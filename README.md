# MCP Dev Helper

Ultra-fast, low-resource local documentation server designed for developers. Serves Markdown documentation from multiple projects through a single endpoint, accessible directly from your IDE or via MCP (Model Context Protocol) in Cursor.

## Features

- 🚀 **Fast HTTP Server** - Local Fastify server with web UI
- 🤖 **MCP Integration** - Access docs directly through Cursor's AI
- 📝 **VS Code Extension** - View docs with `Alt+D` keyboard shortcut
- 🔄 **Hot Reload** - Automatic reloading when docs change
- ⚡ **In-Memory Cache** - Sub-50ms response times
- 📚 **Multi-Project** - Manage docs from multiple projects in one place

## Project Structure

This is a monorepo containing:

- **`packages/core`** - HTTP server and CLI ([README](./packages/core/README.md))
- **`packages/mcp-server`** - MCP server for Cursor AI integration ([README](./packages/mcp-server/README.md))
- **`packages/vscode-plugin`** - VS Code extension ([README](./packages/vscode-plugin/README.md))

## Quick Start

### 1. Install Dependencies

```bash
npm install
npm run build
```

### 2. Configure Projects

Create `~/.mcp-dev-helper/config.yml`:

```yaml
projects:
  - id: 'react-native'
    path: '/absolute/path/to/docs/react-native'
  - id: 'api'
    path: '/absolute/path/to/docs/api'
  - id: 'full-app'
    path: '/absolute/path/to/docs/full-app'
```

### 3. Run the Server

**From the project root:**

```bash
npm start
```

The server will start on `http://localhost:7777`. Open it in your browser to view your documentation!

**To stop the server:**

```bash
npm run stop
```

### 4. Choose Your Integration

- **HTTP Server & CLI** - See [packages/core/README.md](./packages/core/README.md)
- **MCP Server (Cursor AI)** - See [packages/mcp-server/README.md](./packages/mcp-server/README.md)
- **VS Code Extension** - See [packages/vscode-plugin/README.md](./packages/vscode-plugin/README.md)

## Configuration

### Config File Location

`~/.mcp-dev-helper/config.yml`

### Config Format

```yaml
projects:
  - id: 'project-id'        # Unique identifier
    path: '/absolute/path'   # Absolute path to docs folder
```

### Requirements

- Each project must have a unique `id`
- Paths must be absolute
- The server watches all `.md` files recursively
- Config changes reload automatically

## Development

### Build All Packages

```bash
npm run build
```

### Watch Mode

```bash
# Core server (from project root)
npm run dev

# VS Code extension
cd packages/vscode-plugin && npm run watch

# MCP server
cd packages/mcp-server && npm run dev
```

### Linting & Formatting

```bash
npm run lint
npm run lint:fix
npm run format
```

## Documentation

- **[HTTP Server & CLI Guide](./packages/core/README.md)** - Complete guide for the HTTP server and CLI commands
- **[MCP Server Guide](./packages/mcp-server/README.md)** - Setup and usage for Cursor AI integration
- **[VS Code Extension Guide](./packages/vscode-plugin/README.md)** - Installation and usage in VS Code

## License

MIT
