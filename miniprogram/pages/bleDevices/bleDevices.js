const app = getApp();

Page({
  data: {
    deviceList: [],
    isAdapterAvailable: false,
    isAdapterDiscovering: false,
  },

  bindViewDevice: function (event) {
    const self = this;
    const { deviceId, name } = event.currentTarget.dataset;
    wx.navigateTo({
      url: '/pages/blueDevice/blueDevice?title=门禁配置&name=' + name + '&deviceId=' + deviceId,
    })
  },

  scanDevices: function () {
    const self = this;
    if (!self.data.isAdapterDiscovering) {
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        services: ['3000', '4000', '5000'],
        fail() {
        }
      });
      setTimeout(() => {
        wx.stopBluetoothDevicesDiscovery();
      }, 10000);
    } else {
      wx.stopBluetoothDevicesDiscovery();
    }
  },

  onDeviceFound: function ({ devices }) {
    const self = this;
    if (!devices.length) {
      return;
    }
    console.log(devices);
    const deviceList = self.data.deviceList;
    devices.forEach(function (device) {
      const found = deviceList.findIndex(n => n.deviceId === device.deviceId);
      if (found !== -1) {
        deviceList[found].rssi = device.RSSI;
      } else {
        deviceList.push({
          rssi: device.RSSI,
          deviceId: device.deviceId,
          name: device.localName || 'N/A',
        });
      }
    })
    self.setData({ deviceList: deviceList });
  },

  onAdapterChange: function({ available, discovering }) {
    const self = this;
    self.setData({ isAdapterAvailable: available, isAdapterDiscovering: discovering });
  },

  onLoad: function ({ title }) {
    const self = this;
    wx.setNavigationBarTitle({
      title: title
    });
    if (app.data.system === 'devtools') {
      self.setData({ 
        isAdapterAvailable: true,
        deviceList: [{
          'rssi': -37,
          'advertisServiceUUIDs': ["00003787-0000-1000-8000-00805F9B34FB"],
          'deviceId': "84:F7:03:53:E5:FA",
          'localName': "Okr Access Control 1",
          'name': "Okr Access Control 1",
        }]
    });
      return;
    }
    wx.openBluetoothAdapter({
      success(res) {
        wx.onBluetoothAdapterStateChange(self.onAdapterChange);
        wx.onBluetoothDeviceFound(self.onDeviceFound);
        self.scanDevices();
      },
      fail(res) {
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
    wx.offBluetoothDeviceFound(self.onDeviceFound);
    wx.offBluetoothAdapterStateChange(self.onAdapterChange);
    wx.closeBluetoothAdapter();
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
