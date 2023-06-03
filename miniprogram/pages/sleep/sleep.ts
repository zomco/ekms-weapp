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
  const s = Math.trunc(Math.random() * 6 + 1)
  const x1 = begin_mills + chartDataIndex * 1800000
  const x2 = begin_mills + (chartDataIndex + s) * 1800000
  if (chartDataCategory === 1) {
    const c = '#917aef' 
    chartData.push({ 
      value: [is_debug ? chartDataCategory - 1 : 0, x1, x2 , s], 
      itemStyle: {
        borderColor: c,
        color: c
      },
      emphasis: {
        itemStyle: {
          borderColor: c,
          color: c
        }
      },
    })
    chartDataCategory += 1
  } else if (chartDataCategory === 3) {
    const c = '#cdc3f7' 
    chartData.push({ 
      value: [is_debug ? chartDataCategory - 1 : 0, x1, x2 , s], 
      itemStyle: {
        borderColor: c,
        color: c
      },
      emphasis: {
        itemStyle: {
          borderColor: c,
          color: c
        }
      },
    })
    chartDataCategory -= 1
  } else {
    const c = '#ac9cf4'
    chartData.push({ 
      value: [is_debug ? chartDataCategory - 1 : 0, x1, x2 , s],
      itemStyle: {
        borderColor: c,
        color: c
      },
      emphasis: {
        itemStyle: {
          borderColor: c,
          color: c
        }
      },
    })
    const direction = Math.random() < 0.5
    chartDataCategory += (direction ? 1 : -1)
  }
  chartDataIndex += s
}
const chartRenderItem = (params, api) => {
  var categoryIndex = api.value(0);
  var start = api.coord([api.value(1), categoryIndex]);
  var end = api.coord([api.value(2), categoryIndex]);
  var height = api.size([0, 1])[1];
  var rectShape = echarts.graphic.clipRectByRect(
    {
      x: start[0],
      y: start[1] - height / 2,
      width: end[0] - start[0],
      height: height
    },
    {
      x: params.coordSys.x,
      y: params.coordSys.y,
      width: params.coordSys.width,
      height: params.coordSys.height
    }
  );
  return (
    rectShape && {
      type: 'rect',
      transition: ['shape'],
      shape: rectShape,
      style: api.style()
    }
  );
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
    formatter: function (params) {
      const { data: { value: [y, x1, x2, s] }} = params
      const s1 = new Date(x1).toTimeString().slice(0,5)
      const s2 = new Date(x2 + 1800000).toTimeString().slice(0,5)
      const t = s * 30
      return `${t} 分钟\n${s1}-${s2}`
    }
  },
  xAxis: {
    type: 'time',
    splitLine: { show: false, interval: 4 },
  },
  yAxis: {
    splitLine: { show: false },
    show: false,
    data: [1, 2, 3]
  },
  series: [
    {
      type: 'custom',
      renderItem: chartRenderItem,
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