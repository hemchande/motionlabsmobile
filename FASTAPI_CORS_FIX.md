# Fix CORS for Athlete Coach FastAPI on Cloud Run

## The Problem

Your Cloud Run service at `https://athlete-coach-fastapi-630016859450.europe-west1.run.app` doesn't have CORS headers, so browsers block requests from:
- `https://192.168.1.77:3000` (phone)
- Any origin that's not `localhost`

## The Solution

Add CORS middleware to your FastAPI application.

## Code to Add

In your FastAPI backend (the file where you create `app = FastAPI()`), add:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware - PUT THIS RIGHT AFTER app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Your existing routes below...
@app.get("/health")
async def health():
    return {"status": "ok", "server": "athlete_coach_fastapi"}
```

## More Secure Option (Recommended for Production)

If you want to restrict to specific origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://192.168.1.77:3000",  # Your phone/network testing
        "http://localhost:3000",       # Local development
        "https://localhost:3000",      # Local HTTPS
        "https://your-production-domain.com",  # Production domain when deployed
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Step-by-Step

1. **Find your FastAPI main file** (usually `main.py`, `app.py`, or similar)
2. **Import CORSMiddleware** at the top:
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   ```
3. **Add the middleware** right after `app = FastAPI()`:
   ```python
   app.add_middleware(CORSMiddleware, ...)
   ```
4. **Redeploy to Cloud Run**:
   ```bash
   gcloud run deploy athlete-coach-fastapi \\
     --source . \\
     --region europe-west1
   ```

## Verify It Works

After redeploying, test the CORS headers:

```bash
curl -I https://athlete-coach-fastapi-630016859450.europe-west1.run.app/api/athletes
```

You should see:
```
HTTP/2 200
access-control-allow-origin: *        ← This should appear now
access-control-allow-credentials: true
content-type: application/json
```

## Alternative: Quick Test with Cloud Run Console

If you can't redeploy immediately, you can test CORS by adding environment variables or using Cloud Run's console to edit the service.

---

**Next Step:** Add CORS to your FastAPI backend and redeploy to Cloud Run.
