// components/date-picker/date-picker.ts

const format = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`
}

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
      value: '',
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    visible: false,
    note: format(Date.now()),
    value: Date.now(),
    minDate: Date.now() - 604800000,
    maxDate: Date.now(),
  },

  /**
   * 组件的方法列表
   */
  methods: {
    _handleCalendar() {
      this.setData({ visible: true });
    },
    _handleConfirm(e) {
      const that = this
      const { value } = e.detail;
      const date = new Date(value);

      that.setData({ value, note: `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日` });
      that.triggerEvent('pick', value)
    },
  }
})
