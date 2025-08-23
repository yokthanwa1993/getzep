# NEEZS AI Chatbot

A TypeScript AI chatbot with permanent memory using Zep Cloud and OpenAI ChatGPT.

## 🚀 Features

- **Permanent Memory**: Uses Zep Cloud for persistent conversation history
- **AI Integration**: Powered by OpenAI ChatGPT (GPT-4o-mini)
- **MCP Server**: Model Context Protocol server for AI assistants
- **TypeScript**: Built with TypeScript and FastMCP framework

## 📋 Prerequisites

- Node.js 18+ 
- Zep Cloud API Key
- OpenAI API Key

## 🛠️ Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd zep
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env
```

Edit `.env` file with your API keys:
```bash
# Required API Keys
ZEP_API_KEY=your-zep-cloud-api-key-here
OPENAI_API_KEY=your-openai-api-key-here

# Optional Configuration
NEEZS_PROJECT_ID=your-project-id
NEEZS_APP_NAME=NEEZS
NEEZS_DEFAULT_USER_PREFIX=neezs_user_
NEEZS_DEFAULT_THREAD_PREFIX=neezs_thread_
NEEZS_AI_MODEL=gpt-4o-mini
MCP_SERVER_HOST=localhost
MCP_SERVER_PORT=8000
```

## 🚀 Usage

### Local Development:

#### Start NEEZS AI Chatbot:
```bash
npm run start:ai
```

#### Development mode:
```bash
npm run dev:ai
```

### Docker Deployment:

#### Using Docker Compose:
```bash
docker-compose up -d
```

#### Using Docker directly:
```bash
docker build -t neezs-ai-chatbot .
docker run -p 8000:8000 --env-file .env neezs-ai-chatbot
```

### CapRover Deployment:

1. **Push to GitHub** with the following files:
   - `Dockerfile`
   - `captain-definition`
   - `docker-compose.yml`

2. **In CapRover Dashboard:**
   - Create new app
   - Connect to your GitHub repository
   - Set environment variables in CapRover dashboard:
     - `ZEP_API_KEY`
     - `OPENAI_API_KEY`
     - `NEEZS_PROJECT_ID` (optional)
     - `NEEZS_APP_NAME` (optional)

3. **Deploy:**
   - CapRover will automatically build and deploy using the Dockerfile

## 🔧 MCP Server Configuration

### For Cursor IDE:
```json
{
  "mcpServers": {
    "neezs-memory": {
      "url": "http://localhost:8000/sse"
    }
  }
}
```

## 🛠️ Available Tools

### NEEZS AI Tools:
- `neezs_ai_chat` - Chat with NEEZS AI using ChatGPT and Zep Memory
- `neezs_knowledge_search` - Search NEEZS user's knowledge graph and memory
- `neezs_memory_summary` - Get a summary of NEEZS user's memory and conversation history
- `create_neezs_user` - Create a new user in NEEZS for AI chatbot
- `create_neezs_session` - Create a new conversation session for NEEZS AI chatbot

## 🧠 How It Works

1. **User sends message** → Stored in Zep Cloud
2. **Zep provides memory context** → Previous conversation summary
3. **ChatGPT processes** → Uses context + new message
4. **AI response** → Stored back in Zep Cloud
5. **Permanent memory** → Available for future conversations

## 📁 Project Structure

```
zep/
├── neezs-ai-chatbot.ts    # Main NEEZS AI Chatbot server
├── fastmcp/               # FastMCP framework
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── env.example            # Environment variables template
├── .gitignore            # Git ignore rules
├── Dockerfile             # Docker configuration for deployment
├── captain-definition     # CapRover configuration
├── docker-compose.yml     # Docker Compose for local testing
├── .dockerignore          # Docker ignore rules
└── README.md             # This file
```

## 🔑 Getting API Keys

### Zep Cloud API Key:
1. Go to https://cloud.getzep.com/
2. Create account or login
3. Create new project "NEEZS"
4. Go to Settings > API Keys
5. Create new API key

### OpenAI API Key:
1. Go to https://platform.openai.com/api-keys
2. Login to OpenAI account
3. Create new API key

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository.
