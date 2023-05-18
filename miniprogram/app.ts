// app.ts
App<IAppOption>({
  data: {
    service_uuid: "0000FFFF-0000-1000-8000-00805F9B34FB",
    characteristic_write_uuid: "0000FF01-0000-1000-8000-00805F9B34FB",
    characteristic_read_uuid: "0000FF02-0000-1000-8000-00805F9B34FB",
    name: "BLUFI",
    md5Key: "",
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