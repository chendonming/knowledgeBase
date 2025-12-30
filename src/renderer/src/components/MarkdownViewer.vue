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
import { ref, watch, nextTick } from 'vue'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import 'katex/dist/katex.min.css'

const props = defineProps({
  filePath: {
    type: String,
    default: null
  }
})

const htmlContent = ref('')
const frontmatter = ref(null)
const loading = ref(false)
const error = ref(null)

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
    return
  }

  loading.value = true
  error.value = null
  frontmatter.value = null

  try {
    const result = await window.api.readFile(props.filePath)
    if (result.success) {
      htmlContent.value = await parseMarkdown(result.content)
      // 不在这里调用 loadLocalImages，而是通过 watch 监听
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
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

// 监听 htmlContent 变化，当内容更新后加载图片
watch(htmlContent, async (newContent) => {
  if (newContent && newContent.includes('data-local-image')) {
    console.log('HTML content updated, loading images...')
    await nextTick()
    await nextTick()
    await loadLocalImages()
  }
})

watch(() => props.filePath, loadFile, { immediate: true })
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
}

.markdown-body :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: #e8e8e8;
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
