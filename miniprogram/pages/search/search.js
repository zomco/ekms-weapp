const util = require("../../utils/util");
const app = getApp();

Page({
  data: {
    devices: [
      // {
      //   name: n.name,
      //   id: n.deviceId,
      //   rssi: n.RSSI,
      //   advertisData: util.buf2hex(n.advertisData),
      //   advertisServiceUUIDs: n.advertisServiceUUIDs,
      //   serviceData: n.serviceData,
      //   localName: n.localName,
      //   isConnected: false,
      // }
    ],
    listHeight: 0,
    isSearching: false,
    isAvailable: false,
  },

  handleSearch: function() {
    const that = this;
    if (!that.data.isSearching) {
      wx.startBluetoothDevicesDiscovery({
        success: function(res) {
          that.setData({ isSearching: true });
        },
        fail: function(err) {
          console.error(err);
        },
      });
    } else {
      wx.stopBluetoothDevicesDiscovery({
        success: function(res) {
          that.setData({ isSearching: false });
        },
        fail: function(err) {
          console.error(err);
        },
      });
    }
  },

  handleConnect: function(e) {
    var that = this;
    const deviceId = e.currentTarget.id;
    const deviceIndex = that.data.devices.findIndex(n => n.id === deviceId);
    if (deviceIndex === -1) return;
    const device = that.data.devices[deviceIndex];
    if (that.data.isSearching) {
      wx.stopBluetoothDevicesDiscovery({
        success: function(res) {
          that.setData({ isSearching: false });
        },
        fail: function(err) {
          console.error(err);
        },
      });
    }
    wx.showLoading({ title: '连接蓝牙设备中...' });
    wx.createBLEConnection({
      deviceId: device.id,
      success: function(res) {
        wx.hideLoading();
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 1000,
        });
        // 更新设备连接状态
        that.data.devices[deviceIndex].isConnected = true;
        that.setData({ devices: that.data.devices });
        // 将设备信息写入缓存
        const cacheDevices = wx.getStorageSync('devices') || [];
        const cacheDevicesIndex = cacheDevices.findIndex(n => n.id === device.id);
        if (cacheDevicesIndex === -1) {
          cacheDevices.push({ id: device.id, name: device.name });
          wx.setStorageSync('devices', cacheDevices);
        }
        // 断开连接
        wx.closeBLEConnection({ deviceId: device.id });
      },
      fail: function(err) {
        console.error(err);
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: '连接失败',
          showCancel: false,
        });
      }
    })
  },

  onLoad: function(options) {
    const that = this;
    const { windowHeight, windowWidth } = app.globalData.SystemInfo;
    var listHeight = ((windowHeight - 50) * (750 / windowWidth)) - 60;
    that.setData({ listHeight: listHeight });
    // 监听适配器状态
    wx.onBluetoothAdapterStateChange(function(res) {
      const { discovering, available } = res;
      that.setData({ isSearching: available && discovering, isAvailable: available });
    })
    // 监听设备发现
    wx.onBluetoothDeviceFound(function(res) {
      wx.getBluetoothDevices({
        success: (res) => {
          // 获取缓存
          const cacheDevices = wx.getStorageSync('devices') || [];
          const devices = res.devices.map(n => ({
            name: n.name,
            id: n.deviceId,
            rssi: n.RSSI,
            advertisData: util.buf2hex(n.advertisData),
            advertisServiceUUIDs: n.advertisServiceUUIDs,
            serviceData: n.serviceData,
            localName: n.localName,
            isConnected: cacheDevices.some(m => m.id === n.deviceId),
          })).sort((a, b) => b.rssi - a.rssi);
          that.setData({ devices });
        },
        fail: (err) => {
          console.error(err);
        },
      })
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
  },

  onUnload: function() {
    const that = this;
    if (that.data.isSearching) {
      wx.stopBluetoothDevicesDiscovery({
        success: function(res) {
          that.setData({ isSearching: false });
        },
        fail: function(err) {
          console.error(err);
        },
      });
    }
    wx.closeBluetoothAdapter({
      success: function(res) {
        that.setData({ isAvailable: false });
      },
      fail: function(err) {
        console.error(err);
      },
    });
    wx.offBluetoothDeviceFound();
    wx.offBluetoothAdapterStateChange();
  },

  onShow: function() {
    // const that = this;
    // wx.startBluetoothDevicesDiscovery({
    //   success: function(res) {
    //     that.setData({ isSearching: true });
    //   },
    //   fail: function(err) {
    //     console.log(err);
    //   },
    // });
  },

  onHide: function() {
    // const that = this;
    // that.setData({ devices: [] });
    // if (this.data.isSearching) {
    //   wx.stopBluetoothDevicesDiscovery({
    //     success: function(res) {
    //       that.setData({ isSearching: false });
    //     },
    //     fail: function(err) {
    //       console.log(err);
    //     },
    //   });
    // }
  },

  onReady: function() {
    // 页面首次渲染完毕时执行
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