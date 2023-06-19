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
      const s1 = new Date(x1).toTimeString().slice(0,5)
      return `${y1} 次/分\n${s1}`
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
    max: 60,
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
        borderColor: '#f0c044',
        color: '#f0c044'
      },
      emphasis: {
        itemStyle: {
          borderColor: '#f0c044',
          color: '#f0c044'
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
      const [{ body, timestamp }] = data
      if (!body) return
      const { presence, movement, energy, distance, location } = body
      if (energy) {
        if (chartData.length >= chartDataMax) {
          chartData.shift()
        }
        chartData.push([energy, timestamp * 1000]);
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