// pages/heartRt/heartRt.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';

const chartDataMax = 30

Page({

  /**
   * 页面的初始数据
   */
  data: {
    sensorId: '',
    ec: { lazyLoad: true },
  },
  chart: null,
  chartData: [],
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { sensorId } = options
    const that = this
    that.setData({ sensorId })
  },

  bindopen: function() {
    const that = this
    const component = this.selectComponent('#rt-breath-chart')
    if (!component) {
      console.log('realtime breath component is missing', component)
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
        yAxis: {
          type: 'time',
          splitLine: { show: true, interval: 4 },
          axisLabel: { rotate: 270 },
          inverse: true
        },
        xAxis: {
          type: 'value',
          splitLine: { show: true },
          position: 'top',
          max: 30,
          min: 0,
          axisLabel: { rotate: 90 },
        },
        series: [
          {
            name: 'max',
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: that.chartData,
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
      })
      console.log(chart)
      that.chart = chart
      return chart
    })
  },

  bindmessage: function({ detail }) {
    const that = this
    try {
      const data = JSON.parse(detail)
      const [{ breath, timestamp }] = data
      if (!breath) return
      const { rate, waves, info } = breath
      if (!rate) return
      if (that.chartData.length >= chartDataMax) {
        that.chartData.shift()
      }
      that.chartData.push([rate, timestamp * 1000]);
      that.chart.setOption({ series: { data: that.chartData } })
    } catch (e) {
      console.log(e)
    }
  }
})