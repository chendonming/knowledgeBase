import fs from 'fs'
import { createRequire } from 'module'
import { getThemeConfig } from '../renderer/src/themes/themeConfig.js'

const require = createRequire(import.meta.url)

const readFileSafe = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    console.warn('[share] Failed to read CSS file:', filePath, error.message)
    return ''
  }
}

const loadPackageCss = (modulePath) => {
  try {
    const resolved = require.resolve(modulePath)
    return readFileSafe(resolved)
  } catch (error) {
    console.warn('[share] Failed to resolve CSS module:', modulePath, error.message)
    return ''
  }
}

// 主题变量样式
const buildThemeVariables = (themeId = 'dark') => {
  const theme = getThemeConfig(themeId)
  const vars = Object.entries(theme.colors)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n')

  // 与 renderer 保持一致：非暗色主题在 root 上增加 class
  const themeClass = themeId === 'dark' ? '' : `${themeId}-theme`

  return {
    css: `:root {\n${vars}\n}`,
    themeClass
  }
}

// 与 MarkdownViewer.vue 保持一致的排版样式（去掉 :deep 作用域）
const markdownCss = `
.markdown-body {
  max-width: 900px;
  margin: 0 auto;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
}

.markdown-body h1 {
  font-size: 2em;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.markdown-body h2 {
  font-size: 1.5em;
  margin-top: 24px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.markdown-body h3 {
  font-size: 1.25em;
  margin-top: 24px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.markdown-body p {
  margin-bottom: 16px;
  color: var(--text-primary);
}

.markdown-body code {
  background-color: var(--code-bg);
  color: #e8e8e8;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-body pre {
  background-color: var(--code-bg);
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  border: 1px solid var(--border-color);
  margin: 16px 0;
  line-height: 1.5;
  position: relative;
}

.markdown-body pre code {
  background-color: transparent;
  padding: 0;
  color: #e8e8e8;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-body ul,
.markdown-body ol {
  margin-bottom: 16px;
  padding-left: 32px;
  color: var(--text-primary);
}

.markdown-body li {
  margin-bottom: 4px;
  color: var(--text-primary);
}

.markdown-body blockquote {
  margin: 16px 0;
  padding: 0 16px;
  border-left: 4px solid var(--border-color);
  color: var(--text-secondary);
}

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.markdown-body th,
.markdown-body td {
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  color: var(--text-primary);
}

.markdown-body th {
  background-color: var(--bg-secondary);
  font-weight: 600;
}

.markdown-body tr:nth-child(even) {
  background-color: var(--bg-secondary);
}

.markdown-body img {
  max-width: 100%;
  height: auto;
}

.markdown-body a {
  color: var(--accent-color);
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
  color: var(--accent-hover);
}

.markdown-body hr {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 24px 0;
}

.markdown-body strong {
  color: var(--text-primary);
  font-weight: 600;
}

.markdown-body em {
  color: var(--text-primary);
}
`

// 页面基础样式，复用 renderer 全局变量
const baseCss = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
}

.share-shell {
  min-height: 100vh;
  background: radial-gradient(ellipse at top, rgba(255, 255, 255, 0.04), transparent 45%),
    radial-gradient(ellipse at bottom, rgba(255, 255, 255, 0.04), transparent 45%),
    var(--bg-primary);
  color: var(--text-primary);
  padding: 32px 16px 48px;
}

.share-frame {
  max-width: 1080px;
  margin: 0 auto;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.share-header {
  padding: 20px 28px;
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.share-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.share-title span {
  color: var(--text-secondary);
  font-size: 14px;
}

.share-main {
  padding: 28px;
  background: var(--bg-secondary);
}

.share-footer {
  padding: 16px 28px 22px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 12px;
}

.code-copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease, color 0.2s ease;
}

pre:hover .code-copy-btn,
.code-copy-btn:focus {
  opacity: 1;
}

.code-copy-btn:hover {
  background: var(--accent-color);
  color: #fff;
}

.code-copy-btn.copied {
  background: #4caf50;
  color: #fff;
  border-color: #4caf50;
}

.code-copy-btn.failed {
  background: #f56c6c;
  color: #fff;
  border-color: #f56c6c;
}
`

const fallbackKatexCdn = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
const fallbackHighlightCdn = 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/atom-one-dark.min.css'

const katexCss = loadPackageCss('katex/dist/katex.min.css')
const highlightCss = loadPackageCss('highlight.js/styles/atom-one-dark.css')

export const buildShareHtml = ({ htmlContent, title = 'Markdown 预览', themeId = 'dark' }) => {
  const { css: themeVars, themeClass } = buildThemeVariables(themeId)

  const headStyles = [themeVars, baseCss, markdownCss, highlightCss, katexCss]
    .filter(Boolean)
    .map((css) => `<style>\n${css}\n</style>`)
    .join('\n')

  const fallbackLinks = [
    katexCss ? '' : `<link rel="stylesheet" href="${fallbackKatexCdn}" />`,
    highlightCss ? '' : `<link rel="stylesheet" href="${fallbackHighlightCdn}" />`
  ]
    .filter(Boolean)
    .join('\n')

  const safeHtml = htmlContent || '<p>暂无内容</p>'

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <title>${title}</title>
  ${headStyles}
  ${fallbackLinks}
</head>
<body class="share-shell ${themeClass}">
  <div class="share-frame">
    <header class="share-header">
      <div class="share-title">
        📄 ${title}
        <span>由 KnowledgeBase 生成的分享页</span>
      </div>
      <div class="badge">实时预览</div>
    </header>
    <main class="share-main">
      <article class="markdown-body">${safeHtml}</article>
    </main>
    <footer class="share-footer">
      <span>当前主题：${themeId}</span>
      <span>📡 局域网可见</span>
    </footer>
  </div>
</body>
</html>`
}
