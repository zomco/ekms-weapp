// pages/sleep/sleep.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';

// const is_debug = app.data.system === 'devtools'
const is_debug = true
const now_mills = Date.now()
const begin_mills = new Date().setHours(0, 0, 0, 0)

let chart
const chartData = []
let chartDataIndex = 0
let chartDataCategory = 1
while (chartDataIndex < 48) {
  const span = Math.trunc(Math.random() * 6 + 1)
  if (chartDataCategory === 1) {
    for (let i = 0 ; i < span && chartDataIndex < 48 ; i++) {
      const x = begin_mills + chartDataIndex * 1800000
      chartData.push({ x, y1: is_debug ? chartDataCategory - 1 : 0, y2: is_debug ? 1 : 0, s: span })
      chartDataIndex += 1
    }
    chartDataCategory += 1
  } else if (chartDataCategory === 3) {
    for (let i = 0 ; i < span && chartDataIndex < 48 ; i++) {
      const x = begin_mills + chartDataIndex * 1800000
      chartData.push({ x, y1: is_debug ? chartDataCategory - 1 : 0, y2: is_debug ? 1 : 0, s: span })
      chartDataIndex += 1
    }
    chartDataCategory -= 1
  } else {
    for (let i = 0 ; i < span && chartDataIndex < 48 ; i++) {
      const x = begin_mills + chartDataIndex * 1800000
      chartData.push({ x, y1: is_debug ? chartDataCategory - 1 : 0, y2: is_debug ? 1 : 0, s: span })
      chartDataIndex += 1
    }
    const direction = Math.random() < 0.5
    chartDataCategory += (direction ? 1 : -1)
  }
}
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
        { data: { value: [x2, y2] }},
      ] = params
      const s1 = new Date(x1).toTimeString().slice(0,5)
      const s2 = new Date(x2 + 1800000).toTimeString().slice(0,5)
      const c = y1 === 0 && y2 === 1 ? '深睡' : (y1 === 1 && y2 === 1 ? '浅睡' : (y1 === 2 && y2 === 1 ? '快速眼动' : '' ))
      return `${c}\n${s1}-${s2}`
    }
  },
  xAxis: {
    type: 'time',
    splitLine: { show: false, interval: 4 },
  },
  yAxis: {
    type: 'value',
    splitLine: { show: true },
    position: 'right',
    show: false,
  },
  series: [
    {
      name: 'min',
      type: 'bar',
      stack: '1',
      barCategoryGap: '0',
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
      data: chartData.map(n => [n.x, n.y1])
    },
    {
      name: 'max',
      type: 'bar',
      stack: '1',
      barCategoryGap: '0',
      data: chartData.map(n => { 
        const c = n.y1 === 0 && n.y2 === 1 ? '#917aef' : (n.y1 === 1 && n.y2 === 1 ? '#ac9cf4' : (n.y1 === 2 && n.y2 === 1 ? '#cdc3f7' : '#fff' ))
        return {
          value: [n.x, n.y2],
          itemStyle: {
            borderColor: c,
            color: c,
          },
          emphasis: {
            itemStyle: {
              borderColor: c,
              color: c
            }
          },  
        }
      }),
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
    id: '',
    name: '',
    ec: { onInit: initChart },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { id, name } = options
    const that = this
    that.setData({ id, name })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})