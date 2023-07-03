const app = getApp<IAppOption>()
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
      if (res.statusCode === 401) {
        wx.clearStorageSync()
        wx.redirectTo({ url: '/pages/index/index' })
      }
      const { success, result, message } = res.data
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
      if (res.statusCode === 401) {
        wx.clearStorageSync()
        wx.redirectTo({ url: '/pages/index/index' })
      }
      const { success, result, message } = res.data
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

module.exports = {
  formatTime: formatTime,
  get,
  post,
  login,
}
