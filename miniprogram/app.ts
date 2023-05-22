// app.ts
App<IAppOption>({
  data: {
    system: 'ios'
  },
  globalData: {},
  onLaunch() {
    const that = this;
    wx.getSystemInfo({
      success(res) {
        that.data.system = res.platform
      }
    })
    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
  },
})