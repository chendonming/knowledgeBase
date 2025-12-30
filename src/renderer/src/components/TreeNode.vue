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
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['select'])

const isExpanded = ref(props.level === 0)
const isSelected = ref(false)

const handleClick = () => {
  if (props.node.type === 'directory') {
    isExpanded.value = !isExpanded.value
  } else {
    emit('select', props.node)
    isSelected.value = true
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
