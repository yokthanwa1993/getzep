import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ZepClient } from "@getzep/zep-cloud";
import * as dotenv from "dotenv";

dotenv.config();

const ZEP_API_KEY = process.env.ZEP_API_KEY!;

// Debug: Check if API key is loaded
console.error("ZEP_API_KEY loaded:", ZEP_API_KEY ? "YES" : "NO");
console.error("ZEP_API_KEY length:", ZEP_API_KEY?.length || 0);

const zepClient = new ZepClient({
  apiKey: ZEP_API_KEY,
});

const server = new Server({
  name: "my-memory",
  version: "1.0.0",
});

// Tool schemas
const AddMemorySchema = z.object({
  sessionId: z.string().describe("Session ID for the memory"),
  content: z.string().describe("Content to store in memory"),
  metadata: z.record(z.any()).optional().describe("Optional metadata for the memory"),
});

const SearchMemorySchema = z.object({
  sessionId: z.string().describe("Session ID to search in"),
  query: z.string().describe("Search query"),
  limit: z.number().optional().describe("Maximum number of results to return"),
});

const GetMemorySchema = z.object({
  sessionId: z.string().describe("Session ID to get memories from"),
  limit: z.number().optional().describe("Maximum number of memories to return"),
});

const DeleteMemorySchema = z.object({
  sessionId: z.string().describe("Session ID to delete memories from"),
});

// Add memory to Zep Cloud
async function addMemoryToZep(sessionId: string, content: string, metadata?: any) {
  try {
    // Create user if not exists
    const userId = `user_${sessionId}`;
    let userExists = false;
    try {
      await zepClient.user.get(userId);
      userExists = true;
      console.log(`Using existing user: ${userId}`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.log(`User ${userId} not found, will create`);
      } else {
        console.error(`Error checking if user exists: ${userId}:`, error);
        throw error;
      }
    }

    // Create user if it doesn't exist
    if (!userExists) {
      await zepClient.user.add({
        userId: userId,
        firstName: "User",
        lastName: sessionId,
        email: `${sessionId}@example.com`,
      });
      console.log(`Created new user: ${userId}`);
    }

    // Create thread (always try to create, handle conflicts gracefully)
    const threadId = `thread_${sessionId}`;
    try {
      await zepClient.thread.create({
        threadId: threadId,
        userId: userId,
      });
      console.log(`Created new thread: ${threadId}`);
    } catch (error: any) {
      if (error.statusCode === 409 || error.statusCode === 400) {
        console.log(`Thread ${threadId} already exists, continuing...`);
      } else {
        console.error(`Error creating thread:`, error);
        throw error;
      }
    }

    // Add message to thread
    await zepClient.thread.addMessages(threadId, {
      messages: [{
        role: "user",
        content: content,
      }],
    });

    return { success: true, message: "Memory added successfully" };
  } catch (error) {
    console.error("Error adding memory to Zep:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Search memory in Zep Cloud
async function searchMemoryInZep(sessionId: string, query: string, limit: number = 10) {
  try {
    const threadId = `thread_${sessionId}`;

    // Search in thread messages (using getUserContext as search)
    const contextResponse = await zepClient.thread.getUserContext(threadId, { mode: "basic" });
    
    // For now, return the context as a simple search result
    // You can implement more sophisticated search logic here
    return {
      success: true,
      results: contextResponse.context ? [{ content: contextResponse.context }] : [],
      total: contextResponse.context ? 1 : 0,
    };
  } catch (error) {
    console.error("Error searching memory in Zep:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Get memory from Zep Cloud
async function getMemoryFromZep(sessionId: string, limit: number = 10) {
  try {
    const threadId = `thread_${sessionId}`;

    // Get thread messages
    const thread = await zepClient.thread.get(threadId, { limit });

    return {
      success: true,
      messages: thread.messages || [],
      total: thread.messages?.length || 0,
    };
  } catch (error) {
    console.error("Error getting memory from Zep:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Delete memory from Zep Cloud
async function deleteMemoryFromZep(sessionId: string) {
  try {
    const threadId = `thread_${sessionId}`;
    
    // Delete thread (this will delete all messages in the thread)
    await zepClient.thread.delete(threadId);

    return { success: true, message: "Memory deleted successfully" };
  } catch (error) {
    console.error("Error deleting memory from Zep:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add_memory",
        description: "Add a memory to a session",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "Session ID for the memory"
            },
            content: {
              type: "string", 
              description: "Content to store in memory"
            },
            metadata: {
              type: "object",
              description: "Optional metadata for the memory"
            }
          },
          required: ["sessionId", "content"]
        },
      },
      {
        name: "search_memory",
        description: "Search memories in a session",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "Session ID to search in"
            },
            query: {
              type: "string",
              description: "Search query"
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return"
            }
          },
          required: ["sessionId", "query"]
        },
      },
      {
        name: "get_memory",
        description: "Get all memories from a session",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "Session ID to get memories from"
            },
            limit: {
              type: "number",
              description: "Maximum number of memories to return"
            }
          },
          required: ["sessionId"]
        },
      },
      {
        name: "delete_memory",
        description: "Delete all memories from a session",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "Session ID to delete memories from"
            }
          },
          required: ["sessionId"]
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "add_memory": {
      const { sessionId, content, metadata } = AddMemorySchema.parse(args);
      const result = await addMemoryToZep(sessionId, content, metadata);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case "search_memory": {
      const { sessionId, query, limit } = SearchMemorySchema.parse(args);
      const result = await searchMemoryInZep(sessionId, query, limit);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case "get_memory": {
      const { sessionId, limit } = GetMemorySchema.parse(args);
      const result = await getMemoryFromZep(sessionId, limit);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case "delete_memory": {
      const { sessionId } = DeleteMemorySchema.parse(args);
      const result = await deleteMemoryFromZep(sessionId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Zep Cloud MCP Server started");
}

main().catch(console.error);
