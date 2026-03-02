# Camera Access Requirements - getUserMedia

## Problem

`getUserMedia()` API (for webcam access) requires a **secure context**:

- ✅ HTTPS (any domain)
- ✅ `http://localhost` or `http://127.0.0.1`
- ❌ HTTP on network IPs (like `http://192.168.x.x`)

---

## Browser Security Rules

| URL | Protocol | Camera Access? |
|-----|----------|---------------|
| `http://localhost:3000` | HTTP (localhost) | ✅ Works |
| `http://127.0.0.1:3000` | HTTP (localhost) | ✅ Works |
| `http://192.168.1.77:3000` | HTTP (network IP) | ❌ Blocked |
| `https://192.168.1.77:3001` | HTTPS | ✅ Works |
| `https://your-app.vercel.app` | HTTPS | ✅ Works |

**Key point:** HTTP on network IPs = `navigator.mediaDevices` is `undefined`

---

## Error You're Seeing

```
Failed to start webcam: TypeError: Cannot read properties of undefined (reading 'getUserMedia')
```

**Translation:** You're accessing via `http://192.168.x.x:3000`, which is not a secure context.

---

## Solutions

### Solution 1: Use Localhost (Laptop Testing Only)

**Access via:**
```
http://localhost:3000
```

**Works for:**
- ✅ Testing on the same machine
- ✅ WebSocket (`ws://`)
- ✅ Camera access

**Doesn't work for:**
- ❌ Testing on phone/other devices

---

### Solution 2: Enable HTTPS (Full Testing - Recommended)

**Step 1: Enable HTTPS on Frontend**

Uncomment in `vite.config.ts`:
```typescript
https: {
  key: fs.readFileSync(path.resolve(__dirname, '.cert/key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, '.cert/cert.pem')),
},
```

**Step 2: Enable WSS on Backend**

Your WebSocket server at `136.115.36.127:8010` needs SSL:

```bash
uvicorn main:app --host 0.0.0.0 --port 8010 \
  --ssl-keyfile=key.pem \
  --ssl-certfile=cert.pem
```

**Step 3: Restart Both Servers**

```bash
# Frontend
npm run dev

# Backend (on the WebSocket server machine)
# ... your uvicorn command with SSL
```

**Access via:**
```
https://192.168.1.77:3001
```

**Result:**
- ✅ Camera access works
- ✅ WebSocket uses `wss://` (auto)
- ✅ Works on phone!

---

### Solution 3: Deploy to Production (Best)

Deploy both frontend and backend with SSL:

**Frontend:**
- Vercel, Netlify, Firebase Hosting (auto HTTPS)
- Example: `https://your-app.vercel.app`

**Backend:**
- Cloud Run, Heroku, etc. (auto HTTPS)
- Example: `wss://your-backend.app/api/live-camera/ws`

**Result:**
- ✅ Everything works
- ✅ No certificate warnings
- ✅ Works on all devices

---

## Testing Matrix

| Your Setup | WebSocket | Camera (Laptop) | Camera (Phone) |
|------------|-----------|----------------|---------------|
| **HTTP on localhost** | ✅ `ws://` | ✅ Works | ❌ Can't access localhost from phone |
| **HTTP on network IP** | ✅ `ws://` | ❌ Blocked | ❌ Blocked |
| **HTTPS (no backend WSS)** | ❌ Mixed content error | ✅ Works | ✅ Works |
| **HTTPS + backend WSS** | ✅ `wss://` | ✅ Works | ✅ Works |

**Optimal:** HTTPS frontend + WSS backend = Everything works everywhere!

---

## Current Situation

**You have:**
- Frontend: HTTP on network IP (`http://192.168.1.77:3000`)
- Backend WebSocket: `ws://136.115.36.127:8010` (no SSL)

**Result:**
- ✅ WebSocket connects
- ❌ Camera blocked (`navigator.mediaDevices` undefined)

---

## Recommended Next Steps

### For Quick Laptop Testing

1. Access via `http://localhost:3000`
2. Test WebSocket + Camera
3. Both will work!

### For Phone Testing

1. **Enable SSL on WebSocket server** (backend)
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8010 \
     --ssl-keyfile=key.pem --ssl-certfile=cert.pem
   ```

2. **Enable HTTPS in vite.config.ts** (frontend)
   ```typescript
   https: {
     key: fs.readFileSync(path.resolve(__dirname, '.cert/key.pem')),
     cert: fs.readFileSync(path.resolve(__dirname, '.cert/cert.pem')),
   },
   ```

3. **Restart both servers**

4. **Access:** `https://192.168.1.77:3001`

5. **Test on phone** - everything works! ✅

---

## Error Messages Now

The app will now show a helpful error when camera access is blocked:

```
Camera access requires HTTPS or localhost. 
Current URL: http://192.168.1.77:3000

Solutions:
1. Access via http://localhost:3000 (if on same machine)
2. Enable HTTPS in vite.config.ts (requires WSS support on backend)
```

---

## Summary

**Camera access blocked on HTTP network IPs** is a browser security feature, not a bug.

**Quick fix:** Use `http://localhost:3000` (laptop only)

**Full fix:** Enable HTTPS + WSS (works everywhere)

See **WEBSOCKET_HTTPS_FIX.md** for WSS setup instructions.
