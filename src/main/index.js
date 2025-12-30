import { app, shell, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs/promises'
import path from 'path'
import { existsSync, mkdirSync } from 'fs'
import http from 'http'
import { networkInterfaces } from 'os'

// 获取应用数据目录
const getUserDataPath = () => {
  return app.getPath('userData')
}

// HTTP 分享服务器
let shareServer = null
let currentSharedContent = null
let activeConnections = new Set()

// 获取本机局域网 IP
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

// 创建分享服务器
const createShareServer = (htmlContent, title) => {
  return new Promise((resolve, reject) => {
    // 如果已有服务器在运行，先关闭
    if (shareServer) {
      stopShareServer()
    }

    currentSharedContent = { htmlContent, title }
    activeConnections = new Set()

    const server = http.createServer((req, res) => {
      // 设置 CORS 头，允许跨域访问
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Content-Type', 'text/html; charset=utf-8')

      // 创建完整的 HTML 页面
      const fullHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Markdown 预览'}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.0/github-markdown.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    body {
      margin: 0;
      padding: 20px;
      background-color: #f6f8fa;
    }
    .container {
      max-width: 980px;
      margin: 0 auto;
      background: white;
      padding: 45px;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e1e4e8;
    }
    .header h1 {
      margin: 0;
      color: #24292e;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e1e4e8;
      color: #586069;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 ${title || 'Markdown 文档'}</h1>
    </div>
    <article class="markdown-body">
      ${htmlContent}
    </article>
    <div class="footer">
      由 KnowledgeBase 应用生成并分享
    </div>
  </div>
</body>
</html>
      `

      res.end(fullHtml)
    })

    // 跟踪所有 socket 连接
    server.on('connection', (socket) => {
      activeConnections.add(socket)
      socket.on('close', () => {
        activeConnections.delete(socket)
      })
    })

    // 监听随机端口
    server.listen(0, () => {
      const port = server.address().port
      const ip = getLocalIP()
      const url = `http://${ip}:${port}`

      shareServer = server
      resolve({ url, port })
    })

    server.on('error', (error) => {
      reject(error)
    })
  })
}

// 停止分享服务器
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
    currentSharedContent = null
    return true
  }
  return false
}

// 创建应用菜单
function createAppMenu(mainWindow) {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '打开文件夹',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog({
              properties: ['openDirectory']
            })
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send('menu-open-folder', result.filePaths[0])
            }
          }
        },
        {
          label: '打开历史记录',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow.webContents.send('menu-open-history')
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit'
        }
      ]
    },
    {
      label: '分享',
      submenu: [
        {
          label: '生成分享链接',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('menu-create-share')
          }
        },
        {
          label: '停止分享',
          click: () => {
            mainWindow.webContents.send('menu-stop-share')
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '查看',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '切换开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 创建应用菜单
  createAppMenu(mainWindow)

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

  // 文件夹历史管理 IPC 处理器
  const historyFile = path.join(getUserDataPath(), 'folderHistory.json')

  // 读取文件夹历史
  ipcMain.handle('get-folder-history', async () => {
    try {
      if (existsSync(historyFile)) {
        const data = await fs.readFile(historyFile, 'utf-8')
        return JSON.parse(data)
      }
      return []
    } catch (error) {
      return []
    }
  })

  // 保存文件夹到历史
  ipcMain.handle('add-folder-to-history', async (event, folderPath) => {
    try {
      let history = []
      if (existsSync(historyFile)) {
        const data = await fs.readFile(historyFile, 'utf-8')
        history = JSON.parse(data)
      }

      // 移除重复项
      history = history.filter(item => item !== folderPath)
      // 添加到开头
      history.unshift(folderPath)
      // 只保留最近的 20 个
      history = history.slice(0, 20)

      // 确保目录存在
      const dir = path.dirname(historyFile)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      await fs.writeFile(historyFile, JSON.stringify(history, null, 2))
      return { success: true, history }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 删除文件夹历史记录
  ipcMain.handle('remove-folder-from-history', async (event, folderPath) => {
    try {
      let history = []
      if (existsSync(historyFile)) {
        const data = await fs.readFile(historyFile, 'utf-8')
        history = JSON.parse(data)
      }

      history = history.filter(item => item !== folderPath)

      const dir = path.dirname(historyFile)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      await fs.writeFile(historyFile, JSON.stringify(history, null, 2))
      return { success: true, history }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 获取最后使用的文件夹
  ipcMain.handle('get-last-folder', async () => {
    try {
      const configFile = path.join(getUserDataPath(), 'lastFolder.json')
      if (existsSync(configFile)) {
        const data = await fs.readFile(configFile, 'utf-8')
        const config = JSON.parse(data)
        return config.lastFolder || null
      }
      return null
    } catch (error) {
      return null
    }
  })

  // 保存最后使用的文件夹
  ipcMain.handle('save-last-folder', async (event, folderPath) => {
    try {
      const configFile = path.join(getUserDataPath(), 'lastFolder.json')
      const dir = path.dirname(configFile)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      await fs.writeFile(configFile, JSON.stringify({ lastFolder: folderPath }, null, 2))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 分享功能 IPC 处理器
  ipcMain.handle('create-share-link', async (event, { htmlContent, title }) => {
    try {
      const { url, port } = await createShareServer(htmlContent, title)
      return { success: true, url, port }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('stop-share-server', async () => {
    try {
      const stopped = stopShareServer()
      return { success: true, stopped }
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
  // 停止分享服务器
  stopShareServer()

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
