// pages/sleep/sleep.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get, renderDuration, sleepStatusItem  } from '../../utils/util'

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
    const start_mills = new Date().setHours(0, 0, 0, 0)
    const stop_mills = start_mills + 86400000
    let result = []
    try {
      await that.loadAggData(sensorId, start_mills, stop_mills)
      result = await get(`sensor/${sensorId}/duration/sleep/status`, {
        start: start_mills / 1000,
        stop: stop_mills / 1000,
        unit: '1m',
      })
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
      if (result.length) {
        chartData = result.filter(v => v.state !== '3').map((v, i) => sleepStatusItem(v))
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
            const t = s
            return `${name} ${t} 分钟\n${s1}-${s2}`
          }
        },
        xAxis: {
          type: 'time',
          splitLine: { show: false, interval: 4 },
          min: start_mills,
          max: stop_mills,
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
      return chart;
    })

  },

  loadAggData: async function(sensorId, start_mills, stop_mills) {
    const that = this
    const result = await get(`sensor/${sensorId}/aggregate/sleep/status`, {
      start: start_mills / 1000,
      stop: stop_mills / 1000,
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
  },

})