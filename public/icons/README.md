# PWA icons

- **icon.svg** — Used for the web app manifest (any size).
- For best support on all devices (especially "Add to Home Screen"), add:
  - **icon-192.png** — 192×192 px
  - **icon-512.png** — 512×512 px

You can generate these from `icon.svg` using:
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- Or: export from Figma/design tool, or `convert icon.svg -resize 192x192 icon-192.png` (ImageMagick)

If the PNGs are missing, the manifest still works using the SVG icon.
