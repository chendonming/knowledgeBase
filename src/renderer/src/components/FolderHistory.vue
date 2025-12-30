<template>
  <div v-if="isOpen" class="folder-history-modal">
    <div class="modal-overlay" @click="closeModal"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Folder History</h2>
        <button class="btn-close" @click="closeModal">✕</button>
      </div>
      <div class="history-list">
        <div v-if="folders.length === 0" class="empty-state">No folder history yet</div>
        <div
          v-for="folder in folders"
          :key="folder"
          class="history-item"
          @click="selectFolder(folder)"
        >
          <div class="folder-path">
            <span class="folder-icon">📁</span>
            <span class="path-text">{{ folder }}</span>
          </div>
          <button class="btn-remove" title="Remove from history" @click.stop="removeFolder(folder)">
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  folders: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'select', 'remove'])

const closeModal = () => {
  emit('close')
}

const selectFolder = (folder) => {
  emit('select', folder)
  closeModal()
}

const removeFolder = (folder) => {
  emit('remove', folder)
}
</script>

<style scoped>
.folder-history-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-close:hover {
  background-color: var(--hover-bg);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.history-item {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:hover {
  background-color: var(--hover-bg);
}

.folder-path {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.folder-icon {
  flex-shrink: 0;
  font-size: 18px;
}

.path-text {
  color: var(--text-primary);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: monospace;
}

.btn-remove {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px 8px;
  margin-left: 8px;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-remove:hover {
  background-color: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}
</style>
