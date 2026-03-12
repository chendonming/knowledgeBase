<template>
  <div v-if="isOpen" class="settings-modal">
    <div class="modal-overlay" @click="closeModal"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>设置</h2>
        <button class="btn-close" @click="closeModal">✕</button>
      </div>
      <div class="settings-body">
        <section class="settings-section">
          <h3>字体</h3>
          <div class="font-group">
            <h4>整体程序字体（菜单、侧边栏等）</h4>
            <div class="font-row">
              <label>英文字体</label>
              <input v-model="draft.ui.fontLatin" type="text" placeholder="例如：Segoe UI, system-ui" />
            </div>
            <div class="font-row">
              <label>中文字体</label>
              <input v-model="draft.ui.fontCJK" type="text" placeholder="例如：微软雅黑, PingFang SC" />
            </div>
          </div>
          <div class="font-group">
            <h4>编辑器字体</h4>
            <div class="font-row">
              <label>英文字体</label>
              <input v-model="draft.editor.fontLatin" type="text" placeholder="例如：Consolas, Monaco" />
            </div>
            <div class="font-row">
              <label>中文字体</label>
              <input v-model="draft.editor.fontCJK" type="text" placeholder="例如：微软雅黑, Source Han Sans" />
            </div>
          </div>
          <div class="font-group">
            <h4>预览文档字体</h4>
            <div class="font-row">
              <label>英文字体</label>
              <input v-model="draft.preview.fontLatin" type="text" placeholder="例如：Georgia, serif" />
            </div>
            <div class="font-row">
              <label>中文字体</label>
              <input v-model="draft.preview.fontCJK" type="text" placeholder="例如：思源宋体, 宋体" />
            </div>
          </div>
        </section>
        <div class="presets">
          <span class="preset-label">快速预设：</span>
          <button class="preset-btn" @click="applyPreset('default')">默认</button>
          <button class="preset-btn" @click="applyPreset('source-han')">思源黑体</button>
          <button class="preset-btn" @click="applyPreset('noto')">Noto Sans</button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="restoreDefaults">恢复默认</button>
        <div class="footer-right">
          <button class="btn-secondary" @click="closeModal">取消</button>
          <button class="btn-primary" @click="apply">应用</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getFontSettings, setFontSettings, defaultFontSettings } from '../stores/fontSettings'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const draft = ref({
  ui: { fontCJK: '', fontLatin: '' },
  editor: { fontCJK: '', fontLatin: '' },
  preview: { fontCJK: '', fontLatin: '' }
})

const loadDraft = () => {
  const s = getFontSettings()
  draft.value = {
    ui: { ...s.ui },
    editor: { ...s.editor },
    preview: { ...s.preview }
  }
}

watch(() => props.isOpen, (open) => {
  if (open) loadDraft()
})

const closeModal = () => emit('close')

const apply = () => {
  setFontSettings(draft.value)
  closeModal()
}

const restoreDefaults = () => {
  draft.value = {
    ui: { ...defaultFontSettings.ui },
    editor: { ...defaultFontSettings.editor },
    preview: { ...defaultFontSettings.preview }
  }
}

const presets = {
  default: {
    ui: { fontCJK: '', fontLatin: 'Segoe UI, system-ui, sans-serif' },
    editor: { fontCJK: '', fontLatin: 'Consolas, Monaco, monospace' },
    preview: { fontCJK: '', fontLatin: 'Georgia, serif' }
  },
  'source-han': {
    ui: { fontCJK: 'Source Han Sans SC, 思源黑体', fontLatin: 'Segoe UI, system-ui' },
    editor: { fontCJK: 'Source Han Sans SC, 思源黑体', fontLatin: 'Consolas, Monaco' },
    preview: { fontCJK: 'Source Han Sans SC, 思源黑体', fontLatin: 'Georgia' }
  },
  noto: {
    ui: { fontCJK: 'Noto Sans SC', fontLatin: 'Segoe UI, system-ui' },
    editor: { fontCJK: 'Noto Sans Mono CJK SC', fontLatin: 'Consolas, Monaco' },
    preview: { fontCJK: 'Noto Serif SC', fontLatin: 'Georgia' }
  }
}

const applyPreset = (name) => {
  const p = presets[name]
  if (p) draft.value = { ui: { ...p.ui }, editor: { ...p.editor }, preview: { ...p.preview } }
}
</script>

<style scoped>
.settings-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 90%;
  max-width: 540px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
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

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.settings-section h3 {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.font-group {
  margin-bottom: 20px;
}

.font-group h4 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.font-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.font-row label {
  width: 80px;
  font-size: 13px;
  color: var(--text-primary);
}

.font-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 13px;
}

.font-row input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.font-row input::placeholder {
  color: var(--text-tertiary);
}

.presets {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.preset-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.preset-btn {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: var(--hover-bg);
  border-color: var(--accent-color);
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.footer-right {
  display: flex;
  gap: 8px;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--accent-color);
  border: none;
  color: #fff;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--hover-bg);
}
</style>
