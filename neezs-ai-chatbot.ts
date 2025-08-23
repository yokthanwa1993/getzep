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

// NEEZS Configuration
const NEEZS_CONFIG = {
  APP_NAME: process.env.NEEZS_APP_NAME || "NEEZS",
  USER_PREFIX: process.env.NEEZS_DEFAULT_USER_PREFIX || "neezs_user_",
  THREAD_PREFIX: process.env.NEEZS_DEFAULT_THREAD_PREFIX || "neezs_thread_",
  PROJECT_ID: process.env.NEEZS_PROJECT_ID || "neezs-project",
  AI_MODEL: process.env.NEEZS_AI_MODEL || "gpt-4o-mini",
};

console.log("🚀 NEEZS AI Chatbot Configuration:");
console.log(`   App: ${NEEZS_CONFIG.APP_NAME}`);
console.log(`   AI Model: ${NEEZS_CONFIG.AI_MODEL}`);
console.log(`   User Prefix: ${NEEZS_CONFIG.USER_PREFIX}`);
console.log(`   Thread Prefix: ${NEEZS_CONFIG.THREAD_PREFIX}`);

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
      const neezsUserId = `${NEEZS_CONFIG.USER_PREFIX}${args.user_id}`;
      const neezsSessionId = `${NEEZS_CONFIG.THREAD_PREFIX}${args.session_id}`;
      
      console.log(`NEEZS AI Chat - User: ${neezsUserId}, Session: ${neezsSessionId}`);
      
      // 1. Add user message to Zep
      await zepClient.thread.addMessages(neezsSessionId, {
        messages: [{
          role: "user",
          content: args.message,
          name: "User",
          metadata: {
            app: NEEZS_CONFIG.APP_NAME,
            project: NEEZS_CONFIG.PROJECT_ID,
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
      const systemPrompt = args.system_prompt || `You are ${NEEZS_CONFIG.APP_NAME} AI, a helpful assistant with access to the user's memory and conversation history. Use the provided context to give personalized and relevant responses. Be friendly, helpful, and remember previous interactions.`;
      
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
        model: NEEZS_CONFIG.AI_MODEL,
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
          name: `${NEEZS_CONFIG.APP_NAME} AI`,
          metadata: {
            app: NEEZS_CONFIG.APP_NAME,
            project: NEEZS_CONFIG.PROJECT_ID,
            timestamp: new Date().toISOString(),
            ai_model: NEEZS_CONFIG.AI_MODEL,
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
      const neezsUserId = `${NEEZS_CONFIG.USER_PREFIX}${args.user_id}`;
      console.log(`Searching NEEZS knowledge for user: ${neezsUserId}, query: ${args.query}`);
      
      const results = await zepClient.graph.search({
        userId: neezsUserId,
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
      const neezsUserId = `${NEEZS_CONFIG.USER_PREFIX}${args.user_id}`;
      const neezsSessionId = `${NEEZS_CONFIG.THREAD_PREFIX}${args.session_id}`;
      
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
      const neezsUserId = `${NEEZS_CONFIG.USER_PREFIX}${args.user_id}`;
      console.log(`Creating NEEZS user: ${neezsUserId}`);
      
      const user = await zepClient.user.add({
        userId: neezsUserId,
        firstName: args.first_name || "",
        lastName: args.last_name || "",
        email: args.email || "",
        metadata: {
          app: NEEZS_CONFIG.APP_NAME,
          project: NEEZS_CONFIG.PROJECT_ID,
          created_for: "ai_chatbot",
        },
      });
      
      return `NEEZS user ${neezsUserId} created successfully for AI chatbot`;
    } catch (error) {
      throw new Error(`Failed to create NEEZS user: ${error}`);
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
      const neezsUserId = `${NEEZS_CONFIG.USER_PREFIX}${args.user_id}`;
      const neezsSessionId = `${NEEZS_CONFIG.THREAD_PREFIX}${args.session_id}`;
      
      console.log(`Creating NEEZS session: ${neezsSessionId} for user: ${neezsUserId}`);
      
      await zepClient.thread.create({
        threadId: neezsSessionId,
        userId: neezsUserId,
        metadata: {
          app: NEEZS_CONFIG.APP_NAME,
          project: NEEZS_CONFIG.PROJECT_ID,
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
