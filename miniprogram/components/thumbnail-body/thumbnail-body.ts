// components/hearttn/hearttn.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get } from '../../utils/util'

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
      wx.navigateTo({ url: `/packageBody/body/body?sensorId=${sensorId}` })
    }
  },

  observers: {
    'sensorId': async function(sensorId) {
      const that = this
      if (!sensorId) {
        console.log('thumbnail body sensor id is missing', sensorId)
        return
      }
      that.setData({ isLoading: true })
      const start_mills = new Date().setHours(0, 0, 0, 0)
      const stop_mills = start_mills + 86400000
      const result = await get(`sensor/${sensorId}/stat/body/energy`, {
        start: start_mills / 1000,
        stop: stop_mills / 1000,
        unit: '1h'
      })
      that.setData({ isLoading: false })

      const component = this.selectComponent('#tn-body-chart')
      if (!component) {
        console.log('thumbnail body component is missing', component)
        return
      }
      component.init((canvas, width, height, dpr) => {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr // new
        });

        let chartData1 = []
        if (result && result.length) {
          chartData1 = result.map((v, i) => [Date.parse(v.time), v.mean])
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
            show: false,
            type: 'time',
            min: start_mills,
            max: stop_mills,
          },
          yAxis: {
            show: false,
            type: 'value',
          },
          series: [
            {
              name: 'max',
              type: 'line',
              smooth: true,
              symbol: 'none',
              data: chartData1,
              itemStyle: {
                borderColor: '#f0c044',
                color: '#f0c044'
              },
              emphasis: {
                itemStyle: {
                  borderColor: '#f0c044',
                  color: '#f0c044'
                }
              },
            }
          ],
          backgroundColor: 'rgba(246,246,246)',
        });

        return chart;
      })

    }
  }
})
