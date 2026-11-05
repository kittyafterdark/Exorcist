# Image Exorcist 1.0.0

Unofficial frontend-only [Lumiverse Spindle](https://docs.lumiverse.chat/) extension. No backend permissions.

## Install

Import `image-exorcist.zip` through Lumiverse's Extensions/Spindle interface or install the contents as an unpacked extension according to your Lumi version. The `spindle.json` is at the zip's root, and `dist/frontend.js` is already built. You do not need Bun or Node to use it.

## Controls

Open the **EXORCIST** sidebar drawer tab (or find `Image Exorcist` in Ctrl+K). Choose:

- **Placeholder:** replace `<img>` and `<input type="image">` with a censored SVG.
- **Custom image:** supply an HTTP(S) URL or choose a local file (up to 1.2 MB).
- **Hide:** visually hide images, leaving their layout footprint.
- **Also attack CSS backgrounds:** on by default. Captures URL backgrounds, pseudo-element backgrounds, and CSS `content: url(...)` images.
- **Quick toggle:** chat composer Extras menu (when supported).

Settings live in this browser's localStorage. Uploaded images remain in the browser; nothing is sent to a server by the extension. The extension does *not* delete images or modify chat/character records. Disabling or unloading restores display; SVG `<image>` hrefs are also restored. HTML `<img>` sources are never changed.

Known limits: browser cross-origin/sandboxed iframes, canvas painting, CSS masks, and video frames cannot be reliably recolored with this DOM approach. URLs loaded from a third-party image host may reveal the visitor's IP to that host. The extension does not cancel browser image downloads already initiated by the page.

## Develop

Edit `src/frontend.js`, then run `node scripts/build.mjs`. No dependencies required. An E2E mock-host test is included in `tests/` for browser-level verification.
