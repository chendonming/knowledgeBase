# knowledgebase

A personal knowledge base tool built with Electron and Vue that renders Markdown files in a VitePress-like interface.

## Features

- 📁 **Local Folder Import**: Browse and display markdown files from local directories
- 🌳 **File Tree Navigation**: Hierarchical file structure with expandable folders
- 📝 **Markdown Rendering**: Deep customization using Unified ecosystem (remark/rehype)
- 🎨 **VitePress-like UI**: Clean, modern interface for reading documentation
- � **Folder History**: Remember recently used folders with quick access (new!)
  - Auto-save last opened folder
  - Quick history access with Ctrl+H shortcut
  - Manage up to 20 recent folders
- 🔍 **GitHub Support**: Ready for GitHub repository integration (coming soon)

## New Feature: Folder History

Easily manage your recently used folders with the new folder history feature!

### Quick Start
1. Select a folder using "Select Folder" button
2. Press `Ctrl+H` (Windows/Linux) or `Cmd+H` (macOS) to open history
3. Click any folder in the history list to quickly load it
4. Your last opened folder is automatically restored on app restart

### Key Features
- **Auto-Save**: Last opened folder is automatically remembered
- **History List**: View your 20 most recent folders
- **Quick Access**: Use Ctrl+H keyboard shortcut
- **Management**: Delete folders from history with one click
- **Persistence**: All data is saved automatically

For detailed instructions, see [FOLDER_HISTORY_FEATURE.md](./FOLDER_HISTORY_FEATURE.md)

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **Vue 3**: Progressive JavaScript framework for UI
- **Unified Ecosystem**:
  - `remark-parse`: Markdown parsing
  - `remark-gfm`: GitHub Flavored Markdown support
  - `remark-rehype`: Convert markdown to HTML
  - `rehype-stringify`: Serialize HTML
  - `rehype-highlight`: Code syntax highlighting

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

## Usage

1. Launch the application
2. Click "Select Folder" to choose a directory containing markdown files
3. Browse the file tree in the sidebar
4. Click on any `.md` file to view its rendered content

## Architecture

- **Main Process**: Handles file system operations and IPC communication
- **Renderer Process**: Vue-based UI with components for file tree and markdown viewing
- **Preload Script**: Secure IPC bridge between main and renderer processes

## Customization

The markdown parser is built on the Unified ecosystem, allowing for deep customization:

```javascript
// Add custom plugins to the markdown processor
processor
  .use(customPlugin)
  .use(anotherPlugin, options)
```
