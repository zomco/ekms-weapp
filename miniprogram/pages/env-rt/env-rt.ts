// pages/heartRt/heartRt.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';

let chart
const chartDataMax = 30
const stop_mills = new Date().getTime()
const start_mills = stop_mills - chartDataMax * 1000
const chartData = Array.from({ length: chartDataMax}, (v, i) => [0, start_mills + (i + 1) * 1000])
const chartOptions = {
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
        { data: [y1, x1] },
      ] = params
      const s1 = new Date(x1).toTimeString().slice(0,8)
      return `${y1.toFixed(2)} Lux\n${s1}`
    }
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
};

const initChart = function (canvas, width, height, dpr) {
  chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(chart);
  chart.setOption(chartOptions);
  return chart;
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    sensorId: '',
    name: '',
    ec: { onInit: initChart }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { sensorId, name } = options
    const that = this
    that.setData({ sensorId, name })
  },

  bindmessage: function({ detail }) {
    try {
      if (!chart) return
      const data = JSON.parse(detail)
      const [{ env, timestamp }] = data
      if (!env) return
      const { illuminance, temperature, humidity } = env
      if (illuminance) {
        if (chartData.length >= chartDataMax) {
          chartData.shift()
        }
        chartData.push([illuminance, timestamp * 1000]);
        chart.setOption({
          series: {
            data: chartData
          }
        })
      }
    } catch (e) {
      console.log(e)
    }
  }
})