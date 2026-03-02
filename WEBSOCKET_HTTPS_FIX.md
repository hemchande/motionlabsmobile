# WebSocket HTTPS Fix - Mixed Content Error

## Problem

When running the app over **HTTPS**, the browser blocks **insecure WebSocket connections** (`ws://`):

```
Mixed Content: The page at 'https://192.168.1.77:3001/' was loaded over HTTPS,
but attempted to connect to the insecure WebSocket endpoint 'ws://136.115.36.127:8010/api/live-camera/ws'.
This request has been blocked; this endpoint must be available over WSS.
```

---

## Solution

The app now **auto-detects** the page protocol and uses the correct WebSocket protocol:

- **HTTPS page** → Uses `wss://` (secure WebSocket)
- **HTTP page** → Uses `ws://` (insecure WebSocket)

### Code Change

```typescript
// Auto-switch to wss:// if page is HTTPS
if (window.location.protocol === 'https:' && url.startsWith('ws://')) {
  const secureUrl = url.replace('ws://', 'wss://');
  console.log(`🔒 HTTPS detected, switching to secure WebSocket: ${secureUrl}`);
  return secureUrl;
}
```

---

## How It Works

### Example 1: HTTPS Page

**Page URL:** `https://192.168.1.77:3001/`

**Original WebSocket URL:** `ws://136.115.36.127:8010/api/live-camera/ws`

**Auto-converted to:** `wss://136.115.36.127:8010/api/live-camera/ws`

**Console log:**
```
🔒 HTTPS detected, switching to secure WebSocket: wss://136.115.36.127:8010/api/live-camera/ws
```

---

### Example 2: HTTP Page

**Page URL:** `http://192.168.1.77:3000/`

**WebSocket URL:** `ws://136.115.36.127:8010/api/live-camera/ws`

**Result:** No change (HTTP can use ws://)

---

## Backend Requirements

For `wss://` to work, your **backend WebSocket server** must support **SSL/TLS**.

### Option 1: Backend Supports WSS (Recommended)

If your server at `136.115.36.127:8010` already supports WSS:

✅ **No additional changes needed!**

The connection will work automatically:
```
🔒 HTTPS detected, switching to secure WebSocket: wss://136.115.36.127:8010/api/live-camera/ws
🔌 Connecting to wss://136.115.36.127:8010/api/live-camera/ws...
✅ Connected! Session ID: abc123
```

---

### Option 2: Backend Doesn't Support WSS Yet

If your server **only** supports `ws://` (not `wss://`), you have two options:

#### Option A: Enable WSS on Backend (Recommended for Production)

Configure your FastAPI/WebSocket server to support SSL:

**Python (FastAPI with uvicorn):**
```python
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8010,
        ssl_keyfile="path/to/key.pem",
        ssl_certfile="path/to/cert.pem"
    )
```

**Or via command line:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8010 \
  --ssl-keyfile=key.pem \
  --ssl-certfile=cert.pem
```

---

#### Option B: Use HTTP (Dev Only)

For local development, run the frontend on **HTTP** instead of HTTPS:

**In `vite.config.ts`:**
```typescript
server: {
  // Comment out HTTPS
  // https: {
  //   key: fs.readFileSync(path.resolve(__dirname, '.cert/key.pem')),
  //   cert: fs.readFileSync(path.resolve(__dirname, '.cert/cert.pem')),
  // },
}
```

**Result:**
- Page runs on `http://192.168.1.77:3000`
- WebSocket uses `ws://136.115.36.127:8010/api/live-camera/ws`
- ✅ No mixed content error!

**Limitation:** `getUserMedia()` won't work on network IPs with HTTP.

---

## Environment Variable Override

You can also set the WebSocket URL explicitly in `.env`:

### For HTTPS (WSS)
```bash
VITE_LIVE_CAMERA_WS_URL=wss://136.115.36.127:8010/api/live-camera/ws
```

### For HTTP (WS)
```bash
VITE_LIVE_CAMERA_WS_URL=ws://136.115.36.127:8010/api/live-camera/ws
```

The auto-detection will **still apply** unless you use `wss://` explicitly in the env var.

---

## Testing

### Test HTTPS → WSS Auto-Switch

1. **Start dev server with HTTPS:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   https://192.168.1.77:3001/
   ```

3. **Open DevTools Console**

4. **Start WebSocket feed**

5. **Expected logs:**
   ```
   🔒 HTTPS detected, switching to secure WebSocket: wss://136.115.36.127:8010/api/live-camera/ws
   🔌 Connecting to wss://136.115.36.127:8010/api/live-camera/ws...
   ```

6. **If backend supports WSS:**
   ```
   ✅ Connected! Session ID: abc123
   ```

7. **If backend doesn't support WSS:**
   ```
   ❌ Failed to connect: Error: ...
   ```

---

## Troubleshooting

### Error: "Failed to connect" (After WSS Auto-Switch)

**Cause:** Backend server doesn't support WSS (SSL/TLS).

**Solutions:**

1. **Enable SSL on backend** (see Option A above)
2. **Use HTTP for frontend** (see Option B above)
3. **Use a reverse proxy** (nginx with SSL termination)

---

### Error: Certificate Invalid (WSS)

**Cause:** Backend SSL certificate is self-signed or expired.

**Solutions:**

1. **Use valid SSL cert** (Let's Encrypt, mkcert)
2. **Accept self-signed cert in browser:**
   - Navigate to `https://136.115.36.127:8010` directly
   - Click "Advanced" → "Proceed anyway"
   - Return to app and try WebSocket again

---

## Production Deployment

### Recommended Setup

**Frontend:**
- Deployed on HTTPS (Vercel, Netlify, Firebase Hosting, Cloud Run)
- Example: `https://your-app.vercel.app`

**Backend WebSocket:**
- Deployed with SSL/TLS support
- Example: `wss://your-backend.example.com/api/live-camera/ws`

**Environment variable:**
```bash
VITE_LIVE_CAMERA_WS_URL=wss://your-backend.example.com/api/live-camera/ws
```

**Result:**
- ✅ No mixed content errors
- ✅ Secure WebSocket connection
- ✅ Works on all devices

---

## Summary

| Page Protocol | WebSocket URL (Input) | WebSocket URL (Used) | Works? |
|---------------|----------------------|---------------------|--------|
| HTTP | `ws://...` | `ws://...` | ✅ Yes |
| HTTP | `wss://...` | `wss://...` | ✅ Yes (if backend supports SSL) |
| HTTPS | `ws://...` | `wss://...` (auto) | ✅ Yes (if backend supports SSL) |
| HTTPS | `wss://...` | `wss://...` | ✅ Yes (if backend supports SSL) |

**Key change:** `ws://` automatically becomes `wss://` when page is HTTPS!

---

## Files Modified

📄 `/Users/eishahemchand/MotionLabsAI/src/components/LiveCameraWSFeed.tsx`

**Function:** `getWSUrl()`

**Change:** Auto-detect HTTPS and switch to WSS

---

**Next step:** Ensure your backend WebSocket server at `136.115.36.127:8010` supports WSS (SSL/TLS)! 🔒
