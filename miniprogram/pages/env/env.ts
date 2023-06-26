// pages/position/position.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get } from '../../utils/util'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    sensorId: '',
    ec: { lazyLoad: true },
    isLoading: true,
    loadingError: '',
    aggData0: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
    const { sensorId, name } = options
    const that = this
    that.setData({ sensorId, name })
    if (!sensorId) return

    that.setData({ isLoading: true })
    const start_mills = new Date().setHours(0, 0, 0, 0)
    const stop_mills = start_mills + 86400000
    let result = []

    try {
      result = await get(`sensor/${sensorId}/stat/env/illuminance`, {
        start: start_mills / 1000,
        stop: stop_mills / 1000,
        unit: '30m',
      })
      await that.loadStatData(result)
      that.setData({ isLoading: false, loadingError: '' })
    } catch (e) {
      that.setData({ isLoading: false, loadingError: e.message })
    }

    const component = this.selectComponent('#env-chart')
    if (!component) {
      console.log('env component is missing', component)
      return
    }
    component.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // new
      });

      const chartData1 = Array.from({ length: 48}, (v, i) => [start_mills + (i + 1) * 1800000, null])
      if (result && result.length) {
        const index = chartData1.findIndex(v => v[0] === Date.parse(result[0].time))
        chartData1.splice(index, result.length, ...result.map((v, i) => [Date.parse(v.time), v.mean]))
      }   

      chart.setOption({
        grid: {
          containLabel: true,
          left: '20rpx',
          top: 0,
          right: '20rpx',
          bottom: 0
        },
        tooltip: {
          show: true,
          trigger: 'axis',
          formatter: (params) => {
            const [
              { data: [x1, y1] },
              { data: [x2, y2] },
            ] = params
            const s1 = new Date(x1).toTimeString().slice(0,5)
            const s2 = new Date(x2 + 1800000).toTimeString().slice(0,5)
            return `${y1}-${y1+y2} 次/分\n${s1}-${s2}`
          }
        },
        xAxis: {
          type: 'time',
          splitLine: { show: true, interval: 4 },
        },
        yAxis: {
          type: 'value',
          splitLine: { show: true },
          position: 'right',
        },
        series: [
          {
            name: 'max',
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: chartData1,
            itemStyle: {
              borderColor: '#68B3F6',
              color: '#68B3F6'
            },
            emphasis: {
              itemStyle: {
                borderColor: '#68B3F6',
                color: '#68B3F6'
              }
            },
          }
        ]
      });
      return chart;
    })

    await that.loadStatData(result)
  },

  loadStatData: async function(data) {
    const that = this
    let sum = 0;
    let min = 200;
    let max = 0;
    data.forEach((v, i) => {
      if (v.max > max) max = v.max
      if (v.min < min) min = v.min
      sum = sum + v.mean
    })
    const mean = data.length ? Math.floor(sum / data.length) : 0
    that.setData({ aggData0: { min, max, mean } })
  },

  bindRealtimeTap() {
    const { sensorId } = this.data
    wx.navigateTo({
      url: `/pages/env-rt/env-rt?sensorId=${sensorId}`
    })
  }
})