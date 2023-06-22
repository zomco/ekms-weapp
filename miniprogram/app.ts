// app.ts

App<IAppOption>({
  globalData: {
    env: wx.getAccountInfoSync().miniProgram.envVersion,
  },
  onLaunch: async function () {

  }
})