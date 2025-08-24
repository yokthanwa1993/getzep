#!/usr/bin/env node

/**
 * NEEZS AI Chatbot
 * A TypeScript chatbot that uses ChatGPT with Zep Cloud Memory
 */

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

import { FastMCP } from "./fastmcp/src/FastMCP.js";
import { z } from "zod";
import { ZepClient } from "@getzep/zep-cloud";
import OpenAI from "openai";

// Initialize Zep Cloud client for NEEZS
const zepClient = new ZepClient({
  apiKey: process.env.ZEP_API_KEY || "your-neezs-api-key-here",
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "your-openai-api-key-here",
});

const server = new FastMCP({
  name: "NEEZS AI Chatbot",
  version: process.env.NEEZS_APP_VERSION || "1.0.0",
  ping: {
    intervalMs: 10000,
    logLevel: "debug",
  },
});

// Dynamic Configuration Management
let currentConfig = {
  APP_NAME: process.env.APP_NAME || process.env.NEEZS_APP_NAME || "NEEZS",
  USER_ID: process.env.USER_ID || process.env.NEEZS_DEFAULT_USER_ID || "neezs_user_",
  SESSION_ID: process.env.SESSION_ID || process.env.NEEZS_DEFAULT_SESSION_ID || "neezs_thread_",
  PROJECT_ID: process.env.PROJECT_ID || process.env.NEEZS_PROJECT_ID || "neezs-project",
  AI_MODEL: process.env.AI_MODEL || process.env.NEEZS_AI_MODEL || "gpt-4o-mini",
};

// Function to update configuration from MCP environment variables
function updateConfigFromEnv() {
  // Priority: MCP env > .env > default
  currentConfig.APP_NAME = process.env.APP_NAME || currentConfig.APP_NAME;
  currentConfig.USER_ID = process.env.USER_ID || currentConfig.USER_ID;
  currentConfig.SESSION_ID = process.env.SESSION_ID || currentConfig.SESSION_ID;
  currentConfig.PROJECT_ID = process.env.PROJECT_ID || currentConfig.PROJECT_ID;
  currentConfig.AI_MODEL = process.env.AI_MODEL || currentConfig.AI_MODEL;
  
  console.log("🔄 Configuration Updated from MCP Environment:");
  console.log(`   App: ${currentConfig.APP_NAME}`);
  console.log(`   Project ID: ${currentConfig.PROJECT_ID}`);
  console.log(`   AI Model: ${currentConfig.AI_MODEL}`);
  console.log(`   User Prefix: ${currentConfig.USER_ID}`);
  console.log(`   Session ID: ${currentConfig.SESSION_ID}`);
}

// Update config from environment variables (including MCP env)
updateConfigFromEnv();

console.log("🚀 NEEZS AI Chatbot Configuration:");
console.log(`   App: ${currentConfig.APP_NAME}`);
console.log(`   Project ID: ${currentConfig.PROJECT_ID}`);
console.log(`   AI Model: ${currentConfig.AI_MODEL}`);
console.log(`   User Prefix: ${currentConfig.USER_ID}`);
  console.log(`   Session ID: ${currentConfig.SESSION_ID}`);

// Tool: NEEZS AI Chat
const NEEZSChatParams = z.object({
  user_id: z.string().describe("NEEZS user ID"),
  session_id: z.string().describe("NEEZS session ID"),
  message: z.string().describe("User's message to NEEZS AI"),
  system_prompt: z.string().optional().describe("Optional system prompt for AI"),
});

server.addTool({
  name: "neezs_ai_chat",
  description: "Chat with NEEZS AI using ChatGPT and Zep Memory",
  parameters: NEEZSChatParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: false,
    title: "NEEZS AI Chat",
  },
  execute: async (args) => {
    try {
      // Use user_id directly if it already contains the full ID, otherwise add prefix
      const neezsUserId = args.user_id === 'yok' ? 'neezs_user_yok' 
        : args.user_id.includes('neezs_user_') 
        ? args.user_id 
        : `${currentConfig.USER_ID}${args.user_id}`;
      const neezsSessionId = `${currentConfig.SESSION_ID}${args.session_id}`;
      
      console.log(`NEEZS AI Chat - User: ${neezsUserId}, Session: ${neezsSessionId}`);
      
      // 1. Add user message to Zep
      await zepClient.thread.addMessages(neezsSessionId, {
        messages: [{
          role: "user",
          content: args.message,
          name: "User",
          metadata: {
            app: currentConfig.APP_NAME,
            project: currentConfig.PROJECT_ID,
            timestamp: new Date().toISOString(),
          },
        }],
      });
      
      // 2. Get memory context from Zep
      const memory = await zepClient.thread.getUserContext(neezsSessionId, {
        mode: "summary" as any,
      });
      
      console.log(`Memory context retrieved for session: ${neezsSessionId}`);
      
      // 3. Prepare system prompt
      const systemPrompt = args.system_prompt || `You are ${currentConfig.APP_NAME} AI, a helpful assistant with access to the user's memory and conversation history. Use the provided context to give personalized and relevant responses. Be friendly, helpful, and remember previous interactions.`;
      
      // 4. Prepare messages for ChatGPT
      const messages = [
        {
          role: "system" as const,
          content: systemPrompt,
        },
        {
          role: "assistant" as const,
          content: `Context from user's memory: ${memory?.context || "No previous context available."}`,
        },
        {
          role: "user" as const,
          content: args.message,
        },
      ];
      
      // 5. Get response from ChatGPT
      const response = await openai.chat.completions.create({
        model: currentConfig.AI_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      const aiResponse = response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
      
      // 6. Add AI response to Zep
      await zepClient.thread.addMessages(neezsSessionId, {
        messages: [{
          role: "assistant",
          content: aiResponse,
          name: `${currentConfig.APP_NAME} AI`,
          metadata: {
            app: currentConfig.APP_NAME,
            project: currentConfig.PROJECT_ID,
            timestamp: new Date().toISOString(),
            ai_model: currentConfig.AI_MODEL,
          },
        }],
      });
      
      return `NEEZS AI Response: ${aiResponse}`;
    } catch (error) {
      throw new Error(`NEEZS AI Chat failed: ${error}`);
    }
  },
});

// Tool: NEEZS Knowledge Search
const NEEZSSearchParams = z.object({
  user_id: z.string().describe("NEEZS user ID to search knowledge for"),
  query: z.string().describe("Search query"),
  limit: z.number().default(5).describe("Maximum number of results"),
});

server.addTool({
  name: "neezs_knowledge_search",
  description: "Search NEEZS user's knowledge graph and memory",
  parameters: NEEZSSearchParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "NEEZS Knowledge Search",
  },
  execute: async (args) => {
    try {
      // Use user_id directly if it already contains the full ID, otherwise add prefix
      const neezsUserId = args.user_id === 'yok' ? 'neezs_user_yok' 
        : args.user_id.includes('neezs_user_') 
        ? args.user_id 
        : `${currentConfig.USER_ID}${args.user_id}`;
      console.log(`Searching NEEZS knowledge for user: ${neezsUserId}, query: ${args.query}`);
      
      const results = await zepClient.graph.search({
        graphId: neezsUserId,
        query: args.query,
        limit: args.limit,
      });
      
      return `NEEZS Knowledge Search Results for "${args.query}": ${JSON.stringify(results)}`;
    } catch (error) {
      throw new Error(`NEEZS Knowledge Search failed: ${error}`);
    }
  },
});

// Tool: NEEZS Memory Summary
const NEEZSMemorySummaryParams = z.object({
  user_id: z.string().describe("NEEZS user ID"),
  session_id: z.string().describe("NEEZS session ID"),
});

server.addTool({
  name: "neezs_memory_summary",
  description: "Get a summary of NEEZS user's memory and conversation history",
  parameters: NEEZSMemorySummaryParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "NEEZS Memory Summary",
  },
  execute: async (args) => {
    try {
      // Use user_id directly if it already contains the full ID, otherwise add prefix
      const neezsUserId = args.user_id === 'yok' ? 'neezs_user_yok' 
        : args.user_id.includes('neezs_user_') 
        ? args.user_id 
        : `${currentConfig.USER_ID}${args.user_id}`;
      const neezsSessionId = `${currentConfig.SESSION_ID}${args.session_id}`;
      
      console.log(`Getting NEEZS memory summary for user: ${neezsUserId}, session: ${neezsSessionId}`);
      
      const memory = await zepClient.thread.getUserContext(neezsSessionId, {
        mode: "summary" as any,
      });
      
      return `NEEZS Memory Summary for ${neezsUserId} (${neezsSessionId}): ${JSON.stringify(memory)}`;
    } catch (error) {
      throw new Error(`NEEZS Memory Summary failed: ${error}`);
    }
  },
});

// Tool: Create NEEZS User (for AI chatbot)
const CreateNEEZSUserParams = z.object({
  user_id: z.string().describe("Unique user identifier for NEEZS"),
  first_name: z.string().optional().describe("User's first name"),
  last_name: z.string().optional().describe("User's last name"),
  email: z.string().optional().describe("User's email address"),
});

server.addTool({
  name: "create_neezs_user",
  description: "Create a new user in NEEZS for AI chatbot",
  parameters: CreateNEEZSUserParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: false,
    title: "Create NEEZS User",
  },
  execute: async (args) => {
    try {
      // Use user_id directly if it already contains the full ID, otherwise add prefix
      const neezsUserId = args.user_id === 'yok' ? 'neezs_user_yok' 
        : args.user_id.includes('neezs_user_') 
        ? args.user_id 
        : `${currentConfig.USER_ID}${args.user_id}`;
      console.log(`Creating NEEZS user: ${neezsUserId}`);
      
      const user = await zepClient.user.add({
        userId: args.user_id,
        firstName: args.first_name || "",
        lastName: args.last_name || "",
        email: args.email || "",
        metadata: {
          app: currentConfig.APP_NAME,
          project: currentConfig.PROJECT_ID,
          created_for: "ai_chatbot",
        },
      });
      
      return `NEEZS user ${neezsUserId} created successfully for AI chatbot`;
    } catch (error) {
      throw new Error(`Failed to create NEEZS user: ${error}`);
    }
  },
});

// Tool: Get NEEZS User
const GetNEEZSUserParams = z.object({
  user_id: z.string().describe("NEEZS user ID to retrieve"),
});

server.addTool({
  name: "get_neezs_user",
  description: "Get details of a NEEZS user",
  parameters: GetNEEZSUserParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "Get NEEZS User",
  },
  execute: async (args) => {
    try {
      // Use user_id directly if it already contains the full ID, otherwise add prefix
      const neezsUserId = args.user_id === 'yok' ? 'neezs_user_yok' 
        : args.user_id.includes('neezs_user_') 
        ? args.user_id 
        : `${currentConfig.USER_ID}${args.user_id}`;
      console.log(`Getting NEEZS user: ${neezsUserId}`);
      
      const user = await zepClient.user.get(neezsUserId);
      
      return `NEEZS User Details: ${JSON.stringify(user)}`;
    } catch (error) {
      throw new Error(`Failed to get NEEZS user: ${error}`);
    }
  },
});

// Tool: List NEEZS Users
const ListNEEZSUsersParams = z.object({
  limit: z.number().optional().describe("Maximum number of users to return"),
  offset: z.number().optional().describe("Number of users to skip"),
});

server.addTool({
  name: "list_neezs_users",
  description: "List all NEEZS users",
  parameters: ListNEEZSUsersParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "List NEEZS Users",
  },
  execute: async (args) => {
    try {
      console.log(`Listing NEEZS users with limit: ${args.limit || 10}, offset: ${args.offset || 0}`);
      
      const users = await zepClient.user.listOrdered({
        pageSize: args.limit || 10,
        pageNumber: Math.floor((args.offset || 0) / (args.limit || 10)) + 1,
      });
      
      return `NEEZS Users: ${JSON.stringify(users)}`;
    } catch (error) {
      throw new Error(`Failed to list NEEZS users: ${error}`);
    }
  },
});

// Tool: Create User (Generic)
const CreateUserParams = z.object({
  user_id: z.string().describe("Unique user identifier"),
  first_name: z.string().optional().describe("User's first name"),
  last_name: z.string().optional().describe("User's last name"),
  email: z.string().optional().describe("User's email address"),
});

server.addTool({
  name: "create_user",
  description: "Create a new user",
  parameters: CreateUserParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: false,
    title: "Create User",
  },
  execute: async (args) => {
    try {
      console.log(`Creating user: ${args.user_id}`);
      
      const user = await zepClient.user.add({
        userId: args.user_id,
        firstName: args.first_name || "",
        lastName: args.last_name || "",
        email: args.email || "",
        metadata: {
          app: currentConfig.APP_NAME,
          project: currentConfig.PROJECT_ID,
          created_at: new Date().toISOString(),
        },
      });
      
      return `User ${args.user_id} created successfully`;
    } catch (error) {
      throw new Error(`Failed to create user: ${error}`);
    }
  },
});

// Tool: Get User (Generic)
const GetUserParams = z.object({
  user_id: z.string().describe("User ID to retrieve"),
});

server.addTool({
  name: "get_user",
  description: "Get details of a user",
  parameters: GetUserParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "Get User",
  },
  execute: async (args) => {
    try {
      console.log(`Getting user: ${args.user_id}`);
      
      const user = await zepClient.user.get(args.user_id);
      
      return `User Details: ${JSON.stringify(user)}`;
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`);
    }
  },
});

// Tool: List Users (Generic)
const ListUsersParams = z.object({
  limit: z.number().optional().describe("Maximum number of users to return"),
  offset: z.number().optional().describe("Number of users to skip"),
});

server.addTool({
  name: "list_users",
  description: "List all users",
  parameters: ListUsersParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "List Users",
  },
  execute: async (args) => {
    try {
      console.log(`Listing users with limit: ${args.limit || 10}, offset: ${args.offset || 0}`);
      
      const users = await zepClient.user.listOrdered({
        pageSize: args.limit || 10,
        pageNumber: Math.floor((args.offset || 0) / (args.limit || 10)) + 1,
      });
      
      return `Users: ${JSON.stringify(users)}`;
    } catch (error) {
      throw new Error(`Failed to list users: ${error}`);
    }
  },
});

// Tool: Create NEEZS Session (for AI chatbot)
const CreateNEEZSSessionParams = z.object({
  session_id: z.string().describe("Unique session identifier for NEEZS"),
  user_id: z.string().describe("NEEZS user ID to associate with session"),
});

server.addTool({
  name: "create_neezs_session",
  description: "Create a new conversation session for NEEZS AI chatbot",
  parameters: CreateNEEZSSessionParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: false,
    title: "Create NEEZS Session",
  },
  execute: async (args) => {
    try {
      // Use user_id directly if it already contains the full ID, otherwise add prefix
      const neezsUserId = args.user_id === 'yok' ? 'neezs_user_yok' 
        : args.user_id.includes('neezs_user_') 
        ? args.user_id 
        : `${currentConfig.USER_ID}${args.user_id}`;
      const neezsSessionId = `${currentConfig.SESSION_ID}${args.session_id}`;
      
      console.log(`Creating NEEZS session: ${neezsSessionId} for user: ${neezsUserId}`);
      
      await zepClient.thread.create({
        threadId: neezsSessionId,
        userId: neezsUserId,
        metadata: {
          app: currentConfig.APP_NAME,
          project: currentConfig.PROJECT_ID,
          session_type: "neezs_ai_chat",
          created_at: new Date().toISOString(),
        },
      });
      
      return `NEEZS session ${neezsSessionId} created successfully for AI chatbot`;
    } catch (error) {
      throw new Error(`Failed to create NEEZS session: ${error}`);
    }
  },
});

// Tool: Get NEEZS Session
const GetNEEZSSessionParams = z.object({
  session_id: z.string().describe("NEEZS session ID to retrieve"),
});

server.addTool({
  name: "get_neezs_session",
  description: "Get details of a NEEZS session",
  parameters: GetNEEZSSessionParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "Get NEEZS Session",
  },
  execute: async (args) => {
    try {
      const neezsSessionId = `${currentConfig.SESSION_ID}${args.session_id}`;
      console.log(`Getting NEEZS session: ${neezsSessionId}`);
      
      const session = await zepClient.thread.get(neezsSessionId);
      
      return `NEEZS Session Details: ${JSON.stringify(session)}`;
    } catch (error) {
      throw new Error(`Failed to get NEEZS session: ${error}`);
    }
  },
});

// Tool: Add NEEZS Memory (Knowledge Graph)
const AddNEEZSMemoryParams = z.object({
  user_id: z.string().describe("NEEZS user ID"),
  content: z.string().describe("Memory content to add"),
  metadata: z.record(z.any()).optional().describe("Optional metadata for the memory"),
  memory_type: z.string().optional().describe("Type of memory (e.g., 'fact', 'preference', 'project_info')"),
});

server.addTool({
  name: "add_neezs_memory",
  description: "Add memory/facts to NEEZS user's knowledge graph",
  parameters: AddNEEZSMemoryParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: false,
    title: "Add NEEZS Memory",
  },
  execute: async (args) => {
    try {
      // Use user_id directly if it already contains the full ID, otherwise add prefix
      const neezsUserId = args.user_id === 'yok' ? 'neezs_user_yok' 
        : args.user_id.includes('neezs_user_') 
        ? args.user_id 
        : `${currentConfig.USER_ID}${args.user_id}`;
      console.log(`Adding NEEZS memory for user: ${neezsUserId}`);
      
      // Try to create user graph first if it doesn't exist
      try {
        await zepClient.graph.create({
          graphId: neezsUserId,
          name: `NEEZS Graph for ${neezsUserId}`,
          description: `Knowledge graph for NEEZS user ${neezsUserId}`,
        });
        console.log(`Created new graph for ${neezsUserId}`);
      } catch (createError) {
        // Graph might already exist, continue
        console.log(`Graph for ${neezsUserId} might already exist`);
      }
      
      const memory = await zepClient.graph.add({
        graphId: neezsUserId,
        data: args.content,
        type: "text",
        metadata: {
          app: currentConfig.APP_NAME,
          project: currentConfig.PROJECT_ID,
          memory_type: args.memory_type || "fact",
          created_at: new Date().toISOString(),
          ...args.metadata,
        },
      });
      
      return `NEEZS memory added successfully for user ${neezsUserId}`;
    } catch (error) {
      throw new Error(`Failed to add NEEZS memory: ${error}`);
    }
  },
});

// Tool: Get NEEZS Memory
const GetNEEZSMemoryParams = z.object({
  user_id: z.string().describe("NEEZS user ID"),
  memory_id: z.string().describe("Memory ID to retrieve"),
});

server.addTool({
  name: "get_neezs_memory",
  description: "Get specific memory from NEEZS user's knowledge graph",
  parameters: GetNEEZSMemoryParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "Get NEEZS Memory",
  },
  execute: async (args) => {
    try {
      // Use user_id directly if it already contains the full ID, otherwise add prefix
      const neezsUserId = args.user_id === 'yok' ? 'neezs_user_yok' 
        : args.user_id.includes('neezs_user_') 
        ? args.user_id 
        : `${currentConfig.USER_ID}${args.user_id}`;
      console.log(`Getting NEEZS memory for user: ${neezsUserId}, memory: ${args.memory_id}`);
      
      // Try to get memory by searching for it first
      const searchResult = await zepClient.graph.search({
        graphId: neezsUserId,
        query: "*",
        limit: 50,
      });
      
      const memory = searchResult.edges?.find(edge => edge.uuid === args.memory_id);
      
      if (!memory) {
        throw new Error(`Memory with ID ${args.memory_id} not found`);
      }
      
      return `NEEZS Memory: ${JSON.stringify(memory)}`;
    } catch (error) {
      throw new Error(`Failed to get NEEZS memory: ${error}`);
    }
  },
});

// Tool: List NEEZS Memories
const ListNEEZSMemoriesParams = z.object({
  user_id: z.string().describe("NEEZS user ID"),
  limit: z.number().optional().describe("Maximum number of memories to return"),
  offset: z.number().optional().describe("Number of memories to skip"),
  memory_type: z.string().optional().describe("Filter by memory type"),
});

server.addTool({
  name: "list_neezs_memories",
  description: "List all memories from NEEZS user's knowledge graph",
  parameters: ListNEEZSMemoriesParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "List NEEZS Memories",
  },
  execute: async (args) => {
    try {
      // Use user_id directly if it already contains the full ID, otherwise add prefix
      const neezsUserId = args.user_id === 'yok' ? 'neezs_user_yok' 
        : args.user_id.includes('neezs_user_') 
        ? args.user_id 
        : `${currentConfig.USER_ID}${args.user_id}`;
      console.log(`Listing NEEZS memories for user: ${neezsUserId}`);
      
      const memories = await zepClient.graph.search({
        graphId: neezsUserId,
        query: args.memory_type || "*",
        limit: args.limit || 10,
      });
      
      return `NEEZS Memories for ${neezsUserId}: ${JSON.stringify(memories)}`;
    } catch (error) {
      throw new Error(`Failed to list NEEZS memories: ${error}`);
    }
  },
});

// Tool: Search NEEZS Memories
const SearchNEEZSMemoriesParams = z.object({
  user_id: z.string().describe("NEEZS user ID"),
  query: z.string().describe("Search query for memories"),
  limit: z.number().optional().describe("Maximum number of results to return"),
  memory_type: z.string().optional().describe("Filter by memory type"),
});

server.addTool({
  name: "search_neezs_memories",
  description: "Search memories in NEEZS user's knowledge graph",
  parameters: SearchNEEZSMemoriesParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "Search NEEZS Memories",
  },
  execute: async (args) => {
    try {
      // Use user_id directly if it already contains the full ID, otherwise add prefix
      const neezsUserId = args.user_id === 'yok' ? 'neezs_user_yok' 
        : args.user_id.includes('neezs_user_') 
        ? args.user_id 
        : `${currentConfig.USER_ID}${args.user_id}`;
      console.log(`Searching NEEZS memories for user: ${neezsUserId}, query: ${args.query}`);
      
      const searchResults = await zepClient.graph.search({
        graphId: neezsUserId,
        query: args.query,
        limit: args.limit || 5,
        metadata: args.memory_type ? { memory_type: args.memory_type } : undefined,
      });
      
      return `NEEZS Memory Search Results for ${neezsUserId}: ${JSON.stringify(searchResults)}`;
    } catch (error) {
      throw new Error(`Failed to search NEEZS memories: ${error}`);
    }
  },
});

// Tool: Delete NEEZS Memory
const DeleteNEEZSMemoryParams = z.object({
  user_id: z.string().describe("NEEZS user ID"),
  memory_id: z.string().describe("Memory ID to delete"),
});

server.addTool({
  name: "delete_neezs_memory",
  description: "Delete specific memory from NEEZS user's knowledge graph",
  parameters: DeleteNEEZSMemoryParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: false,
    title: "Delete NEEZS Memory",
  },
  execute: async (args) => {
    try {
      // Use user_id directly if it already contains the full ID, otherwise add prefix
      const neezsUserId = args.user_id === 'yok' ? 'neezs_user_yok' 
        : args.user_id.includes('neezs_user_') 
        ? args.user_id 
        : `${currentConfig.USER_ID}${args.user_id}`;
      console.log(`Deleting NEEZS memory for user: ${neezsUserId}, memory: ${args.memory_id}`);
      
      await zepClient.graph.delete({
        graphId: neezsUserId,
        memoryId: args.memory_id,
      });
      
      return `NEEZS memory ${args.memory_id} deleted successfully for user ${neezsUserId}`;
    } catch (error) {
      throw new Error(`Failed to delete NEEZS memory: ${error}`);
    }
  },
});

// Start the server
const port = parseInt(process.env.MCP_SERVER_PORT || "8000");
const host = process.env.MCP_SERVER_HOST || "0.0.0.0";

server.start({
  transportType: "httpStream",
  httpStream: {
    port: port,
    host: host,
  },
});

console.log(`🚀 NEEZS AI Chatbot started on http://${host}:${port}`);
console.log(`📡 SSE endpoint: http://${host}:${port}/sse`);
console.log("💡 NEEZS AI Chatbot Ready!");
console.log("🔑 Zep Cloud API Key:", process.env.ZEP_API_KEY ? "✅ Set" : "❌ Not set");
console.log("🔑 OpenAI API Key:", process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Not set");
