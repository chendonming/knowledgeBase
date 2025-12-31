<template>
  <div class="markdown-editor">
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
// 使用 min 目录中的样式文件，避免 ESM 树中缺失 CSS 报错
import 'monaco-editor/min/vs/editor/editor.main.css'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker.js?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker.js?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker.js?worker'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: 'vs-dark'
  },
  language: {
    type: String,
    default: 'markdown'
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const editorContainer = ref(null)
let editorInstance = null
let resizeObserver = null

if (!self.MonacoEnvironment) {
  self.MonacoEnvironment = {
    getWorker(_, label) {
      switch (label) {
        case 'json':
          return new jsonWorker()
        case 'css':
        case 'scss':
        case 'less':
          return new cssWorker()
        case 'html':
        case 'handlebars':
        case 'razor':
          return new htmlWorker()
        case 'typescript':
        case 'javascript':
          return new tsWorker()
        default:
          // 其他语言（含 markdown）均使用通用编辑器 worker
          return new editorWorker()
      }
    }
  }
}

const bindModel = () => {
  if (!editorInstance) return

  editorInstance.onDidChangeModelContent(() => {
    emit('update:modelValue', editorInstance.getValue())
  })

  editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    emit('save', editorInstance.getValue())
  })
}

onMounted(() => {
  editorInstance = monaco.editor.create(editorContainer.value, {
    value: props.modelValue ?? '',
    language: props.language,
    theme: props.theme,
    minimap: { enabled: false },
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    renderLineHighlight: 'line',
    automaticLayout: false,
    folding: true,
    tabSize: 2,
    readOnly: props.readOnly
  })

  bindModel()

  resizeObserver = new ResizeObserver(() => {
    editorInstance?.layout()
  })
  if (editorContainer.value) {
    resizeObserver.observe(editorContainer.value)
  }
})

watch(
  () => props.modelValue,
  (val) => {
    if (!editorInstance) return
    const current = editorInstance.getValue()
    if (val !== current) {
      const position = editorInstance.getPosition()
      editorInstance.setValue(val ?? '')
      if (position) editorInstance.setPosition(position)
    }
  }
)

watch(
  () => props.theme,
  (val) => {
    if (val) {
      monaco.editor.setTheme(val)
    }
  }
)

watch(
  () => props.language,
  (val) => {
    if (editorInstance && val) {
      const model = editorInstance.getModel()
      if (model) monaco.editor.setModelLanguage(model, val)
    }
  }
)

watch(
  () => props.readOnly,
  (val) => {
    editorInstance?.updateOptions({ readOnly: val })
  }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (editorInstance) {
    editorInstance.dispose()
    editorInstance = null
  }
})
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

.editor-container {
  flex: 1;
  min-height: 320px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}
</style>
