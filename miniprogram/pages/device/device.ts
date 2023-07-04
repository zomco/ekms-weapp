// pages/device/device.ts
import { post } from '../../utils/util'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    code: '',
    isLoading: false,
    loadingError: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const { code } = options
    const that = this
    this.setData({ code, isLoading: true })
    try {
      const sensor = await post('sensor', { code })
      const sensors = wx.getStorageSync('sensors')
      const index = sensors.findIndex(v => v.id === sensor.id)
      if (index === -1) {
        sensors.push(sensor)
        wx.setStorageSync('sensors', sensors)
        wx.setStorageSync('sensorIndex', sensors.length - 1)
      } else {
        wx.setStorageSync('sensorIndex', index)
      }
      wx.redirectTo({ url: '/pages/index/index' })
      that.setData({ isLoading: false, loadingError: null })
    } catch (e) {
      console.error(e)
      that.setData({ isLoading: false, loadingError: e })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})