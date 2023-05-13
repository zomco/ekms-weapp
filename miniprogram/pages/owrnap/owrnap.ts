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
let heartChart
const heartChartDataMax = 5
const heartChartData = []
const initHeartChart = function (canvas, width, height, dpr) {
  heartChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(heartChart);
  var option = {
    title: {
      text: '心率',
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
        data: heartChartData,
        type: 'line',
        showSymbol: false,
        smooth: true
      }
    ]
  };
  heartChart.setOption(option);
  return heartChart;
}
let breathChart
const breathChartDataMax = 5
const breathChartData = []
const initBreathChart = function (canvas, width, height, dpr) {
  breathChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(breathChart);
  var option = {
    title: {
      text: '呼吸',
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
      type: 'time',
      splitLine: {
        show: false
      }
    },
    yAxis: {
      x: 'center',
      type: 'value',
      splitLine: {
        show: false
      }
    },
    series: [
      {
        data: breathChartData,
        type: 'line',
        showSymbol: false,
        smooth: true
      }
    ]
  };
  breathChart.setOption(option);
  return breathChart;
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
    heartEc: { onInit: initHeartChart },
    breathData: null,
    breathEc: { onInit: initBreathChart },
  },

  // echart

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

        if (!!heartChart) {
          if (heartChartData.length === heartChartDataMax) {
            heartChartData.shift()
          }
          heartChartData.push({ name: now, value: [now, heartData.value] })
          heartChart.setOption({ series: [{ data: heartChartData }] });
        }
        if (!!breathChart) {
          if (breathChartData.length === breathChartDataMax) {
            breathChartData.shift()
          }
          breathChartData.push({ name: now, value: [now, breathData.value] })
          breathChart.setOption({ series: [{ data: breathChartData }] });
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