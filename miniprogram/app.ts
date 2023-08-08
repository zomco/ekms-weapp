// app.ts

App<IAppOption>({
  globalData: {
    env: wx.getAccountInfoSync().miniProgram.envVersion,
  },
  onLaunch: async function () {
    // wx.loadFontFace({
    //   global: true,
    //   family: 'Material Design Icons',
    //   source: 'url("https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/fonts/materialdesignicons-webfont.eot")',
    //   success: console.log,
    //   fail: console.log
    // })
  }
})