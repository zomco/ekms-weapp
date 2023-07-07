// pages/sleep/sleep.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get, renderDuration, sleepStatusItem } from '../../utils/util'


Component({
  lifetimes: {
    attached: function() {
      // 在组件实例进入页面节点树时执行
    },
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
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
    ec: { lazyLoad: true },
    isLoading: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    _BindNavigateTap: function() {
      const { sensorId } = this.data
      if (!sensorId) return
      wx.navigateTo({ url: `/pages/sleep/sleep?sensorId=${sensorId}` })
    }
  },

  observers: {
    'sensorId': async function(sensorId) {
      const that = this
      if (!sensorId) {
        console.log('thumbnail sleep sensor id is missing', sensorId)
        return
      }
      that.setData({ isLoading: true })
      const startMills = new Date().setHours(0, 0, 0, 0)
      const stopMills = startMills + 86400000
      const result = await get(`sensor/${sensorId}/duration/sleep/status`, {
        start: startMills / 1000,
        stop: stopMills / 1000,
        unit: '1m'
      })
      that.setData({ isLoading: false })

      const component = this.selectComponent('#tn-sleep-chart')
      if (!component) {
        console.log('thumbnail sleep component is missing', component)
        return
      }
      component.init((canvas, width, height, dpr) => {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr // new
        });

        let chartData = []
        if (result.length) {
          chartData = result.filter(v => v.state !== '3').map((v, i) => sleepStatusItem(v))
        } 

        chart.setOption({
          grid: {
            containLabel: true,
            left: '-30rpx',
            top: '0rpx',
            right: '0rpx',
            bottom: '-30rpx'
          },
          xAxis: {
            type: 'time',
            show: false,
            min: startMills,
            max: stopMills,
          },
          yAxis: {
            show: false,
            data: [1, 2, 3]
          },
          series: [
            {
              type: 'custom',
              renderItem: renderDuration,
              itemStyle: {
                opacity: 0.8
              },
              encode: {
                x: [1, 2],
                y: 0
              },
              data: chartData
            }
          ],
          backgroundColor: 'rgba(246,246,246)',
        });

        return chart;
      })

    }
  }
})
