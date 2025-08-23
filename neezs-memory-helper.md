# NEEZS Memory Management Guide

## 📋 Daily Workflow

### เริ่มต้นวัน
```
/add_memory sessionId="neezs-project" content="Today's Goals: Working on [specific feature]. Current blockers: [issues]. Next priorities: [tasks]"
```

### เก็บ Code Insights
```
/add_memory sessionId="neezs-project" content="Code Discovery: Found [component/function] in [file path]. Purpose: [what it does]. Important note: [key insight]"
```

### Progress Updates
```
/add_memory sessionId="neezs-project" content="Progress Update: Completed [task]. Learned: [insights]. Next: [next steps]. Issues encountered: [problems and solutions]"
```

### Architecture Decisions
```
/add_memory sessionId="neezs-project" content="Architecture Decision: Chose [technology/pattern] for [use case]. Reason: [why]. Alternative considered: [other options]. Implementation: [how]"
```

## 🔍 Memory Categories

### Project Context
- Overview & Goals
- Tech Stack & Architecture
- Team & Timeline
- Business Requirements

### Code Knowledge  
- File Structure
- Key Components
- API Endpoints
- Database Schema
- Utility Functions

### Development Progress
- Completed Features
- Current Tasks
- Known Issues
- Future Plans

### Learning & Insights
- Problem Solutions
- Best Practices
- Performance Tips
- Security Considerations

## 📱 Quick Commands

### Daily Start
```
/search_memory sessionId="neezs-project" query="current status progress tasks"
```

### Find Specific Code
```
/search_memory sessionId="neezs-project" query="[component name] [file name] [function]"
```

### Review Architecture
```
/search_memory sessionId="neezs-project" query="architecture decisions tech stack database"
```

### Check TODOs
```
/search_memory sessionId="neezs-project" query="todo tasks next priorities blockers"
```

## 💡 Pro Tips

1. **Be Specific**: แทนที่จะเขียน "fixed bug" ให้เขียน "fixed authentication redirect issue in LoginPage.tsx by adding proper error handling"

2. **Include Context**: เสมอใส่ file paths, function names, และ reasoning

3. **Update Progress**: อัปเดตสถานะงานทุกวัน

4. **Cross-Reference**: เชื่อมโยงข้อมูลใหม่กับข้อมูลเก่า

5. **Use Keywords**: ใช้คำสำคัญที่ค้นหาง่าย เช่น "API", "component", "database", "bug", "feature"
