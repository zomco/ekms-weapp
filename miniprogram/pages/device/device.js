const app = getApp();
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
let sliderCtx = {};
Page({
  data: {
    name: '',
    deviceId: '',
    isConnected: true,

    pickColor: null,
    raduis: 550,        //这里最大为750rpx铺满屏幕
    valueWidthOrHerght: 0,

    cycle: 0,
    increment: 0,
    start: 0,
    end: 0,
    wait: 0,
    red: 0,
    green: 0,
    blue: 0,
  },

  SendTap: function() {
    var that = this
    if (that.data.isConnected) {
      var buffer = new ArrayBuffer(that.data.inputText.length)
      var dataView = new Uint8Array(buffer)
      for (var i = 0; i < that.data.inputText.length; i++) {
        dataView[i] = that.data.inputText.charCodeAt(i)
      }
      wx.writeBLECharacteristicValue({
        deviceId: that.data.deviceId,
        serviceId: that.data.serviceId,
        characteristicId: that.data.characteristics[0].uuid,
        value: buffer,
        success: function(res) {
          console.log('发送成功')
        }
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '蓝牙已断开',
        showCancel: false,
        success: function(res) {
          that.setData({
            searching: false
          })
        }
      })
    }
  },

  handleSlide: function(e) {
    let that = this;
    if (e.touches && ( e.type === 'touchend')) {
      let x = e.changedTouches[0].x;
      let y = e.changedTouches[0].y;
      if (e.type !== 'touchend') {
        x = e.touches[0].x;
        y = e.touches[0].y;
      }
      //复制画布上指定矩形的像素数据
      wx.canvasGetImageData({
        canvasId: "colorPicker",
        x: x,
        y: y,
        width: 1,
        height: 1,
        success(res) {
          // 转换成hsl格式，获取旋转角度
          let h = util.rgb2hsl(res.data[0], res.data[1], res.data[2]);
          that.setData({
            pickColor: JSON.stringify({
              red: res.data[0],
              green: res.data[1],
              blue: res.data[2]
            })
          })
          // 判断是否在圈内
          if (h[1] !== 1.0) {
            return;
          }

          util.drawSlider(sliderCtx, that.data.valueWidthOrHerght, that.data.valueWidthOrHerght, h[0]);
          // 设置设备
          if (e.type !== 'touchEnd') {
            // 触摸结束才设置设备属性
            return;
          }
        }
      });
    }
  },

  onLoad: function(options) {
    var that = this;
    const deviceId = options.deviceId;
    that.setData({
      name: options.name,
      deviceId,
    });

    colorPickerCtx = wx.createCanvasContext('colorPicker');
    colorPickerCtx.fillStyle = 'rgb(255, 255, 255)';
    sliderCtx = wx.createCanvasContext('colorPickerSlider');

    // 绘制色环
    let isInit = true;
    wx.createSelectorQuery().select('#colorPicker').boundingClientRect(function(rect) {
      that.setData({ valueWidthOrHerght: rect.width });
      if(isInit){
        colorPickerCtx.fillRect(0, 0, rect.width, rect.height);
        util.drawRing(colorPickerCtx, rect.width, rect.height);
        // 设置默认位置
        util.drawSlider(sliderCtx, rect.width, rect.height, 1.0);
        isInit = false;
      }
      that.setData({
        pickColor: JSON.stringify({
          red: 255,
          green: 0,
          blue: 0,
        })
      });
    }).exec();

    // 获取外围设备服务列表
    wx.getBLEDeviceServices({
      deviceId,
      success: function(res) {
        console.log(res.services);
        const service = res.services.find(n => n.uuid === SERVICE_UUID);
        if (!service) return;
        const serviceId = service.uuid;
        wx.getBLEDeviceCharacteristics({
          deviceId,
          serviceId,
          success: function(res) {
            const cycle = res.characteristics.find(n => n.uuid === CHARACTERISTIC_CYCLE_UUID && n.properties.read && n.properties.write && n.properties.notify);
            const increment = res.characteristics.find(n => n.uuid === CHARACTERISTIC_INCREMENT_UUID && n.properties.read && n.properties.write && n.properties.notify);
            const start = res.characteristics.find(n => n.uuid === CHARACTERISTIC_START_UUID && n.properties.read && n.properties.write && n.properties.notify);
            const end = res.characteristics.find(n => n.uuid === CHARACTERISTIC_END_UUID && n.properties.read && n.properties.write && n.properties.notify);
            const wait = res.characteristics.find(n => n.uuid === CHARACTERISTIC_WAIT_UUID && n.properties.read && n.properties.write && n.properties.notify);
            const red = res.characteristics.find(n => n.uuid === CHARACTERISTIC_RED_UUID && n.properties.read && n.properties.write && n.properties.notify);
            const green = res.characteristics.find(n => n.uuid === CHARACTERISTIC_GREEN_UUID && n.properties.read && n.properties.write && n.properties.notify);
            const blue = res.characteristics.find(n => n.uuid === CHARACTERISTIC_BLUE_UUID && n.properties.read && n.properties.write && n.properties.notify);
            if (!cycle || !increment || !start || !end || !wait || !red || !green || !blue) return;
            wx.readBLECharacteristicValue({ deviceId, serviceId, characteristicId: cycle.uuid });
            wx.readBLECharacteristicValue({ deviceId, serviceId, characteristicId: increment.uuid });
            wx.readBLECharacteristicValue({ deviceId, serviceId, characteristicId: start.uuid });
            wx.readBLECharacteristicValue({ deviceId, serviceId, characteristicId: end.uuid });
            wx.readBLECharacteristicValue({ deviceId, serviceId, characteristicId: wait.uuid });
            wx.readBLECharacteristicValue({ deviceId, serviceId, characteristicId: red.uuid });
            wx.readBLECharacteristicValue({ deviceId, serviceId, characteristicId: green.uuid });
            wx.readBLECharacteristicValue({ deviceId, serviceId, characteristicId: blue.uuid });
            // 监听特点变化
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId, serviceId, characteristicId: cycle.uuid });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId, serviceId, characteristicId: increment.uuid });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId, serviceId, characteristicId: start.uuid });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId, serviceId, characteristicId: end.uuid });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId, serviceId, characteristicId: wait.uuid });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId, serviceId, characteristicId: red.uuid });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId, serviceId, characteristicId: green.uuid });
            wx.notifyBLECharacteristicValueChange({ state: true, deviceId, serviceId, characteristicId: blue.uuid });
          }
        })
      },
      fail: function(err) {
        console.log(err);
      }
    });
    // 监听蓝牙事件
    wx.onBLEConnectionStateChange(function(res) {
      const { connected, deviceId } = res;
      that.setData({ isConnected: connected });
    });
    wx.onBLECharacteristicValueChange(function(res) {
      if (res.deviceId !== that.data.deviceId || res.serviceId !== SERVICE_UUID) return;
      const value = parseInt(util.buf2hex(res.value), 16);
      console.log(value);
      switch (res.characteristicId) {
        case CHARACTERISTIC_CYCLE_UUID:
          that.setData({ cycle: value });
          break;
        case CHARACTERISTIC_INCREMENT_UUID:
          that.setData({ increment: value });
          break;
        case CHARACTERISTIC_START_UUID:
          that.setData({ start: value });
          break;
        case CHARACTERISTIC_END_UUID:
          that.setData({ end: value });
          break;
        case CHARACTERISTIC_WAIT_UUID:
          that.setData({ wait: value });
          break;
        case CHARACTERISTIC_RED_UUID:
          that.setData({ red: value });
          break;
        case CHARACTERISTIC_GREEN_UUID:
          that.setData({ green: value });
          break;
        case CHARACTERISTIC_BLUE_UUID:
          that.setData({ blue: value });
          break;
        default:
          break;
      }
    })
  },

  onUnload: function() {
    wx.closeBLEConnection({
      deviceId: this.data.deviceId,
      success: function(res) {
        console.log(res);
      },
      fail: function(err) {
        console.log(err);
      },
    })
  },

})