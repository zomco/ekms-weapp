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
      wx.navigateTo({ url: `/packageBreath/breath/breath?sensorId=${sensorId}` })
    }
  },

  observers: {
    'sensorId': async function(sensorId) {
      const that = this
      if (!sensorId) {
        console.log('thumbnail breath sensor id is missing', sensorId)
        return
      }
      that.setData({ isLoading: true })
      const startMills = new Date().setHours(0, 0, 0, 0)
      const stopMills = startMills + 86400000
      const result = await get(`sensor/${sensorId}/stat/sleep_overview/breath`, {
        start: startMills / 1000,
        stop: stopMills / 1000,
        unit: '1h',
      })
      that.setData({ isLoading: false })

      const component = this.selectComponent('#tn-breath-chart')
      if (!component) {
        console.log('thumbnail breath component is missing', component)
        return
      }
      component.init((canvas, width, height, dpr) => {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr // new
        });

        const chartData1 = new Array(24).fill(0).map((v, i) => [startMills + i * 3600000, null])
        const chartData2 = new Array(24).fill(0).map((v, i) => [startMills + i * 3600000, null])
        if (result && result.length) {
          result.forEach(v => {
            const index = chartData1.findIndex(vv => vv[0] === Date.parse(v.time))
            if (index === -1) return
            chartData1[index] = [Date.parse(v.time), v.min]
            chartData2[index] = [Date.parse(v.time), v.max - v.min]
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
            show: false,
            type: 'time',
            min: startMills,
            max: stopMills,
          },
          yAxis: {
            show: false,
            type: 'value',
            max: 30,
            min: 0,
          },
          series: [
            {
              name: 'min',
              type: 'bar',
              stack: '1',
              data: chartData1,
              barWidth: '20%',
              itemStyle: {
                borderColor: 'transparent',
                color: 'transparent'
              },
              emphasis: {
                itemStyle: {
                  borderColor: 'transparent',
                  color: 'transparent'
                }
              },
            },
            {
              name: 'max',
              type: 'bar',
              stack: '1',
              data: chartData2,
              barWidth: '20%',
              itemStyle: {
                borderColor: '#6ad0bb',
                color: '#6ad0bb'
              },
              emphasis: {
                itemStyle: {
                  borderColor: '#6ad0bb',
                  color: '#6ad0bb'
                }
              },
            }
          ],
          backgroundColor: 'rgba(246,246,246)',
        });
        return chart;
      })

    }
  },
})
