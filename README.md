# Zep Cloud MCP Server for Cursor

A TypeScript-based MCP (Model Context Protocol) server that provides AI-powered memory management capabilities for Cursor using Zep Cloud.

## Features

- 🧠 **AI-Powered Memory Management** with Zep Cloud
- 🔍 **Smart Memory Search** with entity extraction
- 📊 **Knowledge Graph** built automatically
- 💾 **Persistent Storage** on Zep Cloud
- 📡 **MCP Compatible** for Cursor integration

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
ZEP_API_KEY=your_zep_cloud_api_key_here
```

### 3. Build and Run

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## MCP Tools

The server provides the following MCP tools:

### Memory Operations
- `add_memory` - Add memory to a session
- `search_memory` - Search memories with AI-powered context
- `get_memory` - Get all memories for a session
- `delete_memory` - Delete all memories for a session

## Usage Examples

### Adding Memory
```bash
# Using MCP protocol
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "add_memory",
    "arguments": {
      "sessionId": "user123",
      "content": "User likes TypeScript and React"
    }
  }
}
```

### Searching Memory
```bash
# Using MCP protocol
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_memory",
    "arguments": {
      "sessionId": "user123",
      "query": "TypeScript",
      "limit": 5
    }
  }
}
```

## Cursor MCP Configuration

The project includes a local MCP configuration file (`.cursor/mcp.json`) that Cursor will automatically detect:

```json
{
  "mcpServers": {
    "my-memory": {
      "command": "node",
      "args": ["./dist/mcp-server.js"]
    }
  }
}
```

**Note:** Cursor will use this local configuration automatically when you open this project. No global configuration needed!

## Project Structure

```
├── .cursor/
│   └── mcp.json          # Local MCP configuration
├── src/
│   └── mcp-server.ts # MCP server implementation
├── dist/             # Compiled JavaScript files
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```

## Dependencies

- **@getzep/zep-cloud** - Zep Cloud client for AI-powered memory
- **@modelcontextprotocol/sdk** - MCP protocol implementation
- **dotenv** - Environment variables
- **zod** - Schema validation

## Development

The MCP server communicates via stdio with Cursor. No HTTP server is needed.

### Testing

Test the MCP server directly:

```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "add_memory", "arguments": {"sessionId": "test", "content": "Hello World"}}}' | node dist/mcp-server.js
```

## License

MIT
