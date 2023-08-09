// app.ts

App<IAppOption>({
  globalData: {
    env: wx.getAccountInfoSync().miniProgram.envVersion,
  },
  onLaunch: async function () {
    wx.loadFontFace({
      global: true,
      family: 'Material Design Icons',
      source: 'url("https://care.arnmi.com/fonts/materialdesignicons-webfont.eot")',
      success: console.log,
      fail: console.log
    })
  }
})