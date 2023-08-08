// packageConfig/locate/locate.ts
const app = getApp<IAppOption>()
import * as echarts from '../../ec-canvas/echarts';

const chartDataMax = 30
/**
 * 雷达要求安装在床头正上方1m 高度，向下倾斜45°对着床中间，确保雷达
 * 与人体身体的距离为1.5m 范围内，确保雷达探测范围能正常覆盖睡眠区域
 * 
 * 
 * 
 * 雷达倾斜安装，倾斜角度为45°，安装在床头上方，雷达安装高度建议为
 * 高于床面1m；保证雷达主波束覆盖探测区域；雷达前面无明显遮挡物及覆盖
 * 物。受雷达安装高度及雷达波束范围影响，在该安装模式下，人体存在检测最 *
 * 大距离L3 ≈ 2.5 米；睡眠检测最大距离L2 ≈ 2.5 米；人体呼吸频率检测最
 * 大距离L1 ≈ 1.5 米。
 * 
 * 
 * 
 * 干扰因素：雷达属于电磁波探测传感器，活动的非生命体会导致误报。金属，液
 * 体的运动，会导致误判。通常，电风扇，贴近雷达的宠物，金属窗帘的晃动都会
 * 引起误判。雷达需要在安装角度做规划。
 * 非干扰因素：雷达电磁波会穿透人体的衣物，窗帘，薄木板，玻璃。需要根据应
 * 用，决定雷达的安装角度以及性能。
 * 半干扰因素：雷达判断人体存在，不适合直接面对空调。空调内部电机会导致雷
 * 达误判。需要雷达产品不直接面对空调。或者同空调同一方向。
 * 
 * 
 * 
 * R60ABD1 雷达模块波束覆盖范围如下图所示。雷达覆盖范围为水平40°、俯
 * 仰40°的立体扇形区域。
 * 
 * 
 */
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
      const { location, distance } = body
      console.log(location, distance)
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