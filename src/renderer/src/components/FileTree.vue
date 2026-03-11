<template>
  <div class="file-tree" @click="handleBackgroundClick">
    <div class="file-tree-header">
      <h3>Files</h3>
      <button
        v-if="tree"
        class="header-btn"
        title="新建文件"
        @click="startCreateFile(tree)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>
    <div class="tree-content">
      <TreeNode
        v-if="tree"
        :node="tree"
        :level="0"
        :selected-path="selectedPath"
        @select="handleSelect"
        @context-menu="showContextMenu"
      />
      <div v-else class="empty-state">No folder selected</div>
    </div>

    <!-- Context Menu -->
    <Teleport to="body">
      <Transition name="ctx-menu">
        <div
          v-if="contextMenu.visible"
          class="context-menu"
          :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        >
          <template v-if="contextMenu.node?.type === 'file'">
            <div class="ctx-item" @click="ctxOpen">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>打开</span>
            </div>
            <div class="ctx-item" @click="ctxEdit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>编辑</span>
            </div>
            <div class="ctx-separator"></div>
            <div class="ctx-item ctx-danger" @click="ctxDelete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>删除</span>
            </div>
          </template>
          <template v-else-if="contextMenu.node?.type === 'directory'">
            <div class="ctx-item" @click="ctxNewFile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              <span>新建文件</span>
            </div>
          </template>
        </div>
      </Transition>
    </Teleport>

    <!-- New file input dialog -->
    <Teleport to="body">
      <Transition name="ctx-menu">
        <div v-if="newFileDialog.visible" class="new-file-overlay" @click.self="cancelCreateFile">
          <div class="new-file-dialog">
            <div class="dialog-title">新建 Markdown 文件</div>
            <input
              ref="newFileInputRef"
              v-model="newFileDialog.fileName"
              class="dialog-input"
              placeholder="输入文件名（不含 .md）"
              @keydown.enter="confirmCreateFile"
              @keydown.escape="cancelCreateFile"
            />
            <div class="dialog-actions">
              <button class="dialog-btn dialog-cancel" @click="cancelCreateFile">取消</button>
              <button class="dialog-btn dialog-confirm" @click="confirmCreateFile">创建</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
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

const emit = defineEmits(['select-file', 'edit-file', 'delete-file', 'create-file'])

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  node: null
})

const newFileDialog = ref({
  visible: false,
  dirPath: '',
  fileName: ''
})

const newFileInputRef = ref(null)

const handleSelect = (node) => {
  if (node.type === 'file') {
    emit('select-file', node)
  }
}

const showContextMenu = ({ node, x, y }) => {
  contextMenu.value = { visible: true, x, y, node }
}

const hideContextMenu = () => {
  contextMenu.value = { ...contextMenu.value, visible: false }
}

const handleBackgroundClick = () => {
  hideContextMenu()
}

const handleGlobalClick = (event) => {
  if (contextMenu.value.visible) {
    const menu = document.querySelector('.context-menu')
    if (menu && !menu.contains(event.target)) {
      hideContextMenu()
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleGlobalClick, true)
})

const ctxOpen = () => {
  const node = contextMenu.value.node
  hideContextMenu()
  if (node) emit('select-file', node)
}

const ctxEdit = () => {
  const node = contextMenu.value.node
  hideContextMenu()
  if (node) emit('edit-file', node)
}

const ctxDelete = () => {
  const node = contextMenu.value.node
  hideContextMenu()
  if (node) emit('delete-file', node)
}

const ctxNewFile = () => {
  const node = contextMenu.value.node
  hideContextMenu()
  if (node) startCreateFile(node)
}

const startCreateFile = (dirNode) => {
  const dirPath = dirNode.type === 'directory' ? dirNode.path : ''
  if (!dirPath) return
  newFileDialog.value = { visible: true, dirPath, fileName: '' }
  nextTick(() => {
    newFileInputRef.value?.focus()
  })
}

const cancelCreateFile = () => {
  newFileDialog.value = { visible: false, dirPath: '', fileName: '' }
}

const confirmCreateFile = () => {
  const { dirPath, fileName } = newFileDialog.value
  if (!fileName.trim()) return
  emit('create-file', { dirPath, fileName: fileName.trim() })
  cancelCreateFile()
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
  padding: 12px 16px;
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

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.header-btn:hover {
  background: var(--hover-bg);
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

/* Context Menu */
.context-menu {
  position: fixed;
  min-width: 160px;
  background: var(--dropdown-bg, var(--bg-secondary));
  border: 1px solid var(--dropdown-border, var(--border-color));
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  padding: 4px 0;
  z-index: 10000;
}

.ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.15s;
}

.ctx-item:hover {
  background: var(--dropdown-hover-bg, var(--hover-bg));
}

.ctx-item svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.ctx-item.ctx-danger {
  color: #f56c6c;
}

.ctx-item.ctx-danger:hover {
  background: rgba(245, 108, 108, 0.1);
}

.ctx-separator {
  height: 1px;
  background: var(--border-color);
  margin: 4px 8px;
}

.ctx-menu-enter-active,
.ctx-menu-leave-active {
  transition: all 0.12s ease;
}

.ctx-menu-enter-from,
.ctx-menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* New file dialog */
.new-file-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.new-file-dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  min-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dialog-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.dialog-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.dialog-input:focus {
  border-color: var(--accent-color);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.dialog-btn {
  padding: 6px 16px;
  font-size: 13px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.dialog-cancel {
  background: var(--bg-tertiary, var(--bg-primary));
  color: var(--text-secondary);
}

.dialog-cancel:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.dialog-confirm {
  background: var(--accent-color);
  color: #fff;
}

.dialog-confirm:hover {
  background: var(--accent-hover);
}
</style>
