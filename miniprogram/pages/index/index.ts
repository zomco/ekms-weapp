// index.ts
// 获取应用实例
import { get } from '../../utils/util'

const app = getApp<IAppOption>()

Page({
  data: {
    devices: [],
  },
  // 事件处理函数
  bindDeviceTap(event) {
    const { id, name } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/device/device?id=${id}&name=${name}` })
  },
  onLoad: async () => {
    try {
      await get('https://zomco.arnmi.com/api/owner/device')
    } catch (e) {
      console.error(e)
    }
  },
  scanRemoteCode: function () {
    wx.scanCode({
      onlyFromCamera: true,
      success: function(res) {
        console.log(res, res.result)
        wx.navigateTo({ url: `/pages/rtuDeviceNap/rtuDeviceNap?id=${res.result}` });
      },
    })
  },
})
