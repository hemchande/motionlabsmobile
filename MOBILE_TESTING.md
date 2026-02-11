# Load the app on your phone – troubleshooting

If the app **doesn’t load on your phone**, follow these steps.

## 1. Start the dev server

In the project folder:

```bash
npm run dev
```

Leave this running. You should see something like:

```
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

## 2. Get the URL for your phone

In **another terminal** (same machine), run:

```bash
npm run phone-url
```

It will print the exact URL to open on your phone (e.g. `http://192.168.1.105:3000`). Type that **exactly** in your phone’s browser (Safari, Chrome, etc.).

- Use **http://** (not https).
- Include **:3000** at the end.
- No trailing slash needed (both work).

## 3. Same Wi‑Fi

- Phone and computer must be on the **same Wi‑Fi network**.
- Guest networks or a different router = won’t work.

## 4. macOS firewall (fixes “can’t connect” on phone)

If the phone says **“can’t connect”** or the page never loads, the Mac firewall is often blocking the connection. Do this:

1. On your Mac: **System Settings** → **Network** → **Firewall** → **Options**.
2. In the list, find **Terminal** (or **Node**). If you run `npm run dev` from Cursor’s terminal, look for **Cursor** or **Terminal**.
3. Set it to **Allow incoming connections**.
4. Click **OK**, then on your phone try the URL again.

If the firewall is **Off**, this isn’t the cause — check same Wi‑Fi and the correct URL instead.

## 5. Quick checks

| Check | What to do |
|-------|------------|
| Works on computer? | Open `http://localhost:3000` in the computer’s browser. If it doesn’t load, the dev server isn’t running or the port is wrong. |
| Right address? | On the phone, use the **Network** URL from step 1, or the URL from `npm run phone-url`. Don’t use `localhost` on the phone. |
| Typo? | No spaces, `http://`, correct IP, `:3000`. |
| VPN? | Turn off VPN on the computer; it can block LAN access. |

## 5b. Athlete Coach API (port 8004) when on phone

When you open the app on your phone, it now calls the API at **the same host as the page** (e.g. `http://192.168.x.x:8004`). So:

- The **Athlete Coach API** must be running on your computer (e.g. port 8004).
- If the phone can load the app (port 3000) but API calls fail, allow **the process that runs the API** (e.g. Python/uvicorn) in the Mac firewall as well, or ensure nothing is blocking port 8004.

You don’t need to set `VITE_ATHLETE_COACH_API_URL` for local phone testing; the app uses your computer’s IP and port 8004 automatically.

## 6. Still not loading?

- Restart the dev server: stop it (Ctrl+C), run `npm run dev` again, then run `npm run phone-url` and use the new URL.
- Restart your Wi‑Fi router.
- Try another browser on the phone (e.g. Chrome if you used Safari).

---

## PWA: Add to Home Screen (Phase 2)

The app is set up as a **Progressive Web App (PWA)** so users can install it on their phone.

- **Build:** Run `npm run build`. The `build/` folder will contain `manifest.webmanifest`, `sw.js`, and the rest of the app.
- **Deploy:** Host the `build/` folder (e.g. Firebase Hosting, Cloud Storage + CDN, or any static host). The app must be served over **HTTPS** (or localhost) for “Add to Home Screen” to work.
- **Install on phone:** Open the app URL in Safari (iOS) or Chrome (Android). Use the browser’s **Add to Home Screen** / **Install app** option. The app will open in standalone mode (no browser UI).
- **Icons:** The app uses `public/icons/icon.svg`. For best support (e.g. maskable icons), add `icon-192.png` and `icon-512.png` in `public/icons/` — see `public/icons/README.md`.
