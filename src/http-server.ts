import express from 'express';
import cors from 'cors';
import { ZepClient } from "@getzep/zep-cloud";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

const ZEP_API_KEY = process.env.ZEP_API_KEY!;
const zepClient = new ZepClient({
  apiKey: ZEP_API_KEY,
});

app.use(cors());
app.use(express.json());

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

// API Routes
app.post('/api/memory/add', async (req, res) => {
  try {
    const { sessionId, content, metadata } = req.body;
    
    if (!sessionId || !content) {
      return res.status(400).json({ error: 'sessionId and content are required' });
    }

    const result = await addMemoryToZep(sessionId, content, metadata);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/memory/search', async (req, res) => {
  try {
    const { sessionId, query, limit } = req.query;
    
    if (!sessionId || !query) {
      return res.status(400).json({ error: 'sessionId and query are required' });
    }

    const result = await searchMemoryInZep(sessionId as string, query as string, limit ? parseInt(limit as string) : 10);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/memory/get', async (req, res) => {
  try {
    const { sessionId, limit } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const result = await getMemoryFromZep(sessionId as string, limit ? parseInt(limit as string) : 10);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/memory/delete', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const result = await deleteMemoryFromZep(sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// SSE endpoint for real-time updates
app.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);

  // Keep connection alive
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

app.listen(PORT, () => {
  console.log(`NEEZS Memory Server running on port ${PORT}`);
  console.log(`Zep Cloud API Key: ${ZEP_API_KEY ? 'Loaded' : 'Missing'}`);
});
