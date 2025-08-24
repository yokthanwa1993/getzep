# 🧠 NEEZS AI Chatbot with Zep Memory

NEEZS AI Chatbot เป็น AI Chatbot ที่พัฒนาด้วย TypeScript ใช้ ChatGPT เป็น AI Engine และ Zep Cloud เป็นระบบ Memory Management ที่ทรงพลัง รองรับการจำข้อมูลผู้ใช้ แชทประวัติ และ Knowledge Graph สำหรับการพัฒนาโปรเจคที่ต้องการ AI ที่จำบริบทได้

## ✨ Features

### 🤖 **AI Chat System**
- แชทกับ AI โดยใช้ ChatGPT (gpt-4o-mini)
- จำบริบทการสนทนาผ่าน Zep Memory
- รองรับการตั้งค่า System Prompt แบบกำหนดเอง
- สร้าง Session แยกตามผู้ใช้และหัวข้อ

### 👥 **User Management**
- สร้างและจัดการผู้ใช้ (ทั่วไปและ NEEZS)
- ระบบ Metadata สำหรับจัดเก็บข้อมูลเพิ่มเติม
- รองรับ User Prefix และ Project ID

### 🧠 **Advanced Memory System**
- **Knowledge Graph**: เก็บข้อมูลแบบ Graph ผ่าน Zep Cloud
- **Memory Types**: รองรับหลายประเภท (fact, preference, project_info, etc.)
- **Search & Retrieval**: ค้นหาความจำด้วย Semantic Search
- **Auto Memory Management**: จัดการ Graph อัตโนมัติ

### 🔍 **Search & Analytics**
- ค้นหาข้อมูลใน Knowledge Graph
- สรุปประวัติการสนทนา
- วิเคราะห์ Memory Pattern

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- npm หรือ yarn
- Zep Cloud API Key
- OpenAI API Key

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/neezs-ai-chatbot
cd neezs-ai-chatbot

# Install dependencies
npm install

# Copy environment file
cp env.example .env
```

### Configuration

แก้ไขไฟล์ `.env`:

```env
# 🔑 Required API Keys
ZEP_API_KEY=your-zep-cloud-api-key-here
OPENAI_API_KEY=your-openai-api-key-here

# 🏗️ NEEZS Project Settings
NEEZS_PROJECT_ID=your-project-id
NEEZS_PROJECT_NAME=NEEZS
NEEZS_APP_NAME=NEEZS
NEEZS_APP_VERSION=1.0.0

# 👤 User Configuration
NEEZS_DEFAULT_USER_ID=neezs_user_
NEEZS_DEFAULT_SESSION_ID=neezs_thread_

# 🤖 AI Model Settings
NEEZS_AI_MODEL=gpt-4o-mini

# 🌐 Server Configuration
MCP_SERVER_HOST=localhost
MCP_SERVER_PORT=8000
```

### Getting API Keys

#### Zep Cloud API Key
1. ไปที่ [https://cloud.getzep.com/](https://cloud.getzep.com/)
2. สร้างบัญชีหรือเข้าสู่ระบบ
3. สร้างโปรเจคใหม่
4. ไปที่ Settings > API Keys
5. สร้าง API Key ใหม่

#### OpenAI API Key
1. ไปที่ [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. เข้าสู่ระบบ OpenAI
3. สร้าง API Key ใหม่

### Running

```bash
# Start NEEZS AI Chatbot
npm run start:ai

# Development mode with auto-reload
npm run dev:ai
```

## 📚 API Functions

### 👥 User Management

#### 1. **list_users**
แสดงรายชื่อผู้ใช้ทั้งหมด
```typescript
Parameters:
- limit?: number (default: 10)
- offset?: number (default: 0)
```

#### 2. **list_neezs_users** 
แสดงรายชื่อผู้ใช้ NEEZS
```typescript
Parameters:
- limit?: number (default: 10)  
- offset?: number (default: 0)
```

#### 3. **create_user**
สร้างผู้ใช้ใหม่ (ทั่วไป)
```typescript
Parameters:
- user_id: string
- first_name?: string
- last_name?: string
- email?: string
```

#### 4. **create_neezs_user**
สร้างผู้ใช้ NEEZS ใหม่
```typescript
Parameters:
- user_id: string
- first_name?: string
- last_name?: string 
- email?: string
```

#### 5. **get_user**
ดูข้อมูลผู้ใช้
```typescript
Parameters:
- user_id: string
```

#### 6. **get_neezs_user**
ดูข้อมูลผู้ใช้ NEEZS
```typescript
Parameters:
- user_id: string (จะเติม prefix อัตโนมัติ)
```

### 💬 Session Management

#### 7. **create_neezs_session**
สร้าง Session สำหรับ AI Chatbot
```typescript
Parameters:
- session_id: string
- user_id: string
```

#### 8. **get_neezs_session**
ดูข้อมูล Session
```typescript
Parameters:
- session_id: string
```

### 🧠 Memory Management

#### 9. **add_neezs_memory**
เพิ่มความจำใน Knowledge Graph
```typescript
Parameters:
- user_id: string
- content: string
- memory_type?: string (default: "fact")
- metadata?: object
```

#### 10. **list_neezs_memories**
แสดงรายการความจำทั้งหมด
```typescript
Parameters:
- user_id: string
- limit?: number (default: 10)
- memory_type?: string
```

#### 11. **get_neezs_memory**
ดูความจำเฉพาะ
```typescript
Parameters:
- user_id: string
- memory_id: string
```

#### 12. **search_neezs_memories**
ค้นหาความจำ
```typescript
Parameters:
- user_id: string
- query: string
- limit?: number (default: 5)
- memory_type?: string
```

#### 13. **delete_neezs_memory**
ลบความจำ
```typescript
Parameters:
- user_id: string
- memory_id: string
```

### 🤖 AI & Knowledge

#### 14. **neezs_ai_chat**
แชทกับ AI
```typescript
Parameters:
- user_id: string
- session_id: string
- message: string
- system_prompt?: string
```

#### 15. **neezs_knowledge_search**
ค้นหาใน Knowledge Graph
```typescript
Parameters:
- user_id: string
- query: string
- limit?: number (default: 5)
```

#### 16. **neezs_memory_summary**
สรุปความจำและประวัติการสนทนา
```typescript
Parameters:
- user_id: string
- session_id: string
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cursor IDE    │────│  FastMCP Server │────│   Zep Cloud     │
│                 │    │                 │    │                 │
│ - MCP Client    │    │ - 16 Functions  │    │ - Memory Store  │
│ - Tool Calls    │    │ - User Mgmt     │    │ - Knowledge     │
│                 │    │ - AI Chat       │    │   Graph         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   OpenAI API    │
                       │                 │
                       │ - ChatGPT       │
                       │ - GPT-4o-mini   │
                       └─────────────────┘
```

### Technology Stack
- **Runtime**: Node.js + TypeScript
- **MCP Framework**: FastMCP
- **AI Engine**: OpenAI ChatGPT (gpt-4o-mini)
- **Memory System**: Zep Cloud
- **Validation**: Zod
- **Environment**: dotenv

## 💻 Development

### Project Structure
```
neezs-ai-chatbot/
├── neezs-ai-chatbot.ts    # Main application
├── package.json           # Dependencies
├── tsconfig.json         # TypeScript config
├── .env                  # Environment variables
├── .env.example          # Environment template
├── fastmcp/              # FastMCP framework
└── README.md             # Documentation
```

### Scripts
```bash
# Start production server
npm run start:ai

# Development with auto-reload
npm run dev:ai

# Build TypeScript
npm run build

# Install dependencies
npm install
```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ZEP_API_KEY` | Zep Cloud API Key | ✅ | - |
| `OPENAI_API_KEY` | OpenAI API Key | ✅ | - |
| `NEEZS_PROJECT_ID` | Project identifier | ❌ | `neezs-project` |
| `NEEZS_APP_NAME` | Application name | ❌ | `NEEZS` |
| `NEEZS_DEFAULT_USER_ID` | User ID prefix | ❌ | `neezs_user_` |
| `NEEZS_DEFAULT_SESSION_ID` | Session ID prefix | ❌ | `neezs_thread_` |
| `NEEZS_AI_MODEL` | OpenAI model | ❌ | `gpt-4o-mini` |
| `MCP_SERVER_PORT` | Server port | ❌ | `8000` |

## 🔧 Configuration

### Dynamic Configuration
ระบบรองรับการเปลี่ยน configuration แบบ dynamic ผ่าน environment variables:

```typescript
// Configuration priority: MCP env > .env > default
currentConfig = {
  APP_NAME: process.env.APP_NAME || "NEEZS",
  USER_ID: process.env.USER_ID || "neezs_user_",
  SESSION_ID: process.env.SESSION_ID || "neezs_thread_",
  PROJECT_ID: process.env.PROJECT_ID || "neezs-project",
  AI_MODEL: process.env.AI_MODEL || "gpt-4o-mini"
}
```

### Memory Types
```typescript
// Supported memory types
type MemoryType = 
  | "fact"           // ข้อเท็จจริง
  | "preference"     // ความชอบ
  | "project_info"   // ข้อมูลโปรเจค
  | "code_snippet"   // โค้ดตัวอย่าง
  | "solution"       // วิธีแก้ปัญหา
  | "learning"       // สิ่งที่เรียนรู้
```

## 📊 Usage Examples

### Basic AI Chat
```typescript
// เริ่มการสนทนา
await neezs_ai_chat({
  user_id: "yok",
  session_id: "project_discussion_001", 
  message: "สวัสดีครับ ผมกำลังพัฒนาแอพ NEEZS"
});
```

### Add Project Memory
```typescript
// เพิ่มข้อมูลโปรเจค
await add_neezs_memory({
  user_id: "yok",
  content: "แอพ NEEZS ใช้ TypeScript, React Native, และ Zep Cloud",
  memory_type: "project_info",
  metadata: {
    category: "tech_stack",
    priority: "high"
  }
});
```

### Search Solutions
```typescript
// ค้นหา solutions เก่า
await search_neezs_memories({
  user_id: "yok", 
  query: "authentication error",
  memory_type: "solution",
  limit: 5
});
```

### Knowledge Discovery
```typescript
// ค้นหาความรู้
await neezs_knowledge_search({
  user_id: "yok",
  query: "React Native navigation",
  limit: 10
});
```

## 🔍 Advanced Features

### Memory Metadata
```typescript
// Rich metadata support
const metadata = {
  category: "bug_fix",
  priority: "high", 
  tags: ["authentication", "security"],
  created_by: "yok",
  project_phase: "development",
  related_files: ["auth.ts", "login.tsx"]
};
```

### Session Context
```typescript
// Session-based memory
- แต่ละ session มี context แยกกัน
- Memory ใช้ร่วมกันระหว่าง sessions
- AI จำบริบทของแต่ละ session
```

### Smart Search
```typescript
// Semantic search capabilities
- ค้นหาด้วยความหมาย ไม่ใช่แค่คำ
- Score-based ranking
- Context-aware results
```

## 🚨 Troubleshooting

### Common Issues

#### 1. **API Key Errors**
```bash
Error: Status code: 401 - unauthorized

Solution:
- ตรวจสอบ ZEP_API_KEY และ OPENAI_API_KEY
- สร้าง API key ใหม่ถ้าหมดอายุ
- ตรวจสอบ .env file ถูกโหลดหรือไม่
```

#### 2. **Server Connection Issues**  
```bash
Error: Connection refused

Solution:
- ตรวจสอบ server กำลังทำงานอยู่หรือไม่
- เช็ค port 8000 ว่าถูกใช้แล้วหรือไม่
- ลอง restart server
```

#### 3. **Memory/Graph Errors**
```bash
Error: Graph not found / BadRequestError

Solution:
- Graph จะถูกสร้างอัตโนมัติเมื่อเพิ่ม memory ครั้งแรก
- ตรวจสอบ user_id ถูกต้องหรือไม่
- ลองเพิ่ม memory ใหม่เพื่อสร้าง graph
```

#### 4. **TypeScript Errors**
```bash
Error: tsx command not found

Solution:
npm install tsx
# หรือ
npm install -g tsx
```

### Debug Mode
```bash
# เปิด debug logging
DEBUG=true npm run dev:ai

# ดู server logs
npm run start:ai | grep -i error
```

## 🔐 Security

### API Key Management
- ใช้ `.env` file สำหรับ API keys
- **ห้าม** commit API keys เข้า git
- ใช้ `.gitignore` เพื่อป้องกัน `.env`

### Data Privacy
- ข้อมูล memory เก็บใน Zep Cloud
- รองรับ metadata encryption
- User isolation ผ่าน user_id

## 📈 Performance

### Optimization Tips
- ใช้ `limit` parameter เพื่อจำกัดผลลัพธ์
- Cache ผลลัพธ์การค้นหาที่ใช้บ่อย
- ใช้ memory_type เพื่อ filter ข้อมูล
- จัดกลุ่ม memories ด้วย metadata

### Monitoring
```bash
# ดู memory usage
node --inspect neezs-ai-chatbot.ts

# Monitor API calls
grep -i "API" logs/*.log

# Check response times
time curl localhost:8000/health
```

## 🤝 Contributing

### Development Setup
```bash
# Fork repository
git clone your-fork
cd neezs-ai-chatbot

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/new-function

# Make changes and test
npm run dev:ai

# Commit and push
git commit -m "feat: add new function"
git push origin feature/new-function
```

### Code Style
- ใช้ TypeScript strict mode
- ESLint + Prettier configuration
- Semantic commit messages
- Comprehensive error handling

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Zep Cloud Docs](https://help.getzep.com/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [FastMCP Docs](https://github.com/jlowin/fastmcp)

### Community
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Server](https://discord.gg/your-server)

### Contact
- Email: your-email@domain.com
- Twitter: [@your-twitter](https://twitter.com/your-twitter)

---

## 🎯 Roadmap

### Upcoming Features
- [ ] Multi-language support
- [ ] Voice chat integration  
- [ ] Advanced analytics dashboard
- [ ] Plugin system
- [ ] Mobile app integration
- [ ] Team collaboration features

### Version History
- **v1.0.0** - Initial release with 16 core functions
- **v0.9.0** - Beta release with memory management
- **v0.8.0** - Alpha release with basic chat

---

**Made with ❤️ for developers who need AI that remembers**

*NEEZS AI Chatbot - Your development companion that never forgets* 🧠✨
