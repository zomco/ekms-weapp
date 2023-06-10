// app.ts

App<IAppOption>({
  data: {
    system: 'ios'
  },
  globalData: {
    mockData: true,
    platform: wx.getSystemInfoSync().platform,
  },
  onLaunch: function () {
  }
})