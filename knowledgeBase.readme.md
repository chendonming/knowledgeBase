# KnowledgeBase 项目实现方式分析

## 项目概述

KnowledgeBase 是一个基于 Electron 和 Vue 3 的个人知识库工具，能够渲染 Markdown 文件并提供类似 VitePress 的界面体验。该项目采用现代前端技术栈，提供了丰富的功能来管理本地 Markdown 文档。

## 技术栈

- **主框架**: Electron (跨平台桌面应用)
- **前端框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **Markdown 渲染**: Unified 生态系统 (remark/rehype)
- **代码编辑**: Monaco Editor
- **样式**: CSS Variables + 多主题系统

## 全局快捷键

项目支持丰富的键盘快捷键提升操作效率：

### 文件操作

- `Ctrl+O` / `Cmd+O`: 打开文件夹
- `Ctrl+H` / `Cmd+H`: 打开文件夹历史面板
- `Ctrl+P` / `Cmd+P`: 打开文件搜索面板（全局搜索）
- `Ctrl+Shift+I` / `Cmd+Shift+I`: 刷新搜索索引
- `Alt+F4`: 退出应用 (Windows/Linux)

### 编辑操作

- `Ctrl+E` / `Cmd+E`: 切换编辑模式
- `Ctrl+F` / `Cmd+F`: 在当前文档中搜索关键字（仅查看模式）
- `Ctrl+Z` / `Cmd+Z`: 撤销
- `Ctrl+Y` / `Cmd+Y`: 重做
- `Ctrl+X` / `Cmd+X`: 剪切
- `Ctrl+C` / `Cmd+C`: 复制
- `Ctrl+V` / `Cmd+V`: 粘贴
- `Ctrl+A` / `Cmd+A`: 全选

### 界面操作

- `Ctrl+B` / `Cmd+B`: 切换侧边栏显示/隐藏
- `Ctrl+R` / `Cmd+R`: 重新加载
- `Ctrl+0` / `Cmd+0`: 重置缩放
- `Ctrl++` / `Cmd++`: 放大
- `Ctrl+-` / `Cmd+-`: 缩小
- `F11`: 切换全屏
- `F12`: 打开开发者工具

### 分享功能

- `Ctrl+Shift+S` / `Cmd+Shift+S`: 创建分享链接
- `Ctrl+Shift+X` / `Cmd+Shift+X`: 停止分享

## 核心功能实现分析

### 1. 左侧目录树 (Directory Tree)

#### UI 代码位置

- **主组件**: `src/renderer/src/components/FileTree.vue`
- **递归组件**: `src/renderer/src/components/TreeNode.vue`
- **状态管理**: `src/renderer/src/stores/uiState.js`

#### 记住状态的机制

目录树状态通过 localStorage 持久化存储，具体实现如下：

```javascript
// 在 uiState.js 中
const treeExpansionState = ref({}) // key: path, value: expanded

export const getTreeExpansionState = (path) => {
  return treeExpansionState.value[path] !== undefined ? treeExpansionState.value[path] : true // 默认展开根目录
}

export const setTreeExpansionState = (path, expanded) => {
  treeExpansionState.value[path] = expanded
  localStorage.setItem('tree-expansion-state', JSON.stringify(treeExpansionState.value))
}

// 初始化时从 localStorage 恢复
export const initializeUIState = () => {
  const savedTreeState = localStorage.getItem('tree-expansion-state')
  if (savedTreeState) {
    treeExpansionState.value = JSON.parse(savedTreeState)
  }
}
```

**状态持久化原理**:

- 每个目录的展开/收起状态以路径为key存储在内存中
- 每次状态改变时同步写入localStorage
- 切换文件夹时清除旧状态(`clearTreeExpansionState`)
- 应用启动时自动恢复(`initializeUIState`)

**用户体验优化**:

- 自动展开包含选中文件的目录路径
- 根目录默认展开，其他目录保持上次状态

### 2. 历史记录功能 (Folder History)

#### 核心代码位置

- **UI 组件**: `src/renderer/src/components/FolderHistory.vue`
- **状态管理**: `src/renderer/src/App.vue`
- **持久化存储**: Main进程文件系统操作
- **菜单集成**: `src/renderer/src/components/MenuBar.vue`

#### 实现原理

基于文件系统的历史记录管理系统，支持最近使用的文件夹记忆：

**数据存储架构**:

```javascript
// 存储在用户数据目录中的 JSON 文件
const userDataPath = app.getPath('userData')
const historyFile = path.join(userDataPath, 'folder-history.json')
const lastFolderFile = path.join(userDataPath, 'last-folder.json')
```

**历史记录管理**:

```javascript
// 添加文件夹到历史记录
const addFolderToHistory = async (folderPath) => {
  try {
    let history = []
    if (fsSync.existsSync(historyFile)) {
      const data = fs.readFileSync(historyFile, 'utf-8')
      history = JSON.parse(data)
    }

    // 移除已存在的相同路径
    history = history.filter((item) => item.path !== folderPath)

    // 添加到开头
    history.unshift({
      path: folderPath,
      timestamp: Date.now()
    })

    // 限制最多20个记录
    if (history.length > 20) {
      history = history.slice(0, 20)
    }

    // 保存到文件
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2))
  } catch (error) {
    console.error('Error saving folder history:', error)
  }
}

// 获取历史记录
const getFolderHistory = async () => {
  try {
    if (fsSync.existsSync(historyFile)) {
      const data = fs.readFileSync(historyFile, 'utf-8')
      return JSON.parse(data)
    }
    return []
  } catch (error) {
    console.error('Error loading folder history:', error)
    return []
  }
}
```

**最后文件夹记忆**:

```javascript
const saveLastFolder = async (folderPath) => {
  try {
    fs.writeFileSync(
      lastFolderFile,
      JSON.stringify(
        {
          path: folderPath,
          timestamp: Date.now()
        },
        null,
        2
      )
    )
  } catch (error) {
    console.error('Error saving last folder:', error)
  }
}

const getLastFolder = async () => {
  try {
    if (fsSync.existsSync(lastFolderFile)) {
      const data = fs.readFileSync(lastFolderFile, 'utf-8')
      const result = JSON.parse(data)
      return result.path
    }
    return null
  } catch (error) {
    console.error('Error loading last folder:', error)
    return null
  }
}
```

**应用启动恢复**:

```javascript
// 在 App.vue 中
onMounted(async () => {
  // 加载历史记录
  await loadFolderHistory()

  // 尝试加载上次使用的文件夹
  try {
    const lastFolder = await window.api.getLastFolder()
    if (lastFolder) {
      const result = await window.api.getFileTree(lastFolder)
      if (result.success) {
        currentFolder.value = lastFolder
        fileTree.value = result.tree
      }
    }
  } catch (error) {
    console.error('Failed to load last folder:', error)
  }
})
```

#### 历史记录操作

**删除特定记录**:

```javascript
const removeFolderFromHistory = async (folderPath) => {
  try {
    if (fsSync.existsSync(historyFile)) {
      const data = fs.readFileSync(historyFile, 'utf-8')
      let history = JSON.parse(data)

      // 移除指定路径
      history = history.filter((item) => item.path !== folderPath)

      fs.writeFileSync(historyFile, JSON.stringify(history, null, 2))
    }
  } catch (error) {
    console.error('Error removing folder from history:', error)
  }
}
```

**UI 组件特性**:

- **模态框显示**: 居中弹窗，不阻挡主界面
- **路径显示**: 完整文件夹路径，支持长路径截断
- **时间戳排序**: 最近使用的文件夹排在前面
- **删除操作**: 右键或按钮删除特定历史记录
- **快捷选择**: 点击直接加载对应文件夹

#### 集成和触发

**菜单集成**:

```javascript
// MenuBar.vue 中的菜单项
{
  id: 'open-history',
  label: '打开历史记录',
  accelerator: 'Ctrl+H',
  action: 'open-history'
}
```

**快捷键处理**:

```javascript
// App.vue 中的全局快捷键
if ((event.ctrlKey || event.metaKey) && key === 'h') {
  event.preventDefault()
  showHistory.value = !showHistory.value
}
```

#### 数据持久化

**存储位置**:

- **Windows**: `%APPDATA%\knowledgebase\`
- **macOS**: `~/Library/Application Support/knowledgebase/`
- **Linux**: `~/.config/knowledgebase/`

**存储格式**:

```json
// folder-history.json
[
  {
    "path": "C:\\Users\\User\\Documents\\notes",
    "timestamp": 1703123456789
  },
  {
    "path": "D:\\projects\\docs",
    "timestamp": 1703123400000
  }
]

// last-folder.json
{
  "path": "C:\\Users\\User\\Documents\\notes",
  "timestamp": 1703123456789
}
```

#### 特性

- **自动记录**: 每次打开文件夹时自动添加到历史
- **容量限制**: 最多保存20个历史记录
- **去重处理**: 相同路径不会重复记录，只更新时间戳
- **错误恢复**: 文件损坏时返回空历史记录
- **跨平台**: 使用 Electron 的标准用户数据目录
- **实时同步**: 操作后立即刷新UI显示

### 3. 中间 Markdown 渲染

#### 核心代码位置

- **渲染组件**: `src/renderer/src/components/MarkdownViewer.vue`
- **编辑组件**: `src/renderer/src/components/MarkdownEditor.vue`

#### 渲染原理

使用 Unified 生态系统的完整 Markdown 处理流水线：

```javascript
const parseMarkdown = async (markdown) => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(remarkGfm) // GitHub Flavored Markdown
    .use(remarkMath) // 数学公式支持
    .use(remarkRehype)
    .use(rehypeAddHeadingIds) // 为标题添加唯一ID
    .use(rehypeHighlight, {
      // 代码语法高亮
      detect: true,
      prefix: 'hljs-'
    })
    .use(rehypeKatex) // KaTeX 数学公式渲染
    .use(rehypeFixImagePaths) // 处理本地图片路径
    .use(rehypeAddLinkTargets) // 链接添加 target="_blank"
    .use(rehypeStringify)

  const result = await processor.process(content)
  return String(result)
}
```

**核心特性**:

- **Frontmatter 支持**: 解析 YAML/TOML 元数据，显示标题、作者、日期等
- **图片处理**: 自动解析相对路径，异步加载本地图片
- **代码高亮**: 使用 highlight.js，支持语言自动检测
- **数学公式**: 支持 KaTeX 渲染的 LaTeX 数学表达式
- **标题锚点**: 自动生成可跳转的标题ID
- **外部链接**: 自动添加 `target="_blank"`
- **文档内搜索**: 支持在当前文档中进行关键字搜索和跳转

**图片加载优化**:

- 使用 `data-local-image` 属性标记需要异步加载的图片
- 显示加载动画直到图片完全加载
- 支持相对路径解析和错误处理

#### 文档内搜索功能 (Ctrl+F)

在查看模式下支持在当前文档中进行实时搜索：

```javascript
const performSearch = () => {
  const query = searchQuery.value.trim()
  const regex = new RegExp(query, 'gi')
  const textNodes = []

  // 提取所有文本节点
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      textNodes.push(node)
    } else if (
      node.nodeType === Node.ELEMENT_NODE &&
      !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName)
    ) {
      node.childNodes.forEach(walk)
    }
  }
  walk(markdownBody)

  // 在文本节点中搜索匹配
  textNodes.forEach((textNode) => {
    const text = textNode.textContent
    let match
    while ((match = regex.exec(text)) !== null) {
      searchMatches.value.push({
        node: textNode,
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      })
    }
  })

  // 高亮显示匹配结果
  highlightMatches()
}
```

**搜索特性**:

- **实时搜索**: 输入时立即反馈结果
- **高亮显示**: 匹配文本以黄色背景突出显示
- **跳转导航**: 支持上一个/下一个匹配项跳转
- **位置指示**: 显示当前匹配位置和总数
- **键盘导航**: Enter键跳转到下一个，箭头键导航
- **Escape关闭**: 按ESC键关闭搜索界面

**用户体验优化**:

- 搜索框浮动显示，不占用文档空间
- 匹配项滚动到可视区域中央
- 当前匹配项特殊高亮（绿色背景）
- 搜索状态保持，切换文档后自动重新搜索

**快捷键支持**:

- `Ctrl+F` / `Cmd+F`: 打开文档内搜索（仅查看模式）
- `Enter`: 跳转到下一个匹配项
- `↑/↓`: 在匹配项间导航
- `Escape`: 关闭搜索界面

### 4. 文件搜索功能 (Ctrl+P)

#### 核心代码位置

- **搜索面板**: `src/renderer/src/components/SearchPanel.vue`
- **搜索管理器**: `src/main/searchManager.js` - FlexSearch 核心实现
- **索引管理**: Main进程的 FileSearchManager 类

#### 实现原理

基于 FlexSearch 引擎的高性能全文搜索系统，具有完整的索引缓存和增量更新机制：

**FlexSearch 配置**:

```javascript
this.flexsearchConfig = {
  tokenize: 'forward', // 前向分词
  resolution: 9, // 高分辨率索引
  minlength: 1 // 最小长度为1
}
```

**核心搜索流程**:

```javascript
// 1. 检查缓存索引是否存在
const cached = this.getCachedIndex(folderPath)

// 2. 如果启用自动更新，检测文件变化
if (autoUpdate) {
  const changes = await this.checkFolderChanges(folderPath, files)
  if (changes.modified.length > 0 || changes.added.length > 0 || changes.deleted.length > 0) {
    await this.updateIndexIncremental(folderPath, changes)
  }
}

// 3. 执行搜索
const searchResults = idx.search({
  query: query,
  limit: 1000,
  suggest: true
})

// 4. 处理结果并返回匹配行预览
const results = this.processSearchResults(searchResults, fileMap, query)
```

#### 索引机制

**索引构建时机**:

1. **首次搜索**: 当文件夹首次被搜索时自动构建完整索引
2. **应用启动**: 检查最近使用的文件夹，预构建索引以提升响应速度
3. **增量更新**: 检测文件修改时间(mtime)和大小(size)的变化，自动更新索引
4. **强制刷新**: 用户手动触发时重建完整索引

**索引数据结构**:

```javascript
// 缓存结构
this.indexCache.set(folderPath, {
  idx: FlexSearch.Index, // FlexSearch 索引实例
  fileMap: Map, // fileId -> {path, name, relativePath, lines, content}
  files: Array, // [{id, name, path, relativePath, content}, ...]
  timestamp: Date.now() // 最后更新时间
})

// 文件统计信息（持久化到磁盘）
this.fileStats.set(filePath, {
  mtime: stat.mtimeMs, // 修改时间
  size: stat.size // 文件大小
})
```

**索引持久化**:

- **文件统计信息**: 存储在 `os.tmpdir()/knowledgebase-search-cache/` 目录
- **索引缓存**: 仅在内存中，应用重启后重建
- **缓存键**: 使用文件夹路径的 MD5 哈希作为文件名

**增量更新算法**:

```javascript
async updateIndexIncremental(folderPath, changes) {
  // 处理删除的文件
  for (const deletedPath of changes.deleted) {
    const fileId = files.findIndex(f => f.path === deletedPath)
    if (fileId !== -1) {
      fileMap.delete(fileId)
      files.splice(fileId, 1)
      idx.remove(fileId)  // FlexSearch 删除操作
    }
  }

  // 处理新增/修改的文件
  for (const filePath of [...changes.modified, ...changes.added]) {
    const content = await fs.readFile(filePath, 'utf-8')
    // 更新文件映射和索引
    idx.update(fileId, `${fileName} ${content}`)
  }
}
```

**文件变化检测**:

```javascript
checkFolderChanges(folderPath, currentFiles) {
  const changes = { modified: [], added: [], deleted: new Set(/* 现有文件 */) }

  for (const file of currentFiles) {
    const stat = await fs.stat(file.path)
    const newStats = { mtime: stat.mtimeMs, size: stat.size }

    if (this.isFileModified(file.path, newStats)) {
      changes.modified.push(file.path)
    }
  }
  // ... 检测新增和删除的文件
}
```

#### 搜索特性

**实时搜索**:

- 输入时自动触发，300ms 防抖优化
- 支持模糊搜索和建议匹配
- 限制返回结果数量 (limit: 1000)

**结果处理**:

- **上下文预览**: 为每个匹配行提供 40 个字符的上下文
- **行号定位**: 显示匹配行在文件中的具体位置
- **匹配计数**: 统计每个文件的总匹配数量
- **结果限制**: 每个文件最多显示 5 个匹配行

**性能优化**:

```javascript
// 上下文预览算法
getContextPreview(line, query) {
  const index = line.toLowerCase().indexOf(query.toLowerCase())
  const start = Math.max(0, index - 40)
  const end = Math.min(line.length, index + query.length + 40)
  let preview = line.substring(start, end).trim()

  if (start > 0) preview = '...' + preview
  if (end < line.length) preview = preview + '...'

  return preview
}
```

**用户体验优化**:

- **索引状态可视化**: 显示缓存的文件夹数量和文件统计
- **构建进度提示**: 首次构建时显示进度状态
- **智能缓存**: 避免重复构建相同的索引
- **错误处理**: 完善的错误处理和用户反馈

#### 缓存管理

**内存缓存策略**:

- 使用 Map 结构存储索引和文件映射
- 应用重启时自动清理内存缓存
- 支持按文件夹清除特定缓存

**磁盘持久化**:

- 文件统计信息持久化到临时目录
- 避免索引数据过大，只持久化元信息
- 使用 MD5 哈希作为缓存文件名

**缓存清理**:

- 切换文件夹时清理旧索引缓存
- 支持手动刷新重建索引
- 定期清理过期缓存文件

### 5. 主题切换功能

#### 核心代码位置

- **主题配置**: `src/renderer/src/themes/themeConfig.js`
- **状态管理**: `src/renderer/src/stores/uiState.js`
- **扩展指南**: `src/renderer/src/themes/THEME_EXAMPLE.js`

#### 实现原理

基于 CSS Variables 的多主题系统，支持动态主题切换：

**主题数据结构**:

```javascript
export const themes = {
  dark: {
    name: '深色',
    id: 'dark',
    colors: {
      'bg-primary': '#1e1e1e', // 主背景色
      'bg-secondary': '#252525', // 次级背景色
      'bg-tertiary': '#2d2d2d', // 第三级背景色
      'text-primary': '#e8e8e8', // 主文本色
      'text-secondary': '#a0a0a0', // 次级文本色
      'text-tertiary': '#707070', // 第三级文本色
      'border-color': '#3e3e3e', // 边框色
      'accent-color': '#4a9eff', // 强调色
      'accent-hover': '#66b1ff' // 强调色悬停
      // ... 更多颜色变量
    }
  }
  // 其他主题配置...
}
```

**主题应用机制**:

```javascript
export const applyTheme = (themeId) => {
  const theme = getThemeConfig(themeId)
  const root = document.documentElement

  // 1. 移除所有主题类
  Object.keys(themes).forEach((id) => {
    root.classList.remove(`${id}-theme`)
  })

  // 2. 添加新主题类（暗色主题不需要额外类）
  if (themeId !== 'dark') {
    root.classList.add(`${themeId}-theme`)
  }

  // 3. 应用 CSS 变量到 :root
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
}
```

**主题持久化策略**:

```javascript
export const initTheme = () => {
  const saved = localStorage.getItem('theme-mode')
  if (saved) {
    themeMode.value = saved
  } else {
    // 首次使用检测系统偏好
    themeMode.value = getSystemTheme()
    localStorage.setItem('theme-mode', themeMode.value)
  }

  // 应用到 DOM
  applyTheme(themeMode.value)
}

export const setThemeMode = (mode) => {
  themeMode.value = mode
  localStorage.setItem('theme-mode', mode)
  applyTheme(mode)
}
```

**系统主题检测**:

```javascript
const getSystemTheme = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}
```

#### 支持的主题

- **Dark (深色)** - 默认主题，适合长时间编辑
- **Light (浅色)** - 高对比度，适合明亮环境
- **Blue (蓝色)** - 专业和平静的视觉效果
- **Green (绿色)** - 清爽自然的配色方案
- **Purple (紫色)** - 创意和活力的色彩搭配

#### 主题扩展机制

**添加新主题的步骤**:

1. 在 `themeConfig.js` 中添加主题配置对象
2. 定义完整的颜色变量集合（23个必需变量）
3. 在 `main.css` 中添加对应的 CSS 规则
4. 重启应用验证新主题

**颜色变量体系**:

- **背景层级**: `bg-primary` → `bg-secondary` → `bg-tertiary`
- **文本层级**: `text-primary` → `text-secondary` → `text-tertiary`
- **交互状态**: `hover-bg`, `selected-bg`, `accent-hover`
- **组件专用**: `sidebar-bg`, `code-bg`, `menubar-*`

**配色设计原则**:

- 确保主文本与背景的对比度 ≥ 4.5:1 (WCAG AA)
- 强调色应在不同背景下都有良好可读性
- 悬停和选中状态应有明显的视觉反馈

### 6. 分享功能

#### 核心代码位置

- **分享逻辑**: `src/renderer/src/components/MarkdownViewer.vue`
- **服务器实现**: `src/main/index.js` - HTTP 服务器和图片处理
- **模板生成**: `src/main/shareTemplate.js` - HTML 模板和样式

#### 实现原理

基于本地 HTTP 服务器的文档分享系统，支持完整的样式和图片资源：

**分享流程架构**:

```javascript
// 1. 创建分享链接
const createShareLink = async () => {
  // 获取渲染后的 HTML 内容
  const htmlContent = await parseMarkdown(markdownContent)
  const title = frontmatter.value?.title || 'Markdown 文档'

  // 调用主进程创建服务器
  const result = await window.api.createShareLink({
    htmlContent: htmlContent,
    title,
    themeId: themeMode.value
  })

  if (result.success) {
    shareUrl.value = result.url
    // 自动复制到剪贴板
    await navigator.clipboard.writeText(shareUrl.value)
  }
}

// 2. 主进程创建服务器
const createShareServer = async ({ htmlContent, title, themeId = 'dark' }) => {
  // 处理本地图片（转换为 data URL）
  const processedHtml = await inlineLocalImages(htmlContent)

  // 生成完整 HTML（包含样式和脚本）
  const fullHtml = buildShareHtml({ htmlContent: processedHtml, title, themeId })

  // 启动 HTTP 服务器
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(fullHtml)
    })

    // 监听随机端口
    server.listen(0, () => {
      const port = server.address().port
      const ip = getLocalIP() // 获取局域网 IP
      const url = `http://${ip}:${port}`
      resolve({ url, port })
    })
  })
}
```

#### 图片处理机制

**本地图片内联**:

```javascript
const inlineLocalImages = async (htmlContent) => {
  // 查找所有 data-local-image 属性
  const imgRegex = /<img\b[^>]*data-local-image=["']([^"']+)["'][^>]*>/gi

  for (const match of Array.from(processed.matchAll(imgRegex))) {
    const imagePath = match[1]

    try {
      // 读取图片文件并转换为 base64
      const buffer = await fs.readFile(imagePath)
      const ext = path.extname(imagePath).toLowerCase()
      const mimeType = imageMimeTypes[ext] || 'image/jpeg'
      const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`

      // 替换 HTML 中的图片标签
      let newTag = originalTag
        .replace(/data-local-image=["'][^"']*["']\s*/i, '') // 移除标记属性
        .replace('<img', `<img src="${dataUrl}"`) // 添加 data URL

      processed = processed.replace(originalTag, newTag)
    } catch (error) {
      console.warn('[share] Failed to inline image:', imagePath)
    }
  }

  return processed
}
```

#### HTML 模板生成

**模板结构**:

```javascript
const buildShareHtml = ({ htmlContent, title, themeId }) => {
  // 1. 获取主题配置并生成 CSS 变量
  const { css: themeCss, themeClass } = buildThemeVariables(themeId)

  // 2. 加载必要的样式文件
  const highlightCss = loadPackageCss('highlight.js/styles/atom-one-dark.css')
  const katexCss = loadPackageCss('katex/dist/katex.min.css')

  // 3. 生成完整 HTML
  return `
    <!DOCTYPE html>
    <html lang="zh-CN" class="${themeClass}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        ${themeCss}
        ${markdownCss}
        ${highlightCss}
        ${katexCss}
      </style>
    </head>
    <body>
      <div class="share-container">
        <article class="markdown-body">
          ${htmlContent}
        </article>
      </div>
    </body>
    </html>
  `
}
```

#### 服务器管理

**连接跟踪和清理**:

```javascript
// 跟踪所有 socket 连接
server.on('connection', (socket) => {
  activeConnections.add(socket)
  socket.on('close', () => {
    activeConnections.delete(socket)
  })
})

// 停止分享时的清理
const stopShareServer = () => {
  if (shareServer) {
    // 强制关闭所有活动连接
    activeConnections.forEach((connection) => {
      try {
        connection.destroy()
      } catch (e) {
        // 忽略错误
      }
    })
    activeConnections.clear()

    // 关闭服务器
    shareServer.close()
    shareServer = null
  }
}
```

#### 网络访问

**局域网 IP 检测**:

```javascript
const getLocalIP = () => {
  const interfaces = networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过内部地址和非 IPv4 地址
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}
```

#### 特性

- **完整样式保持**: 包含原始应用的完整主题和样式
- **图片资源内联**: 本地图片转换为 data URL，无需额外请求
- **数学公式支持**: KaTeX 渲染保持一致
- **代码高亮**: highlight.js 样式完整保留
- **局域网访问**: 自动检测并使用局域网 IP
- **自动剪贴板**: 分享链接自动复制到剪贴板
- **资源清理**: 停止分享时正确清理所有连接和资源
- **错误处理**: 完善的图片加载失败处理

### 7. 右侧大纲功能

#### 核心代码位置

- **大纲组件**: `src/renderer/src/components/Outline.vue`
- **状态管理**: `src/renderer/src/stores/uiState.js`
- **标题锚点**: `src/renderer/src/components/MarkdownViewer.vue` (rehypeAddHeadingIds)

#### 实现原理

基于 DOM 解析和动态更新的文档大纲生成系统：

**标题提取算法**:

```javascript
const extractHeadings = (htmlContent) => {
  if (!htmlContent) {
    headings.value = []
    return
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html')
  const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')

  const extractedHeadings = []

  headingElements.forEach((element, index) => {
    const level = parseInt(element.tagName[1]) // h1 -> 1, h2 -> 2, etc.
    const text = element.textContent.trim()

    // 确保每个标题都有唯一ID（用于跳转）
    let id = element.id
    if (!id) {
      id = `heading-${index}-${level}`
      element.id = id // 修改原始DOM元素
    }

    if (text) {
      extractedHeadings.push({
        id,
        text,
        level
      })
    }
  })

  headings.value = extractedHeadings
}
```

**标题ID生成策略** (在 Markdown 渲染时):

```javascript
const rehypeAddHeadingIds = () => {
  return (tree) => {
    const slugCounts = new Map()

    const slugify = (text) => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '') // 保留中英文、数字与空格/连字符
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
    }

    const ensureUniqueSlug = (base) => {
      const count = slugCounts.get(base) || 0
      slugCounts.set(base, count + 1)
      return count === 0 ? base : `${base}-${count}`
    }

    const extractText = (node) => {
      if (!node) return ''
      if (node.type === 'text') return node.value || ''
      if (node.children) {
        return node.children.map((child) => extractText(child)).join(' ')
      }
      return ''
    }

    const visit = (node) => {
      if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) {
        const textContent = extractText(node).trim()

        if (textContent) {
          const baseSlug = slugify(textContent)
          const finalSlug = baseSlug ? ensureUniqueSlug(baseSlug) : ensureUniqueSlug('heading')

          if (!node.properties) node.properties = {}
          // 尊重用户已定义的ID
          if (!node.properties.id) {
            node.properties.id = finalSlug
          }
        }
      }

      if (node.children) {
        node.children.forEach(visit)
      }
    }

    visit(tree)
  }
}
```

#### 跳转和滚动实现

**平滑滚动算法**:

```javascript
const scrollToHeading = (headingId) => {
  const container = document.querySelector('.markdown-viewer')
  const selector = `#${CSS.escape(headingId)}`
  const element = container?.querySelector(selector) || document.querySelector(selector)

  if (!element) return

  // 优先在 markdown 容器内滚动，避免整体页面滚动
  if (container) {
    const containerRect = container.getBoundingClientRect()
    const targetRect = element.getBoundingClientRect()
    const offsetTop = targetRect.top - containerRect.top + container.scrollTop
    const topWithPadding = Math.max(offsetTop - 12, 0) // 留一点顶部间距

    container.scrollTo({
      top: topWithPadding,
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    })
  } else {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    })
  }

  // 临时高亮显示
  element.classList.add('outline-highlight')
  setTimeout(() => {
    element.classList.remove('outline-highlight')
  }, 2000)
}
```

#### 状态管理和折叠

**折叠状态持久化**:

```javascript
// 在 uiState.js 中
const outlineCollapsed = ref(false)

export const toggleOutlineCollapsed = () => {
  outlineCollapsed.value = !outlineCollapsed.value
  localStorage.setItem('outline-collapsed', JSON.stringify(outlineCollapsed.value))
}

export const getOutlineCollapsed = () => {
  return outlineCollapsed
}

export const setOutlineCollapsed = (collapsed) => {
  outlineCollapsed.value = collapsed
  localStorage.setItem('outline-collapsed', JSON.stringify(collapsed))
}
```

#### 大纲特性

**层级化显示**:

- **h1**: 最大字体，无额外缩进，主要标题
- **h2**: 次级标题，28px 左边距
- **h3**: 第三级标题，40px 左边距
- **h4-h6**: 递进缩进，较小字体

**交互特性**:

- **悬停效果**: 背景色变化和边框高亮
- **点击跳转**: 平滑滚动到对应标题位置
- **视觉反馈**: 临时高亮和边框动画
- **折叠控制**: 可折叠/展开整个大纲面板

**性能优化**:

- **延迟提取**: HTML 更新后延迟 100ms 提取标题，避免频繁更新
- **DOM 复用**: 直接修改已有元素的 ID，避免重新渲染
- **内存管理**: 监听组件卸载时清理事件监听

**可访问性**:

- **键盘导航**: 支持键盘操作
- **语义化**: 使用适当的标题层级
- **视觉指示**: 清晰的层级和悬停状态

**状态持久化**:

- 折叠状态通过 localStorage 保存
- 支持切换显示/隐藏

### 8. 其他关键功能

#### 编辑功能

##### 核心代码位置

- **编辑器组件**: `src/renderer/src/components/MarkdownEditor.vue`
- **状态管理**: `src/renderer/src/components/MarkdownViewer.vue`
- **文件操作**: Main进程 IPC 接口

##### Monaco Editor 集成

```javascript
// 动态导入 Monaco Editor
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker.js?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker.js?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker.js?worker'

// 创建编辑器实例
const createEditor = () => {
  editorInstance = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    readOnly: props.readOnly,
    fontSize: 14,
    lineHeight: 1.5,
    wordWrap: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true
  })

  // 监听内容变化
  editorInstance.onDidChangeModelContent(() => {
    const value = editorInstance.getValue()
    emit('update:modelValue', value)
  })
}
```

##### 模式切换机制

```javascript
// MarkdownViewer.vue 中的模式管理
const isEditing = ref(false)

const enterEditMode = async () => {
  if (!props.filePath || loading.value) return

  if (!rawContent.value) {
    await loadFile()
  }

  editorContent.value = rawContent.value
  isEditing.value = true
}

const exitEditMode = () => {
  isEditing.value = false
  editorContent.value = rawContent.value
}

// 监听外部编辑状态变化
watch(
  () => props.editing,
  (val) => {
    if (val) {
      enterEditMode()
    } else {
      exitEditMode()
    }
  }
)
```

##### 保存机制

```javascript
const saveFile = async (content) => {
  if (!props.filePath) return

  saving.value = true
  try {
    const payload = {
      filePath: props.filePath,
      rootDir: props.rootFolder,
      content: content ?? editorContent.value
    }

    const result = await window.api.saveFile(payload)

    if (!result?.success) {
      throw new Error(result?.error || '保存失败')
    }

    // 更新本地状态
    rawContent.value = payload.content
    editorContent.value = payload.content

    // 重新渲染预览
    htmlContent.value = await parseMarkdown(payload.content)
    emit('html-updated', htmlContent.value)

    await showAlert({
      title: '保存成功',
      message: '文件已保存',
      type: 'success'
    })
  } catch (err) {
    await showAlert({
      title: '保存失败',
      message: err.message || '未知错误',
      type: 'error'
    })
  } finally {
    saving.value = false
  }
}
```

##### 文件冲突检测

```javascript
const handleFileChanged = async () => {
  if (isEditing.value && hasUnsavedChanges.value) {
    await showAlert({
      title: '文件已被修改',
      message: '检测到文件在外部发生变更，请先保存或退出编辑后再刷新。',
      type: 'warning'
    })
    return
  }

  if (props.filePath) {
    await loadFile()
  }
}

// 监听文件变更事件
window.api.onFileChanged(handleFileChanged)
```

##### 主题适配

```javascript
// 根据应用主题动态切换 Monaco 主题
const monacoTheme = computed(() => (themeMode.value === 'light' ? 'vs' : 'vs-dark'))

// 监听主题变化
watch(monacoTheme, (newTheme) => {
  if (editorInstance) {
    monaco.editor.setTheme(newTheme)
  }
})
```

##### 特性

- **语法高亮**: Markdown 语法高亮和错误提示
- **自动补全**: 基础的 Markdown 语法补全
- **撤销/重做**: 完整的编辑历史管理
- **查找替换**: Ctrl+F 在编辑模式下打开 Monaco 查找
- **格式化**: 基础的代码格式化支持
- **性能优化**: 按需加载 Monaco，避免初始包体积过大

#### 菜单系统

- **菜单栏**: 自定义 Electron 菜单
- **快捷键**: 全功能键盘快捷键支持
- **命令处理**: 通过 IPC 桥接主进程和渲染进程

#### 文件监视

- **实时更新**: 使用 chokidar 监视文件变更
- **自动刷新**: 文件修改时自动重新渲染
- **冲突检测**: 编辑时检测外部修改

#### 代码复制功能

- **自动添加**: 为所有代码块添加复制按钮
- **状态反馈**: 复制成功/失败的视觉反馈
- **回退方案**: 支持传统复制方法

#### 消息提示系统

##### 核心代码位置

- **UI 组件**: `src/renderer/src/components/AlertModal.vue`
- **状态管理**: `src/renderer/src/stores/alertService.js`
- **使用示例**: 贯穿整个应用的各个功能模块

##### 队列化消息管理

```javascript
// alertService.js - 核心状态管理
import { reactive } from 'vue'

const state = reactive({
  visible: false,
  title: '提示',
  message: '',
  type: 'info',
  resolve: null
})

const queue = [] // 消息队列

// 显示下一个消息
const showNext = () => {
  if (state.visible || queue.length === 0) return

  const next = queue.shift()
  state.title = next.title
  state.message = next.message
  state.type = next.type
  state.resolve = next.resolve
  state.visible = true
}

// 显示消息的Promise API
export const showAlert = (options) => {
  const payload = typeof options === 'string' ? { message: options } : options || {}
  const entry = {
    title: payload.title || '提示',
    message: payload.message || '',
    type: payload.type || 'info',
    resolve: null
  }

  return new Promise((resolve) => {
    entry.resolve = resolve
    queue.push(entry)
    showNext()
  })
}

// 确认消息
export const confirmAlert = () => {
  if (state.resolve) {
    state.resolve()
  }
  state.visible = false
  state.resolve = null

  // 显示队列中的下一个消息
  setTimeout(() => {
    showNext()
  }, 0)
}
```

##### UI 组件实现

```javascript
// AlertModal.vue - 响应式消息显示
<template>
  <transition name="alert-fade">
    <div v-if="visible" class="alert-overlay" @click="handleOverlayClick">
      <div class="alert-dialog" :class="`alert-${type}`" role="alertdialog" aria-modal="true">
        <header class="alert-header">
          <div class="alert-title">
            <span class="alert-dot" :class="`alert-dot-${type}`"></span>
            <span>{{ title }}</span>
          </div>
          <button class="alert-close" @click="confirmAlert">×</button>
        </header>

        <div class="alert-body">
          <p v-if="isSingleLine" class="alert-message">{{ message }}</p>
          <pre v-else class="alert-message multiline">{{ message }}</pre>
        </div>

        <footer class="alert-actions">
          <button class="alert-button" @click="confirmAlert">知道了</button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { alertState, confirmAlert } from '../stores/alertService'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '提示' },
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }
})

// 计算是否为单行消息
const isSingleLine = computed(() => {
  return !message.includes('\n') && message.length < 100
})

// 遮罩点击处理
const handleOverlayClick = (event) => {
  if (event.target === event.currentTarget) {
    confirmAlert()
  }
}
</script>
```

##### 消息类型和样式

```css
/* AlertModal.vue 中的样式 */
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.alert-dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  min-width: 320px;
  max-width: 500px;
  animation: alertSlideIn 0.2s ease-out;
}

.alert-info {
  border-left: 4px solid #2196f3;
}
.alert-success {
  border-left: 4px solid #4caf50;
}
.alert-warning {
  border-left: 4px solid #ff9800;
}
.alert-error {
  border-left: 4px solid #f44336;
}

.alert-dot-info {
  background: #2196f3;
}
.alert-dot-success {
  background: #4caf50;
}
.alert-dot-warning {
  background: #ff9800;
}
.alert-dot-error {
  background: #f44336;
}
```

##### 使用示例

```javascript
// 成功消息
await showAlert({
  title: '保存成功',
  message: '文件已保存到磁盘',
  type: 'success'
})

// 错误消息
await showAlert({
  title: '保存失败',
  message: '磁盘空间不足，请清理后重试',
  type: 'error'
})

// 警告消息
await showAlert({
  title: '文件被修改',
  message: '检测到文件在外部发生变更，建议重新加载',
  type: 'warning'
})

// 普通提示
await showAlert({
  title: '功能说明',
  message: '这是关于如何使用该功能的具体说明...',
  type: 'info'
})
```

##### 特性

- **类型化显示**: 四种消息类型 (info/成功/warning/错误) 对应不同颜色和图标
- **队列处理**: 支持多个消息排队显示，避免同时显示多个弹窗
- **Promise 支持**: 基于 Promise 的异步 API，便于流程控制
- **自动换行**: 长消息自动换行，多行消息使用 `<pre>` 标签保持格式
- **无障碍支持**: ARIA 属性和键盘导航支持
- **动画效果**: 淡入淡出和滑动动画
- **遮罩交互**: 点击遮罩区域可以关闭消息
- **响应式设计**: 适配不同屏幕尺寸

## 架构特点

### 主进程 (Main Process)

#### 核心职责

- **文件系统操作**: 递归文件遍历、文件读取/写入、权限检查
- **窗口管理**: 无边框窗口、标题栏自定义、系统托盘集成
- **IPC 通信**: 安全的双向通信桥接，事件监听和响应
- **搜索索引构建**: FlexSearch 引擎管理、索引缓存和更新
- **本地服务器**: HTTP 服务器创建、资源服务、连接管理

#### 技术实现

```javascript
// 主进程窗口配置
const mainWindow = new BrowserWindow({
  width: 1400,
  height: 900,
  frame: false, // 无边框设计
  titleBarStyle: 'hidden', // 隐藏原生标题栏
  webPreferences: {
    preload: join(__dirname, '../preload/index.js'),
    contextIsolation: true, // 安全沙箱
    nodeIntegration: false, // 禁用 Node 集成
    enableRemoteModule: false // 禁用远程模块
  }
})
```

#### 进程通信模式

```javascript
// IPC 处理器的注册模式
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return { success: true, content }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 事件监听模式
ipcMain.on('menu-open-folder', (event) => {
  // 处理菜单事件
})
```

### 渲染进程 (Renderer Process)

#### Vue 3 架构

```javascript
// 组合式 API 的状态管理
import { ref, computed, watch, onMounted } from 'vue'

export default {
  setup() {
    const fileTree = ref(null)
    const selectedFilePath = ref(null)

    const selectedFile = computed(() => {
      // 计算属性：根据路径查找文件对象
      return findFileByPath(fileTree.value, selectedFilePath.value)
    })

    // 响应式数据监听
    watch(selectedFilePath, async (newPath) => {
      if (newPath) {
        await loadFileContent(newPath)
      }
    })

    return {
      fileTree,
      selectedFilePath,
      selectedFile
    }
  }
}
```

#### Markdown 渲染流水线

```javascript
// Unified 生态的插件组合
const processor = unified()
  .use(remarkParse) // 解析 Markdown
  .use(remarkGfm) // GitHub 风格扩展
  .use(remarkMath) // 数学公式支持
  .use(remarkFrontmatter) // 前置元数据
  .use(remarkRehype) // 转换为 HTML
  .use(rehypeAddHeadingIds) // 添加标题锚点
  .use(rehypeHighlight) // 代码语法高亮
  .use(rehypeKatex) // 数学公式渲染
  .use(rehypeStringify) // 输出 HTML 字符串
```

#### 状态管理策略

**UI 状态层**:

```javascript
// stores/uiState.js - 全局 UI 状态
const themeMode = ref('dark')
const outlineCollapsed = ref(false)
const treeExpansionState = ref({}) // 目录树展开状态

// 持久化到 localStorage
export const initializeUIState = () => {
  const savedTheme = localStorage.getItem('theme-mode')
  if (savedTheme) themeMode.value = savedTheme

  const savedOutline = localStorage.getItem('outline-collapsed')
  if (savedOutline) outlineCollapsed.value = JSON.parse(savedOutline)

  const savedTree = localStorage.getItem('tree-expansion-state')
  if (savedTree) treeExpansionState.value = JSON.parse(savedTree)
}
```

**组件状态层**:

```javascript
// 组件内的局部状态
const isEditing = ref(false)
const searchQuery = ref('')
const loading = ref(false)

// 使用 provide/inject 在组件树中传递
provide('outlineCollapsed', outlineCollapsed)
const injectedCollapsed = inject('outlineCollapsed')
```

**跨进程通信**:

```javascript
// Preload 脚本提供的安全 API
const api = {
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  getFileTree: (dirPath) => ipcRenderer.invoke('get-file-tree', dirPath),
  searchFiles: (params) => ipcRenderer.invoke('search-files', params),

  // 事件监听
  onFileChanged: (callback) => ipcRenderer.on('file-changed', callback),
  onMenuOpenFolder: (callback) => ipcRenderer.on('menu-open-folder', callback)
}

contextBridge.exposeInMainWorld('api', api)
```

### 性能优化策略

#### 索引缓存系统

```javascript
// FlexSearch 索引缓存
this.indexCache = new Map() // folderPath -> { idx, fileMap, files, timestamp }

// 缓存命中检查
const cached = this.getCachedIndex(folderPath)
if (cached) {
  // 检查是否需要增量更新
  const changes = await this.checkFolderChanges(folderPath, currentFiles)
  if (changes.modified.length > 0 || changes.added.length > 0) {
    await this.updateIndexIncremental(folderPath, changes)
  }
}
```

#### 懒加载和虚拟化

```javascript
// 图片懒加载
const loadLocalImages = async () => {
  const images = document.querySelectorAll('img[data-local-image]')

  for (const img of images) {
    const imagePath = img.getAttribute('data-local-image')
    try {
      const result = await window.api.readImage(imagePath)
      img.src = result.dataUrl
      img.removeAttribute('data-local-image')
    } catch (error) {
      console.error('Failed to load image:', imagePath)
    }
  }
}
```

#### 防抖和节流

```javascript
// 搜索输入防抖
let searchTimeout = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300) // 300ms 防抖
})
```

### 扩展性设计

#### 插件系统架构

**Unified 生态扩展**:

```javascript
// 添加自定义 Markdown 插件
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(customRemarkPlugin, options) // 自定义插件
  .use(remarkRehype)
  .use(customRehypePlugin) // HTML 处理插件
  .use(rehypeStringify)
```

**主题扩展系统**:

```javascript
// 动态添加新主题
export const addTheme = (themeName, themeConfig) => {
  themes[themeName] = {
    name: themeConfig.name,
    id: themeName,
    colors: {
      ...defaultColors,
      ...themeConfig.colors
    }
  }
}
```

#### IPC 接口模块化

```javascript
// 功能模块化的 IPC 接口设计
const fileOperations = {
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),
  getFileTree: (dirPath) => ipcRenderer.invoke('file:tree', dirPath)
}

const searchOperations = {
  searchFiles: (params) => ipcRenderer.invoke('search:files', params),
  buildIndex: (folderPath) => ipcRenderer.invoke('search:build-index', folderPath),
  refreshIndex: (folderPath) => ipcRenderer.invoke('search:refresh-index', folderPath)
}

const shareOperations = {
  createShare: (params) => ipcRenderer.invoke('share:create', params),
  stopShare: () => ipcRenderer.invoke('share:stop')
}
```

#### 配置化系统

```javascript
// 配置文件结构
const appConfig = {
  ui: {
    theme: 'dark',
    fontSize: 14,
    sidebarWidth: 300
  },
  editor: {
    tabSize: 2,
    wordWrap: true,
    minimap: false
  },
  search: {
    indexCacheSize: 50,
    searchTimeout: 300
  },
  shortcuts: {
    'open-folder': 'Ctrl+O',
    'open-search': 'Ctrl+P',
    'toggle-edit': 'Ctrl+E'
  }
}

// 运行时配置加载
import config from './config.json'
export const getConfig = (path) => _.get(config, path)
```

#### 热重载和开发体验

```javascript
// Vite 热重载配置
export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'src/main/index.js',
        vite: {
          build: {
            outDir: 'dist-electron/main'
          },
          plugins: [externalizeDeps()]
        }
      }
    ])
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
```

这个项目展现了现代桌面应用开发的优秀实践，结合了前端工程化、用户体验设计和系统级功能实现的全面能力。
