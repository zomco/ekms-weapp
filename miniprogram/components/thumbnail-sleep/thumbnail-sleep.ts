// pages/sleep/sleep.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get } from '../../utils/util'

const chartDataItem = (item) => {
  let color = 'rgba(246,246,246)'
  switch (item.state) {
    case '0':
      color = '#917aef'
      break;
    case '1':
      color = '#cdc3f7'
      break;
    case '2':
      color = '#ac9cf4'
      break;
    case '3':
      color = '#e6e1f7'
      break;
  }
  return { 
    value: [parseInt(item.state), Date.parse(item.start), Date.parse(item.stop) , item.duration],
    itemStyle: {
      borderColor: color,
      color: color
    },
    emphasis: {
      itemStyle: {
        borderColor: color,
        color: color
      }
    },
  }
}
const chartRenderItem = (params, api) => {
  var categoryIndex = api.value(0);
  var start = api.coord([api.value(1), categoryIndex]);
  var end = api.coord([api.value(2), categoryIndex]);
  var height = api.size([0, 1])[1];
  var rectShape = echarts.graphic.clipRectByRect(
    {
      x: start[0],
      y: start[1] - height / 2,
      width: end[0] - start[0],
      height: height
    },
    {
      x: params.coordSys.x,
      y: params.coordSys.y,
      width: params.coordSys.width,
      height: params.coordSys.height
    }
  );
  return (
    rectShape && {
      type: 'rect',
      transition: ['shape'],
      shape: rectShape,
      style: api.style()
    }
  );
}

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
      const start_mills = new Date().setHours(0, 0, 0, 0)
      const stop_mills = start_mills + 86400000
      const result = await get(`sensor/${sensorId}/duration/sleep/status`, {
        start: start_mills / 1000,
        stop: stop_mills / 1000,
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
          chartData = result.filter(v => v.state !== '3').map((v, i) => chartDataItem(v))
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
            min: start_mills,
            max: stop_mills,
          },
          yAxis: {
            show: false,
            data: [1, 2, 3]
          },
          series: [
            {
              type: 'custom',
              renderItem: chartRenderItem,
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
