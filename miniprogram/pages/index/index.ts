import { get, login } from '../../utils/util'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    indexes: [],
    sensors: [],
    visible: false,
    isLoading: true,
    loadingError: null,
  },

  onLoad: async function (options) {
    const that = this
    that.setData({ isLoading: true })
    try {
      const { sensors, sensorIndex } = await login()
      that.setData({ 
        isLoading: false,
        sensors: sensors.map((v, i) => ({ label: v.name, value: i, id: v.id })), 
        indexes: [sensorIndex],
      })
    } catch (e) {
      that.setData({ isLoading: false, loadingError: e.message })
    }
  },

  bindPickerShow: function() {
    this.setData({ visible: true })
  },

  bindPickerChange: function(e) {
    const that = this
    const { value, label, columns } = e.detail;
    // that.setData({ indexes: value })
  },

  bindPickerConfirm: function(e) {
    const that = this
    const { value, label, columns } = e.detail;
    wx.setStorageSync('sensorIndex', value[0])
    that.setData({ indexes: value })
  },

  bindSleepTap(event) {
    const { id, name } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/sleep/sleep?id=${id}&name=${name}` })
  },

  bindAddDeviceTap: function () {
    wx.scanCode({
      onlyFromCamera: true,
      success: function(res) {
        console.log(res, res.result)
        if (/^\d{15}$/.test(res.result)) {
          wx.navigateTo({ url: `/pages/device/device?code=${res.result}` });
        }
      },
    })
  },

})