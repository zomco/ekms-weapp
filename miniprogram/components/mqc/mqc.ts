// components/mqc.ts
import mqtt from '../../utils/mqtt.js';

Component({
  lifetimes: {
    attached: function() {
      // 在组件实例进入页面节点树时执行
      // 开始连接
      const that = this
      const { id } = that.data
      const client = mqtt.connect('wxs://zomco.arnmi.com/mqtt', {
        protocolVersion: 4, //MQTT连接协议版本
        clientId: 'miniTest',
        clean: false,
        password: 'test1234.',
        username: 'nap',
        reconnectPeriod: 1000, //1000毫秒，两次重新连接之间的间隔
        connectTimeout: 30 * 1000, //1000毫秒，两次重新连接之间的间隔
        resubscribe: true //如果连接断开并重新连接，则会再次自动订阅已订阅的主题（默认true）
      })
      that.setData({ isConnecting: true })
      client.on('connect', function() {
        that.setData({ isConnecting: false, isConnected: true })
        client.subscribe(`/care/pub/${id}/data/+`, function(err, granted) {
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
        const matches = /^\/care\/\d+\/data\/([a-zA-Z]+)/.exec(topic)
        if (!matches) return
        that.triggerEvent('message', { key: matches[1], value: payload })
      })
      that.client = client
    },
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
      // 断开连接
      const that = this
      const { id } = that.data
      const { client } = that
      if (client === null || id === '') {
        return
      }
      client.unsubscribe(`/care/pub/${id}/data/+`)
      client.end()
    },
  },

  /**
   * 组件的属性列表
   */
  properties: {
    id: String
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
    publish: (key, value) => {
      const that = this
      const { id } = that.data
      const { client } = that
      client.publish(`/care/sub/${id}/data/${key}`, value)
    }
  }
})
