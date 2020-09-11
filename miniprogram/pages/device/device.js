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

const connectDevice = (device, deviceIndex, page) => new Promise((resolve, reject) => {
    // 连接设备
    wx.createBLEConnection({
      deviceId: device.id,
      success: (res) => {

      },
      fail: (err) => {
        console.error(err);
      }
    });
    // 获取外围设备服务列表
    wx.getBLEDeviceServices({
      deviceId: device.id,
      success: function(res) {
        const service = res.services.find(n => n.uuid === SERVICE_UUID);
        if (!service) reject(new Error('service not exists'));
        // 获取外围设备服务特征
        wx.getBLEDeviceCharacteristics({
          deviceId: device.id,
          serviceId: service.id,
          success: function(res) {
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
            if (!cycle || !increment || !start || !end || !wait || !red || !green || !blue) reject(new Error(`characteristics missing`));
            wx.readBLECharacteristicValue({ deviceId: device.id, serviceId: service.id, characteristicId: cycle.uuid, fail: function(err) { reject(err) } });
            wx.readBLECharacteristicValue({ deviceId: device.id, serviceId: service.id, characteristicId: increment.uuid, fail: function(err) { reject(err) } });
            wx.readBLECharacteristicValue({ deviceId: device.id, serviceId: service.id, characteristicId: start.uuid, fail: function(err) { reject(err) } });
            wx.readBLECharacteristicValue({ deviceId: device.id, serviceId: service.id, characteristicId: end.uuid, fail: function(err) { reject(err) } });
            wx.readBLECharacteristicValue({ deviceId: device.id, serviceId: service.id, characteristicId: wait.uuid, fail: function(err) { reject(err) } });
            wx.readBLECharacteristicValue({ deviceId: device.id, serviceId: service.id, characteristicId: red.uuid, fail: function(err) { reject(err) } });
            wx.readBLECharacteristicValue({ deviceId: device.id, serviceId: service.id, characteristicId: green.uuid, fail: function(err) { reject(err) } });
            wx.readBLECharacteristicValue({ deviceId: device.id, serviceId: service.id, characteristicId: blue.uuid, fail: function(err) { reject(err) } });
            // 监听特点变化
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId: device.id, serviceId: service.id, characteristicId: cycle.uuid, fail: function(err) { reject(err) } });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId: device.id, serviceId: service.id, characteristicId: increment.uuid, fail: function(err) { reject(err) } });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId: device.id, serviceId: service.id, characteristicId: start.uuid, fail: function(err) { reject(err) } });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId: device.id, serviceId: service.id, characteristicId: end.uuid, fail: function(err) { reject(err) } });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId: device.id, serviceId: service.id, characteristicId: wait.uuid, fail: function(err) { reject(err) } });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId: device.id, serviceId: service.id, characteristicId: red.uuid, fail: function(err) { reject(err) } });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId: device.id, serviceId: service.id, characteristicId: green.uuid, fail: function(err) { reject(err) } });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId: device.id, serviceId: service.id, characteristicId: blue.uuid, fail: function(err) { reject(err) } });
          },
          fail: function(err) {
            reject(err);
          }
        })
      },
      fail: function(err) {
        reject(err);
      }
    });
});

Page({
  data: {
    raduis: 550,        //这里最大为750rpx铺满屏幕
    valueWidthOrHerght: 0,
    devices: [
      // {
      //   name: '',
      //   id: '',
      //   isConnected: true,
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

  handelSync: function(e) {
    const redBuf = new ArrayBuffer(1);
    const redDataView = new Uint8Array(redBuf);
    redDataView[0] = res.data[0];
    const greenBuf = new ArrayBuffer(1);
    const greenDataView = new Uint8Array(greenBuf);
    greenDataView[0] = res.data[1];
    const blueBuf = new ArrayBuffer(1);
    const blueDataView = new Uint8Array(blueBuf);
    blueDataView[0] = res.data[2];
    wx.writeBLECharacteristicValue({
      deviceId: that.data.deviceId,
      serviceId: SERVICE_UUID,
      characteristicId: CHARACTERISTIC_RED_UUID,
      value: redBuf,
      success: function(res) {
        console.log(res);
      },
      fail: function(err) {
        console.error(err);
      }
    });
    wx.writeBLECharacteristicValue({
      deviceId: that.data.deviceId,
      serviceId: SERVICE_UUID,
      characteristicId: CHARACTERISTIC_GREEN_UUID,
      value: greenBuf,
      success: function(res) {
        console.log(res);
      },
      fail: function(err) {
        console.error(err);
      }
    });
    wx.writeBLECharacteristicValue({
      deviceId: that.data.deviceId,
      serviceId: SERVICE_UUID,
      characteristicId: CHARACTERISTIC_BLUE_UUID,
      value: blueBuf,
      success: function(res) {
        console.log(res);
      },
      fail: function(err) {
        console.error(err);
      }
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
    util.drawSlider(colorPickerSliderCtx, that.data.valueWidthOrHerght, that.data.valueWidthOrHerght, h[0]);
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
      util.drawSlider(colorPickerSliderCtx, that.data.valueWidthOrHerght, that.data.valueWidthOrHerght, 1);
    });

    // 监听连接状态
    wx.onBLEConnectionStateChange(function(res) {
      const devices = that.data.devices;
      const deviceIndex = devices.findIndex(n => n.id === res.deviceId);
      if (deviceIndex === -1) return;
      
      devices[deviceIndex].isConnected = res.connected;
      page.setData({ devices });
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

    // 缓存获取连接设备信息
    const cacheDevices = wx.getStorageSync('devices');
    that.setData({ 
        devices: cacheDevices.map(n => ({
          name: n.name,
          id: n.id,
          isConnected: false,
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
    //     Promise.all(devices.map((n, i) => readDevice(n, i, that)))
    //     .then(() => { console.log('所有设备连接成功') })
    //     .catch((err) => { console.error(err) });
  },

  onUnload: function() {
    const that = this;
    wx.offBLECharacteristicValueChange();
    wx.offBLEConnectionStateChange();
  },

  onReady: function() {
    // 页面首次渲染完毕时执行
  },

  onShow: function() {

  },

  onHide: function() {

  },

  onPullDownRefresh: function() {
    // 触发下拉刷新时执行
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