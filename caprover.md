# 🚀 NEEZS Memory Server - CapRover Deployment

## 📋 Prerequisites

1. **CapRover server** ที่รันอยู่
2. **Git repository** ที่มีโค้ดนี้
3. **Zep Cloud API key**

## 🔧 Step-by-Step Deployment

### **Step 1: Push โค้ดไป Git**
```bash
git add .
git commit -m "Add NEEZS memory server for CapRover"
git push origin main
```

### **Step 2: สร้าง App ใน CapRover**

1. เข้า **CapRover Dashboard**
2. กด **"One-Click Apps"** หรือ **"Apps"**
3. กด **"Create New App"**
4. ใส่ **App Name:** `neezs-memory`
5. เลือก **Image:** `your-git-repo:latest`

### **Step 3: ตั้งค่า Environment Variables**

ใน CapRover App Settings:
```
ZEP_API_KEY=your_zep_cloud_api_key_here
PORT=8000
```

### **Step 4: ตั้งค่า Port**

- **HTTP Port:** `8000`
- **Container Port:** `8000`

### **Step 5: Deploy**

กด **"Deploy"** และรอให้เสร็จ

## 🌐 หลัง Deploy เสร็จ

### **URL ที่ได้:**
```
https://neezs-memory.your-domain.com
```

### **API Endpoints:**
- **Health:** `https://neezs-memory.your-domain.com/health`
- **Add Memory:** `https://neezs-memory.your-domain.com/api/memory/add`
- **Get Memory:** `https://neezs-memory.your-domain.com/api/memory/get`
- **Search Memory:** `https://neezs-memory.your-domain.com/api/memory/search`
- **Delete Memory:** `https://neezs-memory.your-domain.com/api/memory/delete`
- **SSE:** `https://neezs-memory.your-domain.com/sse`

## 🔄 อัปเดต Cursor MCP Config

หลัง deploy เสร็จ แก้ไข `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "zep-memory-neezs": {
      "command": "node",
      "args": ["./dist/mcp-server.js"],
      "env": {
        "ZEP_API_KEY": "your_zep_cloud_api_key_here",
        "PROJECT_ID": "neezs"
      }
    }
  }
}
```

## 🧪 ทดสอบหลัง Deploy

```bash
# Health check
curl https://neezs-memory.your-domain.com/health

# Add memory
curl -X POST https://neezs-memory.your-domain.com/api/memory/add \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "neezs-project", "content": "Deployed to CapRover successfully!"}'
```

## 📝 Notes

- **SSL:** CapRover จะจัดการ HTTPS ให้อัตโนมัติ
- **Scaling:** สามารถ scale ได้ใน CapRover dashboard
- **Logs:** ดู logs ได้ใน CapRover app logs
- **Backup:** CapRover มี backup อัตโนมัติ
