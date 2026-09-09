# WorkPilot AI - Server Ports & URLs

## 🚀 Currently Running Servers

### Backend Server (FastAPI)
- **Port**: `8000`
- **URL**: http://localhost:8000
- **API Base**: http://localhost:8000/api/v1
- **Documentation**: http://localhost:8000/docs
- **Status**: ✅ Running
- **Command**: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- **Location**: `d:\workpilot-ai\backend`

### Frontend Server (Vite/React)
- **Port**: `5173`
- **URL**: http://localhost:5173
- **Status**: ✅ Running
- **Command**: `npm run dev`
- **Location**: `d:\workpilot-ai\Frontend`
- **Network URLs**:
  - http://192.168.56.1:5173/
  - http://192.168.37.1:5173/
  - http://192.168.149.1:5173/
  - http://192.168.0.104:5173/

## ⚠️ Important Configuration Note

### API Port Mismatch
The frontend is configured to connect to **port 8001** by default, but the backend runs on **port 8000**.

**Current configuration** (`Frontend/src/api.js`):
```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';
```

**Backend runs on**: `http://localhost:8000`

### Fix Required
You need to either:

1. **Update Frontend** to use port 8000:
   ```javascript
   const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
   ```

2. **OR Create `.env` file** in Frontend folder:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

3. **OR Run Backend on port 8001**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8001
   ```

## 🔌 Integrations & Services

### Firebase
- **Project ID**: workpilot-ai-d05dd
- **Service**: Authentication, Firestore Database

### Redis (if used)
- **Port**: 6379 (default)
- **Service**: Caching, Rate Limiting

## 📝 Access Points

### For Users
- **Main App**: http://localhost:5173
- **Login**: http://localhost:5173/login
- **Dashboard**: http://localhost:5173 (after login)
- **Integrations**: http://localhost:5173/integrations

### For Developers
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Integrations API**: http://localhost:8000/api/v1/integrations

### For Testing
- **Debug Integrations**: http://localhost:8000/api/v1/integrations/debug
- **Test Tools**: Various `.html` files in project root

## 🛠️ Management Commands

### Start Servers
```bash
# Backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd Frontend
npm run dev
```

### Stop Servers
- Press `Ctrl+C` in the terminal running each server

### Restart Servers
1. Stop with `Ctrl+C`
2. Run the start command again

### Check Server Status
```bash
# Backend
curl http://localhost:8000/health

# Frontend
curl http://localhost:5173
```

## 🐛 Troubleshooting

### Backend Won't Start
1. Check if port 8000 is already in use: `netstat -ano | findstr :8000`
2. Check if Firebase credentials are correct in `.env`
3. Check if all dependencies are installed: `pip install -r requirements.txt`

### Frontend Won't Start
1. Check if port 5173 is already in use: `netstat -ano | findstr :5173`
2. Check if node_modules exists: `npm install`
3. Clear Vite cache: Delete `Frontend/node_modules/.vite`

### API Connection Errors
1. ✅ **Currently**: Backend on 8000, Frontend expects 8001
2. **Fix**: Update `Frontend/src/api.js` to use port 8000
3. **OR**: Create `Frontend/.env` with `VITE_API_BASE_URL=http://localhost:8000/api/v1`

## 📊 Current Status Summary

| Service | Port | Status | URL |
|---------|------|--------|-----|
| Backend API | 8000 | ✅ Running | http://localhost:8000 |
| Frontend App | 5173 | ✅ Running | http://localhost:5173 |
| Frontend → Backend | ❌ Mismatch | Frontend expects 8001, Backend on 8000 |

**Action Required**: Fix port mismatch to ensure frontend can communicate with backend!
