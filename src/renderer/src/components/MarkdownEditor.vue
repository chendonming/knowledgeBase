<template>
  <div class="markdown-editor">
    <div class="editor-toolbar">
      <div class="toolbar-group">
        <button class="toolbar-btn" title="加粗 (Ctrl+B)" @click="formatBold">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
        </button>
        <button class="toolbar-btn" title="斜体 (Ctrl+I)" @click="formatItalic">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
        </button>
        <button class="toolbar-btn" title="删除线 (Ctrl+Shift+S)" @click="formatStrikethrough">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>
        </button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <button class="toolbar-btn" title="标题1" @click="formatHeading(1)">H1</button>
        <button class="toolbar-btn" title="标题2" @click="formatHeading(2)">H2</button>
        <button class="toolbar-btn" title="标题3" @click="formatHeading(3)">H3</button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <button class="toolbar-btn" title="行内代码" @click="formatInlineCode">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
        </button>
        <button class="toolbar-btn" title="代码块 (Ctrl+Shift+K)" @click="formatCodeBlock">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8l3 3-3 3M13 14h3"/></svg>
        </button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <button class="toolbar-btn" title="链接 (Ctrl+K)" @click="formatLink">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
        </button>
        <button class="toolbar-btn" title="图片" @click="formatImage">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        </button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <button class="toolbar-btn" title="无序列表" @click="formatUnorderedList">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
        </button>
        <button class="toolbar-btn" title="有序列表" @click="formatOrderedList">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
        </button>
        <button class="toolbar-btn" title="引用" @click="formatQuote">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
        </button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <button class="toolbar-btn" title="水平线" @click="formatHorizontalRule">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M2 11h20v2H2z"/></svg>
        </button>
        <button class="toolbar-btn" title="表格" @click="formatTable">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z"/></svg>
        </button>
      </div>
    </div>
    <div ref="editorContainer" class="editor-container"></div>
    <div class="editor-statusbar">
      <span class="status-item">Ln {{ cursorLine }}, Col {{ cursorColumn }}</span>
      <span class="status-item">{{ wordCount }} 字</span>
      <span class="status-item">{{ lineCount }} 行</span>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js'
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

const cursorLine = ref(1)
const cursorColumn = ref(1)
const wordCount = ref(0)
const lineCount = ref(0)

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
          return new editorWorker()
      }
    }
  }
}

const updateStats = () => {
  if (!editorInstance) return
  const position = editorInstance.getPosition()
  if (position) {
    cursorLine.value = position.lineNumber
    cursorColumn.value = position.column
  }
  const content = editorInstance.getValue()
  lineCount.value = editorInstance.getModel()?.getLineCount() ?? 0
  const trimmed = content.trim()
  wordCount.value = trimmed ? trimmed.replace(/\s+/g, ' ').split(' ').length : 0
}

// --- Formatting helpers ---

const wrapSelection = (prefix, suffix) => {
  if (!editorInstance) return
  const selection = editorInstance.getSelection()
  const selectedText = editorInstance.getModel().getValueInRange(selection)
  const newText = `${prefix}${selectedText || '文本'}${suffix}`
  editorInstance.executeEdits('toolbar', [
    { range: selection, text: newText, forceMoveMarkers: true }
  ])
  if (!selectedText) {
    const startCol = selection.startColumn + prefix.length
    const endCol = startCol + 2
    editorInstance.setSelection(
      new monaco.Selection(
        selection.startLineNumber,
        startCol,
        selection.startLineNumber,
        endCol
      )
    )
  }
  editorInstance.focus()
}

const insertAtLineStart = (prefix) => {
  if (!editorInstance) return
  const selection = editorInstance.getSelection()
  const startLine = selection.startLineNumber
  const endLine = selection.endLineNumber

  const edits = []
  for (let line = startLine; line <= endLine; line++) {
    const lineContent = editorInstance.getModel().getLineContent(line)
    edits.push({
      range: new monaco.Range(line, 1, line, lineContent.length + 1),
      text: `${prefix}${lineContent}`,
      forceMoveMarkers: true
    })
  }
  editorInstance.executeEdits('toolbar', edits)
  editorInstance.focus()
}

const insertBlock = (text) => {
  if (!editorInstance) return
  const selection = editorInstance.getSelection()
  const position = selection.getStartPosition()
  const lineContent = editorInstance.getModel().getLineContent(position.lineNumber)
  const needsNewline = lineContent.trim().length > 0
  const insertText = needsNewline ? `\n${text}\n` : `${text}\n`

  editorInstance.executeEdits('toolbar', [
    {
      range: new monaco.Range(
        position.lineNumber,
        lineContent.length + 1,
        position.lineNumber,
        lineContent.length + 1
      ),
      text: insertText,
      forceMoveMarkers: true
    }
  ])
  editorInstance.focus()
}

const formatBold = () => wrapSelection('**', '**')
const formatItalic = () => wrapSelection('*', '*')
const formatStrikethrough = () => wrapSelection('~~', '~~')
const formatInlineCode = () => wrapSelection('`', '`')

const formatLink = () => {
  if (!editorInstance) return
  const selection = editorInstance.getSelection()
  const selectedText = editorInstance.getModel().getValueInRange(selection)
  const newText = `[${selectedText || '链接文本'}](url)`
  editorInstance.executeEdits('toolbar', [
    { range: selection, text: newText, forceMoveMarkers: true }
  ])
  if (!selectedText) {
    const startCol = selection.startColumn + 1
    const endCol = startCol + 4
    editorInstance.setSelection(
      new monaco.Selection(selection.startLineNumber, startCol, selection.startLineNumber, endCol)
    )
  }
  editorInstance.focus()
}

const formatImage = () => {
  if (!editorInstance) return
  const selection = editorInstance.getSelection()
  const selectedText = editorInstance.getModel().getValueInRange(selection)
  const newText = `![${selectedText || '图片描述'}](url)`
  editorInstance.executeEdits('toolbar', [
    { range: selection, text: newText, forceMoveMarkers: true }
  ])
  editorInstance.focus()
}

const formatHeading = (level) => {
  if (!editorInstance) return
  const selection = editorInstance.getSelection()
  const line = selection.startLineNumber
  const lineContent = editorInstance.getModel().getLineContent(line)
  const stripped = lineContent.replace(/^#{1,6}\s*/, '')
  const prefix = '#'.repeat(level) + ' '
  editorInstance.executeEdits('toolbar', [
    {
      range: new monaco.Range(line, 1, line, lineContent.length + 1),
      text: `${prefix}${stripped}`,
      forceMoveMarkers: true
    }
  ])
  editorInstance.focus()
}

const formatCodeBlock = () => {
  if (!editorInstance) return
  const selection = editorInstance.getSelection()
  const selectedText = editorInstance.getModel().getValueInRange(selection)
  const newText = '```\n' + (selectedText || '') + '\n```'
  editorInstance.executeEdits('toolbar', [
    { range: selection, text: newText, forceMoveMarkers: true }
  ])
  editorInstance.focus()
}

const formatUnorderedList = () => insertAtLineStart('- ')
const formatOrderedList = () => {
  if (!editorInstance) return
  const selection = editorInstance.getSelection()
  const startLine = selection.startLineNumber
  const endLine = selection.endLineNumber
  const edits = []
  for (let line = startLine; line <= endLine; line++) {
    const lineContent = editorInstance.getModel().getLineContent(line)
    const num = line - startLine + 1
    edits.push({
      range: new monaco.Range(line, 1, line, lineContent.length + 1),
      text: `${num}. ${lineContent}`,
      forceMoveMarkers: true
    })
  }
  editorInstance.executeEdits('toolbar', edits)
  editorInstance.focus()
}
const formatQuote = () => insertAtLineStart('> ')

const formatHorizontalRule = () => insertBlock('---')

const formatTable = () => {
  const table = `| 列1 | 列2 | 列3 |
| --- | --- | --- |
|     |     |     |`
  insertBlock(table)
}

const bindModel = () => {
  if (!editorInstance) return

  editorInstance.onDidChangeModelContent(() => {
    emit('update:modelValue', editorInstance.getValue())
    updateStats()
  })

  editorInstance.onDidChangeCursorPosition(() => {
    updateStats()
  })

  // Ctrl+S  save
  editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    emit('save', editorInstance.getValue())
  })

  // Ctrl+B  bold
  editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, formatBold)

  // Ctrl+I  italic
  editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, formatItalic)

  // Ctrl+Shift+S  strikethrough
  editorInstance.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS,
    formatStrikethrough
  )

  // Ctrl+K  link
  editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, formatLink)

  // Ctrl+Shift+K  code block
  editorInstance.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK,
    formatCodeBlock
  )
}

let completionDisposable = null

const registerMarkdownSnippets = () => {
  completionDisposable = monaco.languages.registerCompletionItemProvider('markdown', {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }

      const snippets = [
        {
          label: 'frontmatter',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '---\ntitle: "${1:标题}"\ndate: "${2:' + new Date().toISOString().split('T')[0] + '}"\ntags: [${3}]\n---\n\n$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'YAML Frontmatter 模板',
          range
        },
        {
          label: 'table',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '| ${1:列1} | ${2:列2} | ${3:列3} |\n| --- | --- | --- |\n| $4 | $5 | $6 |\n$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Markdown 表格',
          range
        },
        {
          label: 'codeblock',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '```${1:language}\n$2\n```\n$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: '代码块',
          range
        },
        {
          label: 'link',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '[${1:文本}](${2:url})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: '链接',
          range
        },
        {
          label: 'image',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '![${1:描述}](${2:url})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: '图片',
          range
        },
        {
          label: 'tasklist',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '- [ ] ${1:任务1}\n- [ ] ${2:任务2}\n- [ ] ${3:任务3}\n$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: '任务列表',
          range
        },
        {
          label: 'math',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '$$\n${1:公式}\n$$\n$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: '数学公式块',
          range
        },
        {
          label: 'details',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '<details>\n<summary>${1:标题}</summary>\n\n${2:内容}\n\n</details>\n$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: '折叠内容块',
          range
        }
      ]

      return { suggestions: snippets }
    }
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
    readOnly: props.readOnly,
    fontSize: 14,
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
    guides: { indentation: true }
  })

  bindModel()
  updateStats()
  registerMarkdownSnippets()

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
      updateStats()
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
  completionDisposable?.dispose()
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

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 4px;
  flex-shrink: 0;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.15s;
}

.toolbar-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.toolbar-btn:active {
  background: var(--selected-bg);
}

.toolbar-btn svg {
  width: 16px;
  height: 16px;
}

.editor-container {
  flex: 1;
  min-height: 320px;
  border: 1px solid var(--border-color);
  border-radius: 0;
  overflow: hidden;
}

.editor-statusbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 8px 8px;
  flex-shrink: 0;
}

.status-item {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
