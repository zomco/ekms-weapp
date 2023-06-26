// components/wsc/wsc.ts
const app = getApp<IAppOption>()
let HOST = 'care1.arnmi.com'
if (app.globalData.env === 'release') {
  HOST = 'care.arnmi.com'
} 

Component({
  lifetimes: {
    attached: function() {
    },
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
      // 断开连接
      const that = this
      const { client } = that
      if (!client) return
      client.close()
    },
  },
  /**
   * 组件的属性列表
   */
  properties: {
    sensorId: String,
  },

  /**
   * 组件的初始数据
   */
  data: {
    isConnecting: false,
    isConnected: false,
    isSubscribed: false,
    connectError: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    publish: function(data) {
      const that = this
      const { client } = that
      client.send(data)
    }
  },

  observers: {
    'sensorId': async function(sensorId) {
      if (!sensorId) return
      const that = this
      const client = wx.connectSocket({
        url: `wss://${HOST}/ws/sensor/${sensorId}`,
        header: {
          authorization: `Bearer ${wx.getStorageSync('token')}`
        },
        success: res => console.log(res),
        fail: err => console.error(err)
      })
      that.setData({ isConnecting: true, connectError: '', isConnected: false })
      client.onOpen(({ header, profile }) => {
        that.setData({ isConnecting: false, connectError: '', isConnected: true })
        that.triggerEvent('open', profile)
        console.log('ws open', header, profile)
      })
      //服务器重连连接关闭的回调
      client.onClose(({ code, reason }) => {
        that.setData({ isConnecting: false, connectError: '', isConnected: false })
        that.triggerEvent('close', code)
        console.log('ws open', code, reason)
      })
      //服务器连接错误的回调
      client.onError(({ errMsg } ) => {
        that.setData({ isConnecting: false, connectError: errMsg, isConnected: false })
        that.triggerEvent('error', errMsg)
        console.log('ws error', errMsg)
      })
      //服务器下发消息的回调
      client.onMessage(({ data }) => {
        that.triggerEvent('message', data)
      })
      that.client = client
    }
  }
})
