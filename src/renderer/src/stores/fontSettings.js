import { ref } from 'vue'

const STORAGE_KEY = 'font-settings'

export const defaultFontSettings = {
  // 整体界面：中文字体、英文字体
  ui: { fontCJK: '', fontLatin: 'Segoe UI, system-ui, sans-serif' },
  // 编辑器
  editor: { fontCJK: '', fontLatin: 'Consolas, Monaco, monospace' },
  // 预览
  preview: { fontCJK: '', fontLatin: 'Georgia, serif' }
}

const defaultSettings = defaultFontSettings

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...defaultSettings, ...parsed }
    }
  } catch (_) {}
  return { ...defaultSettings }
}

const saved = ref(load())

const buildFontFamily = (cjk, latin, generic = 'sans-serif') => {
  const parts = []
  if (latin?.trim()) parts.push(latin.trim())
  if (cjk?.trim()) parts.push(`"${cjk.trim()}"`)
  parts.push(generic)
  return parts.join(', ')
}

export const getFontSettings = () => saved.value

export const setFontSettings = (next) => {
  saved.value = { ...defaultSettings, ...next }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.value))
  applyFonts()
  window.dispatchEvent(new CustomEvent('font-settings-changed'))
}

const genericByScope = { ui: 'sans-serif', editor: 'monospace', preview: 'serif' }

export const getFontFamily = (scope) => {
  const s = saved.value[scope] || defaultSettings[scope]
  const generic = genericByScope[scope] || 'sans-serif'
  return buildFontFamily(s?.fontCJK, s?.fontLatin, generic)
}

export const applyFonts = () => {
  const root = document.documentElement
  root.style.setProperty('--font-ui', getFontFamily('ui'))
  root.style.setProperty('--font-editor', getFontFamily('editor'))
  root.style.setProperty('--font-preview', getFontFamily('preview'))
}
