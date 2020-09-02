const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    name: '',
    deviceId: '',
    serviceId: 0,
    charactiseristics: {},
    isConnected: true,

    pickColor: null,
    raduis: 550,        //这里最大为750rpx铺满屏幕
    valueWidthOrHerght: 0,
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
    var that = this
    that.setData({
      name: options.name,
      deviceId: options.deviceId,
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
      deviceId: that.data.deviceId,
      success: function(res) {
        const lightService = res.services.find(n => n.uuid === '00010203-0405-0607-0809-0A0B0C0D1910');
        if (!lightService) {
          wx.showModal({
            title: '提示',
            content: '非我方出售的设备',
            showCancel: false,
            success: function(res) {
              that.setData({
                searching: false
              })
            }
          })
        }
        that.setData({ serviceId: lightService.uuid });
        wx.getBLEDeviceCharacteristics({
          deviceId: options.deviceId,
          serviceId: lightService.uuid,
          success: function(res) {
            that.setData({ characteristics: res.characteristics });
            // 监听特点变化
            wx.notifyBLECharacteristicValueChange({
              state: true,
              deviceId: options.deviceId,
              serviceId: that.data.serviceId,
              characteristicId: that.data.characteristics[0].uuid,
              success: function(res) {
                console.log('启用notify成功')
              },
              fail(res) {
                console.log(res)
              },
            });
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
      console.log('接收到数据：' + app.buf2string(res.value))
      var time = that.getNowTime()
      that.setData({
        receiveText: that.data.receiveText + time + (app.buf2string(res.value))
      });
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