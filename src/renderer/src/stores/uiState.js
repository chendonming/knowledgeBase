import { ref } from 'vue'

// 全局UI状态
const outlineCollapsed = ref(false)

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
