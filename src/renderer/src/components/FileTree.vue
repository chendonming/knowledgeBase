<template>
  <div class="file-tree">
    <div class="file-tree-header">
      <h3>Files</h3>
    </div>
    <div class="tree-content">
      <TreeNode
        v-if="tree"
        :node="tree"
        :level="0"
        :selected-path="selectedPath"
        @select="handleSelect"
      />
      <div v-else class="empty-state">No folder selected</div>
    </div>
  </div>
</template>

<script setup>
import TreeNode from './TreeNode.vue'

defineProps({
  tree: {
    type: Object,
    default: null
  },
  selectedPath: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select-file'])

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
