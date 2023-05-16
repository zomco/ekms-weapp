// pages/owrnap/owrnap.ts
import mqtt from '../../utils/mqtt.js';
import * as echarts from '../../ec-canvas/echarts';

const host = 'wxs://zomco.arnmi.com/mqtt'
const mqttOpts = {
  protocolVersion: 4, //MQTT连接协议版本
  clientId: 'miniTest',
  clean: false,
  password: 'test1234.',
  username: 'nap',
  reconnectPeriod: 1000, //1000毫秒，两次重新连接之间的间隔
  connectTimeout: 30 * 1000, //1000毫秒，两次重新连接之间的间隔
  resubscribe: true //如果连接断开并重新连接，则会再次自动订阅已订阅的主题（默认true）
}
//
let rateChart
const heartRateChartData = []
const breathRateChartData = []
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
      left: 'center'
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
      left: 'center'
    },
    grid: {
      containLabel: true
    },
    tooltip: {
      show: true,
      trigger: 'axis'
    },
    xAxis: {
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
        data: [],
        name: '心跳波形',
        datasetId: 'heart_wave',
        type: 'line',
        showSymbol: false,
        smooth: true
      },
      {
        data: [],
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
const bodyXChartData = []
const bodyYChartData = []
const bodyZChartData = []
const bodyDistanceChartData = []
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
      left: 'center'
    },
    grid: {
      containLabel: true
    },
    tooltip: {
      show: true,
      trigger: 'axis',
      valueFormatter: (value) => `${value} 厘米`
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
        data: bodyDistanceChartData,
        name: '距离',
        datasetId: 'body_distance',
        type: 'line',
        showSymbol: false,
        smooth: true
      },
      {
        data: bodyXChartData,
        name: 'X距离',
        datasetId: 'body_x',
        type: 'line',
        showSymbol: false,
        smooth: true
      },
      {
        data: bodyYChartData,
        name: 'Y距离',
        datasetId: 'body_y',
        type: 'line',
        showSymbol: false,
        smooth: true
      },
      {
        data: bodyZChartData,
        name: 'Z距离',
        datasetId: 'body_z',
        type: 'line',
        showSymbol: false,
        smooth: true
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
    isConnecting: false,
    isConnected: false,
    isSubscribed: false,
    initData: null,
    reportData: null,
    rangeData: null,
    bodyData: null,
    heartData: null,
    breathData: null,
    rateEc: { onInit: initRateChart },
    waveEc: { onInit: initWaveChart },
    pathEc: { onInit: initPathChart },
  },

  // mqtt
  client: null,
  id: '',

  onLoad: function(options) {
    // const { id } = options
    const id = '864269064865054'
    // 页面创建时执行
    const that = this;
    //开始连接
    const client = mqtt.connect(host, mqttOpts)
    that.setData({ isConnecting: true })
    // that.setData({ isConnecting: false, isConnected: true })
    client.on('connect', function() {
      that.setData({ isConnecting: false, isConnected: true })
      client.subscribe(`/nap/pub/${id}/data/+`, function(err, granted) {
        if (!err) {
          that.setData({ isSubscribed: true })
        } else {
          that.setData({ isSubscribed: false })
        }
      })
    })
    //服务器重连连接异常的回调
    client.on("reconnect", function() {
      that.setData({ isConnecting: true, isConnected: false })
    })
    //服务器重连连接关闭的回调
    client.on("close", function() {
      that.setData({ isConnected: false })
    })
    //服务器重连连接关闭的回调
    client.on("disconnect", function() {
      that.setData({ isConnected: false })
    })
    //服务器连接异常的回调
    client.on("offline", function() {
      that.setData({ isConnected: false })
    })
    //服务器连接错误的回调
    client.on("error", function(error) {
      that.setData({ isConnecting: false, isConnected: false })
      console.error(" 服务器 error 的回调" + error)
    })
    //服务器下发消息的回调
    client.on("message", function(topic:string, payload) {
      // console.log(" 收到 topic:" + topic + " , payload :" + payload.toString())
      const data = JSON.parse(payload.toString())
      if (topic.endsWith('init')) {
        that.setData({ initData: data })
      } else if (topic.endsWith('period')) {
        const {
          range: rangeData,
          body: bodyData,
          heart: heartData,
          breath: breathData,
          timestamp,
        } = data
        const now = new Date(timestamp * 1000)

        if (!!rateChart) {
          if (heartRateChartData.length === 5) {
            heartRateChartData.shift()
          }
          if (breathRateChartData.length === 5) {
            breathRateChartData.shift()
          }
          heartRateChartData.push({ name: now, value: [now, heartData.value] })
          breathRateChartData.push({ name: now, value: [now, breathData.value] })
          rateChart.setOption({ series: [{ data: heartRateChartData }, { data: breathRateChartData }] })
        }
        if (!!waveChart) {
          const heartWaveChartData = heartData.waves.map((n, i) => ({ name: i * 0.25, value: [i * 0.25, n]}))
          const breathWaveChartData = breathData.waves.map((n, i) => ({ name: i * 0.25, value: [i * 0.25, n]}))
          waveChart.setOption({ series: [{ data: heartWaveChartData }, { data: breathWaveChartData }] });
        }
        if (!!pathChart) {
          if (bodyDistanceChartData.length === 5) {
            bodyDistanceChartData.shift()
          }
          if (bodyXChartData.length === 5) {
            bodyXChartData.shift()
          }
          if (bodyYChartData.length === 5) {
            bodyYChartData.shift()
          }
          if (bodyZChartData.length === 5) {
            bodyZChartData.shift()
          }
          const { location, distance } = bodyData
          bodyDistanceChartData.push({ name: now, value: [now, distance] })
          const zhex = location.z
          const yhex = location.y
          const xhex = location.x
          const z = (zhex & 0x8000) > 0 ? -(zhex & 0x7FFF) : zhex
          const y = (yhex & 0x8000) > 0 ? -(yhex & 0x7FFF) : yhex
          const x = (xhex & 0x8000) > 0 ? -(xhex & 0x7FFF) : xhex
          bodyXChartData.push({ name: now, value: [now, x] })
          bodyYChartData.push({ name: now, value: [now, y] })
          bodyZChartData.push({ name: now, value: [now, z] })
          pathChart.setOption({ series: [{ data: bodyDistanceChartData }, { data: bodyXChartData }, { data: bodyYChartData }, { data: bodyZChartData }] })
        }
        that.setData({ rangeData, bodyData, heartData, breathData })
      } else if (topic.endsWith('report')) {
        that.setData({ reportData: data })
      } else {
        console.log(`未处理的消息：${topic} ${payload.toString()}`)
      }
    })
    that.client = client
    that.id = id
  },

  onShow: function() {
    // 页面出现在前台时执行
  },

  onReady: function() {
    // 页面首次渲染完毕时执行
  },

  onHide: function() {
    // 页面从前台变为后台时执行
  },

  onUnload: function() {
    // 页面销毁时执行
    const { client, id } = this
    if (client === null || id === '') {
      return
    }
    client.unsubscribe(`/nap/pub/${id}/data/+`)
    client.end()
  },

  onPullDownRefresh: function() {
    // 触发下拉刷新时执行
  },

  onReachBottom: function() {
    // 页面触底时执行
  },

  onShareAppMessage: function () {
    // 页面被用户分享时执行
  },

  onPageScroll: function() {
    // 页面滚动时执行
  },

  onResize: function() {
    // 页面尺寸变化时执行
  }
})