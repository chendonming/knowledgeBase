import { ref } from 'vue'

// 全局UI状态
const outlineCollapsed = ref(false)
const themeMode = ref('dark')

// 检测系统主题偏好
const getSystemTheme = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

// 初始化主题：首次使用系统偏好，之后使用localStorage
export const initTheme = () => {
  const saved = localStorage.getItem('theme-mode')
  if (saved) {
    themeMode.value = saved
  } else {
    themeMode.value = getSystemTheme()
    localStorage.setItem('theme-mode', themeMode.value)
  }
}

// 设置主题
export const setThemeMode = (mode) => {
  themeMode.value = mode
  localStorage.setItem('theme-mode', mode)
}

// 获取当前主题
export const getThemeMode = () => {
  return themeMode
}

// 从localStorage恢复状态
export const initializeUIState = () => {
  const saved = localStorage.getItem('outline-collapsed')
  if (saved !== null) {
    outlineCollapsed.value = JSON.parse(saved)
  }
}

// 切换大纲折叠状态
export const toggleOutlineCollapsed = () => {
  outlineCollapsed.value = !outlineCollapsed.value
  localStorage.setItem('outline-collapsed', JSON.stringify(outlineCollapsed.value))
}

// 获取大纲折叠状态
export const getOutlineCollapsed = () => {
  return outlineCollapsed
}

// 设置大纲折叠状态
export const setOutlineCollapsed = (collapsed) => {
  outlineCollapsed.value = collapsed
  localStorage.setItem('outline-collapsed', JSON.stringify(collapsed))
}
