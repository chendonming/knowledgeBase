<script setup>
import { ref } from 'vue'
import FileTree from './components/FileTree.vue'
import MarkdownViewer from './components/MarkdownViewer.vue'

const fileTree = ref(null)
const selectedFilePath = ref(null)
const currentFolder = ref(null)

const handleSelectFolder = async () => {
  const folderPath = await window.api.selectFolder()
  if (folderPath) {
    currentFolder.value = folderPath
    const result = await window.api.getFileTree(folderPath)
    if (result.success) {
      fileTree.value = result.tree
    }
  }
}

const handleSelectFile = (node) => {
  selectedFilePath.value = node.path
}
</script>

<template>
  <div class="app-container">
    <div class="sidebar">
      <FileTree
        :tree="fileTree"
        @select-folder="handleSelectFolder"
        @select-file="handleSelectFile"
      />
    </div>
    <div class="main-content">
      <div class="header">
        <h1>Knowledge Base</h1>
        <span v-if="currentFolder" class="folder-path">{{ currentFolder }}</span>
      </div>
      <MarkdownViewer :file-path="selectedFilePath" />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
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
</style>
