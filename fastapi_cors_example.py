"""
Example FastAPI app with CORS middleware configured
Copy this pattern into your Athlete Coach FastAPI backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI(
    title="Athlete Coach API",
    description="API for athlete coaching and analytics",
    version="1.0.0"
)

# ⚠️ IMPORTANT: Add CORS middleware RIGHT AFTER creating the app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific domains
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, PUT, DELETE, OPTIONS, etc.
    allow_headers=["*"],  # Allows all headers including Authorization
)

# Your existing routes...
@app.get("/")
async def root():
    return {"message": "Athlete Coach API"}

@app.get("/health")
async def health():
    return {"status": "ok", "server": "athlete_coach_fastapi"}

@app.get("/api/athletes")
async def get_athletes():
    # Your existing logic...
    return {"status": "success", "athletes": []}

# Add all your other existing routes below...
