<template>
  <div class="file-tree">
    <div class="file-tree-header">
      <h3>Files</h3>
      <button class="btn-select" @click="$emit('select-folder')">Select Folder</button>
    </div>
    <div class="tree-content">
      <TreeNode v-if="tree" :node="tree" :level="0" @select="handleSelect" />
      <div v-else class="empty-state">No folder selected</div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue'
import TreeNode from './TreeNode.vue'

defineProps({
  tree: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['select-folder', 'select-file'])

const handleSelect = (node) => {
  if (node.type === 'file') {
    emit('select-file', node)
  }
}
</script>

<style scoped>
.file-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
}

.file-tree-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-tree-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-select {
  padding: 6px 12px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.btn-select:hover {
  background: var(--accent-hover);
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
