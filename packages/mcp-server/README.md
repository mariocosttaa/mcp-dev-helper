# MCP Dev Helper - MCP Server

MCP (Model Context Protocol) server for MCP Dev Helper. Enables Cursor's AI to directly access and query your documentation through natural language.

## What is MCP?

MCP allows AI assistants (like Cursor's AI) to access your documentation through tools and resources. Instead of manually looking up files, you can ask Cursor AI directly about your documentation.

## Quick Start

### 1. Build the Project

From the project root:

```bash
npm install
npm run build
```

### 2. Build the MCP Server

```bash
cd packages/mcp-server
npm run build
```

### 3. Configure Cursor

Edit your `~/.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "mcp-dev-helper": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-dev-helper/packages/mcp-server/dist/index.js"
      ]
    }
  }
}
```

**Important**: Replace `/absolute/path/to/mcp-dev-helper` with the actual absolute path to your project.

**Example:**
```json
{
  "mcpServers": {
    "mcp-dev-helper": {
      "command": "node",
      "args": [
        "/Users/mario/Documents/dev-projects/mcp-dev-helper/packages/mcp-server/dist/index.js"
      ]
    }
  }
}
```

### 3. Restart Cursor

**Critical**: You must completely restart Cursor for the MCP configuration to take effect.

## Usage

Once configured, you can ask Cursor AI about your documentation using natural language.

### Example Queries

#### Get Documentation

```
Show me the React Native api-client documentation
```

```
Get me the full-app backend-translation-patterns docs
```

#### List Projects

```
What projects are available in MCP Dev Helper?
```

#### List Documents

```
List all documents in the react-native project
```

```
What documentation files are in the api project?
```

#### Search Documents

```
Search for documentation about caching
```

```
Find docs related to authentication
```

## Available MCP Tools

The MCP server provides the following tools:

### 1. `get_documentation`

Get HTML content of a specific document.

**Parameters:**
- `project_id` (string, required) - The project ID (e.g., "react-native", "api", "full-app")
- `doc_name` (string, required) - The document name without `.md` extension (e.g., "api-client", "README")

**Example:**
- Project: `react-native`
- Document: `api-client`
- Returns: HTML content of `api-client.md`

### 2. `list_projects`

List all configured projects in MCP Dev Helper.

**Parameters:** None

**Returns:** List of all projects with their IDs and paths

### 3. `list_documents`

List all documents in a specific project.

**Parameters:**
- `project_id` (string, required) - The project ID

**Returns:** List of all `.md` files in the project (recursively)

### 4. `search_documents`

Search for documents by name across all projects.

**Parameters:**
- `query` (string, required) - Search query (document name or partial match)

**Returns:** List of matching documents with their project IDs

## Available Resources

Resources are accessible via URI: `mcp-dev-helper://{project_id}/{doc_name}`

- `mcp-dev-helper://react-native` - React Native project docs
- `mcp-dev-helper://api` - API project docs
- `mcp-dev-helper://full-app` - Full App project docs
- `mcp-dev-helper://react-native/api-client` - Specific document

## Configuration

The MCP server uses the same configuration file as the HTTP server:

**Location:** `~/.mcp-dev-helper/config.yml`

**Format:**
```yaml
projects:
  - id: 'react-native'
    path: '/absolute/path/to/docs/react-native'
  - id: 'api'
    path: '/absolute/path/to/docs/api'
```

## Testing

### Test the MCP Server Directly

```bash
cd packages/mcp-server
node dist/index.js
```

The server runs on stdio (standard input/output), which is how MCP servers communicate. It will wait for input - this is normal.

### Verify in Cursor

1. Open Cursor
2. Open the Chat/Composer
3. Ask: "What tools are available from mcp-dev-helper?"
4. The AI should list the available tools

## Troubleshooting

### MCP Server Not Found

**Symptoms:** Cursor doesn't recognize the MCP server

**Solutions:**
- Verify the path in `~/.cursor/mcp.json` is absolute and correct
- Ensure you've built the server: `npm run build` in `packages/mcp-server`
- Check that `dist/index.js` exists
- Verify the path uses forward slashes (even on Windows/Mac)

### Config Not Loading

**Symptoms:** MCP server can't find projects

**Solutions:**
- Verify `~/.mcp-dev-helper/config.yml` exists
- Check the config file has valid YAML syntax
- Ensure project paths are absolute and exist
- Check file permissions

### Tools Not Available

**Symptoms:** Cursor AI doesn't show MCP Dev Helper tools

**Solutions:**
- **Restart Cursor completely** after updating `mcp.json`
- Check Cursor's developer console for errors
- Verify the MCP server is running (check process list)
- Try asking: "What MCP servers are available?"

### Server Errors

**Symptoms:** MCP server crashes or returns errors

**Solutions:**
- Check server logs (if available in Cursor's console)
- Verify Node.js version (requires >= 18.0.0)
- Ensure all dependencies are installed: `npm install`
- Rebuild the server: `npm run build`

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
packages/mcp-server/
├── src/
│   └── index.ts      # MCP server implementation
└── dist/             # Compiled JavaScript
```

## Benefits

✅ **Direct AI Access** - Ask Cursor AI about your docs naturally  
✅ **Context-Aware** - AI can search and retrieve relevant documentation  
✅ **No Manual Lookup** - No need to remember file names or paths  
✅ **Integrated Workflow** - Documentation access within your coding flow  
✅ **Natural Language** - Use conversational queries instead of exact commands

## Example Workflows

### Getting Started with a New Feature

```
You: "Show me the React Native router-pattern documentation"
AI: [Fetches and displays router-pattern.md]
```

### Exploring Available Documentation

```
You: "What documentation is available for API authentication?"
AI: [Searches and lists relevant docs]
```

### Quick Reference

```
You: "Get me the caching strategy docs"
AI: [Fetches caching-strategy.md from react-native project]
```

## Next Steps

1. Build the MCP server: `cd packages/mcp-server && npm run build`
2. Update `~/.cursor/mcp.json` with the correct absolute path
3. Restart Cursor completely
4. Try asking: "Show me the React Native api-client documentation"

Enjoy seamless documentation access through Cursor's AI! 🚀

## License

MIT

