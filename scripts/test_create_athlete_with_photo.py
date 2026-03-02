#!/usr/bin/env python3
"""
Test POST /api/create-athlete-with-photo with a PNG image and an existing athlete_id.

Usage:
  # Use API URL from env or default; fetch first athlete from /api/athletes
  python3 scripts/test_create_athlete_with_photo.py

  # Specify athlete_id and optional API URL
  ATHLETE_COACH_API_URL=https://... python3 scripts/test_create_athlete_with_photo.py
  python3 scripts/test_create_athlete_with_photo.py --athlete-id ATHLETE_123

  # Use a specific PNG file instead of built-in 1x1 PNG
  python3 scripts/test_create_athlete_with_photo.py --image path/to/photo.png
"""
import os
import sys
import argparse
import base64

# Minimal 1x1 PNG (red pixel) - valid PNG bytes
MINIMAL_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def get_api_url():
    return os.environ.get(
        "ATHLETE_COACH_API_URL",
        os.environ.get("VITE_ATHLETE_COACH_API_URL", "https://athlete-coach-fastapi-630016859450.europe-west1.run.app"),
    ).rstrip("/")


def fetch_existing_athlete_id(api_url: str):
    try:
        import urllib.request
        import json
        req = urllib.request.Request(
            f"{api_url}/api/athletes?limit=5",
            headers={"Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
        athletes = data.get("athletes") if isinstance(data, dict) else data
        if isinstance(athletes, list) and athletes:
            a = athletes[0]
            aid = a.get("athlete_id") or a.get("id") or (a.get("athlete_name") and f"athlete_{a.get('athlete_name', '').replace(' ', '_')}")
            if aid:
                return aid
    except Exception as e:
        print(f"Warning: could not fetch athletes: {e}")
    return None


def main():
    parser = argparse.ArgumentParser(description="Test /api/create-athlete-with-photo with a PNG and optional athlete_id")
    parser.add_argument("--athlete-id", type=str, help="Existing athlete_id to associate (optional; backend may use for update)")
    parser.add_argument("--image", type=str, help="Path to PNG file (default: minimal 1x1 PNG)")
    parser.add_argument("--email", type=str, default="test-create-photo@motionlabs.local", help="Form email")
    parser.add_argument("--name", type=str, default="Test Athlete Photo", help="Form athlete_name / full_name")
    parser.add_argument("--firebase-uid", type=str, default="test_uid_create_photo_123", help="Form firebase_uid")
    parser.add_argument("--password", type=str, default="TestPassword123!", help="Form password (required by API)")
    args = parser.parse_args()

    api_url = get_api_url()
    endpoint = f"{api_url}/api/create-athlete-with-photo"
    print(f"API base: {api_url}")
    print(f"Endpoint: {endpoint}")

    athlete_id = args.athlete_id
    if not athlete_id:
        athlete_id = fetch_existing_athlete_id(api_url)
        if athlete_id:
            print(f"Using existing athlete_id from /api/athletes: {athlete_id}")
        else:
            print("No --athlete-id and no athletes from API; sending without athlete_id (create-only).")
    else:
        print(f"Using provided athlete_id: {athlete_id}")
    # Use unique email when testing with existing athlete_id to avoid "user already exists"
    if athlete_id and "test-create-photo@" in args.email:
        import time
        args.email = f"test-photo-{athlete_id}-{int(time.time())}@motionlabs.local"
        print(f"Using unique email for this run: {args.email}")

    if args.image:
        with open(args.image, "rb") as f:
            photo_bytes = f.read()
        print(f"Loaded PNG from file: {args.image} ({len(photo_bytes)} bytes)")
    else:
        photo_bytes = base64.b64decode(MINIMAL_PNG_B64)
        print(f"Using built-in minimal PNG ({len(photo_bytes)} bytes)")

    try:
        import urllib.request
        import urllib.error

        # Build multipart form (simplified: no multipart boundary handling by hand - use a temp file and multipart encoder or curl)
        # Python stdlib doesn't have a nice multipart builder; use requests if available, else we'll use subprocess curl
        try:
            import requests
            files = {"photo": ("photo.png", photo_bytes, "image/png")}
            data = {
                "athlete_name": args.name,
                "full_name": args.name,
                "email": args.email,
                "firebase_uid": args.firebase_uid,
                "password": args.password,
            }
            if athlete_id:
                data["athlete_id"] = athlete_id
            resp = requests.post(endpoint, files=files, data=data, timeout=30)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text[:500]}")
            try:
                j = resp.json()
                print("JSON:", j)
            except Exception:
                pass
            sys.exit(0 if resp.ok else 1)
        except ImportError:
            pass

        # Fallback: use curl
        import tempfile
        import subprocess
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(photo_bytes)
            tmp.flush()
            tmp_path = tmp.name
        try:
            curl_cmd = [
                "curl", "-s", "-w", "\n%{http_code}", "-X", "POST",
                "-F", f"photo=@{tmp_path};type=image/png",
                "-F", f"athlete_name={args.name}",
                "-F", f"full_name={args.name}",
                "-F", f"email={args.email}",
                "-F", f"firebase_uid={args.firebase_uid}",
                "-F", f"password={args.password}",
            ]
            if athlete_id:
                curl_cmd += ["-F", f"athlete_id={athlete_id}"]
            curl_cmd.append(endpoint)
            out = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=30)
            body_and_code = (out.stdout or "") + (out.stderr or "")
            if "\n" in body_and_code:
                body, code = body_and_code.rsplit("\n", 1)
                try:
                    code = int(code)
                except ValueError:
                    code = 0
                print(f"Status: {code}")
                print(f"Response: {body[:500]}")
            else:
                print(out.stdout or out.stderr)
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
        sys.exit(0 if code == 200 else 1)

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
