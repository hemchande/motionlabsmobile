# HTTP Mode Enabled (HTTPS Disabled)

## Current Status

✅ **Running on HTTP** - Dev server accessible at `http://localhost:3000` and `http://192.168.x.x:3000`

---

## What Changed

### Before (HTTPS)
```typescript
server: {
  https: {
    key: fs.readFileSync(path.resolve(__dirname, '.cert/key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, '.cert/cert.pem')),
  },
}
```

**URLs:**
- `https://localhost:3000` ✅
- `https://192.168.x.x:3000` ✅

---

### Now (HTTP)
```typescript
server: {
  // HTTPS disabled - running on HTTP for now
  // https: { ... }  ← Commented out
}
```

**URLs:**
- `http://localhost:3000` ✅
- `http://192.168.x.x:3000` ✅

---

## Important: Features That Require HTTPS

### ⚠️ Will NOT Work on HTTP (Network IP)

1. **WebSocket Live Camera Feed**
   - `getUserMedia()` API requires secure context (HTTPS or localhost)
   - ❌ Won't work on `http://192.168.x.x:3000` (network IP)
   - ✅ Works on `http://localhost:3000` only

2. **Service Workers / PWA**
   - PWA installation requires HTTPS
   - ❌ Won't install on network IPs

---

## What WILL Work

### ✅ On `http://localhost:3000`
- Google OAuth login
- Firebase Authentication
- Firestore read/write
- FastAPI backend calls
- Cloudflare Stream videos
- WebSocket live camera (localhost exception)
- All app features

### ✅ On `http://192.168.x.x:3000` (Phone/Tablet)
- Google OAuth login
- Firebase Authentication
- Firestore read/write
- FastAPI backend calls
- Cloudflare Stream videos
- Dashboard, Alerts, Record tabs
- ❌ **NOT** WebSocket live camera (requires HTTPS)

---

## Testing on Phone

### Start Dev Server
```bash
npm run dev
```

### Access on Phone
1. Find your computer's IP:
   ```bash
   npm run phone-url
   ```

2. Open on phone:
   ```
   http://192.168.x.x:3000
   ```

### Expected Console Logs

**✅ Should work:**
```
Firebase initialized
User authenticated
Dashboard loaded
```

**❌ Won't work (getUserMedia):**
```
Failed to start webcam: TypeError: Cannot read properties of undefined
```

---

## When to Use HTTP vs HTTPS

### Use HTTP When:
- Testing basic features (login, dashboard, alerts)
- Don't need live camera on phone
- Want faster dev setup (no SSL certs)
- Firestore rules testing

### Use HTTPS When:
- Testing live camera on phone/network IP
- Testing PWA installation
- Production deployment
- Full feature testing

---

## How to Re-Enable HTTPS

Edit `vite.config.ts` and uncomment the HTTPS section:

```typescript
server: {
  https: {
    key: fs.readFileSync(path.resolve(__dirname, '.cert/key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, '.cert/cert.pem')),
  },
}
```

**Prerequisites:**
- `.cert/key.pem` and `.cert/cert.pem` must exist
- Install with `mkcert` (see `MOBILE_TESTING.md`)

---

## Current Configuration

**File:** `vite.config.ts`

**Server config:**
```typescript
server: {
  port: 3000,
  host: '0.0.0.0',        // Listen on all network interfaces
  open: true,              // Auto-open browser
  strictPort: false,       // Try next port if 3000 busy
  // https: { ... }        ← Disabled (HTTP mode)
}
```

---

## Testing Checklist

### On Laptop (`http://localhost:3000`)
- [ ] Login works
- [ ] Dashboard loads
- [ ] Alerts tab accessible
- [ ] Record tab accessible
- [ ] Live camera works (localhost exception)

### On Phone (`http://192.168.x.x:3000`)
- [ ] Login works
- [ ] Dashboard loads
- [ ] Alerts tab accessible
- [ ] Record tab accessible
- [ ] ⚠️ Live camera won't work (expected - needs HTTPS)

---

## Summary

| Feature | HTTP (localhost) | HTTP (network IP) | HTTPS (all) |
|---------|------------------|-------------------|-------------|
| Login | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| Alerts | ✅ | ✅ | ✅ |
| Record | ✅ | ✅ | ✅ |
| Live Camera | ✅ | ❌ | ✅ |
| PWA Install | ❌ | ❌ | ✅ |

**Current mode:** HTTP (good for testing basic features, skip live camera on phone)

**To enable live camera on phone:** Switch back to HTTPS mode

---

## Restart Dev Server

If dev server is running, restart it to apply changes:

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

**New URL:** `http://localhost:3000` (not https!)

✅ **HTTP mode enabled!**
