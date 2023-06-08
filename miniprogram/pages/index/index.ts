import * as echarts from '../../ec-canvas/echarts';
import { get, login } from '../../utils/util'
const is_debuging = true
const now_debuging = Date.now()

//
let rateChart
const heartRateChartData = is_debuging ? Array.from({ length: 5}, (v, i) => {
  const t = new Date(now_debuging + i * 1000)
  return { name: t, value: [t, Math.trunc(Math.random() * 100)] }
}) : []
const breathRateChartData = is_debuging ? Array.from({ length: 5}, (v, i) => {
  const t = new Date(now_debuging + i * 1000)
  return { name: t, value: [t, Math.trunc(Math.random() * 30)] }
}) : []
const initRateChart = function (canvas, width, height, dpr) {
  rateChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(rateChart);
  var option = {
    title: {
      text: '频率',
      // left: 'center'
    },
    grid: {
      containLabel: true
    },
    tooltip: {
      show: true,
      trigger: 'axis',
      valueFormatter: (value) => `${value} 次/分钟`
    },
    xAxis: {
      type: 'time',
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        show: false
      }
    },
    series: [
      {
        data: heartRateChartData,
        name: '心跳频率',
        datasetId: 'heart_rate',
        type: 'line',
        showSymbol: false,
        smooth: true
      },
      {
        data: breathRateChartData,
        name: '呼吸频率',
        datasetId: 'breath_rate',
        type: 'line',
        showSymbol: false,
        smooth: true
      }
    ]
  };
  rateChart.setOption(option);
  return rateChart;
}

// 
let waveChart
const heartWaveChartData = is_debuging ? Array.from({ length: 25}, (v, i) => {
  const t = new Date(now_debuging + i * 1000)
  return { name: t, value: [t, Math.trunc(Math.random() * 256)] }
}) : []
const breathWaveChartData = is_debuging ? Array.from({ length: 25}, (n, i) => {
  const t = new Date(now_debuging + i * 1000)
  return { name: t, value: [t, Math.trunc(Math.random() * 256)] }
}) : []
const initWaveChart = function (canvas, width, height, dpr) {
  waveChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(waveChart);
  var option = {
    title: {
      text: '波形',
      // left: 'center'
    },
    grid: {
      containLabel: true
    },
    tooltip: {
      show: true,
      trigger: 'axis'
    },
    xAxis: {
      type: 'time',
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        show: false
      }
    },
    series: [
      {
        data: heartWaveChartData ,
        name: '心跳波形',
        datasetId: 'heart_wave',
        type: 'line',
        showSymbol: false,
        smooth: true
      },
      {
        data: breathWaveChartData ,
        name: '呼吸波形',
        datasetId: 'breath_wave',
        type: 'line',
        showSymbol: false,
        smooth: true
      }
    ]
  };
  waveChart.setOption(option);
  return waveChart;
}

//
let pathChart
const bodyXYChartData = is_debuging ? Array.from({ length: 5}, (v, i) => {
  const x = Math.trunc(Math.random() * 200 - 100)
  const y = Math.trunc(Math.random() * 200 - 100)
  let a = Math.atan(y / x) / Math.PI * 180
  if (x > 0 && y < 0) {
    a = a + 360
  } else if (x < 0 && y > 0) {
    a = a + 180
  } else if (x < 0 && y < 0) {
    a = a + 180
  }
  const r = Math.sqrt((x * x) + (y * y))
  return [r, a]
}) : []
const initPathChart = function (canvas, width, height, dpr) {
  pathChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(pathChart);
  var option = {
    title: {
      text: '方位',

    },
    polar: {
      center: ['50%', '50%'],
    },
    angleAxis: {
      type: 'value',
      min: 0,
      max: 360,
      interval: 30,
      clockwise: false,
      startAngle: 0
    },
    radiusAxis: {
      type: 'value',
    },
    series: [
      {
        coordinateSystem: 'polar',
        name: 'line',
        type: 'line',
        data: bodyXYChartData
      }
    ]
  };
  pathChart.setOption(option);
  return pathChart;
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    device: null,
    devices: [],
    visible: false,
  },

  onLoad: async function (options) {
    const that = this
    try {
      await login()
      const { content } = await get('owner/sensor')
      console.log(content)
      that.setData({ devices: content, device: content[0] })
    } catch (e) {
      console.error(e)
    }
  },

  bindPositionTap: function() {
    const { id, name } = this.data
    wx.navigateTo({ url: `/pages/position/position?id=${id}&name=${name}` })
  },

  bindHeartTap: function() {
    const { id, name } = this.data
    wx.navigateTo({ url: `/pages/heart/heart?id=${id}&name=${name}` })
  },

  bindBreathTap: function() {
    const { id, name } = this.data
    wx.navigateTo({ url: `/pages/breath/breath?id=${id}&name=${name}` })
  },

  bindSleepTap: function() {
    const { id, name } = this.data
    wx.navigateTo({ url: `/pages/sleep/sleep?id=${id}&name=${name}` })
  },

  bindDrawerShow: function() {
    this.setData({ visible: true })
  },

  // bindDeviceTap(event) {
  //   const { id, name } = event.currentTarget.dataset;
  //   wx.navigateTo({ url: `/pages/device/device?id=${id}&name=${name}` })
  // },

  bindAddDeviceTap: function () {
    wx.scanCode({
      onlyFromCamera: true,
      success: function(res) {
        console.log(res, res.result)
        if (/^\d{15}$/.test(res.result)) {
          wx.navigateTo({ url: `/pages/device/device?code=${res.result}` });
        }
      },
    })
  },

})