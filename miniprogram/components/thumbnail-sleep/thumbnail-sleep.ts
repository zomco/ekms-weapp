// pages/sleep/sleep.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';

// const is_debug = app.data.system === 'devtools'
const is_debug = true
const now_mills = Date.now()
const begin_mills = new Date().setHours(0, 0, 0, 0)

let chart
const chartData = []
let chartDataIndex = 0
let chartDataCategory = 1
while (chartDataIndex < 48) {
  const s = Math.trunc(Math.random() * 6 + 1) // duration
  const x1 = begin_mills + chartDataIndex * 1800000 // basetime
  const x2 = begin_mills + (chartDataIndex + s) * 1800000 // basetime + duration
  if (chartDataCategory === 1) {
    const c = '#917aef' 
    chartData.push({ 
      value: [is_debug ? chartDataCategory - 1 : 0, x1, x2 , s], 
      itemStyle: {
        borderColor: c,
        color: c
      },
      emphasis: {
        itemStyle: {
          borderColor: c,
          color: c
        }
      },
    })
    chartDataCategory += 1
  } else if (chartDataCategory === 3) {
    const c = '#cdc3f7' 
    chartData.push({ 
      value: [is_debug ? chartDataCategory - 1 : 0, x1, x2 , s], 
      itemStyle: {
        borderColor: c,
        color: c
      },
      emphasis: {
        itemStyle: {
          borderColor: c,
          color: c
        }
      },
    })
    chartDataCategory -= 1
  } else {
    const c = '#ac9cf4'
    chartData.push({ 
      value: [is_debug ? chartDataCategory - 1 : 0, x1, x2 , s],
      itemStyle: {
        borderColor: c,
        color: c
      },
      emphasis: {
        itemStyle: {
          borderColor: c,
          color: c
        }
      },
    })
    const direction = Math.random() < 0.5
    chartDataCategory += (direction ? 1 : -1)
  }
  chartDataIndex += s
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
      // 开始连接         
      const that = this
      const { sensorId } = that.data
      console.log('attached', chartData)
      // if (!sensorId) return
      // const series =  [barLowSerie(chartData),barHighSerie(chartData,'#eb665f')]
      // const setSeries = (s) => {
      //   if (chart) {
      //     console.log(s)
      //     chart.setOption({ series: s })
      //   } else {
      //     console.log('waiting chart instance available')
      //     setTimeout(setSeries, 100, s)
      //   }
      // }
      // setSeries(series)
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
      wx.navigateTo({ url: `/pages/sleep/sleep?id=${sensorId}&name=test` })
    }
  }
})
