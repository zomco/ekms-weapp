// components/wsc/wsc.ts
Component({
  lifetimes: {
    attached: function() {
      // 在组件实例进入页面节点树时执行
      // 开始连接
      const that = this
      const { deviceId } = that.data
      if (!deviceId) return

      const client = wx.connectSocket({
        url: `wss://zomco.arnmi.com/ws/device/${deviceId}`,
        header: {
          authorization: `Bearer ${wx.getStorageSync('token')}`
        },
        success: res => console.log(res),
        fail: err => console.error(err)
      })
      that.setData({ isConnecting: true })
      client.onOpen(({ header, profile }) => {
        that.setData({ isConnecting: false, isConnected: true })
      })
      //服务器重连连接关闭的回调
      client.onClose(({ code, reason }) => {
        that.setData({ isConnected: false })
      })
      //服务器连接错误的回调
      client.onError(({ errMsg } ) => {
        that.setData({ isConnecting: false, isConnected: false })
        console.error(" 服务器 error 的回调" + errMsg)
      })
      //服务器下发消息的回调
      client.onMessage(({ data }) => {
        that.triggerEvent('message', data)
      })
      that.client = client
    },
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
      // 断开连接
      const that = this
      const { deviceId } = that.data
      const { client } = that
      if (!client || !deviceId) return
      client.close()
    },
  },
  /**
   * 组件的属性列表
   */
  properties: {
    deviceId: String,
  },

  /**
   * 组件的初始数据
   */
  data: {
    isConnecting: false,
    isConnected: false,
    isSubscribed: false,
    connectError: null,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    publish: function(data) {
      const that = this
      const { deviceId } = that.data
      const { client } = that
      client.send(data)
    }
  }
})