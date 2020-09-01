const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    name: '',
    connectedDeviceId: '',
    serviceId: 0,
    characteristics: {},
    connected: true,

    pickColor: null,
    raduis: 550, //这里最大为750rpx铺满屏幕
    valueWidthOrHerght: 0,
    client: null,
    reconnectCounts: 0, //记录重连的次数
  },

  SendTap: function() {
    var that = this
    if (that.data.connected) {
      var buffer = new ArrayBuffer(that.data.inputText.length)
      var dataView = new Uint8Array(buffer)
      for (var i = 0; i < that.data.inputText.length; i++) {
        dataView[i] = that.data.inputText.charCodeAt(i)
      }
      wx.writeBLECharacteristicValue({
        deviceId: that.data.connectedDeviceId,
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

  onLoad: function(options) {
    var that = this
    that.setData({
      name: options.name,
      connectedDeviceId: options.connectedDeviceId,
    });
    colorPickerCtx = wx.createCanvasContext('colorPicker');
    colorPickerCtx.fillStyle = 'rgb(255, 255, 255)';
    sliderCtx = wx.createCanvasContext('colorPickerSlider');

    // 绘制色环
    let isInit = true;
    wx.createSelectorQuery().select('#colorPicker').boundingClientRect(function(rect) {
      that.setData({
        valueWidthOrHerght: rect.width,
      })
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
      deviceId: that.data.connectedDeviceId,
      success: function(res) {
        var all_UUID = res.services;
        var index_uuid = -1;
        var UUID_lenght = all_UUID.length;
        /* 遍历服务数组 */
        for (var index = 0; index < UUID_lenght; index++) {
          var ergodic_UUID = all_UUID[index].uuid; //取出服务里面的UUID
          /* 判断是否是我们需要的00010203-0405-0607-0809-0A0B0C0D1910*/
          if (ergodic_UUID == '00010203-0405-0607-0809-0A0B0C0D1910') {
            index_uuid = index;
          };
        };
        if (index_uuid == -1) {
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
        that.setData({
          serviceId: res.services[index_uuid].uuid
        })
        wx.getBLEDeviceCharacteristics({
          deviceId: options.connectedDeviceId,
          serviceId: res.services[index_uuid].uuid,
          success: function(res) {
            that.setData({
              characteristics: res.characteristics
            })
            wx.notifyBLECharacteristicValueChange({
              state: true,
              deviceId: options.connectedDeviceId,
              serviceId: that.data.serviceId,
              characteristicId: that.data.characteristics[0].uuid,
              success: function(res) {
                console.log('启用notify成功')
              },
              fail(res) {
                console.log(res)
              }
            })
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
      that.setData({
        isConnected: connected,
      });
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
      deviceId: this.data.connectedDeviceId,
      success: function(res) {},
    })
  },

})