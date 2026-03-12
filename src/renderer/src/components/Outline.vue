<template>
  <div class="outline-container" :class="{ collapsed: isCollapsed }">
    <div v-if="!isCollapsed" class="outline-header">
      <h3>📑 大纲</h3>
    </div>

    <button v-if="headings.length" class="toggle-btn-side" @click="toggleCollapse">
      {{ isCollapsed ? '▶' : '◀' }}
    </button>

    <div v-if="!headings.length && !isCollapsed" class="outline-empty">暂无标题</div>

    <ul v-else-if="!isCollapsed" class="outline-list">
      <li
        v-for="heading in headings"
        :key="`${heading.id}-${heading.level}`"
        :class="`outline-item level-${heading.level}`"
      >
        <a :href="`#${heading.id}`" @click.prevent="handleHeadingClick(heading.id)">
          {{ heading.text }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { getOutlineCollapsed, toggleOutlineCollapsed } from '../stores/uiState'

const props = defineProps({
  htmlContent: {
    type: String,
    default: ''
  },
  editing: {
    type: Boolean,
    default: false
  },
  pendingScrollToId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['exit-edit-and-scroll', 'scroll-done'])

const headings = ref([])
const isCollapsed = getOutlineCollapsed()

// 从HTML内容中提取标题
const extractHeadings = (htmlContent) => {
  if (!htmlContent) {
    headings.value = []
    return
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html')

  const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const extractedHeadings = []

  headingElements.forEach((element, index) => {
    const level = parseInt(element.tagName[1])
    const text = element.textContent.trim()

    // 如果没有id，为其生成一个
    let id = element.id
    if (!id) {
      id = `heading-${index}-${level}`
      element.id = id
    }

    if (text) {
      extractedHeadings.push({
        id,
        text,
        level
      })
    }
  })

  headings.value = extractedHeadings
}

// 处理大纲节点点击：编辑模式下先退出编辑再跳转
const handleHeadingClick = (headingId) => {
  if (props.editing) {
    emit('exit-edit-and-scroll', headingId)
    return
  }
  scrollToHeading(headingId)
}

// 滚动到指定标题，保持菜单栏可见
const scrollToHeading = (headingId) => {
  const escapeSelector = (id) => {
    try {
      return CSS.escape(id)
    } catch (e) {
      return id.replace(/([ #;?%&,.+*~':"!^$\[{\}()|\/])/g, '\\$1')
    }
  }

  const doScroll = () => {
    const markdownViewer = document.querySelector('.markdown-viewer')
    const selector = `#${escapeSelector(headingId)}`
    const element = markdownViewer?.querySelector(selector) || document.querySelector(selector)

    if (!element) return

    // 使用 scrollIntoView，由浏览器自动处理可滚动容器的查找
    element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })

    // 高亮显示（需在 MarkdownViewer 内生效，用普通 class）
    element.classList.add('outline-highlight')
    setTimeout(() => {
      element.classList.remove('outline-highlight')
    }, 2000)
  }

  // 确保 DOM 已渲染后再查找和滚动
  nextTick(doScroll)
}

// 切换大纲展开/收起
const toggleCollapse = () => {
  toggleOutlineCollapsed()
}

// 监听htmlContent变化
watch(
  () => props.htmlContent,
  (newContent) => {
    // 延迟提取，确保DOM已更新
    setTimeout(() => {
      extractHeadings(newContent)
    }, 100)
  },
  { immediate: true }
)

// 监听待跳转 ID：编辑模式退出后，预览渲染完成后执行滚动
watch(
  () => props.pendingScrollToId,
  (id) => {
    if (id && !props.editing) {
      nextTick(() => {
        setTimeout(() => scrollToHeading(id), 150) // 等待预览 DOM 渲染
        emit('scroll-done')
      })
    }
  }
)
</script>

<style scoped>
.outline-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  overflow: hidden;
  width: 260px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

/* 折叠状态：向右收起隐藏 */
.outline-container.collapsed {
  width: 45px;
  border-left: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn-side {
  position: absolute;
  left: 8px;
  top: 26px;
  transform: translateY(-50%);
  padding: 8px 10px;
  font-size: 12px;
  background: var(--hover-bg);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.toggle-btn-side:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
  border-color: var(--accent-color);
}

.outline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 50px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  min-height: 56px;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.outline-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.3px;
}

.toggle-btn {
  padding: 4px 6px;
  font-size: 10px;
  background: var(--hover-bg);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
  border-color: var(--accent-color);
}

.outline-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 12px;
  text-align: center;
  padding: 24px 16px;
}

.outline-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  padding: 12px 0;
  margin: 0;
  transition: all 0.3s ease;
}

.outline-item {
  margin: 0;
  padding: 0;
}

.outline-item a {
  display: block;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  line-height: 1.5;
}

.outline-item a:hover {
  color: var(--text-primary);
  background: var(--hover-bg);
  border-left-color: var(--accent-color);
}

/* 层级缩进和样式 */
.outline-item.level-1 a {
  padding-left: 16px;
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary);
  margin-top: 4px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.outline-item.level-1 a:hover {
  color: var(--text-primary);
}

.outline-item.level-2 a {
  padding-left: 28px;
  font-weight: 500;
  font-size: 12px;
  color: var(--text-secondary);
}

.outline-item.level-3 a {
  padding-left: 40px;
  font-size: 12px;
  color: var(--text-secondary);
}

.outline-item.level-4 a {
  padding-left: 52px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.outline-item.level-5 a {
  padding-left: 64px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.outline-item.level-6 a {
  padding-left: 76px;
  font-size: 10px;
  color: var(--text-tertiary);
}

.outline-item a:active {
  background: var(--selected-bg);
  border-left-color: var(--accent-color);
}

/* 滚动条样式 */
.outline-list::-webkit-scrollbar {
  width: 8px;
}

.outline-list::-webkit-scrollbar-track {
  background: transparent;
  margin: 4px 0;
}

.outline-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.outline-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
  background-clip: padding-box;
}

/* 高亮效果 */
:deep(.outline-highlight) {
  animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
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
</style>
