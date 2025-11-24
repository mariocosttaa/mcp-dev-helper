# MCP Dev Helper - HTTP Server & CLI

The core HTTP server and CLI for MCP Dev Helper. Provides a Fastify-based web server with a user-friendly interface and RESTful API for accessing your documentation.

## Quick Start

### 1. Build the Project

From the project root:

```bash
npm install
npm run build
```

### 2. Configure Projects

Create a configuration file at `~/.mcp-dev-helper/config.yml`:

```yaml
projects:
  - id: 'react-native'
    path: '/absolute/path/to/docs/react-native'
  - id: 'api'
    path: '/absolute/path/to/docs/api'
  - id: 'full-app'
    path: '/absolute/path/to/docs/full-app'
```

**Requirements:**
- Each project must have a unique `id`
- Paths must be absolute
- The server watches all `.md` files recursively

### 3. Run the Server

**From the project root (easiest):**

```bash
npm start
```

The server starts on `http://localhost:7777`. Open it in your browser!

**To stop the server:**

```bash
npm run stop
```

## Installation Options

### Development Mode (Easiest)

Just run from the project root after building:

```bash
npm start
```

### Global Installation (Optional)

If you want to use `mcp-dev-helper` command from anywhere:

```bash
npm install -g mcp-dev-helper
```

Then you can use:

```bash
mcp-dev-helper start
mcp-dev-helper stop
```

## Usage

### CLI Commands

#### Start Server

```bash
# From project root (easiest)
npm start

# With custom port (from packages/core)
cd packages/core
node dist/cli.js start --port 8080

# If installed globally
mcp-dev-helper start
```

#### Stop Server

```bash
# From project root
npm run stop

# If installed globally
mcp-dev-helper stop
```

### Web Interface

Once the server is running, access it at `http://localhost:7777` (or your custom port).

#### Available Routes

- **`GET /`** - Homepage listing all configured projects
- **`GET /projects/{project_id}`** - Lists all documentation files in a project
- **`GET /projects/{project_id}/{doc_name}`** - View a specific document

#### Example

1. Open `http://localhost:7777` in your browser
2. Click on a project (e.g., "react-native")
3. Click on a document (e.g., "api-client")
4. View the rendered Markdown documentation

### API Endpoint

#### GET /api/docs/:project_id/:doc_name

Get documentation content as HTML (for IDE integrations).

**Parameters:**
- `project_id` - Project ID from config
- `doc_name` - Document name without `.md` extension

**Example Request:**

```bash
curl http://localhost:7777/api/docs/react-native/api-client
```

**Example Response:**

```json
{
  "htmlContent": "<h1>API Client</h1><p>Documentation content...</p>"
}
```

**Status Codes:**
- `200 OK` - Document found and returned
- `404 Not Found` - Project or document not found
- `500 Internal Server Error` - Server error

## Features

### Hot Reload

The server automatically watches for changes:
- **Configuration file** (`~/.mcp-dev-helper/config.yml`) - Reloads project list on change
- **Markdown files** - Invalidates cache when files are modified

### In-Memory Cache

- Rendered HTML is cached in memory
- Cache is invalidated when source files change
- Sub-50ms response times for cached content

### Security

- Directory traversal protection
- Path validation to ensure files are within project directories
- Secure file path resolution

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Project Structure

```
packages/core/
├── src/
│   ├── cli.ts          # CLI entry point
│   ├── server.ts       # Fastify server implementation
│   ├── server-daemon.ts # Background server process
│   ├── config.ts       # Configuration loader
│   ├── cache.ts        # HTML cache implementation
│   └── watcher.ts      # File watcher for hot reload
└── dist/               # Compiled JavaScript
```

## Troubleshooting

### Server Won't Start

- **Port already in use**: Check if port 7777 (or your custom port) is already in use
- **Config file missing**: Ensure `~/.mcp-dev-helper/config.yml` exists
- **Invalid config**: Check YAML syntax and project paths
- **Paths don't exist**: Verify all project paths in config are valid

### Server Not Responding

- Check if server process is running: `ps aux | grep mcp-dev-helper`
- Verify server logs for errors
- Test with: `curl http://localhost:7777`

### Documentation Not Found

- Verify the file exists in the project's docs folder
- Check file name matches exactly (case-sensitive)
- Ensure the project ID matches your config
- Check file has `.md` extension

### Cache Issues

- Restart the server to clear cache
- Check file watcher is running (server logs)
- Verify file permissions allow reading

## Examples

### Start Server in Background

```bash
npm start
# Server starts in background, logs PID
```

### Access Documentation via API

```bash
# Get React Native API client docs
curl http://localhost:7777/api/docs/react-native/api-client

# Get API authentication patterns
curl http://localhost:7777/api/docs/api/backend/api-authentication-patterns
```

### View in Browser

1. Start server: `npm start`
2. Open: `http://localhost:7777`
3. Navigate through projects and documents

## License

MIT
