<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import FileTree from './components/FileTree.vue'
import MarkdownViewer from './components/MarkdownViewer.vue'
import FolderHistory from './components/FolderHistory.vue'
import Outline from './components/Outline.vue'

const fileTree = ref(null)
const selectedFilePath = ref(null)
const currentFolder = ref(null)
const folderHistory = ref([])
const showHistory = ref(false)
const markdownHtmlContent = ref('')

// 加载文件夹
const loadFolder = async (folderPath) => {
  if (!folderPath) return

  try {
    const result = await window.api.getFileTree(folderPath)
    if (result.success) {
      currentFolder.value = folderPath
      fileTree.value = result.tree

      // 保存到历史记录和最后使用的文件夹
      await window.api.addFolderToHistory(folderPath)
      await window.api.saveLastFolder(folderPath)

      // 更新本地历史显示
      await loadFolderHistory()
    }
  } catch (error) {
    console.error('Failed to load folder:', error)
  }
}

const handleSelectFolder = async () => {
  const folderPath = await window.api.selectFolder()
  if (folderPath) {
    await loadFolder(folderPath)
  }
}

const handleSelectFile = (node) => {
  selectedFilePath.value = node.path
}

// 加载文件夹历史
const loadFolderHistory = async () => {
  try {
    const history = await window.api.getFolderHistory()
    folderHistory.value = history
  } catch (error) {
    console.error('Failed to load folder history:', error)
  }
}

// 打开历史弹窗
const openHistory = () => {
  showHistory.value = true
}

// 关闭历史弹窗
const closeHistory = () => {
  showHistory.value = false
}

// 选择历史文件夹
const selectHistoryFolder = async (folderPath) => {
  await loadFolder(folderPath)
}

// 删除历史记录
const removeFromHistory = async (folderPath) => {
  try {
    await window.api.removeFolderFromHistory(folderPath)
    await loadFolderHistory()
  } catch (error) {
    console.error('Failed to remove folder from history:', error)
  }
}

// 监听全局快捷键
const handleKeyDown = (event) => {
  // Ctrl+H 打开文件夹历史
  if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
    event.preventDefault()
    showHistory.value = !showHistory.value
  }
}

// 初始化
onMounted(async () => {
  // 加载历史记录
  await loadFolderHistory()

  // 尝试加载上次使用的文件夹
  try {
    const lastFolder = await window.api.getLastFolder()
    if (lastFolder) {
      const result = await window.api.getFileTree(lastFolder)
      if (result.success) {
        currentFolder.value = lastFolder
        fileTree.value = result.tree
      }
    }
  } catch (error) {
    console.error('Failed to load last folder:', error)
  }

  // 添加快捷键监听
  window.addEventListener('keydown', handleKeyDown)
})

// 清理事件监听
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="app-container">
    <div class="sidebar">
      <FileTree
        :tree="fileTree"
        @select-folder="handleSelectFolder"
        @select-file="handleSelectFile"
        @show-history="openHistory"
      />
    </div>
    <div class="main-content">
      <MarkdownViewer :file-path="selectedFilePath" @html-updated="markdownHtmlContent = $event" />
    </div>
    <div class="outline-panel">
      <Outline :html-content="markdownHtmlContent" />
    </div>

    <!-- Folder History Modal -->
    <FolderHistory
      :is-open="showHistory"
      :folders="folderHistory"
      @close="closeHistory"
      @select="selectHistoryFolder"
      @remove="removeFromHistory"
    />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
  position: relative;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

.outline-panel {
  width: 250px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  padding: 16px 24px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.folder-path {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: monospace;
}

.btn-folder-history {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-color);
  border: none;
  cursor: pointer;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
  z-index: 100;
}

.btn-folder-history:hover {
  background: var(--accent-hover);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.btn-folder-history:active {
  transform: scale(0.95);
}
</style>
