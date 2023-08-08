// pages/breath/breath.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get } from '../../utils/util'

/**
 * 
 * 呼吸过高：＞25 次/min
 * 呼吸过低：＜10 次/min
 * 正常：10≤x≤25 次/min
 * 无：无人时的默认状态
 * 
 */
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
    const startMills = new Date().setHours(0, 0, 0, 0) - 14400000
    const stopMills = startMills + 86400000
    const intervalCount = 24
    const intervalMills = 86400000 / intervalCount
    let aggData:[] = []
    let statData:[] = []

    try {
      aggData = await that.loadAggData(sensorId, startMills, stopMills)
      statData = await that.loadStatData(sensorId, startMills, stopMills)
      that.setData({ isLoading: false, loadingError: '' })
    } catch (e) {
      that.setData({ isLoading: false, loadingError: e.message })
    }

    const component = this.selectComponent('#breath-chart')
    if (!component) {
      console.log('breath component is missing', component)
      return
    }
    component.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // new
      });

      const chartData1 = new Array(intervalCount).fill(0).map((v, i) => [startMills + i * intervalMills, null])
      const chartData2 = new Array(intervalCount).fill(0).map((v, i) => [startMills + i * intervalMills, null])
      if (statData && statData.length) {
        statData.forEach(v => {
          const index = chartData1.findIndex(vv => vv[0] === Date.parse(v.time))
          if (index === -1) return
          chartData1[index] = [Date.parse(v.time), v.min]
          chartData2[index] = [Date.parse(v.time), v.max - v.min]
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
          show: true,
          trigger: 'axis',
          formatter: (params) => {
            const [
              { data: [x1, y1] },
              { data: [x2, y2] },
            ] = params
            if (!y1) return
            const s1 = new Date(x1).toTimeString().slice(0,5)
            const s2 = new Date(x2 + intervalMills).toTimeString().slice(0,5)
            return `${y1}-${y1+y2} 次/分\n${s1}-${s2}`
          }
        },
        xAxis: {
          type: 'time',
          splitLine: { show: true, interval: 4 },
          min: startMills,
          max: stopMills,
          interval: intervalMills,
        },
        yAxis: {
          type: 'value',
          splitLine: { show: true },
          position: 'right',
          max: 30,
          min: 0,
        },
        series: [
          {
            name: 'min',
            type: 'bar',
            stack: '1',
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
            data: chartData1
          },
          {
            name: 'max',
            type: 'bar',
            stack: '1',
            data: chartData2,
            itemStyle: {
              borderColor: '#6ad0bb',
              color: '#6ad0bb'
            },
            emphasis: {
              itemStyle: {
                borderColor: '#6ad0bb',
                color: '#6ad0bb'
              }
            },
          }
        ]
      });
      that.chart = chart
      return chart;
    })
  },

  loadAggData: async function(sensorId, startMills, stopMills) {
    const that = this
    const result = await get(`sensor/${sensorId}/aggregate/sleep_overview/breath`, {
      start: startMills / 1000,
      stop: stopMills / 1000,
      unit: '10m',
    })
    result.forEach((v, i) => {
      switch (v.state) {
        case "0": {
          that.setData({ aggData3: { sum: v.sum * 10, ratio: (v.sum / 1.44).toFixed(2) }})
          break;
        }
        case "1": {
          that.setData({ aggData2: { sum: v.sum * 10, ratio: (v.sum / 1.44).toFixed(2) }})
          break;
        }
        case "2": {
          that.setData({ aggData1: { sum: v.sum * 10, ratio: (v.sum / 1.44).toFixed(2) }})
          break;
        }
      }
    })

    return result
  },
  
  loadStatData: async function(sensorId, startMills, stopMills) {
    const that = this
    const result = await get(`sensor/${sensorId}/stat/sleep_overview/breath`, {
      start: startMills / 1000,
      stop: stopMills / 1000,
      unit: '1h',
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
    if (mean < 15) {
      overview = '呼吸较慢'
    } else if (mean < 20) {
      overview = '呼吸正常'
    } else {
      overview = '呼吸过快'
    }

    that.setData({ aggData0: { min, max, mean, overview } })

    return result
  },

  bindRealtimeTap() {
    const { sensorId } = this.data
    wx.navigateTo({
      url: `/packageBreath/breath-rt/breath-rt?sensorId=${sensorId}`
    })
  },

  bindCalendarPick: async function({ detail }) {
    const that = this
    const startMills = detail - 14400000
    const stopMills = startMills + 86400000
    const intervalCount = 24
    const intervalMills = 86400000 / intervalCount
    const sensorId = that.data.sensorId
    try {
      const aggData = await that.loadAggData(sensorId, startMills, stopMills)
      const statData = await that.loadStatData(sensorId, startMills, stopMills)
      const chartData1 = new Array(intervalCount).fill(0).map((v, i) => [startMills + i * intervalMills, null])
      const chartData2 = new Array(intervalCount).fill(0).map((v, i) => [startMills + i * intervalMills, null])
      if (statData && statData.length) {
        statData.forEach(v => {
          const index = chartData1.findIndex(vv => vv[0] === Date.parse(v.time))
          if (index === -1) return
          chartData1[index] = [Date.parse(v.time), v.min]
          chartData2[index] = [Date.parse(v.time), v.max - v.min]
        })
      }
      that.chart.setOption({
        xAxis: { min: startMills, max: stopMills },
        series: [{ data: chartData1 }, { data: chartData2 } ],
      })
    } catch (e) {
      console.log(e)
    }
  },
  
})