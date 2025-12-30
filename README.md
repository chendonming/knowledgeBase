# knowledgebase

A personal knowledge base tool built with Electron and Vue that renders Markdown files in a VitePress-like interface.

## Features

- 📁 **Local Folder Import**: Browse and display markdown files from local directories
- 🌳 **File Tree Navigation**: Hierarchical file structure with expandable folders
- 📝 **Markdown Rendering**: Deep customization using Unified ecosystem (remark/rehype)
- 🎨 **VitePress-like UI**: Clean, modern interface for reading documentation
- 🔍 **GitHub Support**: Ready for GitHub repository integration (coming soon)

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
