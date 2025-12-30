<script setup>
import { ref, onMounted, onBeforeUnmount, inject } from 'vue'
import { setThemeMode } from '../stores/uiState'

const emit = defineEmits(['open-folder', 'open-history', 'create-share', 'stop-share', 'open-search'])
const themeMode = inject('themeMode', ref('dark'))

const activeMenu = ref(null)
const menuPosition = ref({ x: 0, y: 0 })

// 菜单项定义
const menus = ref([
  {
    id: 'file',
    label: '文件',
    items: [
      { id: 'open-folder', label: '打开文件夹', accelerator: 'Ctrl+O', action: 'open-folder' },
      { id: 'open-history', label: '打开历史记录', accelerator: 'Ctrl+H', action: 'open-history' },
      { id: 'open-search', label: '搜索文件', accelerator: 'Ctrl+F', action: 'open-search' },
      { type: 'separator' },
      { id: 'quit', label: '退出', accelerator: 'Alt+F4', action: 'quit' }
    ]
  },
  {
    id: 'share',
    label: '分享',
    items: [
      {
        id: 'create-share',
        label: '生成分享链接',
        accelerator: 'Ctrl+Shift+S',
        action: 'create-share'
      },
      { id: 'stop-share', label: '停止分享', accelerator: 'Ctrl+Shift+X', action: 'stop-share' }
    ]
  },
  {
    id: 'edit',
    label: '编辑',
    items: [
      { id: 'undo', label: '撤销', accelerator: 'Ctrl+Z', action: 'undo' },
      { id: 'redo', label: '重做', accelerator: 'Ctrl+Y', action: 'redo' },
      { type: 'separator' },
      { id: 'cut', label: '剪切', accelerator: 'Ctrl+X', action: 'cut' },
      { id: 'copy', label: '复制', accelerator: 'Ctrl+C', action: 'copy' },
      { id: 'paste', label: '粘贴', accelerator: 'Ctrl+V', action: 'paste' },
      { type: 'separator' },
      { id: 'select-all', label: '全选', accelerator: 'Ctrl+A', action: 'select-all' }
    ]
  },
  {
    id: 'view',
    label: '查看',
    items: [
      { id: 'reload', label: '重新加载', accelerator: 'Ctrl+R', action: 'reload' },
      {
        id: 'force-reload',
        label: '强制重新加载',
        accelerator: 'Ctrl+Shift+R',
        action: 'force-reload'
      },
      {
        id: 'toggle-devtools',
        label: '切换开发者工具',
        accelerator: 'F12',
        action: 'toggle-devtools'
      },
      { type: 'separator' },
      { id: 'reset-zoom', label: '实际大小', accelerator: 'Ctrl+0', action: 'reset-zoom' },
      { id: 'zoom-in', label: '放大', accelerator: 'Ctrl++', action: 'zoom-in' },
      { id: 'zoom-out', label: '缩小', accelerator: 'Ctrl+-', action: 'zoom-out' },
      { type: 'separator' },
      {
        id: 'toggle-fullscreen',
        label: '切换全屏',
        accelerator: 'F11',
        action: 'toggle-fullscreen'
      },
      { type: 'separator' },
      {
        id: 'theme',
        label: '主题',
        submenu: [
          { id: 'theme-dark', label: '深色', action: 'theme-dark' },
          { id: 'theme-light', label: '浅色', action: 'theme-light' }
        ]
      }
    ]
  },
  {
    id: 'help',
    label: '帮助',
    items: [
      { id: 'learn-more', label: '学习更多', action: 'learn-more' },
      { type: 'separator' },
      { id: 'about', label: '关于 Knowledge Base', action: 'about' }
    ]
  }
])

// 切换菜单
const toggleMenu = (menuId, event) => {
  if (activeMenu.value === menuId) {
    activeMenu.value = null
  } else {
    const rect = event.target.getBoundingClientRect()
    menuPosition.value = {
      x: rect.left,
      y: rect.bottom
    }
    activeMenu.value = menuId
  }
}

// 关闭菜单
const closeMenu = () => {
  activeMenu.value = null
}

// 处理菜单项点击
const handleMenuItemClick = async (action) => {
  closeMenu()

  switch (action) {
    case 'open-folder':
      emit('open-folder')
      break
    case 'open-history':
      emit('open-history')
      break
    case 'open-search':
      emit('open-search')
      break
    case 'create-share':
      emit('create-share')
      break
    case 'stop-share':
      emit('stop-share')
      break
    case 'quit':
      window.close()
      break
    case 'undo':
      document.execCommand('undo')
      break
    case 'redo':
      document.execCommand('redo')
      break
    case 'cut':
      document.execCommand('cut')
      break
    case 'copy':
      document.execCommand('copy')
      break
    case 'paste':
      document.execCommand('paste')
      break
    case 'select-all':
      document.execCommand('selectAll')
      break
    case 'reload':
      location.reload()
      break
    case 'force-reload':
      location.reload(true)
      break
    case 'toggle-devtools':
      // 这个需要通过 IPC 调用
      if (window.api && window.api.toggleDevTools) {
        window.api.toggleDevTools()
      }
      break
    case 'reset-zoom':
      document.body.style.zoom = '1'
      break
    case 'zoom-in':
      const currentZoomIn = parseFloat(document.body.style.zoom || '1')
      document.body.style.zoom = (currentZoomIn + 0.1).toString()
      break
    case 'zoom-out':
      const currentZoomOut = parseFloat(document.body.style.zoom || '1')
      document.body.style.zoom = Math.max(0.1, currentZoomOut - 0.1).toString()
      break
    case 'toggle-fullscreen':
      if (window.api && window.api.toggleFullscreen) {
        window.api.toggleFullscreen()
      }
      break
    case 'theme-dark':
      setThemeMode('dark')
      break
    case 'theme-light':
      setThemeMode('light')
      break
    case 'learn-more':
      window.open('https://github.com/electron/electron', '_blank')
      break
    case 'about':
      alert('Knowledge Base\n\n一个基于 Electron 和 Vue 的 Markdown 知识库应用\n\n版本: 1.0.0')
      break
  }
}

// 窗口控制按钮处理
const handleMinimize = () => {
  if (window.api && window.api.minimizeWindow) {
    window.api.minimizeWindow()
  }
}

const handleMaximize = () => {
  if (window.api && window.api.maximizeWindow) {
    window.api.maximizeWindow()
  }
}

const handleClose = () => {
  if (window.api && window.api.closeWindow) {
    window.api.closeWindow()
  }
}

// 点击外部关闭菜单
const handleClickOutside = (event) => {
  if (activeMenu.value && !event.target.closest('.menu-bar')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="menu-bar">
    <div class="menu-bar-content">
      <div class="app-title">📚 Knowledge Base</div>
      <div class="menu-items">
        <div
          v-for="menu in menus"
          :key="menu.id"
          class="menu-item"
          :class="{ active: activeMenu === menu.id }"
          @click="toggleMenu(menu.id, $event)"
        >
          {{ menu.label }}
        </div>
      </div>
    </div>
    <div class="window-controls">
      <button class="window-control-btn minimize" title="最小化" @click="handleMinimize">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="0" y="5" width="12" height="2" fill="currentColor" />
        </svg>
      </button>
      <button class="window-control-btn maximize" title="最大化" @click="handleMaximize">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect
            x="0"
            y="0"
            width="12"
            height="12"
            stroke="currentColor"
            stroke-width="1.5"
            fill="none"
          />
        </svg>
      </button>
      <button class="window-control-btn close" title="关闭" @click="handleClose">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M 0,0 L 12,12 M 12,0 L 0,12" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
    </div>

    <!-- Dropdown Menus -->
    <Transition name="menu-fade">
      <div
        v-if="activeMenu"
        class="dropdown-menu"
        :style="{
          left: menuPosition.x + 'px',
          top: menuPosition.y + 'px'
        }"
      >
        <template v-for="(item, index) in menus.find((m) => m.id === activeMenu)?.items || []"
          :key="index">
          <div
            v-if="!item.submenu"
            class="dropdown-item"
            :class="{ separator: item.type === 'separator' }"
            @click="item.action && handleMenuItemClick(item.action)"
          >
            <template v-if="item.type !== 'separator'">
              <span class="item-label">{{ item.label }}</span>
              <span v-if="item.accelerator" class="item-accelerator">{{ item.accelerator }}</span>
            </template>
          </div>
          <div v-else class="dropdown-item submenu-item" @click.stop>
            <span class="item-label">{{ item.label }}</span>
            <span class="submenu-arrow">▶</span>
            <div class="submenu">
              <div
                v-for="subitem in item.submenu"
                :key="subitem.id"
                class="dropdown-item"
                @click="subitem.action && handleMenuItemClick(subitem.action)"
              >
                <span class="item-label">{{ subitem.label }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.menu-bar {
  height: 40px;
  background: linear-gradient(180deg, var(--menubar-bg-start) 0%, var(--menubar-bg-end) 100%);
  border-bottom: 1px solid var(--menubar-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  position: relative;
  z-index: 1000;
  -webkit-app-region: drag;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.menu-bar-content {
  display: flex;
  align-items: center;
  padding: 0 12px;
  -webkit-app-region: no-drag;
}

.app-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--menubar-text);
  margin-right: 24px;
  padding: 0 8px;
  transition: color 0.3s ease;
}

.menu-items {
  display: flex;
  align-items: center;
  gap: 4px;
}

.menu-item {
  padding: 6px 12px;
  font-size: 13px;
  color: var(--menubar-text);
  cursor: pointer;
  border-radius: 4px;
  transition:
    background-color 0.15s,
    color 0.15s;
}

.menu-item:hover {
  background-color: var(--menubar-hover-bg);
  color: var(--text-primary);
}

.menu-item.active {
  background-color: var(--menubar-hover-bg);
  color: var(--text-primary);
}

.window-controls {
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: no-drag;
}

.window-control-btn {
  width: 46px;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--menubar-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.15s,
    color 0.15s;
  padding: 0;
}

.window-control-btn:hover {
  background-color: var(--menubar-hover-bg);
  color: var(--text-primary);
}

.window-control-btn.close:hover {
  background-color: #e81123;
  color: #ffffff;
}

.dropdown-menu {
  position: fixed;
  min-width: 220px;
  background: var(--dropdown-bg);
  border: 1px solid var(--dropdown-border);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  padding: 4px 0;
  z-index: 10000;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.dropdown-item {
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition:
    background-color 0.15s,
    color 0.15s;
  position: relative;
}

.dropdown-item:not(.separator):not(.submenu-item):hover {
  background-color: var(--dropdown-hover-bg);
  color: var(--accent-color);
}

.dropdown-item.separator {
  height: 1px;
  background: var(--border-color);
  margin: 4px 8px;
  padding: 0;
  cursor: default;
  transition: background-color 0.3s ease;
}

.submenu-item {
  position: relative;
}

.submenu-item:hover .submenu {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
}

.submenu-arrow {
  margin-left: 8px;
  font-size: 10px;
  opacity: 0.6;
}

.submenu {
  position: absolute;
  left: 100%;
  top: -4px;
  min-width: 160px;
  background: var(--dropdown-bg);
  border: 1px solid var(--dropdown-border);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  padding: 4px 0;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-4px);
  transition: opacity 0.15s, transform 0.15s;
  z-index: 10001;
}

.submenu .dropdown-item {
  padding: 8px 16px;
  color: var(--text-primary);
}

.submenu .dropdown-item:hover {
  background-color: var(--dropdown-hover-bg);
  color: var(--accent-color);
}

.item-label {
  flex: 1;
}

.item-accelerator {
  margin-left: 24px;
  font-size: 11px;
  opacity: 0.7;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.menu-fade-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}
</style>
