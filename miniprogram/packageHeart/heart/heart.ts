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
    isCalendarShow: false,
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
    const startMills = new Date().setHours(0, 0, 0, 0)
    const stopMills = startMills + 86400000
    let aggData:[] = []
    let statData:[] = []
    try {
      aggData = await that.loadAggData(sensorId, startMills, stopMills)
      statData = await that.loadStatData(sensorId, startMills, stopMills)
      that.setData({ isLoading: false, loadingError: '' })
    } catch (e) {
      that.setData({ isLoading: false, loadingError: e.message })
    }

    const chartData1 = new Array(48).fill(0).map((v, i) => [startMills + i * 1800000, null])
    const chartData2 = new Array(48).fill(0).map((v, i) => [startMills + i * 1800000, null])
    if (statData && statData.length) {
      statData.forEach(v => {
        const index = chartData1.findIndex(vv => vv[0] === Date.parse(v.time))
        if (index === -1) return
        chartData1[index] = [Date.parse(v.time), v.min]
        chartData2[index] = [Date.parse(v.time), v.max - v.min]
      })
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
            const s2 = new Date(x2 + 1800000).toTimeString().slice(0,5)
            return `${parseInt(y1)}-${parseInt(y1)+parseInt(y2)} 次/分\n${s1}-${s2}`
          }
        },
        xAxis: {
          type: 'time',
          splitLine: { show: true, interval: 4 },
          min: startMills,
          max: stopMills,
          interval: 60000,
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

      that.chart = chart
      return chart;
    })
  },

  loadAggData: async function(sensorId, startMills, stopMills) {
    const that = this
    const result = await get(`sensor/${sensorId}/aggregate/heart/rate`, {
      start: startMills / 1000,
      stop: stopMills / 1000,
      unit: '1m',
    })
    result.forEach((v, i) => {
      switch (v.state) {
        case "0": {
          that.setData({ aggData4: { sum: v.sum, ratio: (v.sum / 14.4).toFixed(2) }})
          break;
        }
        case "1": {
          that.setData({ aggData3: { sum: v.sum, ratio: (v.sum / 14.4).toFixed(2) }})
          break;
        }
        case "2": {
          that.setData({ aggData2: { sum: v.sum, ratio: (v.sum / 14.4).toFixed(2) }})
          break;
        }
        case "3": {
          that.setData({ aggData1: { sum: v.sum, ratio: (v.sum / 14.4).toFixed(2) }})
          break;
        }
      }
    })

    return result
  },
  
  loadStatData: async function(sensorId, startMills, stopMills) {
    const that = this
    const result = await get(`sensor/${sensorId}/stat/heart/rate`, {
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
    min = min === 200 ? 0 : min
    const mean = result.length ? Math.floor(sum / result.length) : 0
    let overview = ''
    if (mean < 70) {
      overview = '心率较慢'
    } else if (mean < 80) {
      overview = '心率平静'
    } else if (mean < 90) {
      overview = '心率较快'
    } else {
      overview = '心率过快'
    }
    
    that.setData({ aggData0: { min, max, mean, overview } })

    return result
  },

  bindRealtimeTap() {
    const { sensorId } = this.data
    wx.navigateTo({
      url: `/packageHeart/heart-rt/heart-rt?sensorId=${sensorId}`
    })
  },

  bindCalendarPick: async function({ detail }) {
    const that = this
    const startMills = detail
    const stopMills = startMills + 86400000
    const sensorId = that.data.sensorId
    try {
      const aggData = await that.loadAggData(sensorId, startMills, stopMills)
      const statData = await that.loadStatData(sensorId, startMills, stopMills)
      const chartData1 = new Array(48).fill(0).map((v, i) => [startMills + i * 1800000, null])
      const chartData2 = new Array(48).fill(0).map((v, i) => [startMills + i * 1800000, null])
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