// pages/sleep/sleep.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get, renderDuration, sleepStatusItem  } from '../../utils/util'

/**
 * 
 * 睡眠不足：睡眠时长＜4h
 * 睡眠过长：睡眠时长＞12h
 * 异常无人：睡眠状态下，存在探测30min 无人
 * 无：睡眠时长正常或者无人离床状态时
 * 
 * 
 * 针对上报的睡眠评分进行分级
 * 当评分＞0 时
 * 1~60 是较差
 * 61~75 是一般
 * 76~100 是良好
 * 
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
    aggData4: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
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
    let aggData = []
    let durData = []
    try {
      aggData = await that.loadAggData(sensorId, startMills, stopMills)
      durData = await that.loadDurData(sensorId, startMills, stopMills)

      that.setData({ isLoading: false, loadingError: '' })
    } catch (e) {
      that.setData({ isLoading: false, loadingError: e.message })
    }

    const component = this.selectComponent('#sleep-chart')
    if (!component) {
      console.log('sleep component is missing', component)
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
        chartData = durData.filter(v => v.state !== '3').map((v, i) => sleepStatusItem(v))
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
            const name = y == '0' ? '深睡' : y == '1' ? '浅睡' : y == '2' ? '清醒' : y == '3' ? '离床' : '未知'
            const s1 = new Date(x1).toTimeString().slice(0,5)
            const s2 = new Date(x2).toTimeString().slice(0,5)
            const t = s * 10
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
    const result = await get(`sensor/${sensorId}/duration/sleep/status`, {
      start: startMills / 1000,
      stop: stopMills / 1000,
      unit: '10m',
    })

    return result
  },

  loadAggData: async function(sensorId, startMills, stopMills) {
    const that = this
    const result = await get(`sensor/${sensorId}/aggregate/sleep/status`, {
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

  bindCalendarPick: async function({ detail }) {
    const that = this
    const startMills = detail - 14400000
    const stopMills = startMills + 86400000
    const sensorId = that.data.sensorId
    try {
      const aggData = await that.loadAggData(sensorId, startMills, stopMills)
      const durData = await that.loadDurData(sensorId, startMills, stopMills)
      let chartData = []
      if (durData && durData.length) {
        chartData = durData.filter(v => v.state !== '3').map((v, i) => sleepStatusItem(v))
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