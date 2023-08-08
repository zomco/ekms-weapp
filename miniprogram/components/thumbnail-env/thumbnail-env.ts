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
      wx.navigateTo({ url: `/packageEnv/env/env?sensorId=${sensorId}` })
    }
  },

  observers: {
    'sensorId': async function(sensorId) {
      const that = this
      if (!sensorId) {
        console.log('thumbnail env sensor id is missing', sensorId)
        return
      }
      that.setData({ isLoading: true })
      const startMills = new Date().setHours(0, 0, 0, 0) - 14400000
      const stopMills = startMills + 86400000
      const intervalCount = 24
      const intervalMills = 86400000 / intervalCount
      const result = await get(`sensor/${sensorId}/stat/sleep_overview/thi`, {
        start: startMills / 1000,
        stop: stopMills / 1000,
        unit: '1h',
      })
      that.setData({ isLoading: false })

      const component = this.selectComponent('#tn-env-chart')
      if (!component) {
        console.log('thumbnail env component is missing', component)
        return
      }
      component.init((canvas, width, height, dpr) => {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr // new
        });

        const chartData = new Array(intervalCount).fill(0).map((v, i) => [startMills + i * intervalMills, null])
        if (result && result.length) {
          result.forEach(v => {
            const index = chartData.findIndex(vv => vv[0] === Date.parse(v.time))
            if (index === -1) return
            chartData[index] = [Date.parse(v.time), v.mean]
          })
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
            min: 10,
            max: 30,
          },
          series: [
            {
              type: 'line',
              smooth: true,
              symbol: 'none',
              areaStyle: {},
              data: chartData,
              itemStyle: {
                borderColor: '#68B3F6',
                color: '#68B3F6'
              },
              emphasis: {
                itemStyle: {
                  borderColor: '#68B3F6',
                  color: '#68B3F6'
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
