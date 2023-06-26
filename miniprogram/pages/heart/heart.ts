// pages/heart.ts
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
    aggData1: {},
    aggData2: {},
    aggData3: {},
    aggData4: {},
    aggData0: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const { sensorId } = options
    const that = this
    that.setData({ sensorId })
    if (!sensorId) {
      console.log('heart sensor id is missing', sensorId)
      return
    }
    that.setData({ isLoading: true })
    const start_mills = new Date().setHours(0, 0, 0, 0)
    const stop_mills = start_mills + 86400000
    let result = []
    try {
      await that.loadAggData(sensorId, start_mills, stop_mills)
      result = await get(`sensor/${sensorId}/stat/heart/rate`, {
        start: start_mills / 1000,
        stop: stop_mills / 1000,
        unit: '30m',
      })
      await that.loadStatData(result)
      that.setData({ isLoading: false, loadingError: '' })
    } catch (e) {
      that.setData({ isLoading: false, loadingError: e.message })
    }

    const component = this.selectComponent('#heart-chart')
    if (!component) {
      console.log('heart component is missing', component)
      return
    }
    component.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // new
      });

      const chartData1 = Array.from({ length: 48}, (v, i) => [start_mills + (i + 1) * 1800000, null])
      const chartData2 = Array.from({ length: 48}, (v, i) => [start_mills + (i + 1) * 1800000, null])
      if (result.length) {
        const index = chartData1.findIndex(v => v[0] === Date.parse(result[0].time))
        chartData1.splice(index, result.length, ...result.map((v, i) => [Date.parse(v.time), v.min]))
        chartData2.splice(index, result.length, ...result.map((v, i) => [Date.parse(v.time), v.max - v.min]))
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
            return `${parseInt(y1)}-${parseInt(y1)+parseInt(y2)} 次/分\n${s1}-${s2}`
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
          max: 120,
          min: 40,
        },
        series: [
          {
            name: 'min',
            type: 'bar',
            stack: '1',
            data: chartData1,
            itemStyle: {
              borderColor: 'transparent',
              color: 'transparent'
            },
            emphasis: {
              itemStyle: {
                borderColor: 'transparent',
                color: 'transparent'
              }
            },
          },
          {
            name: 'max',
            type: 'bar',
            stack: '1',
            data: chartData2,
            itemStyle: {
              borderColor: '#eb665f',
              color: '#eb665f'
            },
            emphasis: {
              itemStyle: {
                borderColor: '#eb665f',
                color: '#eb665f'
              }
            },
          }
        ]
      });
      return chart;
    })
  },

  loadAggData: async function(sensorId, start_mills, stop_mills) {
    const that = this
    const result = await get(`sensor/${sensorId}/aggregate/heart/rate`, {
      start: start_mills / 1000,
      stop: stop_mills / 1000,
      unit: '1m',
    })
    result.forEach((v, i) => {
      switch (v.state) {
        case "1": {
          that.setData({ aggData4: { sum: v.sum, ratio: (v.sum / 14.4).toFixed(2) }})
          break;
        }
        case "2": {
          that.setData({ aggData3: { sum: v.sum, ratio: (v.sum / 14.4).toFixed(2) }})
          break;
        }
        case "3": {
          that.setData({ aggData2: { sum: v.sum, ratio: (v.sum / 14.4).toFixed(2) }})
          break;
        }
        case "4": {
          that.setData({ aggData1: { sum: v.sum, ratio: (v.sum / 14.4).toFixed(2) }})
          break;
        }
      }
    })
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
      url: `/pages/heart-rt/heart-rt?sensorId=${sensorId}`
    })
  }

})