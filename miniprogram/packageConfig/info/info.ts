// packageConfig/info/info.ts
import { get, post } from '../../utils/util'
import drawQrcode from 'weapp-qrcode-canvas-2d'

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
      that.loadQrcode(result.code)
    } catch (e) {
      that.setData({ isLoading: false, loadingError: e.message })
    }
  },

  loadQrcode: function(code) {
    const query = wx.createSelectorQuery()
    query.select('#myQrcode')
        .fields({
            node: true,
            size: true
        })
        .exec((res) => {
            var canvas = res[0].node
    
            // 调用方法drawQrcode生成二维码
            drawQrcode({
                canvas: canvas,
                canvasId: 'myQrcode',
                width: 260,
                padding: 30,
                background: '#ffffff',
                foreground: '#000000',
                text: code,
            })
    
            // 获取临时路径（得到之后，想干嘛就干嘛了）
            wx.canvasToTempFilePath({
                canvasId: 'myQrcode',
                canvas: canvas,
                x: 0,
                y: 0,
                width: 260,
                height: 260,
                destWidth: 260,
                destHeight: 260,
                success(res) {
                    console.log('二维码临时路径：', res.tempFilePath)
                },
                fail(res) {
                    console.error(res)
                }
            })
        })
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