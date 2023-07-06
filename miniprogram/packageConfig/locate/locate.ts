// packageConfig/locate/locate.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';

const chartDataMax = 30

Page({

  /**
   * 页面的初始数据
   */
  data: {
    sensorId: '',
    ec: { lazyLoad: true },
  },
  chart: null,
  chartData: [],
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { sensorId } = options
    const that = this
    that.setData({ sensorId })
  },

  bindopen: function() {
    const that = this
    const component = this.selectComponent('#locate-chart')
    if (!component) {
      console.log('locate component is missing', component)
      return
    }
    component.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // new
      });

      // prettier-ignore
      // 角度15
      const angles = new Array(24).fill(0).map((v, i) => (15 * i) + '°')
      // prettier-ignore
      // 半径40
      const radius = new Array(7).fill(0).map((v, i) => 40 * i)
 
      chart.setOption( {
        polar: {},
        visualMap: {
          show: false,
          type: 'continuous',
          min: 0,
          max: chartDataMax,
          top: 'bottom',
          left: 'center',
          orient: 'horizontal',
          dimension: 2,
          calculable: false
        },
        angleAxis: {
          type: 'category',
          data: angles,
          boundaryGap: false,
          splitLine: {
            show: true,
            lineStyle: {
              color: '#ddd',
              type: 'dashed'
            }
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            show: false
          }
        },
        radiusAxis: {
          type: 'category',
          data: radius,
          z: 100,
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            show: false
          }
        },
        series: [
          {
            name: 'Punch Card',
            type: 'custom',
            coordinateSystem: 'polar',
            itemStyle: {
              color: '#d14a61'
            },
            renderItem: function (params, api) {
              var values = [api.value(0), api.value(1)];
              var coord = api.coord(values);
              var size = api.size([1, 1], values);
              return {
                type: 'sector',
                shape: {
                  cx: params.coordSys.cx,
                  cy: params.coordSys.cy,
                  r0: coord[2] - size[0] / 2,
                  r: coord[2] + size[0] / 2,
                  startAngle: -(coord[3] + size[1] / 2),
                  endAngle: -(coord[3] - size[1] / 2)
                },
                style: api.style({
                  fill: api.visual('color')
                })
              };
            },
            data: that.chartData,
          }
        ]
      })

      that.chart = chart
      return chart
    })
  },

  bindmessage: function({ detail }) {
    const that = this
    try {
      const data = JSON.parse(detail)
      const [{ body, timestamp }] = data
      if (!body) return
      const { location } = body
      if (!location) return
      const { x, y } = location
      const r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
      let a = Math.atan(y / x) / Math.PI * 180
      if (x < 0 && y > 0) {
        a = a + 180
      } else if (x < 0 && y < 0) {
        a = a + 180
      } else if (x > 0 && y < 0) {
        a = a + 360
      }
      const p = Math.floor(r / 40)
      const q = Math.floor(a / 15)
      // console.log(x, y, r, a, p, q)

      const index = that.chartData.findIndex(v => v[0] === p && v[1] === q)
      // console.log(p, q, index)
      if (index !== -1) {
        that.chartData[index][2] = that.chartData[index][2] + 1
      } else {
        if (that.chartData.length >= chartDataMax) {
          that.chartData.shift()
        }
        that.chartData.push([p, q, 1]);
      }
      that.chart.setOption({ series: { data: that.chartData } })
    } catch (e) {
      console.log(e)
    }
  }
})