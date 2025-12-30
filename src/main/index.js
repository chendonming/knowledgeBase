import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs/promises'
import path from 'path'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // File System IPC Handlers
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  ipcMain.handle('read-directory', async (event, dirPath) => {
    try {
      const files = []

      async function scanDir(currentPath, basePath) {
        const entries = await fs.readdir(currentPath, { withFileTypes: true })

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name)
          const relativePath = path.relative(basePath, fullPath)

          if (entry.isDirectory()) {
            await scanDir(fullPath, basePath)
          } else if (path.extname(entry.name) === '.md') {
            files.push({
              name: entry.name,
              path: fullPath,
              relativePath: relativePath,
              type: 'file'
            })
          }
        }
      }

      await scanDir(dirPath, dirPath)
      return { success: true, files }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return { success: true, content }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-file-tree', async (event, dirPath) => {
    try {
      async function buildTree(currentPath) {
        const stat = await fs.stat(currentPath)
        const name = path.basename(currentPath)

        if (stat.isFile()) {
          return {
            name,
            path: currentPath,
            type: 'file',
            extension: path.extname(name)
          }
        }

        if (stat.isDirectory()) {
          const children = []
          const entries = await fs.readdir(currentPath, { withFileTypes: true })

          for (const entry of entries) {
            const childPath = path.join(currentPath, entry.name)
            children.push(await buildTree(childPath))
          }

          return {
            name,
            path: currentPath,
            type: 'directory',
            children: children.sort((a, b) => {
              if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1
              }
              return a.name.localeCompare(b.name)
            })
          }
        }
      }

      const tree = await buildTree(dirPath)
      return { success: true, tree }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Read image file and convert to base64
  ipcMain.handle('read-image', async (event, imagePath) => {
    try {
      console.log('imagePath: ', imagePath)
      const imageBuffer = await fs.readFile(imagePath)
      const base64 = imageBuffer.toString('base64')

      // 获取文件扩展名来确定 MIME 类型
      const ext = path.extname(imagePath).toLowerCase()
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp'
      }

      const mimeType = mimeTypes[ext] || 'image/jpeg'
      const dataUrl = `data:${mimeType};base64,${base64}`

      return { success: true, dataUrl }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
