import mqtt from '../../utils/mqtt.js';
import * as echarts from '../../ec-canvas/echarts';

const is_debuging = true
const now_debuging = Date.now()
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
    isConnecting: false,
    isConnected: false,
    isSubscribed: false,
    productData: null,
    statusData: null,
    rangeData: null,
    bodyData: null,
    heartData: null,
    breathData: null,
    envData: null,
    reportData: null,
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
    const that = this
    that.id = id
    if (is_debuging) {
      that.setData({ isConnecting: false, isConnected: true })
      return
    }
    //开始连接
    const client = mqtt.connect(host, mqttOpts)
    that.setData({ isConnecting: true })
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
        console.log(data)
        const {
          product: productData,
          status: statusData,
        } = data
        that.setData({ productData, statusData })
      } else if (topic.endsWith('period')) {
        const {
          range: rangeData,
          body: bodyData,
          heart: heartData,
          breath: breathData,
          env: envData, 
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
          if (heartData) {
            heartRateChartData.push({ name: now, value: [now, heartData.value] })
          }
          if (breathData) {
            breathRateChartData.push({ name: now, value: [now, breathData.value] })
          }
          rateChart.setOption({ series: [{ data: heartRateChartData }, { data: breathRateChartData }] })
        }
        if (!!waveChart) {
          if (heartWaveChartData.length === 25) {
            heartWaveChartData.shift()
            heartWaveChartData.shift()
            heartWaveChartData.shift()
            heartWaveChartData.shift()
            heartWaveChartData.shift()
          }
          if (breathWaveChartData.length === 25) {
            breathWaveChartData.shift()
            breathWaveChartData.shift()
            breathWaveChartData.shift()
            breathWaveChartData.shift()
            breathWaveChartData.shift()
          }
          const tmsp = timestamp * 1000
          if (heartData && heartData.waves && heartData.waves.length > 0) {
            heartWaveChartData.push(...heartData.waves.map((n, i) => {
              const tmspd = new Date(tmsp + i * 250)
              return { name: tmspd, value: [tmspd, n] }
            }))
          }
          if (breathData && breathData.waves && breathData.waves.length > 0) {
            breathWaveChartData.push(...breathData.waves.map((n, i) => {
              const tmspd = new Date(tmsp + i * 250)
              return { name: tmspd, value: [tmspd, n] }
            }))
          }
          waveChart.setOption({ series: [{ data: heartWaveChartData }, { data: breathWaveChartData }] });
        }
        if (!!pathChart) {
          if (bodyXYChartData.length === 1) {
            bodyXYChartData.shift()
          }
          const { location } = bodyData
          location.y = (location.y & 0x8000) > 0 ? -(location.y & 0x7FFF) : location.y
          location.x = (location.x & 0x8000) > 0 ? -(location.x & 0x7FFF) : location.x
          const y = location.y
          const x = location.x
          let a = Math.atan(y / x) / Math.PI * 180
          if (x > 0 && y < 0) {
            a = a + 360
          } else if (x < 0 && y > 0) {
            a = a + 180
          } else if (x < 0 && y < 0) {
            a = a + 180
          }
          const r = Math.sqrt((x * x) + (y * y))
          bodyXYChartData.push([r, a])
          pathChart.setOption({ series: [{ data: bodyXYChartData }] })
        }
        if (envData) {
          envData.light = envData.light && envData.light.toFixed(2) || 0
          envData.humidity = envData.humidity && (envData.humidity * 100).toFixed(2) || 0
          envData.tempreture = envData.tempreture && envData.tempreture.toFixed(2) || 0
        }

        that.setData({ rangeData, bodyData, heartData, breathData, envData })
      } else if (topic.endsWith('report')) {
        that.setData({ reportData: data })
      } else {
        console.log(`未处理的消息：${topic} ${payload.toString()}`)
      }
    })

    client.publish(`/nap/sub/${id}/data/init`, "")
    client.publish(`/nap/sub/${id}/data/period`, "")
    that.client = client
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
    if (is_debuging) {
      return
    }
    // 断开连接
    const { client, id } = this
    if (client === null || id === '') {
      return
    }
    client.unsubscribe(`/nap/sub/${id}/data/+`)
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