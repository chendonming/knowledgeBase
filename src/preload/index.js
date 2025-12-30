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
  saveLastFolder: (folderPath) => ipcRenderer.invoke('save-last-folder', folderPath)
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
