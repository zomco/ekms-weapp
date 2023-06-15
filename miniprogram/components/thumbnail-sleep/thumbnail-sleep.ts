// pages/sleep/sleep.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';
import { get } from '../../utils/util'

let chart
const start_mills = new Date().setHours(0, 0, 0, 0)
const stop_mills = start_mills + 86400000
const chartData = [{ 
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
const chartOptions = {
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
      wx.navigateTo({ url: `/pages/sleep/sleep?sensorId=${sensorId}&name=test` })
    }
  },

  observers: {
    'sensorId': async function(sensorId) {
      if (!sensorId || !chart) return
      const result = await get(`sensor/${sensorId}/duration/sleep/status`, {
        start: start_mills / 1000,
        stop: stop_mills / 1000,
        unit: '10m'
      })
      if (!result.length) return
      console.log(result)
      chartData = result.map((v, i) => chartDataItem(v))
      chart.setOption({
        series: [{
          data: chartData
        }]
      })
    }
  }
})
