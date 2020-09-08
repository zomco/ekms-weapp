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
          that.setData({
            isSearching: true,
            devices: [],
          })
        },
        fail: function(err) {
          console.log(err);
        },
      });
    } else {
      wx.stopBluetoothDevicesDiscovery({
        success: function(res) {
          that.setData({ isSearching: false });
        },
        fail: function(err) {
          console.log(err);
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
    wx.showLoading({
      title: '连接蓝牙设备中...',
    })
    wx.createBLEConnection({
      deviceId,
      success: function(res) {
        wx.hideLoading();
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 1000,
        })
        wx.navigateTo({
          url: '../device/device?deviceId=' + deviceId + '&name=' + device.name
        })
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
    wx.onBluetoothAdapterStateChange(function(res) {
      const { discovering, available } = res;
      that.setData({ isSearching: available && discovering, isAvailable: available });
    })
    wx.onBluetoothDeviceFound(function(res) {
      const newDevices = res.devices.filter(n => !that.data.devices.some(m => m.deviceId === n.deviceId));
      const devices = that.data.devices.concat(newDevices).sort((a, b) => a.RSSI - b.RSSI);
      that.setData({ devices });
    });
    wx.openBluetoothAdapter({
      success: function(res) {
        console.log(res);
      },
      fail: function(err) {
        console.log(err);
        wx.showModal({
          title: '提示',
          content: '请检查手机蓝牙是否打开',
          showCancel: false,
          success: function(res) {
            that.setData({ isSearching: false });
          },
        });
      },
    });
  },
  onUnload: function() {
    wx.closeBluetoothAdapter({
      success: function(res) {
        that.setData({ isAvailable: false });
      },
      fail: function(err) {
        console.log(err);
      },
    });
  },
  onShow: function() {
    // 页面出现在前台时执行
  },
  onHide: function() {
    var that = this;
    that.setData({ devices: [] });
    if (this.data.isSearching) {
      wx.stopBluetoothDevicesDiscovery({
        success: function(res) {
          that.setData({ isSearching: false });
        },
        fail: function(err) {
          console.log(err);
        },
      });
    }
  }
})