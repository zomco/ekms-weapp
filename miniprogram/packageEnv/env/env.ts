// pages/position/position.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get, renderDuration, envilluminanceItem } from '../../utils/util'

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
  onLoad: async function(options) {
    const { sensorId } = options
    const that = this
    that.setData({ sensorId })
    if (!sensorId) {
      console.log('env sensor id is missing', sensorId)
      return
    }
    that.setData({ isLoading: true })
    const startMills = new Date().setHours(0, 0, 0, 0)
    const stopMills = startMills + 86400000
    let aggData = []
    let durData = []

    try {
      aggData = await that.loadAggData(sensorId, startMills, stopMills)
      durData = await that.loadDurData(sensorId, startMills, stopMills)
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

      let chartData = []
      if (durData && durData.length) {
        chartData = durData.filter(v => v.state !== '3').map((v, i) => envilluminanceItem(v))
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
          formatter: function (params) {
            const { data: { value: [y, x1, x2, s] }} = params
            const name = y == '0' ? '较亮' : y == '1' ? '适中' : y == '2' ? '较暗' : y == '3' ? '离床' : '未知'
            const s1 = new Date(x1).toTimeString().slice(0,5)
            const s2 = new Date(x2).toTimeString().slice(0,5)
            const t = s
            return `${name} ${t} 分钟\n${s1}-${s2}`
          }
        },
        xAxis: {
          type: 'time',
          splitLine: { show: false, interval: 4 },
          min: startMills,
          max: stopMills,
        },
        yAxis: {
          splitLine: { show: false },
          show: false,
          data: [1, 2, 3]
        },
        series: [
          {
            type: 'custom',
            renderItem: renderDuration,
            itemStyle: {
              opacity: 0.8
            },
            encode: {
              x: [1, 2],
              y: 0
            },
            data: chartData
          }
        ]
      });

      that.chart = chart
      return chart;
    })
  },

  loadDurData: async function(sensorId, startMills, stopMills) {
    const that = this
    const result = await get(`sensor/${sensorId}/duration/env/illuminance`, {
      start: startMills / 1000,
      stop: stopMills / 1000,
      unit: '1m',
    })

    return result
  },

  loadAggData: async function(sensorId, startMills, stopMills) {
    const that = this
    const result = await get(`sensor/${sensorId}/aggregate/env/illuminance`, {
      start: startMills / 1000,
      stop: stopMills / 1000,
      unit: '1m',
    })
    result.forEach((v, i) => {
      switch (v.state) {
        case "0": {
          that.setData({ aggData1: { sum: v.sum, ratio: (v.sum / 14.4).toFixed(2) }})
          break;
        }
        case "1": {
          that.setData({ aggData2: { sum: v.sum, ratio: (v.sum / 14.4).toFixed(2) }})
          break;
        }
        case "2": {
          that.setData({ aggData3: { sum: v.sum, ratio: (v.sum / 14.4).toFixed(2) }})
          break;
        }
        case "3": {
          that.setData({ aggData4: { sum: v.sum, ratio: (v.sum / 14.4).toFixed(2) }})
          break;
        }
      }
    })

    return result
  },

  bindRealtimeTap() {
    const { sensorId } = this.data
    wx.navigateTo({
      url: `/packageEnv/env-rt/env-rt?sensorId=${sensorId}`
    })
  },

  bindCalendarPick: async function({ detail }) {
    const that = this
    const startMills = detail
    const stopMills = startMills + 86400000
    const sensorId = that.data.sensorId
    try {
      const aggData = await that.loadAggData(sensorId, startMills, stopMills)
      const durData = await that.loadDurData(sensorId, startMills, stopMills)
      let chartData = []
      if (durData && durData.length) {
        chartData = durData.filter(v => v.state !== '3').map((v, i) => envilluminanceItem(v))
      }     

      that.chart.setOption({
        xAxis: { min: startMills, max: stopMills },
        series: [{ data: chartData } ],
      })
    } catch (e) {
      console.log(e)
    }
  },

})