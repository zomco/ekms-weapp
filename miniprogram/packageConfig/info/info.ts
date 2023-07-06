// packageConfig/info/info.ts
import { get, post } from '../../utils/util'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    sensorId: '',
    isLoading: true,
    loadingError: '',
    sensor: {}
  },

  onLoad: async function(options) {
    const { sensorId } = options
    const that = this
    that.setData({ sensorId })
    try {
      const result = await get(`sensor/${sensorId}`)
      that.setData({ isLoading: false, loadingError: '', sensor: result })
    } catch (e) {
      that.setData({ isLoading: false, loadingError: e.message })
    }
  },

  bindChangeName: async function({ detail: { value } }) {
    console.log(value)
    const that = this
    try {
      const sensor = await post(`sensor/${that.data.sensorId}`, { name: value })
      const sensors = wx.getStorageSync('sensors')
      const sensorIndex = wx.getStorageSync('sensorIndex')
      sensors[sensorIndex] = sensor
      wx.setStorageSync('sensors', sensors)
      wx.redirectTo({ url: '/pages/index/index' })
    } catch (e) {
      console.error(e)
    }
  }

})