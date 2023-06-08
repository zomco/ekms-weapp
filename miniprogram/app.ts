// app.ts

App<IAppOption>({
  data: {
    system: 'ios'
  },
  globalData: {},
  onLaunch: function () {
    const that = this;
    wx.getSystemInfo({
      success(res) {
        that.data.system = res.platform
      }
    })
  }
})