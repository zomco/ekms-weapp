// pages/heart.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';

// const is_debug = app.data.system === 'devtools'
const is_debug = true
const now_mills = Date.now()
const begin_mills = new Date().setHours(0, 0, 0, 0)

let chart
const chartData = Array.from({ length: 48}, (v, i) => {
  // const x1 = new Date(begin_mills + i * 1800000).toTimeString().slice(0,5)
  // const x2 = new Date(begin_mills + (i + 1) * 1800000).toTimeString().slice(0,5)
  // const x = `${x1} - ${x2}`
  const x = begin_mills + i * 1800000
  const y1 =  is_debug && now_mills > begin_mills ? Math.trunc(Math.random() * 100 + 20) : 0
  const y2 = is_debug && now_mills > begin_mills ? Math.trunc(Math.random() * 40 + 1) : 0
  return { x, y1, y2 }
})
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
      return `${y1}-${y1+y2} 次/分\n${s1}-${s2}`
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
  },
  series: [
    {
      name: 'min',
      type: 'bar',
      stack: '1',
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
      data: chartData.map(n => [n.x, n.y2]),
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