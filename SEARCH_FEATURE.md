# Full-Text Search Feature

## Overview

The Full-Text Search feature allows you to quickly search through all markdown files in your knowledge base. It searches both file names and file contents, providing instant results with context previews.

## How to Use

### Opening the Search Panel

There are three ways to open the search panel:

1. **Keyboard Shortcut**: Press `Ctrl+F` (Windows/Linux) or `Cmd+F` (macOS)
2. **Menu**: Click `文件 (File)` → `搜索文件 (Search Files)`
3. The search panel will appear as an overlay on top of your current view

### Performing a Search

1. Open the search panel using one of the methods above
2. Type your search query in the input field
3. Results will appear automatically as you type (with a 300ms debounce)
4. Browse through the results to find what you're looking for

### Search Results

Each search result shows:

- **File Name**: The name of the markdown file
- **File Path**: The relative path from the root folder
- **Match Count**: Total number of matches found in that file
- **Preview Lines**: Up to 5 matching lines with context (40 characters before and after the match)
- **Line Numbers**: The line number where each match was found
- **Highlighted Terms**: Your search query is highlighted in yellow within the previews

### Navigating Results

- Click on any search result to open that file immediately
- The search panel will close automatically when you select a file
- Press `Escape` to close the search panel without selecting a file

## Features

### Real-time Search

- Search results update as you type
- No need to press Enter or click a search button
- Smart debouncing prevents excessive searches while typing

### Context-Aware Preview

- See the matching text with surrounding context
- Up to 40 characters before and after each match
- Ellipsis (...) indicates truncated content

### Highlighting

- Search terms are visually highlighted in the preview
- Makes it easy to spot why a file matched your query
- Works with case-insensitive matching

### Performance Optimized

- Only shows top 5 matches per file to keep the UI responsive
- Total match count displayed for each file
- Efficient file scanning algorithm

## Search Behavior

### What Gets Searched

- **File Names**: Matches against the markdown file name
- **File Contents**: Searches through the entire content of each `.md` file
- **Case Insensitive**: Searches are not case-sensitive

### What Doesn't Get Searched

- Non-markdown files (e.g., images, PDFs, etc.)
- Hidden files and folders
- Files outside the selected root folder

### Search Limitations

- Maximum 5 preview lines shown per file (total matches still counted)
- Context preview limited to 80 characters per match
- Real-time search has 300ms delay to avoid excessive processing

## Technical Details

### Architecture

The search feature consists of three main components:

1. **Main Process Handler** (`src/main/index.js`):
   - `search-files` IPC handler
   - Recursively scans directories
   - Reads and searches file contents
   - Returns structured results

2. **Preload API** (`src/preload/index.js`):
   - `searchFiles({ folderPath, query })` API
   - Secure bridge between renderer and main process

3. **Search Panel Component** (`src/renderer/src/components/SearchPanel.vue`):
   - User interface for search
   - Real-time result display
   - Keyboard shortcuts and accessibility

### Search Algorithm

```javascript
// Pseudocode
function searchFiles(folderPath, query):
  results = []

  for each file in folder (recursively):
    if file is markdown:
      content = read file

      if query matches filename OR content:
        matches = find all matching lines
        results.add({
          path, name, matches (limited to 5)
        })

  return results
```

### Performance Considerations

- **Asynchronous**: All file I/O is non-blocking
- **Debounced**: Search waits 300ms after user stops typing
- **Limited Results**: Shows first 5 matches per file
- **Efficient Scanning**: Only processes `.md` files

## Keyboard Shortcuts

| Shortcut           | Action                    |
| ------------------ | ------------------------- |
| `Ctrl+F` / `Cmd+F` | Open search panel         |
| `Escape`           | Close search panel        |
| `Enter`            | (In input) Keep searching |

## Use Cases

### Finding a Specific Topic

1. Open search with `Ctrl+F`
2. Type the topic name (e.g., "React Hooks")
3. Browse results to find relevant files
4. Click to open the most relevant document

### Locating a Code Example

1. Search for a specific function or code pattern
2. Review the context previews to find the right example
3. Open the file to see the complete code

### Cross-referencing Information

1. Search for a concept mentioned across multiple files
2. Use the match count to identify primary sources
3. Open multiple files to gather comprehensive information

## Tips and Best Practices

### Effective Searching

- **Be Specific**: Use unique terms to narrow results
- **Use Keywords**: Technical terms work better than common words
- **Check Previews**: Review context before opening files
- **Use Counts**: Files with more matches might be more relevant

### Working with Results

- Results are sorted by relevance (files found first)
- File paths help identify the location in your knowledge base
- Line numbers make it easy to locate content in large files

### Combining with Other Features

- Use search to find files, then use Outline for navigation
- Search works with all folders in your history
- Combine with folder selection for scoped searches

## Troubleshooting

### No Results Found

- **Check folder selection**: Ensure you have a folder open
- **Verify file types**: Only `.md` files are searched
- **Try different terms**: Use synonyms or related keywords

### Search is Slow

- **Large repositories**: Searching many files takes time
- **Wait for completion**: Spinner indicates search in progress
- **Use specific terms**: Reduces the number of results to process

### Results Don't Update

- **Wait for debounce**: 300ms delay after typing
- **Check connection**: Ensure main process is responsive
- **Restart app**: If issues persist, restart the application

## Future Enhancements

Potential improvements for future versions:

- **Regular Expressions**: Support for advanced pattern matching
- **File Type Filters**: Search specific sections or file types
- **Search History**: Remember recent searches
- **Export Results**: Save search results to a file
- **Advanced Options**: Case-sensitive, whole-word matching
- **Search in Selection**: Limit search to current folder branch

## API Reference

### IPC Handler

```javascript
// Main Process
ipcMain.handle('search-files', async (event, { folderPath, query }) => {
  // Returns: { success: boolean, results: Array, total: number, error?: string }
})
```

### Preload API

```javascript
// Renderer Process
window.api.searchFiles({ folderPath, query }).then((result) => {
  if (result.success) {
    console.log(`Found ${result.total} results`)
    result.results.forEach((file) => {
      console.log(file.name, file.matches)
    })
  }
})
```

### Component Props

```vue
<SearchPanel :is-open="boolean" :current-folder="string" @close="handler" @select-file="handler" />
```

## Credits

Built with:

- Electron IPC for process communication
- Vue 3 Composition API for reactive UI
- Native Node.js `fs` module for file operations
- CSS animations for smooth transitions

---

For more information about the Knowledge Base application, see [README.md](./README.md).
