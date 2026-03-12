<template>
  <div
    class="markdown-viewer"
    :class="{ 'drop-zone-active': isDraggingOver }"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else class="viewer-content" :class="{ 'edit-mode': isEditing }">
      <Transition name="viewer-mode" mode="out-in">
        <div v-if="isEditing" key="edit" class="editor-wrapper">
          <MarkdownEditor
            v-model="editorContent"
            :theme="monacoTheme"
            language="markdown"
            @save="saveFile"
          />
        </div>
        <div v-else key="preview" class="preview-wrapper">
          <!-- 欢迎页：无文件时显示 -->
          <div v-if="!filePath" class="welcome-page">
            <div class="welcome-content">
              <div class="welcome-icon">
                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="16" y="8" width="36" height="48" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                  <path d="M16 20h36M16 28h28M16 36h24M16 44h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <rect x="44" y="12" width="24" height="32" rx="2" stroke="currentColor" stroke-width="2" fill="none" opacity="0.7"/>
                  <path d="M48 20h16M48 26h12M48 32h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
                </svg>
              </div>
              <h1 class="welcome-title">欢迎使用 Knowledge Base</h1>
              <p class="welcome-desc">您的本地 Markdown 知识库管理工具</p>
              <p class="welcome-cta">从左侧文件树选择文档，通过菜单打开文件夹，或将 Markdown 文件拖入此处临时阅读</p>
              <div class="welcome-features">
                <div class="feature-item">
                  <span class="feature-icon">📝</span>
                  <span>支持 Markdown、数学公式、代码高亮</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">⌨️</span>
                  <span>双击文档可进入编辑模式</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🔍</span>
                  <span>Ctrl+F 在文档内搜索</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 文档预览：有文件时显示 -->
          <template v-else>
            <div v-if="frontmatter" class="frontmatter-card">
              <h1 v-if="frontmatter.title" class="fm-title">{{ frontmatter.title }}</h1>
              <div class="fm-meta">
                <span v-if="frontmatter.date" class="fm-date">
                  📅 {{ formatDate(frontmatter.date) }}
                </span>
                <span v-if="frontmatter.tags && frontmatter.tags.length" class="fm-tags">
                  🏷️ <span v-for="tag in frontmatter.tags" :key="tag" class="tag">{{ tag }}</span>
                </span>
                <span v-if="frontmatter.author" class="fm-author"> ✍️ {{ frontmatter.author }} </span>
              </div>
            </div>
            <article
              class="markdown-body"
              v-html="htmlContent"
            ></article>
          </template>
        </div>
      </Transition>
    </div>

    <!-- 搜索覆盖层 -->
    <Transition name="search">
      <div v-if="isSearchOpen" class="search-overlay" @click.self="closeSearch">
        <div class="search-container">
          <div class="search-input-group">
            <svg
              class="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="在文档中搜索..."
              @keydown.enter="nextMatch"
              @keydown.escape="closeSearch"
              @keydown.arrow-up.prevent="prevMatch"
              @keydown.arrow-down.prevent="nextMatch"
              @input="performSearch"
            />
            <div class="search-stats" v-if="searchMatches.length > 0">
              {{ currentMatchIndex + 1 }} / {{ searchMatches.length }}
            </div>
            <button
              class="search-btn"
              @click="prevMatch"
              :disabled="searchMatches.length === 0"
              title="上一个匹配"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
            <button
              class="search-btn"
              @click="nextMatch"
              :disabled="searchMatches.length === 0"
              title="下一个匹配"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <button class="search-btn close-btn" @click="closeSearch" title="关闭搜索">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.css'
import MarkdownEditor from './MarkdownEditor.vue'
import { getThemeMode } from '../stores/uiState'
import { showAlert, showConfirm } from '../stores/alertService'

const props = defineProps({
  filePath: {
    type: String,
    default: null
  },
  rootFolder: {
    type: String,
    default: null
  },
  editing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['html-updated', 'enter-edit', 'exit-edit', 'editing-changed', 'update:hasUnsavedChanges', 'update:saving', 'file-dropped'])

const htmlContent = ref('')
const frontmatter = ref(null)
const rawContent = ref('')
const editorContent = ref('')
const loading = ref(false)
const error = ref(null)
const isEditing = ref(false)
const saving = ref(false)
// 用于忽略「自身保存」触发的 file-changed（IPC 异步，事件可能晚于 saving=false 到达）
const lastSavedPath = ref(null)
const lastSavedTime = ref(0)
const themeMode = getThemeMode()
const autoSaveEnabled = ref(localStorage.getItem('auto-save') === 'true')
let autoSaveTimer = null

// 搜索相关状态
const isSearchOpen = ref(false)
const searchQuery = ref('')
const searchMatches = ref([])
const currentMatchIndex = ref(-1)
const searchInputRef = ref(null)

// 拖放外部文件进行临时阅读
const isDraggingOver = ref(false)
const handleDragOver = (e) => {
  const hasFile = e.dataTransfer?.types?.includes('Files')
  if (hasFile) {
    isDraggingOver.value = true
    e.dataTransfer.dropEffect = 'copy'
  }
}
const handleDragLeave = (e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDraggingOver.value = false
  }
}
const handleDrop = async (e) => {
  e.preventDefault()
  e.stopPropagation()
  isDraggingOver.value = false
  const files = e.dataTransfer?.files
  if (!files?.length) return
  const file = files[0]
  if (!file) return
  const fileName = file.name || ''
  const ext = fileName.toLowerCase()
  if (!ext.endsWith('.md') && !ext.endsWith('.markdown')) {
    await showAlert({
      title: '不支持的文件类型',
      message: '请拖入 Markdown 文件（.md 或 .markdown）',
      type: 'warning'
    })
    return
  }
  loading.value = true
  try {
    // 优先尝试获取原文件路径，以便编辑保存时直接写入原文件（Electron webUtils.getPathForFile）
    const originalPath = window.api.getPathForFile?.(file) || ''
    if (originalPath && originalPath.length > 0) {
      emit('file-dropped', originalPath)
      return
    }
    // 无法获取路径时（如部分 macOS 拖放场景）：创建临时文件，编辑保存只写入临时位置
    const content = await new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result ?? '')
      r.onerror = () => reject(new Error('读取文件失败'))
      r.readAsText(file, 'utf-8')
    })
    const res = await window.api.createTempFileFromDroppedContent({
      content,
      fileName: fileName || 'dropped.md'
    })
    if (res?.success && res.filePath) {
      emit('file-dropped', res.filePath)
    } else {
      await showAlert({
        title: '打开失败',
        message: res?.error || '无法创建临时文件',
        type: 'error'
      })
    }
  } catch (err) {
    await showAlert({
      title: '打开失败',
      message: err?.message || '读取或处理文件失败',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

const monacoTheme = computed(() => (themeMode.value === 'light' ? 'vs' : 'vs-dark'))

const hasUnsavedChanges = computed(
  () => isEditing.value && editorContent.value !== rawContent.value
)

watch(hasUnsavedChanges, (v) => emit('update:hasUnsavedChanges', v), { immediate: true })
watch(saving, (v) => emit('update:saving', v), { immediate: true })

// 分享功能相关状态
const shareUrl = ref('')
const isCreatingShare = ref(false)
const copied = ref(false)
const shareLinkInput = ref(null)

// 创建分享链接
const createShareLink = async () => {
  if (!htmlContent.value) {
    return
  }

  isCreatingShare.value = true
  try {
    const title = frontmatter.value?.title || props.filePath?.split('\\').pop() || 'Markdown 文档'
    const result = await window.api.createShareLink({
      htmlContent: htmlContent.value,
      title,
      themeId: themeMode.value
    })

    if (result.success) {
      shareUrl.value = result.url
    } else {
      await showAlert({
        title: '分享失败',
        message: '生成分享链接失败: ' + result.error,
        type: 'error'
      })
    }
  } catch (err) {
    await showAlert({
      title: '分享失败',
      message: '生成分享链接失败: ' + err.message,
      type: 'error'
    })
  } finally {
    isCreatingShare.value = false
  }
}

// 停止分享
const stopSharing = async () => {
  try {
    await window.api.stopShareServer()
    shareUrl.value = ''
    copied.value = false
  } catch (err) {
    await showAlert({
      title: '停止分享失败',
      message: '停止分享失败: ' + err.message,
      type: 'error'
    })
  }
}

// 选中分享链接文本
const selectShareLink = () => {
  if (shareLinkInput.value) {
    shareLinkInput.value.select()
  }
}

// 复制分享链接
const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    // 如果 clipboard API 失败，使用传统方法
    selectShareLink()
    document.execCommand('copy')
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// 处理菜单创建分享事件
const handleMenuCreateShare = async () => {
  if (!htmlContent.value) {
    await showAlert({
      title: '提示',
      message: '请先选择一个 Markdown 文件',
      type: 'warning'
    })
    return
  }
  await createShareLink()
  if (shareUrl.value) {
    // 复制到剪贴板并提示
    await copyShareLink()
    await showAlert({
      title: '分享已生成',
      message: `分享链接已生成并复制到剪贴板:\n${shareUrl.value}`,
      type: 'success'
    })
  }
}

// 处理菜单停止分享事件
const handleMenuStopShare = async () => {
  if (shareUrl.value) {
    await stopSharing()
    await showAlert({
      title: '分享已停止',
      message: '分享已停止',
      type: 'info'
    })
  } else {
    await showAlert({
      title: '提示',
      message: '当前没有正在分享的文档',
      type: 'warning'
    })
  }
}

// 处理文件变更事件（IPC 传参: { filePath, timestamp }）
const handleFileChanged = async (_event, data) => {
  // 若是自身保存触发的变更，直接忽略（IPC 异步，事件可能晚于 saving=false 到达）
  if (saving.value) return
  const changedPath = data?.filePath
  if (
    changedPath &&
    changedPath === props.filePath &&
    lastSavedPath.value === changedPath &&
    Date.now() - lastSavedTime.value < 800
  ) {
    lastSavedPath.value = null
    return
  }
  lastSavedPath.value = null

  if (isEditing.value && hasUnsavedChanges.value) {
    await showAlert({
      title: '文件已被修改',
      message: '检测到文件在外部发生变更，请先保存或退出编辑后再刷新。',
      type: 'warning'
    })
    return
  }

  if (props.filePath) {
    await loadFile()
  }
}

// 处理键盘事件
const handleKeyDown = (event) => {
  // Ctrl+F 或 Cmd+F 打开搜索
  if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
    event.preventDefault()
    if (!isEditing.value) {
      openSearch()
    }
  }
}

// 监听菜单事件和键盘事件
onMounted(() => {
  window.addEventListener('menu-create-share', handleMenuCreateShare)
  window.addEventListener('menu-stop-share', handleMenuStopShare)
  window.addEventListener('keydown', handleKeyDown)
  // 监听文件变更事件
  window.api.onFileChanged(handleFileChanged)
  // 开始监视当前文件
  if (props.filePath) {
    window.api.watchFile(props.filePath)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('menu-create-share', handleMenuCreateShare)
  window.removeEventListener('menu-stop-share', handleMenuStopShare)
  window.removeEventListener('keydown', handleKeyDown)
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (props.filePath) {
    window.api.unwatchFile(props.filePath)
  }
})

const formatDate = (dateStr) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

// 手动解析 YAML frontmatter
const parseFrontmatter = (markdown) => {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
  const match = markdown.match(frontmatterRegex)

  if (!match) {
    return { data: {}, content: markdown }
  }

  const yamlContent = match[1]
  const content = markdown.slice(match[0].length)

  // 简单的 YAML 解析
  const data = {}
  const lines = yamlContent.split('\n')

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) continue

    // 处理键值对
    const colonIndex = trimmedLine.indexOf(':')
    if (colonIndex === -1) continue

    const key = trimmedLine.slice(0, colonIndex).trim()
    let value = trimmedLine.slice(colonIndex + 1).trim()

    // 移除引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    // 处理数组 [tag1, tag2, tag3]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/['"]/g, ''))
        .filter((item) => item)
    }

    data[key] = value
  }

  return { data, content }
}

const parseMarkdown = async (markdown) => {
  // 手动解析 frontmatter
  const { data, content } = parseFrontmatter(markdown)

  // 保存 frontmatter 数据
  frontmatter.value = Object.keys(data).length > 0 ? data : null

  // 创建自定义插件来处理图片路径
  const rehypeFixImagePaths = () => {
    return (tree) => {
      const visit = (node) => {
        if (node.type === 'element' && node.tagName === 'img' && node.properties?.src) {
          const src = node.properties.src

          // 只处理相对路径（不是 http/https/data 开头）
          if (
            !src.startsWith('http://') &&
            !src.startsWith('https://') &&
            !src.startsWith('data:') &&
            !src.startsWith('file://')
          ) {
            // 获取当前文件的目录
            const fileDir = props.filePath.substring(0, props.filePath.lastIndexOf('\\'))

            // 解析相对路径
            const resolveRelativePath = (basePath, relativePath) => {
              // 转换路径分隔符
              const normalizedRelative = relativePath.replace(/\//g, '\\')

              // 分割路径
              const baseParts = basePath.split('\\').filter((p) => p)
              const relativeParts = normalizedRelative.split('\\').filter((p) => p)

              // 处理相对路径
              for (const part of relativeParts) {
                if (part === '..') {
                  baseParts.pop() // 返回上一级
                } else if (part !== '.') {
                  baseParts.push(part)
                }
              }

              return baseParts.join('\\')
            }

            // 构建完整路径
            const fullPath = resolveRelativePath(fileDir, src)

            // 标记需要异步加载的图片
            // 使用特殊的 data 属性存储路径
            node.properties['data-local-image'] = fullPath
            node.properties.src = '' // 临时设置为空
          }
        }

        if (node.children) {
          node.children.forEach(visit)
        }
      }

      visit(tree)
    }
  }

  // 为标题生成唯一、可跳转的 id，便于大纲定位
  const rehypeAddHeadingIds = () => {
    return (tree) => {
      const slugCounts = new Map()

      const slugify = (text) => {
        return (
          text
            .toLowerCase()
            // 保留中英文、数字与空格/连字符，其余移除
            .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
        )
      }

      const ensureUniqueSlug = (base) => {
        const count = slugCounts.get(base) || 0
        slugCounts.set(base, count + 1)
        return count === 0 ? base : `${base}-${count}`
      }

      const extractText = (node) => {
        if (!node) return ''
        if (node.type === 'text') return node.value || ''
        if (node.children) {
          return node.children.map((child) => extractText(child)).join(' ')
        }
        return ''
      }

      const visit = (node) => {
        if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) {
          const textContent = extractText(node).trim()

          if (textContent) {
            const baseSlug = slugify(textContent)
            const finalSlug = baseSlug ? ensureUniqueSlug(baseSlug) : ensureUniqueSlug('heading')

            if (!node.properties) node.properties = {}
            // 如果已有 id，尊重用户定义
            if (!node.properties.id) {
              node.properties.id = finalSlug
            }
          }
        }

        if (node.children) {
          node.children.forEach(visit)
        }
      }

      visit(tree)
    }
  }

  // 为链接添加 target="_blank"，使其在外部浏览器中打开
  const rehypeAddLinkTargets = () => {
    return (tree) => {
      const visit = (node) => {
        if (node.type === 'element' && node.tagName === 'a') {
          if (!node.properties) node.properties = {}
          node.properties.target = '_blank'
        }

        if (node.children) {
          node.children.forEach(visit)
        }
      }

      visit(tree)
    }
  }

  // 处理 markdown 内容
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(remarkGfm)
    .use(remarkMath) // 添加数学公式支持
    .use(remarkRehype)
    .use(rehypeAddHeadingIds) // 为标题添加 id，配合大纲跳转
    .use(rehypeHighlight, {
      // 配置代码高亮选项
      detect: true, // 自动检测语言
      prefix: 'hljs-' // 给 CSS class 加前缀
    })
    .use(rehypeKatex) // 使用 KaTeX 渲染公式
    .use(rehypeFixImagePaths)
    .use(rehypeAddLinkTargets) // 为链接添加 target="_blank"
    .use(rehypeStringify)

  const result = await processor.process(content)
  return String(result)
}

const loadFile = async () => {
  if (!props.filePath) {
    htmlContent.value = ''
    frontmatter.value = null
    rawContent.value = ''
    editorContent.value = ''
    emit('html-updated', '')
    return
  }

  loading.value = true
  error.value = null
  frontmatter.value = null

  try {
    const result = await window.api.readFile(props.filePath)
    if (result.success) {
      rawContent.value = result.content
      editorContent.value = result.content
      htmlContent.value = await parseMarkdown(result.content)
      // 触发事件，通知大纲组件更新
      emit('html-updated', htmlContent.value)
    } else {
      error.value = result.error
      emit('html-updated', '')
    }
  } catch (err) {
    error.value = err.message
    emit('html-updated', '')
  } finally {
    loading.value = false
  }
}

const enterEditMode = async () => {
  if (!props.filePath || loading.value) return

  if (!rawContent.value) {
    await loadFile()
  }

  editorContent.value = rawContent.value
  isEditing.value = true
  emit('editing-changed', true)
}

const exitEditMode = () => {
  isEditing.value = false
  editorContent.value = rawContent.value
  emit('editing-changed', false)
}

const requestEnterEdit = () => {
  if (!props.filePath || loading.value) return
  emit('enter-edit')
  enterEditMode()
}

const requestExitEdit = () => {
  emit('exit-edit')
  exitEditMode()
}

const discardChanges = async () => {
  if (hasUnsavedChanges.value) {
    const confirmed = await showConfirm({
      title: '确认放弃',
      message: '当前有未保存的修改，确定要放弃吗？',
      type: 'warning'
    })
    if (!confirmed) return
  }
  emit('exit-edit')
  exitEditMode()
}

const saveFile = async (content) => {
  if (!props.filePath) return

  saving.value = true
  try {
    const payload = {
      filePath: props.filePath,
      rootDir: props.rootFolder,
      content: content ?? editorContent.value
    }

    const result = await window.api.saveFile(payload)

    if (!result?.success) {
      throw new Error(result?.error || '保存失败')
    }

    rawContent.value = payload.content
    // 不更新 editorContent，避免触发 Monaco setValue 导致语法高亮闪烁；编辑器已是最新内容
    lastSavedPath.value = props.filePath
    lastSavedTime.value = Date.now()
    htmlContent.value = await parseMarkdown(payload.content)
    emit('html-updated', htmlContent.value)

    // 保存成功不再弹窗，避免打断编辑流程
  } catch (err) {
    await showAlert({
      title: '保存失败',
      message: err.message || '未知错误',
      type: 'error'
    })
  } finally {
    saving.value = false
  }
}

// 加载本地图片
const loadLocalImages = async () => {
  console.log('loadLocalImages called')

  // 等待多个 tick 确保 v-html 完全渲染
  await nextTick()
  await nextTick()

  // 直接在 document 中查找，不限制容器
  const images = document.querySelectorAll('.markdown-viewer img[data-local-image]')

  console.log('Found images to load:', images.length)

  if (images.length === 0) {
    console.warn('No images found with data-local-image attribute')
    return
  }

  for (const img of images) {
    const imagePath = img.getAttribute('data-local-image')
    if (imagePath) {
      console.log('Loading image:', imagePath)
      try {
        const result = await window.api.readImage(imagePath)
        if (result.success) {
          img.src = result.dataUrl
          console.log('Image loaded successfully:', imagePath)
        } else {
          console.error('Failed to load image:', imagePath, result.error)
          img.alt = `[图片加载失败: ${imagePath}]`
          img.style.display = 'none'
        }
      } catch (err) {
        console.error('Failed to load image:', imagePath, err)
      }
      img.removeAttribute('data-local-image')
    }
  }
}

// 为代码块添加复制按钮
const addCopyButtonsToCodeBlocks = async () => {
  await nextTick()

  const codeBlocks = document.querySelectorAll('.markdown-viewer pre')

  codeBlocks.forEach((pre) => {
    // 避免重复添加
    if (pre.querySelector('.code-copy-btn')) return

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'code-copy-btn'
    button.textContent = '复制'

    let resetTimer = null

    const setCopiedState = () => {
      button.textContent = '已复制'
      button.classList.add('copied')
      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        button.textContent = '复制'
        button.classList.remove('copied')
      }, 2000)
    }

    const setFailedState = () => {
      button.textContent = '复制失败'
      button.classList.add('failed')
      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        button.textContent = '复制'
        button.classList.remove('failed')
      }, 2000)
    }

    button.addEventListener('click', async (event) => {
      event.stopPropagation()

      const codeElement = pre.querySelector('code')
      const text = codeElement ? codeElement.innerText : pre.innerText
      if (!text) return

      try {
        await navigator.clipboard.writeText(text)
        setCopiedState()
      } catch (err) {
        // 回退方案
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        textarea.style.pointerEvents = 'none'
        document.body.appendChild(textarea)
        textarea.select()
        try {
          document.execCommand('copy')
          setCopiedState()
        } catch (fallbackErr) {
          console.error('Copy failed:', fallbackErr || err)
          setFailedState()
        } finally {
          document.body.removeChild(textarea)
        }
      }
    })

    pre.appendChild(button)
  })
}

// 监听 htmlContent 变化，当内容更新后加载图片和重新搜索
watch(htmlContent, async (newContent) => {
  if (!newContent) return

  await addCopyButtonsToCodeBlocks()

  if (newContent.includes('data-local-image')) {
    console.log('HTML content updated, loading images...')
    await nextTick()
    await nextTick()
    await loadLocalImages()
  }

  // 如果搜索框是打开的且有搜索关键词，重新执行搜索
  if (isSearchOpen.value && searchQuery.value.trim()) {
    console.log('HTML content updated, re-executing search...')
    await nextTick()
    await nextTick()
    performSearch()
  }
})

watch(
  () => props.editing,
  (val) => {
    if (val) {
      enterEditMode()
    } else {
      exitEditMode()
    }
  }
)

// Auto-save: debounced save when content changes in edit mode
watch(editorContent, () => {
  if (!autoSaveEnabled.value || !isEditing.value) return
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    if (isEditing.value && editorContent.value !== rawContent.value) {
      saveFile()
    }
  }, 5000)
})

watch(
  () => props.filePath,
  async () => {
    // 仅当父组件未请求编辑模式时才切换到预览；右键「编辑」时父组件会传 editing=true，需保留
    if (!props.editing) {
      isEditing.value = false
    }
    saving.value = false
    rawContent.value = ''
    editorContent.value = ''
    await loadFile()
    // 若父组件请求编辑模式（如右键「编辑」），loadFile 完成后进入编辑器
    if (props.editing) {
      enterEditMode()
    }
  },
  { immediate: true }
)

// 当文件路径改变时，更新文件监视和停止分享
watch(
  () => props.filePath,
  (newPath, oldPath) => {
    // 停止监视旧文件
    if (oldPath) {
      window.api.unwatchFile(oldPath)
    }
    // 开始监视新文件
    if (newPath) {
      window.api.watchFile(newPath)
    }
    // 停止分享
    if (shareUrl.value) {
      stopSharing()
    }
    // 清除搜索状态和结果
    clearSearchHighlights()
    searchMatches.value = []
    currentMatchIndex.value = -1
    // 如果搜索框是打开的且有搜索关键词，重新执行搜索
    if (isSearchOpen.value && searchQuery.value.trim()) {
      nextTick(() => {
        performSearch()
      })
    }
  }
)

// 搜索相关方法
const openSearch = () => {
  isSearchOpen.value = true
  searchQuery.value = ''
  searchMatches.value = []
  currentMatchIndex.value = -1
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

const closeSearch = () => {
  isSearchOpen.value = false
  clearSearchHighlights()
  searchQuery.value = ''
  searchMatches.value = []
  currentMatchIndex.value = -1
}

const performSearch = () => {
  clearSearchHighlights()
  searchMatches.value = []

  if (!searchQuery.value.trim()) {
    currentMatchIndex.value = -1
    return
  }

  const query = searchQuery.value.trim()
  const markdownBody = document.querySelector('.markdown-body')

  if (!markdownBody) return

  // 获取所有文本节点
  const textNodes = []
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      textNodes.push(node)
    } else if (
      node.nodeType === Node.ELEMENT_NODE &&
      !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName)
    ) {
      node.childNodes.forEach(walk)
    }
  }
  walk(markdownBody)

  // 在文本节点中搜索匹配
  textNodes.forEach((textNode) => {
    const text = textNode.textContent
    const regex = new RegExp(query, 'gi')
    let match
    while ((match = regex.exec(text)) !== null) {
      searchMatches.value.push({
        node: textNode,
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      })
    }
  })

  // 高亮匹配
  highlightMatches()

  // 如果有匹配，跳转到第一个
  if (searchMatches.value.length > 0) {
    currentMatchIndex.value = 0
    scrollToMatch(0)
  }
}

const highlightMatches = () => {
  searchMatches.value.forEach((match, index) => {
    const range = document.createRange()
    range.setStart(match.node, match.start)
    range.setEnd(match.node, match.end)

    const highlight = document.createElement('mark')
    highlight.className = 'search-highlight'
    if (index === currentMatchIndex.value) {
      highlight.className += ' current-match'
    }
    highlight.textContent = match.text

    range.deleteContents()
    range.insertNode(highlight)
  })
}

const clearSearchHighlights = () => {
  const highlights = document.querySelectorAll('.search-highlight')
  highlights.forEach((highlight) => {
    const text = document.createTextNode(highlight.textContent)
    highlight.parentNode.replaceChild(text, highlight)
  })
}

const nextMatch = () => {
  if (searchMatches.value.length === 0) return

  currentMatchIndex.value = (currentMatchIndex.value + 1) % searchMatches.value.length
  updateHighlight()
  scrollToMatch(currentMatchIndex.value)
}

const prevMatch = () => {
  if (searchMatches.value.length === 0) return

  currentMatchIndex.value =
    currentMatchIndex.value <= 0 ? searchMatches.value.length - 1 : currentMatchIndex.value - 1
  updateHighlight()
  scrollToMatch(currentMatchIndex.value)
}

const updateHighlight = () => {
  // 移除当前高亮
  const currentHighlights = document.querySelectorAll('.search-highlight.current-match')
  currentHighlights.forEach((el) => el.classList.remove('current-match'))

  // 添加新高亮
  if (currentMatchIndex.value >= 0) {
    const highlights = document.querySelectorAll('.search-highlight')
    if (highlights[currentMatchIndex.value]) {
      highlights[currentMatchIndex.value].classList.add('current-match')
    }
  }
}

const scrollToMatch = (index) => {
  if (index < 0 || index >= searchMatches.value.length) return

  const highlights = document.querySelectorAll('.search-highlight')
  const targetHighlight = highlights[index]

  if (targetHighlight) {
    targetHighlight.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    })
  }
}

defineExpose({
  hasUnsavedChanges,
  isEditing,
  autoSaveEnabled,
  saving,
  saveFile,
  discardChanges,
  enterEditMode,
  exitEditMode
})
</script>

<style scoped>
.markdown-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 24px;
  background: var(--bg-primary);
  position: relative;
}

/* 拖入外部文件时的高亮效果 */
.markdown-viewer.drop-zone-active {
  outline: 2px dashed var(--accent-color);
  outline-offset: -8px;
  background: var(--hover-bg, rgba(255, 255, 255, 0.03));
}

.markdown-viewer .viewer-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.markdown-viewer .viewer-content.edit-mode {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-wrapper,
.preview-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.preview-wrapper {
  overflow-y: auto;
}

/* 编辑/预览切换动画 */
.viewer-mode-enter-active,
.viewer-mode-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.viewer-mode-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.viewer-mode-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.loading,
.error {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
}

.error {
  color: #f56c6c;
}

/* 欢迎页样式 */
.welcome-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 48px 24px;
}

.welcome-content {
  max-width: 480px;
  text-align: center;
  animation: welcome-fade-in 0.5s ease-out;
}

@keyframes welcome-fade-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  color: var(--accent-color);
  opacity: 0.9;
}

.welcome-icon svg {
  width: 100%;
  height: 100%;
}

.welcome-title {
  font-size: 1.75em;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.welcome-desc {
  font-size: 1em;
  color: var(--text-secondary);
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.welcome-cta {
  font-size: 0.95em;
  color: var(--text-tertiary, var(--text-secondary));
  margin: 0 0 32px 0;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  line-height: 1.6;
}

.welcome-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9em;
  color: var(--text-secondary);
  padding: 10px 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid transparent;
  transition: border-color 0.2s, background 0.2s;
}

.feature-item:hover {
  border-color: var(--border-color);
  background: var(--bg-tertiary, var(--hover-bg));
}

.feature-icon {
  font-size: 1.2em;
  flex-shrink: 0;
}

/* Frontmatter Card Styles */
.frontmatter-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.fm-title {
  font-size: 2.5em;
  margin: 0 0 16px 0;
  color: var(--text-primary);
  font-weight: 700;
  border: none !important;
  padding: 0 !important;
}

.fm-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.fm-date,
.fm-author {
  display: flex;
  align-items: center;
  gap: 6px;
}

.fm-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  background: var(--bg-tertiary);
  color: var(--accent-color);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.tag:hover {
  background: var(--accent-color);
  color: white;
  transform: translateY(-1px);
}

.markdown-body {
  max-width: 900px;
  margin: 0 auto;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
  font-family: var(--font-preview, Georgia, serif);
}

/* Hide H1 in content if frontmatter title exists */
.frontmatter-card + .markdown-body :deep(h1:first-child) {
  display: none;
}

/* 大纲跳转时的高亮效果 */
.markdown-body :deep(.outline-highlight) {
  animation: outline-highlight-pulse 2s ease-in-out;
}

@keyframes outline-highlight-pulse {
  0% {
    background-color: var(--selected-bg);
    box-shadow: 0 0 0 2px var(--accent-color);
  }
  50% {
    background-color: var(--hover-bg);
  }
  100% {
    background-color: transparent;
    box-shadow: none;
  }
}

.markdown-body :deep(h1) {
  font-size: 2em;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
  scroll-margin-top: 16px;
}

.markdown-body :deep(h2) {
  font-size: 1.5em;
  margin-top: 24px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
  scroll-margin-top: 16px;
}

.markdown-body :deep(h3) {
  font-size: 1.25em;
  margin-top: 24px;
  margin-bottom: 16px;
  color: var(--text-primary);
  scroll-margin-top: 16px;
}

.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  color: var(--text-primary);
  scroll-margin-top: 16px;
}

.markdown-body :deep(p) {
  margin-bottom: 16px;
  color: var(--text-primary);
}

.markdown-body :deep(code) {
  background-color: var(--code-bg);
  color: var(--code-text-color);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-body :deep(pre) {
  background-color: var(--code-bg);
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  border: 1px solid var(--border-color);
  margin: 16px 0;
  line-height: 1.5;
  position: relative;
}

.markdown-body :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: var(--code-text-color);
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-body :deep(.code-copy-btn) {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.markdown-body :deep(pre:hover .code-copy-btn),
.markdown-body :deep(.code-copy-btn:focus) {
  opacity: 1;
}

.markdown-body :deep(.code-copy-btn:hover) {
  background: var(--accent-color);
  color: #fff;
}

.markdown-body :deep(.code-copy-btn.copied) {
  background: #4caf50;
  color: #fff;
  border-color: #4caf50;
}

.markdown-body :deep(.code-copy-btn.failed) {
  background: #f56c6c;
  color: #fff;
  border-color: #f56c6c;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0 0 16px 1.5em;
  padding: 0;
  color: var(--text-primary);
}

.markdown-body :deep(ul) {
  list-style: disc;
}

.markdown-body :deep(ol) {
  list-style: decimal;
}

.markdown-body :deep(li) {
  margin: 6px 0;
  color: var(--text-primary);
}

.markdown-body :deep(ul ul),
.markdown-body :deep(ul ol),
.markdown-body :deep(ol ul),
.markdown-body :deep(ol ol) {
  margin: 6px 0 6px 1.25em;
}

/* 任务列表样式 */
.markdown-body :deep(ul.contains-task-list) {
  list-style: none;
  padding-left: 0.25em;
}

.markdown-body :deep(li.task-list-item) {
  list-style: none;
  margin: 6px 0;
  padding-left: 1.8em;
  position: relative;
}

.markdown-body :deep(li.task-list-item > input[type='checkbox']) {
  position: absolute;
  left: 0;
  top: 0.1em;
  width: 1.1em;
  height: 1.1em;
  margin: 0;
  cursor: pointer;
  accent-color: var(--accent-color);
}

.markdown-body :deep(li.task-list-item > input[type='checkbox']:disabled) {
  cursor: default;
}

.markdown-body :deep(blockquote) {
  margin: 16px 0;
  padding: 0 16px;
  border-left: 4px solid var(--border-color);
  color: var(--text-secondary);
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  color: var(--text-primary);
}

.markdown-body :deep(th) {
  background-color: var(--bg-secondary);
  font-weight: 600;
}

.markdown-body :deep(tr:nth-child(even)) {
  background-color: var(--bg-secondary);
}

.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
}

/* 正在加载的本地图片样式 */
.markdown-body :deep(img[data-local-image]) {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  min-height: 100px;
  min-width: 200px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.markdown-body :deep(a) {
  color: var(--accent-color);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
  color: var(--accent-hover);
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 24px 0;
}

.markdown-body :deep(strong) {
  color: var(--text-primary);
  font-weight: 600;
}

.markdown-body :deep(em) {
  color: var(--text-primary);
}

/* 搜索相关样式 */
.search-overlay {
  position: fixed;
  top: 20px;
  right: 20px;
  left: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2px);
  animation: searchFadeIn 0.15s ease-out;
}

.search-container {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 400px;
  max-width: calc(100vw - 40px);
}

.search-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.search-icon {
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-stats {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.search-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.search-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.search-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.search-btn svg {
  width: 16px;
  height: 16px;
}

.close-btn {
  color: var(--text-secondary);
}

.close-btn:hover {
  background: #f56c6c;
  color: white;
}

/* 搜索高亮样式 */
.search-highlight {
  background: rgba(255, 208, 0, 0.3);
  color: var(--text-primary);
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 600;
  transition: background 0.2s;
}

.search-highlight.current-match {
  background: rgba(76, 175, 80, 0.4);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
}

/* 搜索动画 */
@keyframes searchFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-enter-active,
.search-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.search-enter-from,
.search-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

</style>
