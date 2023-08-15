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
    const component = this.selectComponent('#rt-env-chart')
    if (!component) {
      console.log('realtime env component is missing', component)
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
            endLabel: {
              show: true,
              rotate: -90,
              offset: [-80, 20],
              fontSize: 24,
              formatter: function (params) {
                return params.value[0];
              }
            },
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
      })
      that.chart = chart
      return chart
    })
  },

  bindmessage: function({ detail }) {
    const that = this
    try {
      const data = JSON.parse(detail)
      const [{ env, timestamp }] = data
      if (!env) return
      const { illuminance, temperature, humidity } = env
      console.log(illuminance, temperature, humidity)
      if (!illuminance) return
      if (that.chartData.length >= chartDataMax) {
        that.chartData.shift()
      }
      that.chartData.push([illuminance, timestamp * 1000]);
      that.chart.setOption({ series: { data: that.chartData } })
    } catch (e) {
      console.log(e)
    }
  }
})