import { ref } from 'vue'
import { applyTheme, getThemeConfig } from '../themes/themeConfig'

// 全局UI状态
const outlineCollapsed = ref(false)
const themeMode = ref('dark')
const treeExpansionState = ref({}) // 目录树展开状态，key: path, value: expanded

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

  // 应用主题到DOM
  applyTheme(themeMode.value)
}

// 设置主题
export const setThemeMode = (mode) => {
  themeMode.value = mode
  localStorage.setItem('theme-mode', mode)

  // 应用主题到DOM
  applyTheme(mode)
}

// 获取当前主题
export const getThemeMode = () => {
  return themeMode
}

// 获取当前主题配置
export const getCurrentThemeConfig = () => {
  return getThemeConfig(themeMode.value)
}

// 从localStorage恢复状态
export const initializeUIState = () => {
  const saved = localStorage.getItem('outline-collapsed')
  if (saved !== null) {
    outlineCollapsed.value = JSON.parse(saved)
  }

  const savedTreeState = localStorage.getItem('tree-expansion-state')
  if (savedTreeState) {
    treeExpansionState.value = JSON.parse(savedTreeState)
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

// 获取目录树展开状态
export const getTreeExpansionState = (path) => {
  return treeExpansionState.value[path] !== undefined ? treeExpansionState.value[path] : true // 默认展开
}

// 设置目录树展开状态
export const setTreeExpansionState = (path, expanded) => {
  treeExpansionState.value[path] = expanded
  localStorage.setItem('tree-expansion-state', JSON.stringify(treeExpansionState.value))
}

// 清除目录树展开状态（当切换文件夹时）
export const clearTreeExpansionState = () => {
  treeExpansionState.value = {}
  localStorage.removeItem('tree-expansion-state')
}
