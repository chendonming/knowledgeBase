<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  currentFolder: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'select-file'])

const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const totalResults = ref(0)
const searchError = ref(null)
const isRefreshing = ref(false)

// 执行搜索
const performSearch = async (forceRefresh = false) => {
  if (!searchQuery.value.trim() || !props.currentFolder) {
    searchResults.value = []
    totalResults.value = 0
    return
  }

  isSearching.value = true
  searchError.value = null

  try {
    const result = await window.api.searchFiles({
      folderPath: props.currentFolder,
      query: searchQuery.value.trim(),
      autoUpdate: true,    // ✅ 启用自动检测文件变化
      forceRefresh: forceRefresh  // 用户手动刷新时强制重建
    })

    if (result.success) {
      searchResults.value = result.results
      totalResults.value = result.total
    } else {
      searchError.value = result.error || '搜索失败'
      searchResults.value = []
      totalResults.value = 0
    }
  } catch (error) {
    searchError.value = error.message || '搜索出错'
    searchResults.value = []
    totalResults.value = 0
  } finally {
    isSearching.value = false
  }
}

// 监听搜索输入变化，自动搜索
let searchTimeout = null
watch(searchQuery, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
})

// 选择文件
const selectFile = (result) => {
  emit('select-file', result.path)
  emit('close')
}

// 刷新索引
const refreshIndex = async () => {
  if (!props.currentFolder) {
    searchError.value = '请先选择一个文件夹'
    return
  }

  isRefreshing.value = true
  searchError.value = null

  try {
    const result = await window.api.refreshSearchIndex({
      folderPath: props.currentFolder
    })

    if (result.success) {
      // 刷新后重新执行搜索
      if (searchQuery.value.trim()) {
        await performSearch(true)  // 使用 forceRefresh=true
      }
    } else {
      searchError.value = result.error || '索引刷新失败'
    }
  } catch (error) {
    searchError.value = error.message || '索引刷新出错'
  } finally {
    isRefreshing.value = false
  }
}

// 高亮搜索词
const highlightText = (text, query) => {
  if (!query) return text
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 关闭面板
const handleClose = () => {
  searchQuery.value = ''
  searchResults.value = []
  totalResults.value = 0
  searchError.value = null
  emit('close')
}

// 处理键盘事件
const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    handleClose()
  }
}

// 聚焦搜索框
const searchInputRef = ref(null)
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.value?.focus()
      }, 100)
    }
  }
)
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="search-overlay" @click="handleClose" @keydown="handleKeyDown">
      <div class="search-panel" @click.stop>
        <div class="search-header">
          <div class="search-title">
            <svg
              class="icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <span>搜索文件</span>
          </div>
          <button class="btn-close" @click="handleClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="search-input-container">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="输入关键词搜索..."
            @keydown.esc="handleClose"
          />
          <button
            class="btn-refresh"
            :class="{ 'is-refreshing': isRefreshing }"
            @click="refreshIndex"
            title="刷新索引"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
            </svg>
          </button>
          <div v-if="isSearching" class="search-spinner"></div>
        </div>

        <div v-if="!currentFolder" class="search-empty">
          <p>请先选择一个文件夹</p>
        </div>

        <div v-else-if="searchError" class="search-error">
          <p>{{ searchError }}</p>
        </div>

        <div
          v-else-if="searchQuery && !isSearching && searchResults.length === 0"
          class="search-empty"
        >
          <p>未找到匹配的文件</p>
        </div>

        <div v-else-if="searchResults.length > 0" class="search-results">
          <div class="results-header">
            <span>找到 {{ totalResults }} 个结果</span>
          </div>
          <div class="results-list">
            <div
              v-for="(result, index) in searchResults"
              :key="index"
              class="result-item"
              @click="selectFile(result)"
            >
              <div class="result-header">
                <svg
                  class="file-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <span class="result-name">{{ result.name }}</span>
                <span class="result-count">{{ result.matchCount }} 处匹配</span>
              </div>
              <div class="result-path">{{ result.relativePath }}</div>
              <div v-if="result.matches.length > 0" class="result-matches">
                <div
                  v-for="(match, matchIndex) in result.matches"
                  :key="matchIndex"
                  class="match-item"
                >
                  <span class="match-line">行 {{ match.lineNumber }}:</span>
                  <span
                    class="match-preview"
                    v-html="highlightText(match.preview, searchQuery)"
                  ></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  z-index: 1000;
  animation: fadeIn 0.15s ease-out;
}

.search-panel {
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}

.search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.search-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.icon {
  width: 24px;
  height: 24px;
  color: var(--accent-color);
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.btn-close svg {
  width: 20px;
  height: 20px;
}

.search-input-container {
  position: relative;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
}

.search-input {
  width: 100%;
  padding: 12px 80px 12px 16px;
  font-size: 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--accent-color);
}

.btn-refresh {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.btn-refresh:active {
  transform: translateY(-50%) scale(0.95);
}

.btn-refresh.is-refreshing {
  animation: spin 0.6s linear infinite;
}

.btn-refresh svg {
  width: 18px;
  height: 18px;
}

.search-spinner {
  position: absolute;
  right: 44px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.search-empty,
.search-error {
  padding: 48px 24px;
  text-align: center;
  color: var(--text-secondary);
}

.search-error {
  color: #e74c3c;
}

.search-results {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.results-header {
  padding: 12px 24px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.results-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.result-item {
  padding: 16px;
  margin-bottom: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  background: var(--hover-bg);
  border-color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.file-icon {
  width: 18px;
  height: 18px;
  color: var(--accent-color);
  flex-shrink: 0;
}

.result-name {
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.result-count {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: 12px;
}

.result-path {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: monospace;
  margin-bottom: 12px;
  padding-left: 26px;
}

.result-matches {
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
  margin-top: 8px;
}

.match-item {
  padding: 6px 0;
  padding-left: 26px;
  font-size: 13px;
  display: flex;
  gap: 8px;
}

.match-line {
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 60px;
  flex-shrink: 0;
}

.match-preview {
  color: var(--text-primary);
  line-height: 1.5;
  word-break: break-word;
}

.match-preview :deep(mark) {
  background: rgba(255, 208, 0, 0.3);
  color: var(--text-primary);
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 3px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* 滚动条样式 */
.results-list::-webkit-scrollbar {
  width: 8px;
}

.results-list::-webkit-scrollbar-track {
  background: transparent;
}

.results-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.results-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
