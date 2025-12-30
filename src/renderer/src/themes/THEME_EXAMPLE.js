/**
 * 主题添加示例
 *
 * 这个文件展示了如何快速为项目添加新主题
 * 遵循以下步骤即可轻松扩展主题系统
 */

// ============================================================
// 步骤 1: 在 themeConfig.js 中添加主题配置
// ============================================================

const EXAMPLE_NEW_THEME = {
  // 给你的主题
  mytheme: {
    name: '我的主题名称', // 在菜单中显示的名称
    id: 'mytheme', // 主题ID（必须唯一且小写）
    colors: {
      // 必需的颜色变量 - 复制以下所有字段并修改颜色值
      'bg-primary': '#1a1a1a', // 主背景色
      'bg-secondary': '#2d2d2d', // 次级背景色
      'bg-tertiary': '#3d3d3d', // 第三级背景色
      'text-primary': '#e0e0e0', // 主文本色
      'text-secondary': '#a0a0a0', // 次级文本色
      'text-tertiary': '#707070', // 第三级文本色
      'border-color': '#4a4a4a', // 边框色
      'accent-color': '#ff6b6b', // 强调色
      'accent-hover': '#ff8787', // 强调色悬停
      'sidebar-bg': '#2d2d2d', // 侧边栏背景
      'header-bg': '#1a1a1a', // 顶部栏背景
      'code-bg': '#3d3d3d', // 代码块背景
      'hover-bg': '#2d2d2d', // 悬停背景
      'selected-bg': '#4a5f7f', // 选中背景
      'menubar-bg-start': '#2d2d30', // 菜单栏背景起点
      'menubar-bg-end': '#252526', // 菜单栏背景终点
      'menubar-border': '#1a1a1a', // 菜单栏边框
      'menubar-text': '#d0d0d0', // 菜单栏文本
      'menubar-hover-bg': 'rgba(255, 107, 107, 0.15)', // 菜单项悬停
      'dropdown-bg': '#2d2d30', // 下拉菜单背景
      'dropdown-border': '#4a4a4a', // 下拉菜单边框
      'dropdown-hover-bg': '#4a5f7f' // 下拉菜单悬停
    }
  }
}

// ============================================================
// 步骤 2: 在 main.css 中添加对应的 CSS 规则
// ============================================================

const EXAMPLE_CSS = `
/* CSS Variables for Your Theme */
.mytheme-theme {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #3d3d3d;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --text-tertiary: #707070;
  --border-color: #4a4a4a;
  --accent-color: #ff6b6b;
  --accent-hover: #ff8787;
  --sidebar-bg: #2d2d2d;
  --header-bg: #1a1a1a;
  --code-bg: #3d3d3d;
  --hover-bg: #2d2d2d;
  --selected-bg: #4a5f7f;
  --menubar-bg-start: #2d2d30;
  --menubar-bg-end: #252526;
  --menubar-border: #1a1a1a;
  --menubar-text: #d0d0d0;
  --menubar-hover-bg: rgba(255, 107, 107, 0.15);
  --dropdown-bg: #2d2d30;
  --dropdown-border: #4a4a4a;
  --dropdown-hover-bg: #4a5f7f;
}
`

// ============================================================
// 颜色选择建议 - 使用在线工具生成和谐的配色方案
// ============================================================

const COLOR_TOOLS = {
  // 推荐工具:
  // 1. https://colorhexa.com - 颜色查询
  // 2. https://coolors.co - 配色方案生成
  // 3. https://www.color-hex.com - 颜色组合

  // 颜色深度建议 (以蓝色为例):
  colors_blue: {
    darkest: '#0f1621', // #RGB 最深的背景
    dark: '#1a2332', // 次级背景
    medium: '#253447', // 第三级背景
    light: '#90caf9', // 文本和强调色
    lighter: '#64b5f6', // 悬停状态
    lightest: '#e3f2fd' // 选中背景
  },

  // 对比度检查建议:
  contrast_ratio: {
    minimum: '4.5:1', // WCAG AA 级别（推荐）
    enhanced: '7:1' // WCAG AAA 级别（更好的可访问性）
  }
}

// ============================================================
// 快速参考：已有主题的颜色
// ============================================================

const EXISTING_THEMES = {
  dark: {
    description: '深色主题 - 适合长时间编辑',
    primary_bg: '#1e1e1e',
    accent: '#4a9eff'
  },
  light: {
    description: '浅色主题 - 提供高对比度',
    primary_bg: '#ffffff',
    accent: '#0078d4'
  },
  blue: {
    description: '蓝色主题 - 专业和平静',
    primary_bg: '#0f1621',
    accent: '#42a5f5'
  },
  green: {
    description: '绿色主题 - 清爽和自然',
    primary_bg: '#0d1b0f',
    accent: '#4caf50'
  },
  purple: {
    description: '紫色主题 - 创意和活力',
    primary_bg: '#1a0f2e',
    accent: '#ab47bc'
  }
}

// ============================================================
// 步骤 3: 启动应用后验证
// ============================================================

const VERIFICATION = {
  steps: [
    '1. 启动开发服务器: npm run dev',
    '2. 打开应用: http://localhost:5173',
    '3. 进入菜单: 查看 → 主题',
    '4. 你的新主题应该出现在列表中',
    '5. 点击选择你的新主题进行测试',
    '6. 刷新页面验证主题是否被保存'
  ]
}

// ============================================================
// 主题ID命名规范
// ============================================================

const NAMING_CONVENTIONS = {
  // ✓ 推荐
  good_examples: [
    'dark-blue',
    'light-green',
    'high-contrast',
    'ocean-blue',
    'forest-green',
    'midnight-purple'
  ],

  // ✗ 不推荐
  bad_examples: [
    'Dark-Blue', // 不要使用大写
    'dark_blue', // 不要使用下划线
    'darkBlue', // 不要使用驼峰命名
    'dark blue', // 不要使用空格
    'dark@blue' // 不要使用特殊字符
  ]
}

// ============================================================
// 调试技巧
// ============================================================

const DEBUG_TIPS = {
  // 1. 在浏览器控制台检查当前主题
  check_current_theme: `
    // 在浏览器控制台运行
    localStorage.getItem('theme-mode')
  `,

  // 2. 检查 CSS 变量是否正确应用
  check_css_variables: `
    // 在浏览器控制台运行
    window.getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-primary')
  `,

  // 3. 手动切换主题测试
  manual_theme_switch: `
    // 在浏览器控制台运行
    import { setThemeMode } from './stores/uiState.js'
    setThemeMode('yourtheme-id')
  `,

  // 4. 检查主题应用情况
  check_theme_class: `
    // 在浏览器控制台运行
    console.log(document.documentElement.className)
  `
}

// ============================================================
// 导出示例
// ============================================================

export {
  EXAMPLE_NEW_THEME,
  EXAMPLE_CSS,
  COLOR_TOOLS,
  EXISTING_THEMES,
  VERIFICATION,
  NAMING_CONVENTIONS,
  DEBUG_TIPS
}
