const binUtil = require('./binUtil')
const app = getApp()

const SERVICE_UUID = {
  '00003000-0000-1000-8000-00805F9B34FB': '状态', // 0x3787 = 14215 = parseInt([0314, 0402, 0115].map(n => n.slice(2)).join(''))
  '00004000-0000-1000-8000-00805F9B34FB': 'MQTT',
  '00005000-0000-1000-8000-00805F9B34FB': '权限'
}

const CHARACTERISTIC_UUID = {
  // 状态
  '00003001-0000-1000-8000-00805F9B34FB': '锁舌',
  '00003002-0000-1000-8000-00805F9B34FB': '大门',
  '00003003-0000-1000-8000-00805F9B34FB': '读卡器',
  // MQTT
  '00004001-0000-1000-8000-00805F9B34FB': '地址',
  '00004002-0000-1000-8000-00805F9B34FB': '用户',
  '00004003-0000-1000-8000-00805F9B34FB': '密码',
  // 权限
  '00005001-0000-1000-8000-00805F9B34FB': '权限区1',
  '00005002-0000-1000-8000-00805F9B34FB': '权限区2',
  '00005003-0000-1000-8000-00805F9B34FB': '权限区3',
  '00005004-0000-1000-8000-00805F9B34FB': '权限区4',
  '00005005-0000-1000-8000-00805F9B34FB': '权限区5',
  '00005006-0000-1000-8000-00805F9B34FB': '权限区6',
  '00005007-0000-1000-8000-00805F9B34FB': '权限区7',
  '00005008-0000-1000-8000-00805F9B34FB': '权限区8',
  '00005009-0000-1000-8000-00805F9B34FB': '权限区9',
  '0000500A-0000-1000-8000-00805F9B34FB': '权限区10',
  '0000500B-0000-1000-8000-00805F9B34FB': '权限区11',
  '0000500C-0000-1000-8000-00805F9B34FB': '权限区12',
  '0000500D-0000-1000-8000-00805F9B34FB': '权限区13',
  '0000500E-0000-1000-8000-00805F9B34FB': '权限区14',
  '0000500F-0000-1000-8000-00805F9B34FB': '权限区15',
  '00005010-0000-1000-8000-00805F9B34FB': '权限区16',
}

const MQTT_URL_LENGTH = 72
const MQTT_USERNAME_LENGTH = 18
const MQTT_PASSWORD_LENGTH = 18
const AUTH_ITEM_KEY_SIZE = 32
const AUTH_ITEM_BALANCE_SIZE = 4
const AUTH_ITEM_SIZE = AUTH_ITEM_KEY_SIZE + AUTH_ITEM_BALANCE_SIZE
const AUTH_LIST_LENGTH = 16
const AUTH_LIST_SIZE = AUTH_ITEM_SIZE * AUTH_LIST_LENGTH

const serviceName = (uuid: string): string => {
  return SERVICE_UUID[uuid] || '未知服务'
}

const serviceValid = (uuid: string): boolean => {
  return !!SERVICE_UUID[uuid]
}

const characteristicName = (uuid: string): string => {
  return CHARACTERISTIC_UUID[uuid] || '未知特征'
}

const characteristicValid = (uuid: string): boolean => {
  return !!CHARACTERISTIC_UUID[uuid]
}

const characteristicValue = (uuid: string, value: any): any => {
  if (value == null) {
    return '未知'
  }
  switch (CHARACTERISTIC_UUID[uuid]) {
    case '锁舌': {
      const v = new DataView(value).getUint8(0)
      return v == 1 ? '已锁上' : (v == 0 ? '已开锁' : '无效值')
    }
    case '大门': {
      const v = new DataView(value).getUint8(0)
      return v == 1 ? '已关上' : (v == 0 ? '已打开' : '无效值')
    }
    case '读卡器': {
      const v = binUtil.buf2Hex(value).split('').map((v, i) => i !== 0 && i % 2 === 0 ? `-${v}` : v).join('')
      return v
    }
    case '地址': 
    case '用户': 
    case '密码': {
      const v = binUtil.buf2Str(value)
      return v
    }
    case '权限区1':
    case '权限区2': 
    case '权限区3': 
    case '权限区4': 
    case '权限区5': 
    case '权限区6': 
    case '权限区7': 
    case '权限区8': 
    case '权限区9': 
    case '权限区10': 
    case '权限区11': 
    case '权限区12': 
    case '权限区13':
    case '权限区14': 
    case '权限区15':  
    case '权限区16':  {
      if (app.data.system === 'devtools') {
        const v = new Array(AUTH_LIST_LENGTH).fill(0).map((v, i) => ({
          key: '0000FF0300001000800000805F9B34FB0000FF0300001000800000805F9B34FB',
          balance: 123,
        }))
        return v
      } else {
        const v = []
        for (let i = 0; i < AUTH_LIST_LENGTH; i++) {
          const item = {
            key: binUtil.buf2Hex(value, i * AUTH_ITEM_SIZE, AUTH_ITEM_KEY_SIZE),
            balance: new DataView(value, i * AUTH_ITEM_SIZE + AUTH_ITEM_KEY_SIZE, AUTH_ITEM_BALANCE_SIZE).getUint32(0)
          }
          v.push(item)
        }
        return v
      }
    }
    default:
      return ''
  }
}

const characteristicDesc = (uuid: string): string => {
  switch (CHARACTERISTIC_UUID[uuid]) {
    case '锁舌': 
      return '门锁锁舌开关状态'
    case '大门':
      return '大门开关状态'
    case '读卡器':
      return '打卡器上一次识别的开锁权限'
    case '地址': 
      return 'MQTT 服务用于对接第三方云服务'
    case '用户': 
      return 'MQTT 服务用户名'
    case '密码': 
      return 'MQTT 服务密码'
    case '权限区1':
    case '权限区2': 
    case '权限区3': 
    case '权限区4': 
    case '权限区5': 
    case '权限区6': 
    case '权限区7': 
    case '权限区8': 
    case '权限区9': 
    case '权限区10': 
    case '权限区11': 
    case '权限区12': 
    case '权限区13':
    case '权限区14': 
    case '权限区15':  
    case '权限区16': 
      return '增加、删除或修改权限列表'
    default:
      return ''
  }
}

const characteristicWrite = (uuid: string, value: string): any => {
  switch (CHARACTERISTIC_UUID[uuid]) {
    case '地址': {
      const array = new Uint8Array(new ArrayBuffer(MQTT_URL_LENGTH))
      const url = binUtil.str2Buf(value)
      array.set(url, 0)
      return array
    } 
    case '用户': {
      const array = new Uint8Array(new ArrayBuffer(MQTT_USERNAME_LENGTH))
      const username = binUtil.str2Buf(value)
      array.set(username, 0)
      return array
    } 
    case '密码': {
      const array = new Uint8Array(new ArrayBuffer(MQTT_PASSWORD_LENGTH))
      const password = binUtil.str2Buf(value)
      array.set(password, 0)
      return array
    } 
    case '权限区1':
    case '权限区2': 
    case '权限区3': 
    case '权限区4': 
    case '权限区5': 
    case '权限区6': 
    case '权限区7': 
    case '权限区8': 
    case '权限区9': 
    case '权限区10': 
    case '权限区11': 
    case '权限区12': 
    case '权限区13':
    case '权限区14': 
    case '权限区15':  
    case '权限区16':  {
      const array = new Uint8Array(new ArrayBuffer(AUTH_LIST_SIZE))
      for (let i = 0; i < AUTH_LIST_LENGTH; i++) {
        const key = binUtil.hex2Buf(value[i].key)
        const b = new ArrayBuffer(AUTH_ITEM_BALANCE_SIZE)
        new DataView(b).setUint32(0, value[i].balance)
        const balance = new Uint8Array(b)
        array.set(key, i * AUTH_ITEM_SIZE)
        array.set(balance, i * AUTH_ITEM_SIZE + AUTH_ITEM_KEY_SIZE)
      }
      return array
    }
    default:
      return Uint8Array.of(0)
  }
}

module.exports = {
  MQTT_URL_LENGTH,
  MQTT_USERNAME_LENGTH,
  MQTT_PASSWORD_LENGTH,
  AUTH_ITEM_KEY_SIZE,
  AUTH_ITEM_BALANCE_SIZE,
  AUTH_ITEM_SIZE,
  AUTH_LIST_LENGTH,
  AUTH_LIST_SIZE,
  serviceName,
  serviceValid,
  characteristicName,
  characteristicValid,
  characteristicValue,
  characteristicDesc,
  characteristicWrite,
}