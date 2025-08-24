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

// Simplified Configuration Management
const config = {
  APP_NAME: process.env.APP_NAME || "NEEZS_APP",
  USER_ID: process.env.USER_ID || "default_neezs_user", // Read from .env
  PROJECT_ID: process.env.PROJECT_ID || "default_neezs_project",
  SESSION_ID_PREFIX: "", // No prefix for simplicity
  AI_MODEL: process.env.AI_MODEL || "gpt-4o-mini",
};

console.log("🚀 NEEZS AI Chatbot Configuration:");
console.log(`   App Name: ${config.APP_NAME}`);
console.log(`   Project ID: ${config.PROJECT_ID}`);
console.log(`   User ID: ${config.USER_ID}`);
console.log(`   AI Model: ${config.AI_MODEL}`);

// Tool: NEEZS Chat
const NEEZSChatParams = z.object({
  session_id: z.string().describe("Unique session identifier (without prefix)"),
  message: z.string().describe("User's message to NEEZS AI"),
  system_prompt: z.string().optional().describe("Optional system prompt for AI"),
});

server.addTool({
  name: "neezs_chat",
  description: "Chat with NEEZS AI using ChatGPT and Zep Memory",
  parameters: NEEZSChatParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: false,
    title: "NEEZS Chat",
  },
  execute: async (args) => {
    try {
      const neezsUserId = config.USER_ID;
      const neezsSessionId = `${config.SESSION_ID_PREFIX}${args.session_id}`;
      
      console.log(`NEEZS Chat - User: ${neezsUserId}, Session: ${neezsSessionId}`);
      
      // 1. Add user message to Zep
      await zepClient.thread.addMessages(neezsSessionId, {
        messages: [{
          role: "user",
          content: args.message,
          name: "User",
          metadata: {
            app: config.APP_NAME,
            project: config.PROJECT_ID,
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
      const systemPrompt = args.system_prompt || `You are ${config.APP_NAME} AI, a helpful assistant with access to the user's memory and conversation history. Use the provided context to give personalized and relevant responses. Be friendly, helpful, and remember previous interactions.`;
      
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
        model: config.AI_MODEL,
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
          name: `${config.APP_NAME} AI`,
          metadata: {
            app: config.APP_NAME,
            project: config.PROJECT_ID,
            timestamp: new Date().toISOString(),
            ai_model: config.AI_MODEL,
          },
        }],
      });
      
      return `NEEZS AI Response: ${aiResponse}`;
    } catch (error) {
      throw new Error(`NEEZS AI Chat failed: ${error}`);
    }
  },
});

// Tool: Session Summary
const SessionSummaryParams = z.object({
  session_id: z.string().describe("NEEZS session ID"),
});

server.addTool({
  name: "session_summary",
  description: "Get a summary of a specific session's conversation history",
  parameters: SessionSummaryParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "Session Summary",
  },
  execute: async (args) => {
    try {
      const neezsUserId = config.USER_ID;
      const neezsSessionId = `${config.SESSION_ID_PREFIX}${args.session_id}`;
      
      console.log(`Getting session summary for user: ${neezsUserId}, session: ${neezsSessionId}`);
      
      const memory = await zepClient.thread.getUserContext(neezsSessionId, {
        mode: "summary" as any,
      });
      
      return `Session Summary for ${neezsUserId} (${neezsSessionId}): ${JSON.stringify(memory)}`;
    } catch (error) {
      throw new Error(`Session Summary failed: ${error}`);
    }
  },
});

// Tool: Create Session
const CreateSessionParams = z.object({}); // No params needed, will be auto-generated

server.addTool({
  name: "create_session",
  description: "Create a new conversation session with an auto-generated timestamp ID",
  parameters: CreateSessionParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: false,
    title: "Create Session",
  },
  execute: async (args) => {
    try {
      // Auto-generate session ID from current timestamp in YYYYMMDD_HHMM format
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const autoSessionId = `${year}${month}${day}_${hours}${minutes}`;

      const neezsUserId = config.USER_ID;
      const neezsSessionId = `${config.SESSION_ID_PREFIX}${autoSessionId}`;
      
      console.log(`Auto-creating session: ${neezsSessionId} for user: ${neezsUserId}`);
      
      await zepClient.thread.create({
        threadId: neezsSessionId,
        userId: neezsUserId,
        metadata: {
          app: config.APP_NAME,
          project: config.PROJECT_ID,
          session_type: "neezs_ai_chat",
          created_at: now.toISOString(),
        },
      });
      
      return `New session created with ID: ${autoSessionId}`;
    } catch (error) {
      throw new Error(`Failed to create session: ${error}`);
    }
  },
});

// Tool: List Sessions
const ListSessionsParams = z.object({
  // We can't limit/offset directly, so we remove these for now
});

server.addTool({
  name: "list_sessions",
  description: "List all conversation sessions for the user by fetching user details",
  parameters: ListSessionsParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "List Sessions",
  },
  execute: async (args) => {
    try {
      console.log(`Listing all sessions in the project...`);

      // Correctly list all threads (sessions) in the project
      const threads = await zepClient.thread.listAll({ limit: 100 }); // Limit to 100 for now

      return `All Sessions: ${JSON.stringify(threads, null, 2)}`;
    } catch (error) {
      throw new Error(`Failed to list sessions: ${error}`);
    }
  },
});

// Tool: Get Session
const GetSessionParams = z.object({
  session_id: z.string().describe("NEEZS session ID to retrieve"),
});

server.addTool({
  name: "get_session",
  description: "Get details of a session",
  parameters: GetSessionParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "Get Session",
  },
  execute: async (args) => {
    try {
      const neezsSessionId = `${config.SESSION_ID_PREFIX}${args.session_id}`;
      console.log(`Getting NEEZS session: ${neezsSessionId}`);
      
      const session = await zepClient.thread.get(neezsSessionId);
      
      return `NEEZS Session Details: ${JSON.stringify(session)}`;
    } catch (error) {
      throw new Error(`Failed to get NEEZS session: ${error}`);
    }
  },
});

// Tool: Add Memory
const AddMemParams = z.object({
  content: z.string().describe("Memory content to add"),
  metadata: z.record(z.any()).optional().describe("Optional metadata for the memory"),
  memory_type: z.string().optional().describe("Type of memory (e.g., 'fact', 'preference', 'project_info')"),
});

server.addTool({
  name: "add_mem",
  description: "Add memory/facts to the knowledge graph",
  parameters: AddMemParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: false,
    title: "Add Memory",
  },
  execute: async (args) => {
    try {
      const neezsUserId = config.USER_ID;
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
          app: config.APP_NAME,
          project: config.PROJECT_ID,
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

// Tool: Search Memory
const SearchMemParams = z.object({
  query: z.string().describe("Search query for memories"),
  limit: z.number().optional().describe("Maximum number of results to return"),
  memory_type: z.string().optional().describe("Filter by memory type"),
});

server.addTool({
  name: "search_mem",
  description: "Search memories in the knowledge graph",
  parameters: SearchMemParams,
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "Search Memory",
  },
  execute: async (args) => {
    try {
      const neezsUserId = config.USER_ID;
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
