import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import FlexSearch from 'flexsearch'
import os from 'os'

/**
 * 文件搜索管理器
 * 使用 flexsearch 实现高效的全文搜索，支持索引缓存和文件统计信息持久化
 */
export class FileSearchManager {
  constructor() {
    this.flexsearchConfig = {
      tokenize: 'forward', // 前向分词
      resolution: 9, // 高分辨率
      minlength: 1 // 最小长度
    }

    // 索引缓存
    this.indexCache = new Map() // folderPath -> { idx, fileMap, files, timestamp }
    this.fileWatchers = new Map() // folderPath -> watcher
    this.fileStats = new Map() // filePath -> { mtime, size }
    this.updateQueue = new Map() // 更新队列
    this.updateTimeout = null

    // 文件统计信息持久化目录
    this.cacheDir = path.join(os.tmpdir(), 'knowledgebase-search-cache')
    this.ensureCacheDir()
  }

  /**
   * 确保缓存目录存在
   */
  ensureCacheDir() {
    if (!fsSync.existsSync(this.cacheDir)) {
      fsSync.mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  /**
   * 获取文件统计信息的存储路径
   * @param {string} folderPath - 文件夹路径
   * @returns {string}
   */
  getFileStatsPath(folderPath) {
    // 使用文件夹路径的 hash 作为文件名
    const hash = require('crypto').createHash('md5').update(folderPath).digest('hex')
    return path.join(this.cacheDir, `stats-${hash}.json`)
  }

  /**
   * 保存文件统计信息到磁盘
   * @param {string} folderPath - 文件夹路径
   * @returns {Promise<void>}
   */
  async saveFileStats(folderPath) {
    try {
      const statsPath = this.getFileStatsPath(folderPath)
      const statsToSave = {}

      // 只保存属于该文件夹的统计信息
      for (const [filePath, stats] of this.fileStats) {
        if (filePath.startsWith(folderPath)) {
          statsToSave[filePath] = stats
        }
      }

      await fs.writeFile(statsPath, JSON.stringify(statsToSave, null, 2), 'utf-8')
      console.log(`File stats saved for ${folderPath}`)
    } catch (error) {
      console.error(`Error saving file stats for ${folderPath}:`, error)
    }
  }

  /**
   * 从磁盘加载文件统计信息
   * @param {string} folderPath - 文件夹路径
   * @returns {Promise<void>}
   */
  async loadFileStats(folderPath) {
    try {
      const statsPath = this.getFileStatsPath(folderPath)

      if (fsSync.existsSync(statsPath)) {
        const content = await fs.readFile(statsPath, 'utf-8')
        const savedStats = JSON.parse(content)

        // 加载到内存中
        for (const [filePath, stats] of Object.entries(savedStats)) {
          this.fileStats.set(filePath, stats)
        }

        console.log(`File stats loaded for ${folderPath}`)
      }
    } catch (error) {
      console.error(`Error loading file stats for ${folderPath}:`, error)
    }
  }

  /**
   * 检查文件是否被修改
   * @param {string} filePath - 文件路径
   * @param {Object} newStats - 新的文件统计信息
   * @returns {boolean} 文件是否被修改
   */
  isFileModified(filePath, newStats) {
    const oldStats = this.fileStats.get(filePath)
    if (!oldStats) return true // 新文件

    return oldStats.mtime !== newStats.mtime || oldStats.size !== newStats.size
  }

  /**
   * 检查文件夹中是否有文件被修改
   * @param {string} folderPath - 文件夹路径
   * @param {Array} currentFiles - 当前文件列表
   * @returns {Promise<{modified: Array, added: Array, deleted: Array}>}
   */
  async checkFolderChanges(folderPath, currentFiles) {
    const modified = []
    const added = []
    const deleted = new Set(
      Array.from(this.fileStats.keys()).filter((p) => p.startsWith(folderPath))
    )

    for (const file of currentFiles) {
      deleted.delete(file.path)

      try {
        const stat = await fs.stat(file.path)
        const newStats = { mtime: stat.mtimeMs, size: stat.size }

        if (this.isFileModified(file.path, newStats)) {
          modified.push(file.path)
          this.fileStats.set(file.path, newStats)
        }
      } catch (error) {
        console.error(`Error checking file ${file.path}:`, error)
      }
    }

    // 添加新文件
    for (const file of currentFiles) {
      if (!this.fileStats.has(file.path)) {
        added.push(file.path)
        try {
          const stat = await fs.stat(file.path)
          this.fileStats.set(file.path, { mtime: stat.mtimeMs, size: stat.size })
        } catch (error) {
          console.error(`Error reading file stats ${file.path}:`, error)
        }
      }
    }

    return {
      modified,
      added: added,
      deleted: Array.from(deleted)
    }
  }

  /**
   * 增量更新索引
   * @param {string} folderPath - 文件夹路径
   * @param {Object} changes - 文件变化信息 { modified, added, deleted }
   * @returns {Promise<void>}
   */
  async updateIndexIncremental(folderPath, changes) {
    const cached = this.indexCache.get(folderPath)
    if (!cached) return // 缓存不存在，跳过增量更新

    const { idx, fileMap, files } = cached

    console.log(
      `Incremental update for ${folderPath}: +${changes.added.length} ~${changes.modified.length} -${changes.deleted.length}`
    )

    // 处理删除的文件
    for (const deletedPath of changes.deleted) {
      const fileId = files.findIndex((f) => f.path === deletedPath)
      if (fileId !== -1) {
        fileMap.delete(fileId)
        files.splice(fileId, 1)
        // 注意：flexsearch 删除操作
        idx.remove(fileId)
        this.fileStats.delete(deletedPath)
      }
    }

    // 处理修改和新增的文件
    for (const filePath of [...changes.modified, ...changes.added]) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const relativePath = path.relative(folderPath, filePath)
        const fileName = path.basename(filePath)

        let fileId = files.findIndex((f) => f.path === filePath)

        if (fileId === -1) {
          // 新增文件
          fileId = files.length
          files.push({
            id: fileId,
            name: fileName,
            path: filePath,
            relativePath: relativePath,
            content: content
          })
        } else {
          // 更新现有文件
          files[fileId].content = content
        }

        // 更新文件映射
        fileMap.set(fileId, {
          path: filePath,
          name: fileName,
          relativePath: relativePath,
          lines: content.split('\n'),
          content: content
        })

        // 更新索引
        idx.update(fileId, `${fileName} ${content}`)

        // 更新文件统计信息
        const stat = await fs.stat(filePath)
        this.fileStats.set(filePath, { mtime: stat.mtimeMs, size: stat.size })
      } catch (error) {
        console.error(`Error updating file in index ${filePath}:`, error)
      }
    }

    // 更新缓存时间戳
    cached.timestamp = Date.now()

    // 保存更新后的文件统计信息到磁盘
    await this.saveFileStats(folderPath)

    console.log(`Incremental update completed for ${folderPath}`)
  }

  /**
   * 检查索引是否需要更新
   * @param {string} folderPath - 文件夹路径
   * @returns {Promise<boolean>}
   */
  async needsIndexUpdate(folderPath) {
    const cached = this.indexCache.get(folderPath)
    if (!cached) return false // 没有缓存，不需要更新

    const files = []
    const fileMap = new Map()

    try {
      await this.collectMarkdownFiles(folderPath, folderPath, files, fileMap)

      const changes = await this.checkFolderChanges(folderPath, files)

      return changes.modified.length > 0 || changes.added.length > 0 || changes.deleted.length > 0
    } catch (error) {
      console.error(`Error checking index updates for ${folderPath}:`, error)
      return false
    }
  }

  /**
   * 刷新索引（强制重建）
   * @param {string} folderPath - 文件夹路径
   * @returns {Promise<void>}
   */
  async refreshIndex(folderPath) {
    console.log(`Refreshing index for: ${folderPath}`)
    this.clearIndexCache(folderPath)
    await this.buildIndexForFolder(folderPath)
  }

  /**
   * 获取上下文预览
   * @param {string} line - 文本行
   * @param {string} query - 搜索关键词
   * @returns {string} 带上下文的预览文本
   */
  getContextPreview(line, query) {
    const index = line.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return line.trim()

    const start = Math.max(0, index - 40)
    const end = Math.min(line.length, index + query.length + 40)
    let preview = line.substring(start, end).trim()

    if (start > 0) preview = '...' + preview
    if (end < line.length) preview = preview + '...'

    return preview
  }

  /**
   * 递归收集目录中的所有 markdown 文件
   * @param {string} currentPath - 当前目录路径
   * @param {string} folderPath - 根文件夹路径
   * @param {Array} files - 文件列表
   * @param {Map} fileMap - 文件映射表
   * @returns {Promise<void>}
   */
  async collectMarkdownFiles(currentPath, folderPath, files, fileMap) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        await this.collectMarkdownFiles(fullPath, folderPath, files, fileMap)
      } else if (path.extname(entry.name) === '.md') {
        try {
          const content = await fs.readFile(fullPath, 'utf-8')
          const relativePath = path.relative(folderPath, fullPath)
          const fileId = files.length

          files.push({
            id: fileId,
            name: entry.name,
            path: fullPath,
            relativePath: relativePath,
            content: content
          })

          fileMap.set(fileId, {
            path: fullPath,
            name: entry.name,
            relativePath: relativePath,
            lines: content.split('\n'),
            content: content
          })
        } catch (error) {
          console.error(`Error reading file ${fullPath}:`, error)
        }
      }
    }
  }

  /**
   * 创建 flexsearch 索引
   * @param {Array} files - 文件列表
   * @returns {FlexSearch.Index} flexsearch 索引对象
   */
  createIndex(files) {
    const idx = new FlexSearch.Index(this.flexsearchConfig)

    files.forEach((file) => {
      idx.add(file.id, `${file.name} ${file.content}`)
    })

    return idx
  }

  /**
   * 处理搜索结果，提取匹配的行
   * @param {Array<number>} searchResults - flexsearch 返回的文件 ID 列表
   * @param {Map} fileMap - 文件映射表
   * @param {string} query - 搜索关键词
   * @returns {Array} 处理后的结果列表
   */
  processSearchResults(searchResults, fileMap, query) {
    const results = []
    const processedFiles = new Set()
    const searchQueryLower = query.toLowerCase()

    searchResults.forEach((fileId) => {
      if (processedFiles.has(fileId)) return
      processedFiles.add(fileId)

      const fileInfo = fileMap.get(fileId)
      if (!fileInfo) return

      const matches = []

      fileInfo.lines.forEach((line, index) => {
        if (line.toLowerCase().includes(searchQueryLower)) {
          matches.push({
            lineNumber: index + 1,
            content: line.trim(),
            preview: this.getContextPreview(line, query)
          })
        }
      })

      const limitedMatches = matches.slice(0, 5)

      if (matches.length > 0) {
        results.push({
          path: fileInfo.path,
          name: fileInfo.name,
          relativePath: fileInfo.relativePath,
          matches: limitedMatches,
          matchCount: matches.length
        })
      }
    })

    return results
  }

  /**
   * 初始化文件夹的索引
   * @param {string} folderPath - 文件夹路径
   * @returns {Promise<{idx: Index, fileMap: Map}>}
   */
  async buildIndexForFolder(folderPath) {
    const files = []
    const fileMap = new Map()

    console.log(`Building index for folder: ${folderPath}`)
    const startTime = Date.now()

    // 先加载持久化的文件统计信息
    await this.loadFileStats(folderPath)

    // 收集所有 markdown 文件
    await this.collectMarkdownFiles(folderPath, folderPath, files, fileMap)

    // 创建索引
    const idx = this.createIndex(files)

    // 更新文件统计信息
    for (const file of files) {
      try {
        const stat = await fs.stat(file.path)
        this.fileStats.set(file.path, { mtime: stat.mtimeMs, size: stat.size })
      } catch (error) {
        console.error(`Error reading file stats ${file.path}:`, error)
      }
    }

    // 保存文件统计信息到磁盘
    await this.saveFileStats(folderPath)

    const duration = Date.now() - startTime
    console.log(`Index built successfully: ${files.length} files, ${duration}ms`)

    // 缓存索引和文件映射（增加时间戳）
    this.indexCache.set(folderPath, {
      idx,
      fileMap,
      files,
      timestamp: Date.now()
    })

    return { idx, fileMap }
  }

  /**
   * 清空指定文件夹的索引缓存（保留文件统计信息）
   * @param {string} folderPath - 文件夹路径
   */
  clearIndexCache(folderPath) {
    console.log(`Clearing index cache for: ${folderPath}`)
    this.indexCache.delete(folderPath)

    // 如果有文件监听器，也关闭它
    if (this.fileWatchers.has(folderPath)) {
      const watcher = this.fileWatchers.get(folderPath)
      watcher.close()
      this.fileWatchers.delete(folderPath)
    }
    // 注意：故意保留 fileStats，只清理内存中的索引
  }

  /**
   * 清空所有缓存
   */
  clearAllCache() {
    console.log('Clearing all index cache')
    this.indexCache.clear()

    // 关闭所有文件监听器
    for (const watcher of this.fileWatchers.values()) {
      watcher.close()
    }
    this.fileWatchers.clear()
  }

  /**
   * 获取指定文件夹的缓存索引
   * @param {string} folderPath - 文件夹路径
   * @returns {{idx: Index, fileMap: Map} | null}
   */
  getCachedIndex(folderPath) {
    return this.indexCache.get(folderPath) || null
  }

  /**
   * 获取缓存状态信息
   * @returns {Object}
   */
  getCacheStats() {
    const stats = {
      totalFolders: this.indexCache.size,
      folders: []
    }

    for (const [folderPath, { files }] of this.indexCache) {
      stats.folders.push({
        path: folderPath,
        fileCount: files.length
      })
    }

    return stats
  }

  /**
   * 执行搜索
   * @param {string} folderPath - 文件夹路径
   * @param {string} query - 搜索关键词
   * @param {Object} options - 选项 { autoUpdate: boolean, forceRefresh: boolean }
   * @returns {Promise<{success: boolean, results: Array, total: number, error?: string}>}
   */
  async search(folderPath, query, options = {}) {
    try {
      if (!folderPath || !query) {
        return { success: false, results: [] }
      }

      const { autoUpdate = true, forceRefresh = false } = options

      let idx
      let fileMap

      // 强制刷新索引
      if (forceRefresh) {
        console.log('Force refreshing index...')
        await this.refreshIndex(folderPath)
      }

      // 从缓存获取索引
      const cached = this.getCachedIndex(folderPath)

      if (cached) {
        console.log(`Using cached index for: ${folderPath}`)
        idx = cached.idx
        fileMap = cached.fileMap

        // 自动检测并更新索引
        if (autoUpdate) {
          const files = []
          const fileMapTemp = new Map()
          await this.collectMarkdownFiles(folderPath, folderPath, files, fileMapTemp)

          const changes = await this.checkFolderChanges(folderPath, files)

          if (
            changes.modified.length > 0 ||
            changes.added.length > 0 ||
            changes.deleted.length > 0
          ) {
            console.log(`Detected changes in ${folderPath}, updating index...`)
            await this.updateIndexIncremental(folderPath, changes)
            // 重新获取更新后的索引
            const updated = this.getCachedIndex(folderPath)
            idx = updated.idx
            fileMap = updated.fileMap
          }
        }
      } else {
        // 缓存不存在，构建新索引
        const result = await this.buildIndexForFolder(folderPath)
        idx = result.idx
        fileMap = result.fileMap
      }

      const searchResults = idx.search({
        query: query,
        limit: 1000,
        suggest: true
      })

      const results = this.processSearchResults(searchResults, fileMap, query)

      return { success: true, results, total: results.length }
    } catch (error) {
      console.error('Search error:', error)
      return { success: false, error: error.message, results: [] }
    }
  }
}

export const searchManager = new FileSearchManager()
