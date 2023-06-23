// components/hearttn/hearttn.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get } from '../../utils/util'

let chart
const start_mills = new Date().setHours(0, 0, 0, 0)
const stop_mills = start_mills + 86400000
const chartData1 = Array.from({ length: 12}, (v, i) => [start_mills + (i + 1) * 7200000, 0])
const chartOptions = {
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
  },
  yAxis: {
    show: false,
    type: 'value',
    max: 45,
    min: 0,
  },
  series: [
    {
      name: 'max',
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: chartData1,
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
};

const initChart = function (canvas, width, height, dpr) {
  chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(chart);
  chart.setOption(chartOptions);
  return chart;
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
    ec: { onInit: initChart },
    isLoading: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    _BindNavigateTap: function() {
      const { sensorId } = this.data
      if (!sensorId) return
      wx.navigateTo({ url: `/pages/env/env?sensorId=${sensorId}&name=test` })
    }
  },

  observers: {
    'sensorId': async function(sensorId) {
      const that = this
      if (!sensorId || !chart) return
      that.setData({ isLoading: true })
      const result = await get(`sensor/${sensorId}/stat/env/temperature`, {
        start: start_mills / 1000,
        stop: stop_mills / 1000,
      })
      that.setData({ isLoading: false })
      if (!result.length) return      
      const index = chartData1.findIndex(v => v[0] === Date.parse(result[0].time))
      chartData1.splice(index, result.length, ...result.map((v, i) => [Date.parse(v.time), v.mean]))

      chart.setOption({
        series: [{
          data: chartData1
        }]
      })
    }
  }
})
