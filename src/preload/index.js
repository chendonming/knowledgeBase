import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  getFileTree: (dirPath) => ipcRenderer.invoke('get-file-tree', dirPath),
  readImage: (imagePath) => ipcRenderer.invoke('read-image', imagePath),
  // 文件夹历史 API
  getFolderHistory: () => ipcRenderer.invoke('get-folder-history'),
  addFolderToHistory: (folderPath) => ipcRenderer.invoke('add-folder-to-history', folderPath),
  removeFolderFromHistory: (folderPath) => ipcRenderer.invoke('remove-folder-from-history', folderPath),
  getLastFolder: () => ipcRenderer.invoke('get-last-folder'),
  saveLastFolder: (folderPath) => ipcRenderer.invoke('save-last-folder', folderPath),
  // 分享功能 API
  createShareLink: ({ htmlContent, title }) => ipcRenderer.invoke('create-share-link', { htmlContent, title }),
  stopShareServer: () => ipcRenderer.invoke('stop-share-server'),
  // 搜索功能 API
  searchFiles: ({ folderPath, query }) => ipcRenderer.invoke('search-files', { folderPath, query }),
  // 文件监视 API
  watchFile: (filePath) => ipcRenderer.invoke('watch-file', filePath),
  unwatchFile: (filePath) => ipcRenderer.invoke('unwatch-file', filePath),
  // 窗口控制 API（用于自定义菜单栏）
  toggleDevTools: () => ipcRenderer.invoke('toggle-devtools'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  // 菜单事件监听器
  onMenuOpenFolder: (callback) => ipcRenderer.on('menu-open-folder', callback),
  onMenuOpenHistory: (callback) => ipcRenderer.on('menu-open-history', callback),
  onMenuCreateShare: (callback) => ipcRenderer.on('menu-create-share', callback),
  onMenuStopShare: (callback) => ipcRenderer.on('menu-stop-share', callback),
  // 文件变更事件监听器
  onFileChanged: (callback) => ipcRenderer.on('file-changed', callback)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
