// pages/position/position.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get, renderDuration, bodyEnergyItem } from '../../utils/util'

/**
 * 0%， 无人，环境无人
 * 1%，静止（睡眠），只有呼吸而没有肢体运动
 * 2%-30%，微动作，只有轻微头部或肢体小运动
 * 31%-60%，走动/快速肢体运动，比较慢速的身体运动
 * 61%-100%，跑动/近距离大动作，快速身体移动
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
      console.log('body sensor id is missing', sensorId)
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

    const component = this.selectComponent('#body-chart')
    if (!component) {
      console.log('body component is missing', component)
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
          chartData1[index] = [Date.parse(v.time), v.mean]
          chartData2[index] = [Date.parse(v.time), 100 - v.mean]
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
            const { data: { value: [x, y] }} = params
            const s = new Date(x).toTimeString().slice(0,5)
            return `${y} %\n${s}`
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
          min: 0,
          max: 100,
        },
        series: [
          {
            type: 'bar',
            stack: '1',
            data: chartData1,
            itemStyle: {
              borderColor: '#f0c044',
              color: '#f0c044'
            },
            emphasis: {
              itemStyle: {
                borderColor: '#f0c044',
                color: '#f0c044'
              }
            },
          },
          {
            type: 'bar',
            stack: '1',
            data: chartData2,
            itemStyle: {
              borderColor: '#f2dd8f',
              color: '#f2dd8f'
            },
            emphasis: {
              itemStyle: {
                borderColor: '#f2dd8f',
                color: '#f2dd8f'
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
    const result = await get(`sensor/${sensorId}/stat/sleep_overview/leratio`, {
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
    if (mean < 30) {
      overview = '活跃'
    } else if (mean < 60) {
      overview = '正常'
    } else {
      overview = '安静'
    }

    that.setData({ aggData0: { min, max, mean, overview } })

    return result
  },

  loadAggData: async function(sensorId, startMills, stopMills) {
    const that = this
    const result = await get(`sensor/${sensorId}/aggregate/sleep_overview/leratio`, {
      start: startMills / 1000,
      stop: stopMills / 1000,
      unit: '10m',
    })

    result.forEach((v, i) => {
      switch (v.state) {
        case "0": {
          that.setData({ aggData4: { sum: v.sum * 10, ratio: (v.sum / 1.44).toFixed(2) }})
          break;
        }
        case "1": {
          that.setData({ aggData3: { sum: v.sum * 10, ratio: (v.sum / 1.44).toFixed(2) }})
          break;
        }
        case "2": {
          that.setData({ aggData2: { sum: v.sum * 10, ratio: (v.sum / 1.44).toFixed(2) }})
          break;
        }
        case "3": {
          that.setData({ aggData1: { sum: v.sum * 10, ratio: (v.sum / 1.44).toFixed(2) }})
          break;
        }
      }
    })

    return result
  },

  bindRealtimeTap() {
    const { sensorId } = this.data
    wx.navigateTo({
      url: `/packageBody/body-rt/body-rt?sensorId=${sensorId}`
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