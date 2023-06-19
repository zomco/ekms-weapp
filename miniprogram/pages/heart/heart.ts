// pages/heart.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get } from '../../utils/util'

let chart
const start_mills = new Date().setHours(0, 0, 0, 0)
const stop_mills = start_mills + 86400000
const chartData1 = Array.from({ length: 12}, (v, i) => [start_mills + (i + 1) * 1800000, 0])
const chartData2 = Array.from({ length: 12}, (v, i) => [start_mills + (i + 1) * 1800000, 0])
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
        { data: [x2, y2] },
      ] = params
      const s1 = new Date(x1).toTimeString().slice(0,5)
      const s2 = new Date(x2 + 1800000).toTimeString().slice(0,5)
      return `${parseInt(y1)}-${parseInt(y1)+parseInt(y2)} 次/分\n${s1}-${s2}`
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
    ec: { onInit: initChart },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const { sensorId, name } = options
    const that = this
    that.setData({ sensorId, name })
    if (!sensorId) return
    const result = await get(`sensor/${sensorId}/stat/heart/rate`, {
      start: start_mills / 1000,
      stop: stop_mills / 1000,
      unit: '30m',
    })
    if (!result.length) return      
    const index = chartData1.findIndex(v => v[0] === Date.parse(result[0].time))
    chartData1.splice(index, result.length, ...result.map((v, i) => [Date.parse(v.time), v.min]))
    chartData2.splice(index, result.length, ...result.map((v, i) => [Date.parse(v.time), v.max - v.min]))
    
    chart.setOption({
      series: [{
        data: chartData1
      }, {
        data: chartData2
      }]
    })
  },

  bindRealtimeTap() {
    const { sensorId, name } = this.data
    wx.navigateTo({
      url: `/pages/heart-rt/heart-rt?sensorId=${sensorId}&name=${name}`
    })
  }

})