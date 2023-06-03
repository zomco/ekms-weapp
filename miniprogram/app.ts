// app.ts
import { login } from './utils/util';

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
      success: async (res) => {
        try {
          await login(res.code)
        } catch (e) {
          console.error(e)
        }
      },
      fail: (err) => console.error(err)
    })
  },
})