// components/hearttn/hearttn.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';

// const is_debug = app.data.system === 'devtools'
const is_debug = true
const now_mills = Date.now()
const begin_mills = new Date().setHours(0, 0, 0, 0)

let chart
const chartData = Array.from({ length: 12}, (v, i) => {
  // const x1 = new Date(begin_mills + i * 1800000).toTimeString().slice(0,5)
  // const x2 = new Date(begin_mills + (i + 1) * 1800000).toTimeString().slice(0,5)
  // const x = `${x1} - ${x2}`
  const x = begin_mills + i * 7200000
  const y1 =  is_debug && now_mills > begin_mills ? Math.trunc(Math.random() * 100 + 20) : 0
  const y2 = is_debug && now_mills > begin_mills ? Math.trunc(Math.random() * 40 + 1) : 0
  return { x, y1, y2 }
})
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
  },
  series: [
    {
      name: 'min',
      type: 'bar',
      stack: '1',
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
      data: chartData.map(n => [n.x, n.y1])
    },
    {
      name: 'max',
      type: 'bar',
      stack: '1',
      data: chartData.map(n => [n.x, n.y2]),
      itemStyle: {
        borderColor: '#eb665f',
        color: '#eb665f'
      },
      emphasis: {
        itemStyle: {
          borderColor: '#eb665f',
          color: '#eb665f'
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
      // 开始连接         
      const that = this
      const { sensorId } = that.data
      console.log('attached', sensorId)
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
      wx.navigateTo({ url: `/pages/heart/heart?id=${sensorId}&name=test` })
    }
  }
})
