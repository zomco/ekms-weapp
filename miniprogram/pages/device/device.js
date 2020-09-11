const util = require('../../utils/util.js');

const SERVICE_UUID = "00010203-0405-0607-0809-0A0B0C0D2C10";
const CHARACTERISTIC_CYCLE_UUID = "00010203-0405-0607-0809-0A0B0C0D2C20";
const CHARACTERISTIC_INCREMENT_UUID = "00010203-0405-0607-0809-0A0B0C0D2C21";
const CHARACTERISTIC_START_UUID = "00010203-0405-0607-0809-0A0B0C0D2C22";
const CHARACTERISTIC_END_UUID = "00010203-0405-0607-0809-0A0B0C0D2C23";
const CHARACTERISTIC_WAIT_UUID = "00010203-0405-0607-0809-0A0B0C0D2C24";
const CHARACTERISTIC_RED_UUID = "00010203-0405-0607-0809-0A0B0C0D2C25";
const CHARACTERISTIC_GREEN_UUID = "00010203-0405-0607-0809-0A0B0C0D2C26";
const CHARACTERISTIC_BLUE_UUID = "00010203-0405-0607-0809-0A0B0C0D2C27";
let colorPickerCtx = {};
let colorPickerSliderCtx = {};

const disconnectDevices = () => new Promise((resolve, reject) => {
  wx.getConnectedBluetoothDevices({
    services: [],
    success: (res) => {
      Promise.all(res.devices.map(n => new Promise((resolve1, reject1) => {
        wx.closeBLEConnection({
          deviceId: n.deviceId,
          success: (res) => resolve1(0),
          fail: (err) => reject1(err)
        });
      }))).then((rets) => {
        console.log('所有连接已关闭');
        resolve(0);
      }).catch((err) => {
        reject(err);
      });
    },
    fail: (err) => {
      reject(err);
    },
  });
});

const writeCharacteristic = (deviceId, serviceId, characteristicId, buffer) => new Promise((resolve, reject) => {
  wx.writeBLECharacteristicValue({
    deviceId,
    serviceId,
    characteristicId,
    value: buffer,
    success: (res) => {
      resolve(0);
    },
    fail: (err) => {
      reject(err);
    },
  });
});

const syncDevice = (device, deviceIndex, page) => new Promise(async (resolve, reject) => {
  try {
    page.data.devices[deviceIndex].isSyncing = true;
    page.data.devices[deviceIndex].syncError = null;
    page.setData({ devices: page.data.devices });

    const { red, green, blue } = page.data;
    const redBuf = new ArrayBuffer(1);
    const redDataView = new Uint8Array(redBuf);
    redDataView[0] = red;

    const greenBuf = new ArrayBuffer(1);
    const greenDataView = new Uint8Array(greenBuf);
    greenDataView[0] = green;

    const blueBuf = new ArrayBuffer(1);
    const blueDataView = new Uint8Array(blueBuf);
    blueDataView[0] = blue;

    await writeCharacteristic(device.id, SERVICE_UUID, CHARACTERISTIC_RED_UUID, redBuf);
    await writeCharacteristic(device.id, SERVICE_UUID, CHARACTERISTIC_GREEN_UUID, greenBuf);
    await writeCharacteristic(device.id, SERVICE_UUID, CHARACTERISTIC_BLUE_UUID, blueBuf);
    page.data.devices[deviceIndex].isSyncing = false;
    page.data.devices[deviceIndex].syncError = null;
    page.setData({ devices: page.data.devices });
    resolve(0);
  } catch (err) {
    page.data.devices[deviceIndex].isSyncing = false;
    page.data.devices[deviceIndex].syncError = err;
    page.setData({ devices: page.data.devices });
    reject(err);
  }
});

const readCharacteristic = (deviceId, serviceId, characteristicId) => new Promise((resolve, reject) => {
  wx.readBLECharacteristicValue({ 
    deviceId, 
    serviceId, 
    characteristicId,
    success: (res) => {
      wx.notifyBLECharacteristicValueChange({ 
        state: true, 
        deviceId, 
        serviceId, 
        characteristicId,
        success: (res) => {
          resolve(0);
        },
        fail: (err) => {
          reject(err);
        } 
      });
    },
    fail: (err) => {
      reject(err);
    }, 
  });
});

const connectDevice = (device, deviceIndex, page) => new Promise((resolve, reject) => {
    // 连接设备
    page.data.devices[deviceIndex].isConnecting = true;
    page.data.devices[deviceIndex].connectError = null;
    page.setData({ devices: page.data.devices });
    wx.createBLEConnection({
      deviceId: device.id,
      success: (res) => {
        // 获取外围设备服务列表
        wx.getBLEDeviceServices({
          deviceId: device.id,
          success: function(res) {
            const service = res.services.find(n => n.uuid === SERVICE_UUID);
            if (!service) {
              const err = new Error('service not exists');
              // 更新状态
              page.data.devices[deviceIndex].isConnecting = false;
              page.data.devices[deviceIndex].connectError = err;
              page.setData({ devices: page.data.devices });
              return reject(err);
            }
            // 获取外围设备服务特征
            wx.getBLEDeviceCharacteristics({
              deviceId: device.id,
              serviceId: service.uuid,
              success: async (res) => {
                let cycle;
                let increment;
                let start;
                let end;
                let wait;
                let red;
                let green;
                let blue;
                res.characteristics.forEach(n => {
                  if (!n.properties.read || !n.properties.write || !n.properties.notify) return;
                  switch (n.uuid) {
                    case CHARACTERISTIC_CYCLE_UUID:
                      cycle = n;
                      break;
                    case CHARACTERISTIC_INCREMENT_UUID:
                      increment = n;
                      break;
                    case CHARACTERISTIC_START_UUID:
                      start = n;
                      break;
                    case CHARACTERISTIC_END_UUID:
                      end = n;
                      break;
                    case CHARACTERISTIC_WAIT_UUID:
                      wait = n;
                      break;
                    case CHARACTERISTIC_RED_UUID:
                      red = n;
                      break;
                    case CHARACTERISTIC_GREEN_UUID:
                      green = n;
                      break;
                    case CHARACTERISTIC_BLUE_UUID:
                      blue = n;
                      break;
                    default:
                      break;
                  }
                });
                if (!cycle || !increment || !start || !end || !wait || !red || !green || !blue) {
                  const err = new Error(`characteristics missing`);
                  page.data.devices[deviceIndex].isConnecting = false;
                  page.data.devices[deviceIndex].connectError = err;
                  page.setData({ devices: page.data.devices });
                  return reject(err);
                }
                try {
                  await readCharacteristic(device.id, service.uuid, cycle.uuid);
                  await readCharacteristic(device.id, service.uuid, increment.uuid);
                  await readCharacteristic(device.id, service.uuid, start.uuid);
                  await readCharacteristic(device.id, service.uuid, end.uuid);
                  await readCharacteristic(device.id, service.uuid, wait.uuid);
                  await readCharacteristic(device.id, service.uuid, red.uuid);
                  await readCharacteristic(device.id, service.uuid, green.uuid);
                  await readCharacteristic(device.id, service.uuid, blue.uuid);
                  // 更新状态
                  page.data.devices[deviceIndex].isConnecting = false;
                  page.data.devices[deviceIndex].connectError = null;
                  page.setData({ devices: page.data.devices });
                  resolve(0);
                } catch (err) {
                  page.data.devices[deviceIndex].isConnecting = false;
                  page.data.devices[deviceIndex].connectError = err;
                  page.setData({ devices: page.data.devices });
                  reject(err);
                }
              },
              fail: (err) => {
                page.data.devices[deviceIndex].isConnecting = false;
                page.data.devices[deviceIndex].connectError = err;
                page.setData({ devices: page.data.devices });
                reject(err);
              }
            })
          },
          fail: (err) => {
            // 更新状态
            page.data.devices[deviceIndex].isConnecting = false;
            page.data.devices[deviceIndex].connectError = err;
            page.setData({ devices: page.data.devices });
            reject(err);
          }
        });
      },
      fail: (err) => {
        // 更新状态
        page.data.devices[deviceIndex].isConnecting = false;
        page.data.devices[deviceIndex].connectError = err;
        page.setData({ devices: page.data.devices });
        reject(err);
      },
    });
});

Page({
  data: {
    raduis: 550,        //这里最大为750rpx铺满屏幕
    valueWidthOrHerght: 0,
    isAvailable: false,
    red: -1,
    green: -1,
    blue: -1,

    devices: [
      // {
      //   name: '',
      //   id: '',
      //   isConnecting: false,
      //   connectError: null,
      //   isSyncing: false,
      //   syncError: null,
      //   cycle: 0,
      //   increment: 0,
      //   start: 0,
      //   end: 0,
      //   wait: 0,
      //   red: 0,
      //   green: 0,
      //   blue: 0,
      // }
    ],
  },

  handleAdd: function(e) {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  handleSync: function(e) {
    const that = this;
    Promise.all(that.data.devices.map((n, i) => syncDevice(n, i, that)))
    .then((rets) => {
      console.log('所有设备写入成功');
    }).catch((err) => {
      console.error(err);
    });
  },

  handleSlide: function(e) {
    let that = this;
    const dpr = wx.getSystemInfoSync().pixelRatio;
    let x = e.changedTouches[0].x * dpr;
    let y = e.changedTouches[0].y * dpr;
    const imageData = colorPickerCtx.getImageData(x, y, 1, 1);
    // 转换成hsl格式，获取旋转角度
    let h = util.rgb2hsl(imageData.data[0], imageData.data[1], imageData.data[2]);
    // 判断是否在圈内
    if (h[1] !== 1.0) return;
    that.setData({ red: imageData.data[0], green: imageData.data[1], blue: imageData.data[2] });
    util.drawSlider(colorPickerSliderCtx, that.data.valueWidthOrHerght, that.data.valueWidthOrHerght, h[0]);
    that.handleSync();
  },

  handleRemove: function(e) {
    let that = this;
    const { index } = e.currentTarget.dataset;
    const device = that.data.devices[index];
    // 关闭连接
    if (!device.isConnecting && !device.connectError) {
      wx.closeBLEConnection({ deviceId: device.id });
    }
    // 删除信息
    const newDevices = that.data.devices.splice(index, 1);
    that.setData({ devices: newDevices });
    // 重写缓存
    const cacheDevices = wx.getStorageSync('devices') || [];
    const cacheDeviceIndex = cacheDevices.findIndex(n => n.id === device.id);
    if (cacheDeviceIndex !== -1) {
      const newCacheDevices = cacheDevices.splice(cacheDeviceIndex, 1);
      wx.setStorageSync('devices', newCacheDevices);
    }
  },

  reconnect: async function() {
    const that = this;
    await disconnectDevices();
    // 缓存获取连接设备信息
    const cacheDevices = wx.getStorageSync('devices') || [];
    that.setData({ 
      devices: cacheDevices.map(n => ({
        name: n.name,
        id: n.id,
        cycle: 0,
        increment: 0,
        start: 0,
        end: 0,
        wait: 0,
        red: 0,
        green: 0,
        blue: 0,
      })),
    });

    // 连接设备
    Promise.all(cacheDevices.map((n, i) => connectDevice(n, i, that)))
      .then(() => { 
        console.log('所有设备连接成功');
        wx.stopPullDownRefresh();
      })
      .catch((err) => { 
        console.error(err);
        wx.stopPullDownRefresh();
      });
  },

  onLoad: function(options) {
    var that = this;

    // 绘制色环
    let isInit = true;
    wx.createSelectorQuery().select('#colorPicker')
    .fields({ node: true, size: true, rect: true })
    .exec((res) => {
      that.setData({ valueWidthOrHerght: res[0].width });
      const canvas = res[0].node
      colorPickerCtx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      colorPickerCtx.scale(dpr, dpr);
      colorPickerCtx.fillStyle = 'rgb(255, 255, 255)';
      if(isInit){
        colorPickerCtx.fillRect(0, 0, res[0].width, res[0].height);
        util.drawRing(colorPickerCtx, res[0].width, res[0].height);
        isInit = false;
      }
    });

    // 绘制拾色器 
    wx.createSelectorQuery().select('#colorPickerSlider')
    .fields({ node: true, size: true, rect: true })
    .exec((res) => {
      const canvas = res[0].node;
      colorPickerSliderCtx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      colorPickerSliderCtx.scale(dpr, dpr);
      // util.drawSlider(colorPickerSliderCtx, that.data.valueWidthOrHerght, that.data.valueWidthOrHerght, 1);
    });

    // 监听适配器状态
    wx.onBluetoothAdapterStateChange(function(res) {
      const { available } = res;
      that.setData({ isAvailable: available });
    });

    // 打开适配器
    wx.openBluetoothAdapter({
      success: function(res) {
        that.setData({ isAvailable: true });
      },
      fail: function(err) {
        console.error(err);
      },
    });

    // 监听连接状态
    wx.onBLEConnectionStateChange(function(res) {
      const devices = that.data.devices;
      const deviceIndex = devices.findIndex(n => n.id === res.deviceId);
      if (deviceIndex === -1) return;
      
      devices[deviceIndex].isConnecting = false;
      devices[deviceIndex].connectDevice = null;
      that.setData({ devices });
    });

    // 监听特性状态
    wx.onBLECharacteristicValueChange(function(res) {
      const devices = that.data.devices;
      const deviceIndex = devices.findIndex(n => n.id === res.deviceId);
      if (deviceIndex === -1 || res.serviceId !== SERVICE_UUID) return;
      const value = parseInt(util.buf2hex(res.value), 16);
      switch (res.characteristicId) {
        case CHARACTERISTIC_CYCLE_UUID:
          devices[deviceIndex].cycle = value;
          that.setData({ devices });
          break;
        case CHARACTERISTIC_INCREMENT_UUID:
          devices[deviceIndex].increment = value;
          that.setData({ devices });
          break;
        case CHARACTERISTIC_START_UUID:
          devices[deviceIndex].start = value;
          that.setData({ devices });
          break;
        case CHARACTERISTIC_END_UUID:
          devices[deviceIndex].end = value;
          that.setData({ devices });
          break;
        case CHARACTERISTIC_WAIT_UUID:
          devices[deviceIndex].wait = value;
          that.setData({ devices });
          break;
        case CHARACTERISTIC_RED_UUID:
          devices[deviceIndex].red = value;
          that.setData({ devices });
          break;
        case CHARACTERISTIC_GREEN_UUID:
          devices[deviceIndex].green = value;
          that.setData({ devices });
          break;
        case CHARACTERISTIC_BLUE_UUID:
          devices[deviceIndex].blue = value;
          that.setData({ devices });
          break;
        default:
          break;
      }
    });
  },

  onUnload: function() {
    const that = this;
    wx.offBLECharacteristicValueChange();
    wx.offBLEConnectionStateChange();
    wx.closeBluetoothAdapter();
    wx.offBluetoothAdapterStateChange();
  },

  onReady: function() {
    // 页面首次渲染完毕时执行
  },

  onShow: function() {
    const that = this;
    that.reconnect();
  },

  onHide: async function() {
    const that = this;
    await disconnectDevices();
  },

  onPullDownRefresh: function() {
    const that = this;
    that.reconnect();
  },

  onReachBottom: function() {
    // 页面触底时执行
  },

  onShareAppMessage: function () {
    // 页面被用户分享时执行
  },

  onPageScroll: function() {
    // 页面滚动时执行
  },

  onResize: function() {
    // 页面尺寸变化时执行
  },

})