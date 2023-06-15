// components/hearttn/hearttn.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get } from '../../utils/util'

let chart
const start_mills = new Date().setHours(0, 0, 0, 0)
const stop_mills = start_mills + 86400000
const chartData1 = Array.from({ length: 12}, (v, i) => [start_mills + (i + 1) * 7200000, 0])
const chartData2 = Array.from({ length: 12}, (v, i) => [start_mills + (i + 1) * 7200000, 0])
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
    max: 50,
    min: 0,
  },
  series: [
    {
      name: 'min',
      type: 'bar',
      stack: '1',
      data: chartData1,
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
  },

  /**
   * 组件的方法列表
   */
  methods: {
    _BindNavigateTap: function() {
      const { sensorId } = this.data
      if (!sensorId) return
      wx.navigateTo({ url: `/pages/breath/breath?sensorId=${sensorId}&name=test` })
    }
  },

  observers: {
    'sensorId': async function(sensorId) {
      if (!sensorId || !chart) return
      const result = await get(`sensor/${sensorId}/stat/breath/rate`, {
        start: start_mills / 1000,
        stop: stop_mills / 1000,
      })
      if (!result.length) return      
      const index = chartData1.findIndex(v => v[0] === Date.parse(result[0].time))
      chartData1.splice(index, result.length, ...result.map((v, i) => [Date.parse(v.time), v.min]))
      chartData2.splice(index, result.length, ...result.map((v, i) => [Date.parse(v.time), v.max - v.min]))

      chart.setOption({
        series: [{
          data: chartData1
        }, {
          data: chartData2
        }]
      })
    }
  },
})
