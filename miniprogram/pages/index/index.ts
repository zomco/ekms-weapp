import * as echarts from '../../ec-canvas/echarts';
import { get, login } from '../../utils/util'


Page({
  /**
   * 页面的初始数据
   */
  data: {
    sensor: null,
    sensors: [],
    visible: false,
  },

  onLoad: async function (options) {
    const that = this
    try {
      await login()
      const { content } = await get('sensor')
      that.setData({ sensors: content, sensor: content[0] })
    } catch (e) {
      console.error(e)
    }
  },

  bindDrawerShow: function() {
    this.setData({ visible: true })
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