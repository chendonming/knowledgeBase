<template>
  <div class="markdown-viewer">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else>
      <!-- Frontmatter metadata display -->
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
      <!-- Markdown content -->
      <article class="markdown-body" v-html="htmlContent"></article>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
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
import { getThemeMode } from '../stores/uiState'

const props = defineProps({
  filePath: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['html-updated'])

const htmlContent = ref('')
const frontmatter = ref(null)
const loading = ref(false)
const error = ref(null)
const themeMode = getThemeMode()

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
      alert('生成分享链接失败: ' + result.error)
    }
  } catch (err) {
    alert('生成分享链接失败: ' + err.message)
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
    alert('停止分享失败: ' + err.message)
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
    alert('请先选择一个 Markdown 文件')
    return
  }
  await createShareLink()
  if (shareUrl.value) {
    // 复制到剪贴板并提示
    await copyShareLink()
    alert(`分享链接已生成并复制到剪贴板:\n${shareUrl.value}`)
  }
}

// 处理菜单停止分享事件
const handleMenuStopShare = async () => {
  if (shareUrl.value) {
    await stopSharing()
    alert('分享已停止')
  } else {
    alert('当前没有正在分享的文档')
  }
}

// 处理文件变更事件
const handleFileChanged = async () => {
  // 重新加载文件
  if (props.filePath) {
    await loadFile()
  }
}

// 监听菜单事件
onMounted(() => {
  window.addEventListener('menu-create-share', handleMenuCreateShare)
  window.addEventListener('menu-stop-share', handleMenuStopShare)
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
  // 停止监视当前文件
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

  // 处理 markdown 内容
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(remarkGfm)
    .use(remarkMath) // 添加数学公式支持
    .use(remarkRehype)
    .use(rehypeHighlight, {
      // 配置代码高亮选项
      detect: true, // 自动检测语言
      prefix: 'hljs-' // 给 CSS class 加前缀
    })
    .use(rehypeKatex) // 使用 KaTeX 渲染公式
    .use(rehypeFixImagePaths)
    .use(rehypeStringify)

  const result = await processor.process(content)
  return String(result)
}

const loadFile = async () => {
  if (!props.filePath) {
    htmlContent.value = '<p>Select a file to view</p>'
    frontmatter.value = null
    emit('html-updated', '')
    return
  }

  loading.value = true
  error.value = null
  frontmatter.value = null

  try {
    const result = await window.api.readFile(props.filePath)
    if (result.success) {
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

// 监听 htmlContent 变化，当内容更新后加载图片
watch(htmlContent, async (newContent) => {
  if (!newContent) return

  await addCopyButtonsToCodeBlocks()

  if (newContent.includes('data-local-image')) {
    console.log('HTML content updated, loading images...')
    await nextTick()
    await nextTick()
    await loadLocalImages()
  }
})

watch(() => props.filePath, loadFile, { immediate: true })

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
  }
)
</script>

<style scoped>
.markdown-viewer {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-primary);
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
}

/* Hide H1 in content if frontmatter title exists */
.frontmatter-card + .markdown-body :deep(h1:first-child) {
  display: none;
}

.markdown-body :deep(h1) {
  font-size: 2em;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.markdown-body :deep(h2) {
  font-size: 1.5em;
  margin-top: 24px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.markdown-body :deep(h3) {
  font-size: 1.25em;
  margin-top: 24px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.markdown-body :deep(p) {
  margin-bottom: 16px;
  color: var(--text-primary);
}

.markdown-body :deep(code) {
  background-color: var(--code-bg);
  color: #e8e8e8;
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
  color: #e8e8e8;
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
  transition: opacity 0.2s ease, background 0.2s ease, color 0.2s ease;
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
  margin-bottom: 16px;
  padding-left: 32px;
  color: var(--text-primary);
}

.markdown-body :deep(li) {
  margin-bottom: 4px;
  color: var(--text-primary);
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
</style>
