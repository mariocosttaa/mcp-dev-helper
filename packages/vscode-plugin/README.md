# MCP Dev Helper - VS Code Extension

View documentation directly in VS Code without leaving your editor. Select text and press `Alt+D` to instantly view the corresponding documentation.

## Features

- **Quick Access** - Select any text in your code and press `Alt+D` to view its documentation
- **Seamless Integration** - Works with your local MCP Dev Helper HTTP server
- **Fast** - Instant documentation lookup without context switching
- **Clean UI** - Documentation displayed in a styled webview panel

## Requirements

- **MCP Dev Helper HTTP Server** must be running (see [packages/core/README.md](../core/README.md))
- **VS Code workspace** folder name must match a project ID in your MCP Dev Helper configuration

## Installation

### Development Mode

1. Open VS Code in this project
2. Press `F5` to launch Extension Development Host
3. In the new window, open a workspace that matches a project ID in your config
4. Select text and press `Alt+D` to test

### Production Installation

1. Build the extension:
```bash
cd packages/vscode-plugin
npm run build
```

2. Package the extension:
```bash
npm install -g vsce
vsce package
```

3. Install the `.vsix` file in VS Code:
   - Open VS Code
   - Go to Extensions view
   - Click "..." menu → "Install from VSIX..."
   - Select the generated `.vsix` file

## Usage

### Basic Usage

1. **Start the MCP Dev Helper server** (from project root):
   ```bash
   npm start
   ```
   
   Or if installed globally:
   ```bash
   mcp-dev-helper start
   ```

2. **Open a workspace** in VS Code
   - The workspace folder name must match a project ID in your `~/.mcp-dev-helper/config.yml`

3. **Select text** in your editor (or place cursor on a word)
   - Example: Select `api-client` or `router-pattern`

4. **Press `Alt+D`** (or run command "MCP Dev Helper: Show Documentation")

5. **View documentation** in the side panel

### How It Works

1. You select text in your editor (e.g., `api-client`)
2. Press `Alt+D` (or run command "MCP Dev Helper: Show Documentation")
3. The extension:
   - Takes the selected text as the document name
   - Uses your workspace folder name as the project ID
   - Calls `GET /api/docs/{project_id}/{doc_name}` on the local server
   - Displays the HTML content in a VS Code webview panel

### Example Workflow

**Scenario:** You're working in a workspace named `react-native` and want to check the `api-client` documentation.

1. Select `api-client` in your code
2. Press `Alt+D`
3. Extension calls: `GET http://localhost:7777/api/docs/react-native/api-client`
4. Documentation appears in a side panel

## Configuration

### Workspace Folder Name

The extension uses the **workspace folder name** as the project ID. This must match a project ID in your `~/.mcp-dev-helper/config.yml` file.

**Example Config:**
```yaml
projects:
  - id: 'react-native'  # ← Workspace folder must be named "react-native"
    path: '/path/to/docs/react-native'
  - id: 'api'           # ← Workspace folder must be named "api"
    path: '/path/to/docs/api'
```

**Important:** If your workspace folder is named `my-project` but your config has `id: 'react-native'`, the extension won't work. Either:
- Rename your workspace folder to match the project ID, or
- Update your config to use the workspace folder name as the project ID

### Server URL

By default, the extension connects to `http://localhost:7777`. This is hardcoded in the extension. If you need a different port, you'll need to modify `src/extension.ts` and rebuild.

## Keyboard Shortcut

**Default:** `Alt+D`

You can change this in VS Code:
1. Open Keyboard Shortcuts (`Cmd+K Cmd+S` on Mac, `Ctrl+K Ctrl+S` on Windows/Linux)
2. Search for "MCP Dev Helper: Show Documentation"
3. Click the pencil icon to edit the keybinding

## Commands

- **`mcp-dev-helper.showDoc`** - Show Documentation
  - Title: "MCP Dev Helper: Show Documentation"
  - Default keybinding: `Alt+D`

## Troubleshooting

### Extension Not Working

**Check Server Status:**
- Ensure the HTTP server is running: `curl http://localhost:7777`
- If not running, start it: `npm start` (or `mcp-dev-helper start` if installed globally)

**Check Workspace:**
- Verify workspace folder name matches a project ID in config
- Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
- Run "MCP Dev Helper: Show Documentation" manually to see error messages

**Check VS Code Console:**
- Help → Toggle Developer Tools
- Look for errors in the Console tab
- Common issues:
  - Server not running
  - Workspace name mismatch
  - Network connection errors

### Documentation Not Found

**Symptoms:** Extension shows "Documentation not found" message

**Solutions:**
- Verify the `.md` file exists in the project's docs folder
- Check file name matches exactly (case-sensitive)
- Ensure the file has `.md` extension
- Verify the project ID matches your config

**Example:**
- Selected text: `api-client`
- Project ID: `react-native`
- Expected file: `/path/to/docs/react-native/api-client.md`

### Server Connection Error

**Symptoms:** Extension shows "Server is not running" error

**Solutions:**
- Start the server: `npm start` (or `mcp-dev-helper start` if installed globally)
- Verify server is running: `curl http://localhost:7777`
- Check if port 7777 is available
- Try restarting VS Code

### Wrong Project ID

**Symptoms:** Extension can't find the project

**Solutions:**
- Check workspace folder name matches project ID in config
- Verify `~/.mcp-dev-helper/config.yml` has the correct project ID
- Rename workspace folder or update config to match

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Project Structure

```
packages/vscode-plugin/
├── src/
│   └── extension.ts   # Extension implementation
├── out/                # Compiled JavaScript
└── package.json        # Extension manifest
```

### Testing

1. Open VS Code in this project
2. Press `F5` to launch Extension Development Host
3. In the new window:
   - Open a workspace with a matching project ID
   - Start the mcp-dev-helper server
   - Test the extension

## Features in Detail

### Text Selection

- **Selected text**: Uses the selected text as document name
- **No selection**: If nothing is selected, tries to get the word at cursor position
- **Case-sensitive**: Document names are case-sensitive

### Webview Panel

- Opens in a side panel (beside the editor)
- Styled to match VS Code theme
- Supports markdown rendering (headings, code blocks, links, etc.)
- Retains context when hidden

### Error Handling

- **404 Not Found**: Shows warning message
- **Server not running**: Shows error message with instructions
- **Network errors**: Shows error message with troubleshooting tips

## Example Use Cases

### Quick Reference

While coding, you need to check the API client pattern:
1. Select `api-client` in your code
2. Press `Alt+D`
3. View the documentation instantly

### Exploring Patterns

You want to see what patterns are available:
1. Select different pattern names
2. Press `Alt+D` for each
3. Compare documentation in side panels

### Onboarding

New team member needs to understand the project:
1. Open workspace
2. Select `README` or `project-structure`
3. Press `Alt+D`
4. View project documentation

## Limitations

- Requires HTTP server to be running
- Workspace folder name must match project ID
- Server URL is hardcoded to `localhost:7777`
- Document names are case-sensitive
- Only works with `.md` files

## Future Enhancements

- Configurable server URL
- Support for nested document paths
- Search functionality
- Recent documents list
- Document navigation (previous/next)

## License

MIT
