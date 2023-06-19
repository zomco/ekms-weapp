// pages/heartRt/heartRt.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';

let chart
const start_mills = new Date().getTime()
const stop_mills = start_mills + 30000
const chartData = Array.from({ length: 1}, (v, i) => [start_mills + (i + 1) * 1000, 0])
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
        { data: [x1, y1] },
      ] = params
      const s1 = new Date(x1).toTimeString().slice(0,5)
      return `${y1} 次/分\n${s1}`
    }
  },
  xAxis: {
    type: 'time',
    splitLine: { show: true, interval: 4 },
  },
  yAxis: {
    type: 'value',
    splitLine: { show: true },
    position: 'right',
    max: 150,
    min: 0,
  },
  series: [
    {
      name: 'max',
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: chartData,
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
      const [{ heart, timestamp }] = data
      if (!heart) return
      const { rate, waves } = heart
      if (rate) {
        if (chartData.length >= 30) {
          chartData.shift()
        }
        chartData.push([timestamp * 1000, rate]);
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