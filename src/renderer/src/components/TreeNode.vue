<template>
  <div class="tree-node">
    <div
      class="node-label"
      :class="{ 'is-file': node.type === 'file', 'is-selected': isSelected }"
      :style="{ paddingLeft: level * 16 + 8 + 'px' }"
      @click="handleClick"
    >
      <span v-if="node.type === 'directory'" class="icon">
        {{ isExpanded ? '📂' : '📁' }}
      </span>
      <span v-else class="icon">📄</span>
      <span class="name">{{ node.name }}</span>
    </div>
    <div v-if="node.type === 'directory' && isExpanded" class="children">
      <TreeNode
        v-for="(child, index) in node.children"
        :key="index"
        :node="child"
        :level="level + 1"
        :selected-path="selectedPath"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  },
  selectedPath: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select'])

const isExpanded = ref(props.level === 0)

// 根据 selectedPath 计算是否选中
const isSelected = computed(() => {
  return props.node.type === 'file' && props.node.path === props.selectedPath
})

// 检查选中的文件是否在当前节点的子树中
const hasSelectedFileInSubtree = computed(() => {
  if (!props.selectedPath) return false

  if (props.node.type === 'file') {
    return props.node.path === props.selectedPath
  }

  if (props.node.type === 'directory' && props.node.children) {
    return props.node.children.some((child) => {
      if (child.type === 'file') {
        return child.path === props.selectedPath
      }
      if (child.type === 'directory') {
        // 递归检查子目录
        return hasSelectedFileInSubtreeForNode(child, props.selectedPath)
      }
      return false
    })
  }

  return false
})

// 递归辅助函数
const hasSelectedFileInSubtreeForNode = (node, selectedPath) => {
  if (node.type === 'file') {
    return node.path === selectedPath
  }

  if (node.type === 'directory' && node.children) {
    return node.children.some((child) => hasSelectedFileInSubtreeForNode(child, selectedPath))
  }

  return false
}

// 监听 selectedPath 变化，自动展开包含选中文件的目录
watch(
  () => props.selectedPath,
  (newSelectedPath) => {
    if (newSelectedPath && props.node.type === 'directory' && hasSelectedFileInSubtree.value) {
      isExpanded.value = true
    }
  },
  { immediate: true }
)

const handleClick = () => {
  if (props.node.type === 'directory') {
    isExpanded.value = !isExpanded.value
  } else {
    emit('select', props.node)
  }
}
</script>

<style scoped>
.tree-node {
  user-select: none;
}

.node-label {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  color: var(--text-primary);
}

.node-label:hover {
  background-color: var(--hover-bg);
}

.node-label.is-selected {
  background-color: var(--selected-bg);
  color: var(--text-primary);
}

.node-label.is-file {
  padding-left: 24px;
}

.icon {
  margin-right: 6px;
  font-size: 16px;
}

.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

.children {
  /* Nested children */
}
</style>
