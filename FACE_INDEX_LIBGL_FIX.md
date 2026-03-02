# Fix: Face index fails with "libGL.so.1: cannot open shared object file"

When calling **POST /api/create-athlete-with-photo**, the response can be:

- `"face_added_to_index": false`
- `"face_error": "Error adding face to index: libGL.so.1: cannot open shared object file: No such file or directory"`

The user and photo are created correctly; only the **face embedding / add-to-index** step fails because the backend’s vision library (e.g. OpenCV) is trying to load OpenGL and the runtime doesn’t have the GL libraries (common on Cloud Run, minimal Docker, or headless servers).

---

## Fix on the backend (Athlete Coach FastAPI / Cloud Run)

Install the OpenGL/GLX libraries in the image or runtime that runs the FastAPI app.

### Option 1: Dockerfile (recommended)

Add before the line that runs your app (e.g. before `CMD`):

**Debian/Ubuntu-based image:**
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
```

**Alpine-based image:**
```dockerfile
RUN apk add --no-cache mesa-gl libglvnd
```

Then rebuild and redeploy the image (e.g. to Cloud Run).

### Option 2: Cloud Run (Dockerfile not under your control)

If you deploy with a base image that you can’t change, switch to a base image that already includes GL, for example:

- `python:3.11-slim` + the `apt-get` block above in your Dockerfile, or  
- An image that already includes OpenCV with GUI/GL support.

### Option 3: Force OpenCV to be headless (if you use OpenCV)

Before importing or using OpenCV in Python, set:

```bash
export OPENCV_VIDEOIO_PRIORITY_MSMF=0
```

and ensure the OpenCV build you use is a headless build (no Qt/GUI). Some pip-installed OpenCV wheels still pull in GL; in that case installing `libgl1-mesa-glx` (Option 1) is the most reliable.

---

## Verify

After redeploying:

1. Call **POST /api/create-athlete-with-photo** again with a clear face photo.
2. Check the response: `"face_added_to_index"` should be `true` and `"face_error"` should be absent or empty.

---

## If you can’t change the backend right now

- User creation and photo upload to GCP still work; only the face index is skipped.
- Face-based features (e.g. match face in video to athlete) won’t work until the backend can add faces to the index (libGL fix or headless OpenCV as above).
