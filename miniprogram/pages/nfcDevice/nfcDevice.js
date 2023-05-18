const app = getApp();
const binUtil = require('../../utils/binUtil.js');

Page({
  data: {
    cardId: '',
    sectorList: [],
    instanceList: [],
    instanceIndex: -1,
    isReading: false,
    isWriting: false,
    isWriteShow: false,
    write: null,
    prepares: [],
    preparesStatus: '',
  },

  execWrite: async function () {
    const self = this
    const { prepares: [prepare4, prepare5] } = self.data
    self.setData({ isWriting: true })
    try {
      const authData = await self.authSector(parseInt(prepare4.index / 4, 10))
      const writeData4 = await self.writeBlock(prepare4.index, prepare4.data)
      console.log(writeData4)
      if (!!prepare5) {
        const writeData5 = await self.writeBlock(prepare5.index, prepare5.data)
        console.log(writeData5)
      }
    } catch (err) {
      console.error(err)
    }
    self.setData({ 
      prepares: [], 
      isWriting: false
    })
  },

  prepareWrite: function (event) {
    const self = this
    const { write: { index, block } } = self.data
    if (index < 1 || index > 63 || index % 4 === 3 || !block) {
      return
    }
 
    self.setData({
      preparesStatus: `写入数据块 ${index}`,
      isWriteShow: false,
      prepares: [{
        index,
        data: block.byteList.map(n => {
          const values = ('' + n.value).split('')
          return parseInt(values[0], 16) * 16 + parseInt(values[1], 16)
        }),
        key: block.byteList.map(n => n.value).join('-')
      }]
    })
  },

  openWrite: function (event) {
    const self = this
    const { 
      index, 
      block, 
      editable 
    } = event.currentTarget.dataset;
    if (!editable || !block.byteList.length) {
      return
    }
    self.setData({ 
      isWriteShow: true,
      write: {
        index,
        block,
      },
     })
  },

  onShowChange: function (event) {
    const self = this
    self.setData({ isWriteShow: event.detail.visible })
  },

  inputEdit: function (event) {
    const { value, cursor, keyCode } = event.detail
    const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'A', 'B', 'C', 'D', 'E', 'F']
    const values = value.split('')
    if (values.length === 2 && chars.includes(values[0])) {
      return chars.includes(values[1]) ? values[0].toUpperCase() + values[1].toUpperCase() : values[0].toUpperCase()
    } else if (values.length === 2 && chars.includes(values[1])) {
      return chars.includes(values[0]) ? values[0].toUpperCase() + values[1].toUpperCase() : values[1].toUpperCase()
    } else if (values.length === 1) {
      return chars.includes(values[0]) ? values[0].toUpperCase() : ''
    } else {
      return value
    }
  },

  confirmEdit: function (event) {
    const self = this
    const { value } = event.detail
    const { edit, index } = event.currentTarget.dataset
    const { write } = self.data
    write.block.byteList[index].value = value
    self.setData({ write })
  },

  writeBlock: function(block, data) {
    const self = this;
    const { instanceList, instanceIndex } = self.data
    if (!instanceList.length || instanceIndex === -1) {
      return
    }
    return new Promise((resolve, reject) => {
      const cmd = new Uint8Array(18)
      cmd.set([0xA0, block], 0)
      cmd.set(data, 2)
      const writeBlock = cmd.buffer
      console.log("写入指令为：", writeBlock);
      instanceList[instanceIndex].instance.transceive({
        data: writeBlock,
        success: function ({ data }) {
          console.log('写入响应数据:', data);
          resolve(data)
        },
        fail: function (err) {
          reject(err)
        }
      })
    })
  },

  readBlock: function(block) {
    const self = this;
    const { instanceList, instanceIndex } = self.data
    if (!instanceList.length || instanceIndex === -1) {
      return
    }
    return new Promise((resolve, reject) => {
      const readBlock = new Uint8Array([0x30, block]).buffer
      console.log("读取指令为：", readBlock);
      instanceList[instanceIndex].instance.transceive({
        data: readBlock,
        success: function ({ data }) {
          console.log('读取响应数据:', data);
          resolve(data)
        },
        fail: function (err) {
          reject(err)
        }
      })
    })
  },

  readSector: function (sector) {
    const self = this
    return new Promise((resolve, reject) => {
      Promise.all(new Array(4).fill(1).map((n, i) => self.readBlock(sector * 4 + i)))
      .then((data) => resolve(data))
      .catch((err) => reject(err))
    })
  },

  authSector: function(sector) {
    const self = this;
    const { instanceList, instanceIndex } = self.data
    if (!instanceList.length || instanceIndex === -1) {
      return
    }
    return new Promise((resolve, reject) => {
      const cmd = new Uint8Array([0x60, sector * 4 + 3, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF])
      cmd.set(self.id, 2)
      const authSector = cmd.buffer
      console.log("解密指令为：", authSector);
      instanceList[instanceIndex].instance.transceive({
        data: authSector,
        success: function ({ data }) {
          console.log('解密响应数据: ', data)
          resolve(data)
        },
        fail: function (err) {
          reject(err)
        }
      })
    })
  },

  execRead: async function() {
    const self = this
    self.setData({ sectorList: [], isReading: true })
    const sectors = []
    for (let i = 0; i < 16; i++) {
      try {
        const authData = await self.authSector(i)
        const readData = await self.readSector(i)
        const blocks = readData.map((m, j) => ({
          j: j,
          control: j === 3,
          editable: j !== 3 && i !== 0,
          byteList: Array.from(new Uint8Array(m)).map((l, k) => ({
            k: k,
            editable: j !== 3 && i !== 0,
            value: parseInt(l).toString(16).padStart(2, '0').toUpperCase()
          }))
        }))
        sectors.push({
          i: i,
          protect: i === 0,
          blockList: blocks
        })
      } catch (err) {
        sectors.push({
          i: i,
          protect: i === 0,
          blockList: new Array(4).fill(1).map((m, j) => ({
            j: j,
            control: j === 3,
            editable: j !== 3 && i !== 0,
            byteList: [],
          }))
        })
      }
    }
    self.setData({ sectorList: sectors, isReading: false })
  },

  connect: function (event) {
    const self = this
    const { index } = event.currentTarget.dataset
    const { instanceList, prepares } = self.data

    instanceList[index].instance.connect({
      success: async res => {
        if (!!prepares.length) {
          await self.execWrite()
        }
        await self.execRead()
      },
      fail: err => {
        console.error(err)
      }
    })
    self.setData({ instanceIndex: index })
  },

  onDiscovered: function({ techs, id }) {
    if (!id) {
      return
    }
    console.log(techs, id)
    const self = this
    let cardId = binUtil.buf2Hex(id)
    const instances = []
    // .close()
    // .connect()
    // .getMaxTransceiveLength()
    // .isConnected()
    // .setTimeout()
    // .transceive()
    if (techs.includes(self.nfc.tech.isoDep)) {
      console.log('isodep found: ', cardId)
      instances.push({
        name: 'IsoDep',
        instance: self.nfc.getIsoDep(),
      })
      // 多了 .getHistoricalBytes()
    } else if (techs.includes(self.nfc.tech.mifareClassic)) {
      console.log('mifareclassic found: ', cardId)
      instances.push({
        name: 'MifareClassic',
        instance: self.nfc.getMifareClassic(),
      })
    } else if (techs.includes(self.nfc.tech.mifareUltralight)) {
      console.log('mifareultralight found: ', cardId)
      instances.push({
        name: 'MifareUltralight',
        instance: self.nfc.getMifareUltralight(),
      })
    } else if (techs.includes(self.nfc.tech.ndef)) {
      console.log('ndef found: ', cardId)
      // 多了 .offNdefMessage()
      // 多了 .onNdefMessage()
      // 多了 .writeNdefMessage()
      // 少了 .getMaxTransceiveLength()
      // 少了 .transceive()
      instances.push({
        name: 'NDEF',
        instance: self.nfc.getNdef(),
      })
    } else if(techs.includes(self.nfc.tech.nfcA)) {
      console.log('nfca found: ', cardId)
      // 多了 .getAtqa()
      // 多了 .getSak()
      instances.push({
        name: 'NFC-A',
        instance: self.nfc.getNfcA(),
      })
    } else if(techs.includes(self.nfc.tech.nfcB)) {
      console.log('nfcb found: ', cardId)
      instances.push({
        name: 'NFC-B',
        instance: self.nfc.getNfcB(),
      })
    } else if(techs.includes(self.nfc.tech.nfcF)) {
      console.log('nfcf found: ', cardId)
      instances.push({
        name: 'NFC-F',
        instance: self.nfc.getNfcF(),
      })
    } else if(techs.includes(self.nfc.tech.nfcV)) {
      console.log('nfcv found: ', cardId)
      instances.push({
        name: 'NFC-V',
        instance: self.nfc.getNfcV(),
      })
    } else {
      console.log('unknown found: ', cardId)
    }
    console.log(instances)
    const index = instances.findIndex(x => x.name === 'MifareClassic' || x.name === 'MifareUltralight')
    self.id = Array.from(new Uint8Array(id))
    self.setData({ cardId, instanceList: instances, instanceIndex: index })
    if (index !== -1) {
      const event = {
        currentTarget: {
          dataset: {
            index
          }
        }
      }
      self.connect(event)
    }
  },

  onLoad: function ({ title, key }) {
    const self = this
    if (!!key) {
      const data = binUtil.hex2Buf(key)
      console.log(Array.from(data), key)
      self.setData({
        preparesStatus: '写入门卡',
        prepares: [{
          index: 4,
          data: data.slice(0, 16),
          key: key.slice(0, 32).split('').map((v, i) => i !== 0 && i % 2 === 0 ? `-${v}` : v).join('')
        }, {
          index: 5,
          data: data.slice(16, 32),
          key: key.slice(32, 64).split('').map((v, i) => i !== 0 && i % 2 === 0 ? `-${v}` : v).join('')
        }]
      })
    }
    const nfc = wx.getNFCAdapter()
    self.nfc = nfc
    wx.setNavigationBarTitle({
      title: title
    })

    if (app.data.system === 'devtools') {
      const sectors = new Array(16).fill(1).map((n, i) => ({
        i: i,
        protect: i === 0,
        blockList: new Array(4).fill(1).map((m, j) => ({
          j: j,
          control: j === 3,
          editable: j !== 3 && i !== 0,
          byteList: new Array(16).fill(1).map((l, k) => ({
            k: k,
            editable: j !== 3 && i !== 0,
            value: parseInt(Math.random()*256).toString(16).padStart(2, '0').toUpperCase()
          })),
        }))
      }))
      self.setData({ sectorList: sectors })
      return;
    }
    nfc.onDiscovered(self.onDiscovered)
    nfc.startDiscovery({
      fail(err) {
        console.error(err) 
      }
    })
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
    self.nfc.offDiscovered(self.onDiscovered)
    self.nfc.stopDiscovery()
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
