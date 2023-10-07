// packageConfig/info/info.ts
import { del, get, post } from '../../utils/util'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    loadingError: '',
    user: {},
    usernameTips: '',
    password1Tips: '',
    password1: '',
    password2Tips: '',
  },

  onLoad: async function(options) {
    const that = this
    try {
      const result = await get(`user`)
      that.setData({ isLoading: false, loadingError: '', user: result })
    } catch (e) {
      that.setData({ isLoading: false, loadingError: e.message })
    }
  },

  bindChangeUsername: async function({ detail: { value } }) {
    const that = this
    if (!value || value.length < 5 || value.length > 20) {
      that.setData({ usernameTips: '限制长度为 5 到 20 个字符' })
      return
    }
    
    try {
      const user = await post(`user`, { username: value })
      that.setData({ user, usernameTips: '' })
    } catch (e) {
      that.setData({ usernameTips: e.message })
    }
  },

  bindChangePassword1: function({ detail: { value } }) {
    const that = this
    if (!value || value.length < 8 || value.length > 30) {
      that.setData({ password1Tips: '限制长度为 8 到 30 个字符' })
      return
    }

    that.setData({ password1: value })
  },

  bindChangePassword2: async function({ detail: { value } }) {
    const that = this
    const { user, password1 } = that.data
    if (!value || value.length < 8 || value.length > 30) {
      that.setData({ password2Tips: '限制长度为 8 到 30 个字符' })
      return
    }

    if (user.passwordConfirmed && (!password1 || value.length < 8 || value.length > 30)) {
      that.setData({ password2Tips: '请输入旧密码' })
      return
    }

    try {
      const user = await post(`user`, { password1, password2: value })
      that.setData({ user, password1Tips: '', password2Tips: '' })
    } catch (e) {
      that.setData({ password2Tips: e.message })
    }
    
  },

})