const app = getApp();

Page({
  data: {
    devices: [],
    listHeight: 0,
    isSearching: false,
    isAvailable: false,
  },

  handleSearch: function() {
    const that = this;
    if (!that.data.isSearching) {
      wx.startBluetoothDevicesDiscovery({
        success: function(res) {
          that.setData({ isSearching: true, devices: [] });
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
    const device = that.data.devices.find(n => n.deviceId === deviceId);
    if (that.data.isSearching) {
      wx.stopBluetoothDevicesDiscovery({
        success: function(res) {
          that.setData({ isSearching: false });
        },
        fail: function(err) {
          console.log(err);
        },
      });
    }
    wx.showLoading({ title: '连接蓝牙设备中...' });
    wx.createBLEConnection({
      deviceId,
      success: function(res) {
        wx.hideLoading();
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 1000,
        });
        // wx.navigateTo({ url: '../device/device' });
      },
      fail: function(err) {
        console.log(err)
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
      const newDevices = res.devices.filter(n => !that.data.devices.some(m => m.deviceId === n.deviceId));
      const devices = that.data.devices.concat(newDevices).sort((a, b) => a.RSSI - b.RSSI);
      that.setData({ devices });
    });
    // 打开适配器
    wx.openBluetoothAdapter({
      success: function(res) {
        console.log(res);
      },
      fail: function(err) {
        console.log(err);
      },
    });
  },

  onUnload: function() {
    const that = this;
    wx.closeBluetoothAdapter({
      success: function(res) {
        that.setData({ isAvailable: false });
      },
      fail: function(err) {
        console.log(err);
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