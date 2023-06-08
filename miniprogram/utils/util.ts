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
  const url = `https://zomco.arnmi.com/api/${path}`
  wx.request({
    url,
    data,
    method: 'GET',
    header: {
      authorization: `Bearer ${wx.getStorageSync('token')}`
    },
    success: (res) => {
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
  const url = `https://zomco.arnmi.com/api/${path}`
  wx.request({
    url,
    data,
    method: 'POST',
    header: {
      authorization: `Bearer ${wx.getStorageSync('token')}`
    },
    success: (res) => {
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
  wx.login({
    success: ({ code }) => {
      wx.request({
        url: 'https://zomco.arnmi.com/api/auth/wxlogin',
        data: { code },
        method: 'POST',
        success: (res) => {
          const { success, result, message } = res.data
          if (!success) {
            return reject(new Error(message))
          }
          wx.setStorageSync('token', result.token)
          wx.setStorageSync('username', result.username)
          resolve(result)
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
