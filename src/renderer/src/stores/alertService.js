import { reactive } from 'vue'

const state = reactive({
  visible: false,
  title: '提示',
  message: '',
  type: 'info',
  resolve: null,
  confirmMode: false // true 时显示「继续」「取消」双按钮
})

const queue = []

const showNext = () => {
  if (state.visible || queue.length === 0) return

  const next = queue.shift()
  state.title = next.title
  state.message = next.message
  state.type = next.type
  state.resolve = next.resolve
  state.confirmMode = next.confirmMode || false
  state.visible = true
}

export const showAlert = (options) => {
  const payload = typeof options === 'string' ? { message: options } : options || {}
  const entry = {
    title: payload.title || '提示',
    message: payload.message || '',
    type: payload.type || 'info',
    resolve: null,
    confirmMode: false
  }

  return new Promise((resolve) => {
    entry.resolve = resolve
    queue.push(entry)
    showNext()
  })
}

/** 显示确认对话框（继续/取消），返回 Promise<boolean>，继续=true，取消=false */
export const showConfirm = (options) => {
  const payload = typeof options === 'string' ? { message: options } : options || {}
  const entry = {
    title: payload.title || '确认',
    message: payload.message || '',
    type: payload.type || 'warning',
    resolve: null,
    confirmMode: true
  }

  return new Promise((resolve) => {
    entry.resolve = resolve
    queue.push(entry)
    showNext()
  })
}

/** 关闭弹窗。对于 confirm 模式，传入 true/false 表示用户选择 */
export const confirmAlert = (userChoice) => {
  if (state.resolve) {
    state.resolve(state.confirmMode ? userChoice : undefined)
  }
  state.visible = false
  state.resolve = null
  state.confirmMode = false

  setTimeout(() => {
    showNext()
  }, 0)
}

export const hideAlerts = () => {
  state.visible = false
  state.resolve = null
  queue.length = 0
}

export const alertState = state
