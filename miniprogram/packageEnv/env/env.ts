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
    const startMills = new Date().setHours(0, 0, 0, 0) - 14400000
    const stopMills = startMills + 86400000
    const intervalCount = 48
    const intervalMills = 86400000 / intervalCount
    let aggData = []
    let statData = []

    try {
      aggData = await that.loadAggData(sensorId, startMills, stopMills)
      statData = await that.loadStatData(sensorId, startMills, stopMills)
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

      const chartData = new Array(intervalCount).fill(0).map((v, i) => [startMills + i * intervalMills, null])
      if (statData && statData.length) {
        statData.forEach(v => {
          const index = chartData.findIndex(vv => vv[0] === Date.parse(v.time))
          if (index === -1) return
          chartData[index] = [Date.parse(v.time), v.mean]
        })
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
          min: 10,
          max: 30,
        },
        series: [
          {
            type: 'line',
            smooth: true,
            symbol: 'none',
            areaStyle: {},
            data: chartData,
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

      that.chart = chart
      return chart;
    })
  },

  loadStatData: async function(sensorId, startMills, stopMills) {
    const that = this
    const result = await get(`sensor/${sensorId}/stat/sleep_overview/thi`, {
      start: startMills / 1000,
      stop: stopMills / 1000,
      unit: '30m',
    })

    let sum = 0;
    let min = 200;
    let max = 0;
    result.forEach((v, i) => {
      if (v.max > max) max = v.max
      if (v.min < min) min = v.min
      sum = sum + v.mean
    })
    min = min == 200 ? 0 : min
    const mean = result.length ? Math.floor(sum / result.length) : 0
    let overview = ''
    if (mean < 20) {
      overview = '较冷'
    } else if (mean < 26) {
      overview = '适中'
    } else {
      overview = '较热'
    }

    that.setData({ aggData0: { min, max, mean, overview } })

    return result
  },

  loadAggData: async function(sensorId, startMills, stopMills) {
    const that = this
    const result = await get(`sensor/${sensorId}/aggregate/sleep_overview/thi`, {
      start: startMills / 1000,
      stop: stopMills / 1000,
      unit: '10m',
    })
    result.forEach((v, i) => {
      switch (v.state) {
        case "0": {
          that.setData({ aggData1: { sum: v.sum * 10, ratio: (v.sum / 1.44).toFixed(2) }})
          break;
        }
        case "1": {
          that.setData({ aggData2: { sum: v.sum * 10, ratio: (v.sum / 1.44).toFixed(2) }})
          break;
        }
        case "2": {
          that.setData({ aggData3: { sum: v.sum * 10, ratio: (v.sum / 1.44).toFixed(2) }})
          break;
        }
        case "3": {
          that.setData({ aggData4: { sum: v.sum * 10, ratio: (v.sum / 1.44).toFixed(2) }})
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
    const startMills = detail - 14400000
    const stopMills = startMills + 86400000
    const intervalCount = 48
    const intervalMills = 86400000 / intervalCount
    const sensorId = that.data.sensorId
    try {
      const aggData = await that.loadAggData(sensorId, startMills, stopMills)
      const statData = await that.loadStatData(sensorId, startMills, stopMills)
      const chartData = new Array(intervalCount).fill(0).map((v, i) => [startMills + i * intervalMills, null])
      if (statData && statData.length) {
        statData.forEach(v => {
          const index = chartData.findIndex(vv => vv[0] === Date.parse(v.time))
          if (index === -1) return
          chartData[index] = [Date.parse(v.time), v.mean]
        })
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