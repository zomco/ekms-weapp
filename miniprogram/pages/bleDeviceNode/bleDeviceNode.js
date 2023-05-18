const app = getApp()
const bleUtil = require('../../utils/bleUtil')

Page({
  data: {
    serviceList: [],
    deviceId: "",
    name: "",
    isConnected: false,
    isConnecting: false,
    isWriteShow: false,
    isWriteSubmiting: false,
    write: null
  },

  randomAuthKey: function (event) {
    const self = this
    const { index } = event.currentTarget.dataset
    const { write } = self.data
    const value = new Array(8).fill(0).map(v => Math.random().toString(16).slice(2, 10)).join('').toUpperCase()
    console.log(value, value.length)
    write.characteristicValue[index].key = value
    self.setData({ write })
  },

  randomAuthBalance: function (event) {
    const self = this
    const { index } = event.currentTarget.dataset
    const { write } = self.data
    write.characteristicValue[index].balance = Math.floor(Math.random() * 100000) + 1;
    self.setData({ write })
  },

  confirmAuthBalance: function (event) {
    const self = this
    const { index } = event.currentTarget.dataset
    const { value, cursor, keyCode } = event.detail
    const { write } = self.data
    write.characteristicValue[index].balance = parseInt(value)
    self.setData({ write })
  },

  confirmMqtt: function (event) {
    const self = this
    const { value, cursor, keyCode } = event.detail
    const { write } = self.data
    write.characteristicValue = value
    self.setData({ write })
  },

  openWrite: function (event) {
    const self = this
    const { 
      deviceId, 
      serviceId, 
      characteristicId, 
      serviceIndex, 
      characteristicIndex,
      serviceName,
      characteristicName,
      characteristicValue,
      characteristicDesc,  
    } = event.currentTarget.dataset;
    self.setData({ 
      isWriteShow: true,
      write: {
        deviceId, 
        serviceId, 
        characteristicId, 
        serviceIndex, 
        characteristicIndex,
        serviceName,
        characteristicName,
        characteristicValue,
        characteristicDesc,
        error: false,
        errorMessage: '',  
      },
     })
  },

  closeWrite: function (event) {
    const self = this
    self.setData({ 
      isWriteShow: false,
     })
  },

  readCharacteristsic: function (event) {
    const self = this
    const { deviceId, serviceId, characteristicId, serviceIndex, characteristicIndex } = event.currentTarget.dataset;
    const services = self.data.serviceList
    services[serviceIndex].characteristics[characteristicIndex].isReading = true
    self.setData({ serviceList: services })
    wx.readBLECharacteristicValue({
      deviceId,
      serviceId,
      characteristicId,
      success (res) {
        console.log('readBLECharacteristicValue:', res.errCode)
      },
      fail (err) {
        services[serviceIndex].characteristics[characteristicIndex].isReading = false
        self.setData({ serviceList: services })
      }
    })
  },

  writeCharacteristic: function (event) {
    const self = this
    const { 
      deviceId, 
      serviceId, 
      characteristicId, 
      serviceIndex, 
      characteristicIndex,
      characteristicValue,  
     } = self.data.write
    self.setData({ isWriteSubmiting: true })
    const array = bleUtil.characteristicWrite(characteristicId, characteristicValue)
    console.log(array)
    wx.writeBLECharacteristicValue({
      deviceId,
      serviceId,
      characteristicId,
      value: array.buffer,
      success (res) {
        console.log('writeBLECharacteristicValue success', res.errMsg)
        const serviceList = self.data.serviceList
        serviceList[serviceIndex].characteristics[characteristicIndex].value = characteristicValue
        self.setData({ isWriteSubmiting: false, isWriteShow: false, serviceList })
      },
      fail (err) {
        self.setData({ isWriteSubmiting: false })
      }
    })
  },

  notifyCharacteristic: function (event) {
    const self = this
    const { deviceId, serviceId, characteristicId, notify, serviceIndex, characteristicIndex } = event.currentTarget.dataset
    const services = self.data.serviceList
    services[serviceIndex].characteristics[characteristicIndex].isNotifying = true
    self.setData({ serviceList: services })
    wx.notifyBLECharacteristicValueChange({
      deviceId,
      serviceId,
      characteristicId,
      state: !notify,
      type: 'notification',
      success (res) {
        console.log('notifyBLECharacteristicValueChange success', res.errMsg)
        services[serviceIndex].characteristics[characteristicIndex].notify = !notify
        services[serviceIndex].characteristics[characteristicIndex].isNotifying = false
        self.setData({ serviceList: services })
      },
      fail (err) {
        services[serviceIndex].characteristics[characteristicIndex].isNotifying = false
        self.setData({ serviceList: services })
      }
    })
  },

  navigateToNfc: function (event) {
    const self = this
    const { key } = event.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/nfcDevice/nfcDevice?title=门卡&key=${key}`,
    })
  },

  reconnect: function () {
    const self = this;
    const deviceId = self.data.deviceId
    if (self.data.isConnected) {
      return
    }
    // wx.closeBLEConnection({
    //   deviceId: deviceId,
    // })
    self.setData({ isConnecting: true })
    wx.createBLEConnection({
      deviceId: deviceId,
      success(res) {
        wx.onBLEConnectionStateChange(self.onConnectionChange);
        wx.onBLECharacteristicValueChange(self.onCharacteristichange);
        wx.getBLEDeviceServices({
          deviceId: deviceId,
          success({ services }) {
            console.log(services)
            Promise.all(services.filter(service => bleUtil.serviceValid(service.uuid)).map((service) => new Promise((resolve, reject) => {
                wx.getBLEDeviceCharacteristics({
                  deviceId: deviceId,
                  serviceId: service.uuid,
                  success({ characteristics }) {
                    console.log(characteristics)
                    resolve({
                      uuid: service.uuid,
                      name: bleUtil.serviceName(service.uuid),
                      isSynchronizing: false,
                      characteristics: characteristics.map(n => ({
                        uuid: n.uuid,
                        name: bleUtil.characteristicName(n.uuid),
                        properties: n.properties,
                        value: bleUtil.characteristicValue(n.uuid, null),
                        desc: bleUtil.characteristicDesc(n.uuid),
                        notify: false,
                        isNotifying: false,
                        isReading: false,
                      }))
                    })
                  },
                  fail(err) {
                    reject(err)
                  }
                })
            })))
            .then((list) => self.setData({ serviceList: list }))
            .catch((err) => console.log('获取特征列表失败'))
            .finally(() => {
              self.setData({ isConnecting: false })
            })
          },
          fail() {
            self.setData({ isConnecting: false })
          }
        })
      },
      fail(res) {
        self.setData({ isConnecting: false })
      }
    })
  },

  reSynchronize: function (event) {
    const self = this
    const { deviceId, serviceId, serviceIndex } = event.currentTarget.dataset;
    const { serviceList } = self.data
    serviceList[serviceIndex].isSynchronizing = true
    self.setData({ serviceList })
    Promise.all(serviceList[serviceIndex].characteristics.map((x, i) => new Promise((resolve, reject) => {
      if (!x.properties.read) {
        resolve()
      }
      serviceList[serviceIndex].characteristics[i].isReading = true
      self.setData({ serviceList })
      wx.readBLECharacteristicValue({
        deviceId,
        serviceId,
        characteristicId: x.uuid,
        success (res) {
          if (!x.properties.notify) {
            resolve()
          }
          serviceList[serviceIndex].characteristics[i].isNotifying = true
          self.setData({ serviceList })
          wx.notifyBLECharacteristicValueChange({
            deviceId,
            serviceId,
            characteristicId: x.uuid,
            state: true,
            type: 'notification',
            success (res) {
              serviceList[serviceIndex].characteristics[i].notify = true
              serviceList[serviceIndex].characteristics[i].isNotifying = false
              self.setData({ serviceList })
              resolve()
            },
            fail (err) {
              serviceList[serviceIndex].characteristics[i].isNotifying = false
              self.setData({ serviceList })
              reject(err)
            }
          })
        },
        fail (err) {
          serviceList[serviceIndex].characteristics[i].isReading = false
          self.setData({ serviceList })
          reject(err)
        }
      })
    })))
    .then(res => {
      console.log(res)
    })
    .catch(err => {
      console.error(err)
    })
    .finally(() => {
      serviceList[serviceIndex].isSynchronizing = false
      self.setData({ serviceList })
    })
  },

  onCharacteristichange: function ({ deviceId, serviceId, characteristicId, value }) {
    const self = this;
    const list = self.data.serviceList
    console.log('characteristic event: ', deviceId, serviceId, characteristicId, value);
    if (deviceId !== self.data.deviceId) {
      return;
    }
    const serviceIndex = list.findIndex(n => n.uuid === serviceId)
    if (serviceIndex === -1) {
      return;
    }
    const characteristicIndex = list[serviceIndex].characteristics.findIndex(n => n.uuid === characteristicId);
    if (characteristicIndex === -1) {
      return;
    }
    
    list[serviceIndex].characteristics[characteristicIndex].value = bleUtil.characteristicValue(characteristicId, value)
    list[serviceIndex].characteristics[characteristicIndex].desc = bleUtil.characteristicDesc(characteristicId)
    list[serviceIndex].characteristics[characteristicIndex].isReading = false
    list[serviceIndex].characteristics[characteristicIndex].write = true
    self.setData({ serviceList: list })
  },

  onConnectionChange: function({ deviceId, connected }) {
    const self = this;
    console.log('connect event: ', deviceId, connected)
    if (deviceId !== self.data.deviceId) {
      return;
    }
    self.setData({ isConnected: connected });
  },

  onLoad: function ({ title, name, deviceId }) {
    const self = this;
    wx.setNavigationBarTitle({
      title: title
    });
    self.setData({ deviceId: deviceId, name: name });
    if (app.data.system === 'devtools') {
      self.setData({ 
        isConnected: true,
        serviceList: [{ 
          uuid: '00003000-0000-1000-8000-00805F9B34FB',
          name: bleUtil.serviceName('00003000-0000-1000-8000-00805F9B34FB'),
          isSynchronizing: false,
          characteristics: [{
            uuid: '00003001-0000-1000-8000-00805F9B34FB',
            name: bleUtil.characteristicName('00003001-0000-1000-8000-00805F9B34FB'),
            value: bleUtil.characteristicValue('00003001-0000-1000-8000-00805F9B34FB', Uint8Array.of(1).buffer),
            desc: bleUtil.characteristicDesc('00003001-0000-1000-8000-00805F9B34FB'),
            properties: {
              indicate: false,
              notify: true,
              read: true,
              write: false,
            },
            notify: false,
            write: false,
            isNotifying: false,
            isReading: false,
          }, {
            uuid: '00003002-0000-1000-8000-00805F9B34FB',
            name: bleUtil.characteristicName('00003002-0000-1000-8000-00805F9B34FB'),
            value: bleUtil.characteristicValue('00003002-0000-1000-8000-00805F9B34FB', Uint8Array.of(1).buffer),
            desc: bleUtil.characteristicDesc('00003002-0000-1000-8000-00805F9B34FB'),
            properties: {
              indicate: false,
              notify: true,
              read: true,
              write: false,
            },
            notify: false,
            write: false,
            isNotifying: false,
            isReading: false,
          }, {
            uuid: '00003003-0000-1000-8000-00805F9B34FB',
            name: bleUtil.characteristicName('00003003-0000-1000-8000-00805F9B34FB'),
            value: bleUtil.characteristicValue('00003003-0000-1000-8000-00805F9B34FB', Uint8Array.of(0,0,255,3,0,0,16,0,128,0,0,128,95,155,52,251,0,0,255,3,0,0,16,0,128,0,0,128,95,155,52,251).buffer),
            desc: bleUtil.characteristicDesc('00003003-0000-1000-8000-00805F9B34FB'),
            properties: {
              indicate: false,
              notify: true,
              read: true,
              write: false,
            },
            notify: false,
            write: false,
            isNotifying: false,
            isReading: false,
          }]
        }, {
          uuid: '00004000-0000-1000-8000-00805F9B34FB',
          name: bleUtil.serviceName('00004000-0000-1000-8000-00805F9B34FB'),
          isSynchronizing: false,
          characteristics: [{
            uuid: '00004001-0000-1000-8000-00805F9B34FB',
            name: bleUtil.characteristicName('00004001-0000-1000-8000-00805F9B34FB'),
            value: bleUtil.characteristicValue('00004001-0000-1000-8000-00805F9B34FB', Uint8Array.of('o'.charCodeAt(),'w'.charCodeAt(),'k'.charCodeAt(),'o'.charCodeAt(),'r'.charCodeAt(),'.'.charCodeAt(),'c'.charCodeAt(),'o'.charCodeAt(),'m'.charCodeAt()).buffer),
            desc: bleUtil.characteristicDesc('00004001-0000-1000-8000-00805F9B34FB'),
            properties: {
              indicate: false,
              notify: false,
              read: true,
              write: true,
            },
            notify: false,
            write: false,
            isNotifying: false,
            isReading: false,
          }, {
            uuid: '00004002-0000-1000-8000-00805F9B34FB',
            name: bleUtil.characteristicName('00004002-0000-1000-8000-00805F9B34FB'),
            value: bleUtil.characteristicValue('00004002-0000-1000-8000-00805F9B34FB', Uint8Array.of('t'.charCodeAt(),'e'.charCodeAt(),'s'.charCodeAt(),'t'.charCodeAt()).buffer),
            desc: bleUtil.characteristicDesc('00004002-0000-1000-8000-00805F9B34FB'),
            properties: {
              indicate: false,
              notify: false,
              read: true,
              write: true,
            },
            notify: false,
            write: false,
            isNotifying: false,
            isReading: false,
          }, {
            uuid: '00004003-0000-1000-8000-00805F9B34FB',
            name: bleUtil.characteristicName('00004003-0000-1000-8000-00805F9B34FB'),
            value: bleUtil.characteristicValue('00004003-0000-1000-8000-00805F9B34FB', Uint8Array.of('t'.charCodeAt(),'e'.charCodeAt(),'s'.charCodeAt(),'t'.charCodeAt(),'1'.charCodeAt()).buffer),
            desc: bleUtil.characteristicDesc('00004003-0000-1000-8000-00805F9B34FB'),
            properties: {
              indicate: false,
              notify: false,
              read: true,
              write: true,
            },
            notify: false,
            write: false,
            isNotifying: false,
            isReading: false,
          }]
        }, {
          uuid: '00005000-0000-1000-8000-00805F9B34FB',
          name: bleUtil.serviceName('00005000-0000-1000-8000-00805F9B34FB'),
          isSynchronizing: false,
          characteristics: new Array(bleUtil.AUTH_LIST_LENGTH).fill(0).map((v, i) => {
            const hex = (i + 1).toString(16).toUpperCase();
            const uuid = `000050${ hex.length === 1 ? '0' + hex : hex }-0000-1000-8000-00805F9B34FB`;
            return {
              uuid: uuid,
              name: bleUtil.characteristicName(uuid),
              value: bleUtil.characteristicValue(uuid, new Uint8Array(bleUtil.AUTH_LIST_SIZE)),
              desc: bleUtil.characteristicDesc(uuid),
              properties: {
                indicate: false,
                notify: false,
                read: true,
                write: true,
              },
              notify: false,
              write: false,
              isNotifying: false,
              isReading: false,
            }
          }),
        }]
      });
      return;
    }
    self.reconnect()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if (app.data.system === 'devtools') {
      return;
    }
    const self = this;
    wx.offBLECharacteristicValueChange(self.onValueChange);
    wx.offBLEConnectionStateChange(self.onConnectionChange);
    wx.closeBLEConnection({ deviceId: self.data.deviceId });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

})
