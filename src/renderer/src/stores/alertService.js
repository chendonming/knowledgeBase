import { reactive } from 'vue'

const state = reactive({
  visible: false,
  title: '提示',
  message: '',
  type: 'info',
  resolve: null
})

const queue = []

const showNext = () => {
  if (state.visible || queue.length === 0) return

  const next = queue.shift()
  state.title = next.title
  state.message = next.message
  state.type = next.type
  state.resolve = next.resolve
  state.visible = true
}

export const showAlert = (options) => {
  const payload = typeof options === 'string' ? { message: options } : options || {}
  const entry = {
    title: payload.title || '提示',
    message: payload.message || '',
    type: payload.type || 'info',
    resolve: null
  }

  return new Promise((resolve) => {
    entry.resolve = resolve
    queue.push(entry)
    showNext()
  })
}

export const confirmAlert = () => {
  if (state.resolve) {
    state.resolve()
  }
  state.visible = false
  state.resolve = null

  // 显示队列中的下一个
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
