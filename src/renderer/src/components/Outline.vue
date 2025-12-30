<template>
  <div class="outline-container">
    <div class="outline-header">
      <h3>📑 大纲</h3>
      <button v-if="headings.length" @click="toggleCollapse" class="toggle-btn">
        {{ isCollapsed ? '展开' : '收起' }}
      </button>
    </div>

    <div v-if="!headings.length" class="outline-empty">
      暂无标题
    </div>

    <ul v-else class="outline-list" :class="{ collapsed: isCollapsed }">
      <li v-for="heading in headings" :key="`${heading.id}-${heading.level}`"
          :class="`outline-item level-${heading.level}`">
        <a :href="`#${heading.id}`" @click.prevent="scrollToHeading(heading.id)">
          {{ heading.text }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  htmlContent: {
    type: String,
    default: ''
  }
})

const headings = ref([])
const isCollapsed = ref(false)

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

// 滚动到指定标题
const scrollToHeading = (headingId) => {
  // 在当前的markdown-viewer中查找元素
  const element = document.querySelector(`#${headingId}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // 高亮显示
    element.classList.add('outline-highlight')
    setTimeout(() => {
      element.classList.remove('outline-highlight')
    }, 2000)
  }
}

// 切换大纲展开/收起
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 监听htmlContent变化
watch(() => props.htmlContent, (newContent) => {
  // 延迟提取，确保DOM已更新
  setTimeout(() => {
    extractHeadings(newContent)
  }, 100)
}, { immediate: true })
</script>

<style scoped>
.outline-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary, #2a2a2a);
  border-right: 1px solid var(--border-color, #404040);
  overflow: hidden;
}

.outline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 12px;
  border-bottom: 1px solid var(--border-color, #404040);
  background: var(--bg-tertiary, #1f1f1f);
}

.outline-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #e8e8e8);
}

.toggle-btn {
  padding: 4px 8px;
  font-size: 12px;
  background: var(--bg-primary, #1a1a1a);
  border: 1px solid var(--border-color, #404040);
  color: var(--text-secondary, #a8a8a8);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: var(--border-color, #404040);
  color: var(--text-primary, #e8e8e8);
}

.outline-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #a8a8a8);
  font-size: 12px;
  text-align: center;
  padding: 16px;
}

.outline-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  padding: 8px 0;
  margin: 0;
  transition: opacity 0.3s ease;
}

.outline-list.collapsed {
  opacity: 0.5;
  pointer-events: none;
}

.outline-item {
  margin: 0;
  padding: 0;
}

.outline-item a {
  display: block;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text-secondary, #a8a8a8);
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: all 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.outline-item a:hover {
  color: var(--text-primary, #e8e8e8);
  background: var(--bg-tertiary, #1f1f1f);
}

/* 层级缩进 */
.outline-item.level-1 a {
  padding-left: 12px;
  font-weight: 600;
  color: var(--text-primary, #e8e8e8);
}

.outline-item.level-2 a {
  padding-left: 24px;
  font-weight: 500;
}

.outline-item.level-3 a {
  padding-left: 36px;
  font-size: 12px;
}

.outline-item.level-4 a {
  padding-left: 48px;
  font-size: 12px;
}

.outline-item.level-5 a {
  padding-left: 60px;
  font-size: 11px;
  color: var(--text-secondary, #a8a8a8);
}

.outline-item.level-6 a {
  padding-left: 72px;
  font-size: 11px;
  color: var(--text-secondary, #a8a8a8);
}

.outline-item a:hover {
  border-left-color: var(--accent-color, #4a9eff);
}

/* 滚动条样式 */
.outline-list::-webkit-scrollbar {
  width: 6px;
}

.outline-list::-webkit-scrollbar-track {
  background: transparent;
}

.outline-list::-webkit-scrollbar-thumb {
  background: var(--border-color, #404040);
  border-radius: 3px;
}

.outline-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary, #a8a8a8);
}

/* 高亮效果 */
:deep(.outline-highlight) {
  animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
  0% {
    background-color: rgba(74, 158, 255, 0.2);
  }
  100% {
    background-color: transparent;
  }
}
</style>
