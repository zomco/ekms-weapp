// pages/sleep/sleep.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get } from '../../utils/util'

const chartDataItem = (item) => {
  let color = 'rgba(246,246,246)'
  switch (item.state) {
    case 0:
      color = '#cdc3f7'
      break;
    case 1:
      color = '#cdc3f7'
      break;
    case 2:
      color = '#ac9cf4'
      break;
  }
  return { 
    value: [item.state, item.start, item.stop , item.duration],
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

Page({

  /**
   * 页面的初始数据
   */
  data: {
    sensorId: '',
    ec: { lazyLoad: true },
    isLoading: true,
    loadingError: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
    const { sensorId } = options
    const that = this
    that.setData({ sensorId })
    if (!sensorId) {
      console.log('heart sensor id is missing', sensorId)
      return
    }
    that.setData({ isLoading: true })
    const start_mills = new Date().setHours(0, 0, 0, 0)
    const stop_mills = start_mills + 86400000
    let result = []
    try {
      result = await get(`sensor/${sensorId}/duration/sleep/status`, {
        start: start_mills / 1000,
        stop: stop_mills / 1000,
        unit: '30m',
      })
      that.setData({ isLoading: false, loadingError: '' })
    } catch (e) {
      that.setData({ isLoading: false, loadingError: e.message })
    }

    const component = this.selectComponent('#sleep-chart')
    if (!component) {
      console.log('sleep component is missing', component)
      return
    }
    component.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // new
      });

      let chartData = [{ 
        value: [0, start_mills, stop_mills , 12],
        itemStyle: {
          borderColor: 'rgba(246,246,246)',
          color: 'rgba(246,246,246)'
        },
        emphasis: {
          itemStyle: {
            borderColor: 'rgba(246,246,246)',
            color: 'rgba(246,246,246)'
          }
        },
      }]
      if (result.length) {
        chartData = result.map((v, i) => chartDataItem(v))
      }     

      chart.setOption({
        grid: {
          containLabel: true,
          left: '20rpx',
          top: 0,
          right: '20rpx',
          bottom: 0
        },
        tooltip: {
          formatter: function (params) {
            const { data: { value: [y, x1, x2, s] }} = params
            const s1 = new Date(x1).toTimeString().slice(0,5)
            const s2 = new Date(x2 + 1800000).toTimeString().slice(0,5)
            const t = s * 30
            return `${t} 分钟\n${s1}-${s2}`
          }
        },
        xAxis: {
          type: 'time',
          splitLine: { show: false, interval: 4 },
        },
        yAxis: {
          splitLine: { show: false },
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
        ]
      });
      return chart;
    })

  },

})