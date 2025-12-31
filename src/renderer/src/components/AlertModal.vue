<template>
  <transition name="alert-fade">
    <div v-if="visible" class="alert-overlay">
      <div class="alert-dialog" :class="`alert-${type}`" role="alertdialog" aria-modal="true">
        <header class="alert-header">
          <div class="alert-title">
            <span class="alert-dot" :class="`alert-dot-${type}`"></span>
            <span>{{ title }}</span>
          </div>
          <button class="alert-close" type="button" aria-label="关闭" @click="$emit('confirm')">
            ×
          </button>
        </header>
        <div class="alert-body">
          <p v-if="isSingleLine" class="alert-message">{{ message }}</p>
          <pre v-else class="alert-message multiline">{{ message }}</pre>
        </div>
        <footer class="alert-actions">
          <button class="alert-button" type="button" @click="$emit('confirm')">知道了</button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '提示'
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info'
  }
})

const isSingleLine = computed(() => !props.message.includes('\n'))
</script>

<style scoped>
.alert-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  backdrop-filter: blur(2px);
}

.alert-dialog {
  width: min(420px, 90vw);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  transform: translateY(0);
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.alert-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.alert-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent-color);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

.alert-dot-info {
  background: var(--accent-color);
}

.alert-dot-success {
  background: #22c55e;
}

.alert-dot-warning {
  background: #f59e0b;
}

.alert-dot-error {
  background: #ef4444;
}

.alert-close {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 4px;
  line-height: 1;
}

.alert-close:hover {
  color: var(--text-primary);
}

.alert-body {
  padding: 16px;
}

.alert-message {
  margin: 0;
  color: var(--text-primary);
  line-height: 1.5;
  white-space: pre-line;
}

.alert-message.multiline {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  font-family: inherit;
}

.alert-actions {
  padding: 12px 16px 16px;
  display: flex;
  justify-content: flex-end;
}

.alert-button {
  min-width: 92px;
  padding: 10px 14px;
  background: var(--accent-color);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.2px;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
}

.alert-button:hover {
  background: var(--accent-hover);
}

.alert-button:active {
  transform: translateY(1px);
}

.alert-dialog.alert-success {
  border-color: rgba(34, 197, 94, 0.45);
}

.alert-dialog.alert-warning {
  border-color: rgba(245, 158, 11, 0.45);
}

.alert-dialog.alert-error {
  border-color: rgba(239, 68, 68, 0.45);
}

.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: opacity 0.18s ease;
}

.alert-fade-enter-from,
.alert-fade-leave-to {
  opacity: 0;
}
</style>
