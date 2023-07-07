const app = getApp<IAppOption>()
import * as echarts from '../ec-canvas/echarts';

let HOST = 'care1.arnmi.com'
if (app.globalData.env === 'trial' || app.globalData.env === 'release') {
  HOST = 'care.arnmi.com'
} else {
  console.log('develop environment:', app.globalData.env)
}

export const formatTime = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

const formatNumber = (n: number) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}

const reset = () => {
  wx.clearStorageSync()
  wx.redirectTo({ url: '/pages/index/index' })
}

const get = (path, data) => new Promise((resolve, reject) => {
  const url = `https://${HOST}/api/${path}`
  wx.request({
    url,
    data,
    method: 'GET',
    header: {
      'authorization': `Bearer ${wx.getStorageSync('token')}`,
      'content-type': 'application/json'
    },
    success: (res) => {
      // 授权信息失效，需要清除缓存，重新登录
      if (res.statusCode === 401) {
        reset()
        return reject(new Error('Login token expired'))
      }
      const { code, success, result, message } = res.data
      // 传感器信息不同步，需要清除缓存，重新登录
      if (code === 40001) {
        reset()
        return reject(new Error('Sensor not existed'))
      }
      if (!success) {
        return reject(new Error(message))
      }
      resolve(result)
    },
    fail: (err) => reject(err)
  })
})

const post = (path, data) => new Promise((resolve, reject) => {
  const url = `https://${HOST}/api/${path}`
  wx.request({
    url,
    data,
    method: 'POST',
    header: {
      'authorization': `Bearer ${wx.getStorageSync('token')}`,
      'content-type': 'application/json'
    },
    success: (res) => {
      // 授权信息失效，需要清除缓存，重新登录
      if (res.statusCode === 401) {
        reset()
        return reject(new Error('Login token expired'))
      }
      const { code, success, result, message } = res.data
      // 传感器信息不同步，需要清除缓存，重新登录
      if (code === 40001) {
        reset()
        return reject(new Error('Sensor not existed'))
      }
      if (!success) {
        return reject(new Error(message))
      }
      resolve(result)
    },
    fail: (err) => reject(err)
  })
})

const login = () => new Promise((resolve, reject) => {
  const token = wx.getStorageSync('token')
  const username = wx.getStorageSync('username')
  const sensors = wx.getStorageSync('sensors')
  const sensorIndex = wx.getStorageSync('sensorIndex')
  if (token && username) {
    resolve({ token, username, sensors, sensorIndex })
    return
  }
  wx.login({
    success: ({ code }) => {
      wx.request({
        url: `https://${HOST}/api/auth/wxlogin`,
        data: { code },
        method: 'POST',
        success: (res) => {
          const { success, result, message } = res.data
          if (!success) {
            return reject(new Error(message))
          }
          wx.setStorageSync('token', result.token)
          wx.setStorageSync('username', result.username)
          wx.setStorageSync('sensors', result.sensors)
          wx.setStorageSync('sensorIndex', 0)
          resolve({ 
            token: result.token, 
            username: result.username, 
            sensors: result.sensors, 
            sensorIndex: 0,
          })
        }
      })
    },
    fail: (err) => console.error(err)
  })
})

const renderDuration = (params, api) => {
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

const envilluminanceItem = (item) => {
  let color = 'rgba(246,246,246)'
  switch (item.state) {
    case '0':
      color = '#68B3F6'
      break;
    case '1':
      color = '#9dcbf5'
      break;
    case '2':
      color = '#cde4f7'
      break;
    case '3':
      color = '#cde4f7'
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

const bodyEnergyItem = (item) => {
  let color = 'rgba(246,246,246)'
  switch (item.state) {
    case '0':
      color = '#f0c044'
      break;
    case '1':
      color = '#f2dd8f'
      break;
    case '2':
      color = '#f5e8c6'
      break;
    case '3':
      color = '#f5e8c6'
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

const sleepStatusItem = (item) => {
  let color = 'rgba(246,246,246)'
  switch (item.state) {
    case '0':
      color = '#917aef'
      break;
    case '1':
      color = '#cdc3f7'
      break;
    case '2':
      color = '#e6e1f7'
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

module.exports = {
  formatTime: formatTime,
  reset,
  get,
  post,
  login,
  renderDuration,
  bodyEnergyItem,
  sleepStatusItem,
  envilluminanceItem,
}
