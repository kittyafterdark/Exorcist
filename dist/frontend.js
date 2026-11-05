/**
 * Image Exorcist — unofficial, frontend-only Spindle extension.
 * Intentionally changes presentation only. It never deletes host media.
 */

const STORAGE_KEY = 'image_exorcist_settings_v1';
const MAX_FILE_BYTES = 1_200_000;
const MARKERS = {
  background: 'data-ie-background',
  beforeBackground: 'data-ie-before-bg',
  afterBackground: 'data-ie-after-bg',
  beforeContent: 'data-ie-before-content',
  afterContent: 'data-ie-after-content',
};

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#1e1a26"/>
  <path d="M0 0 400 300M400 0 0 300" stroke="#5f4a68" stroke-width="8" opacity=".34"/>
  <rect x="24" y="24" width="352" height="252" rx="18" fill="none" stroke="#e9b5cf" stroke-width="5" stroke-dasharray="13 11"/>
  <path d="M160 122h80v56h-80zM173 147l15-14 19 21 12-10 20 24" fill="none" stroke="#e9b5cf" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="180" cy="137" r="5" fill="#e9b5cf"/>
  <text x="200" y="218" text-anchor="middle" font-size="21" font-weight="800" font-family="system-ui,sans-serif" fill="#fff0f7">IMAGE REVOKED</text>
</svg>`;
const PLACEHOLDER_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

function defaults() {
  return { enabled: true, mode: 'placeholder', source: '', includeBackgrounds: true };
}

function isAllowedImageSource(value) {
  if (typeof value !== 'string' || !value) return false;
  if (/^https?:\/\//i.test(value)) return true;
  if (/^data:image\/(?:png|jpeg|jpg|webp|gif|avif|svg\+xml);base64,[a-z\d+/=]+$/i.test(value)) return true;
  return false;
}

function readSettings() {
  const fallback = defaults();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return fallback;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : fallback.enabled,
      mode: ['placeholder', 'custom', 'hide'].includes(parsed.mode) ? parsed.mode : fallback.mode,
      source: isAllowedImageSource(parsed.source) ? parsed.source : '',
      includeBackgrounds: typeof parsed.includeBackgrounds === 'boolean' ? parsed.includeBackgrounds : true,
    };
  } catch {
    return fallback;
  }
}

function cssUrl(url) {
  return `url("${url.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n\f]/g, '')}")`;
}

function hasUrl(value) {
  return typeof value === 'string' && /(?:url\s*\(|image-set\s*\(|cross-fade\s*\()/i.test(value);
}

function imageUrl(settings) {
  return settings.mode === 'custom' && isAllowedImageSource(settings.source)
    ? settings.source
    : PLACEHOLDER_URL;
}

function replacementCss(settings) {
  if (!settings.enabled) return '';
  const mode = settings.mode;
  const uri = cssUrl(imageUrl(settings));
  const root = 'html.ie-exorcist-active';
  const imageSelector = `${root} img:not(.ie-exorcist-panel img), ${root} input[type="image"]`;
  const bgSelectors = [MARKERS.background, MARKERS.beforeBackground, MARKERS.afterBackground];
  const contentSelectors = [MARKERS.beforeContent, MARKERS.afterContent];

  if (mode === 'hide') {
    const bg = settings.includeBackgrounds ? `
      ${root} [${bgSelectors[0]}] { background-image: none !important; }
      ${root} [${bgSelectors[1]}]::before { background-image: none !important; }
      ${root} [${bgSelectors[2]}]::after { background-image: none !important; }
      ${root} [${contentSelectors[0]}]::before { content: none !important; }
      ${root} [${contentSelectors[1]}]::after { content: none !important; }` : '';
    return `${imageSelector}, ${root} svg image { visibility: hidden !important; }${bg}`;
  }
  const bg = settings.includeBackgrounds ? `
    ${root} [${bgSelectors[0]}] { background-image: ${uri} !important; background-size: cover !important; background-position: center !important; }
    ${root} [${bgSelectors[1]}]::before { background-image: ${uri} !important; background-size: cover !important; background-position: center !important; }
    ${root} [${bgSelectors[2]}]::after { background-image: ${uri} !important; background-size: cover !important; background-position: center !important; }
    ${root} [${contentSelectors[0]}]::before { content: ${uri} !important; }
    ${root} [${contentSelectors[1]}]::after { content: ${uri} !important; }` : '';
  return `${imageSelector} { content: ${uri} !important; object-fit: cover !important; }${bg}`;
}

const PANEL_CSS = `
.ie-exorcist-panel{display:grid;gap:14px;padding:18px;color:var(--lumiverse-text,inherit);font:inherit;}
.ie-exorcist-panel *{box-sizing:border-box;}
.ie-exorcist-hero{border:1px solid var(--lumiverse-border,#66546b);border-radius:18px;padding:16px;background:linear-gradient(130deg,rgba(184,102,151,.18),rgba(117,92,183,.08));}
.ie-exorcist-kicker{color:var(--lumiverse-text-muted,#b99dbb);font-size:10px;letter-spacing:.15em;font-weight:800;text-transform:uppercase;}
.ie-exorcist-title{font-size:21px;font-weight:900;letter-spacing:-.035em;margin:5px 0 6px;}
.ie-exorcist-muted{font-size:12px;line-height:1.6;color:var(--lumiverse-text-muted,#bcb2c4);}
.ie-exorcist-panel label{display:block;font-size:12px;font-weight:650;}
.ie-exorcist-panel select,.ie-exorcist-panel input[type="url"]{width:100%;border:1px solid var(--lumiverse-border,#66546b);background:var(--lumiverse-fill-subtle,#292431);color:var(--lumiverse-text,#fff);border-radius:10px;padding:10px 12px;font:inherit;min-width:0;}
.ie-exorcist-panel button,.ie-exorcist-file{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:37px;padding:8px 11px;border:1px solid var(--lumiverse-border,#66546b);border-radius:10px;background:var(--lumiverse-fill-subtle,#292431);color:var(--lumiverse-text,#fff);font:inherit;font-weight:700;font-size:12px;cursor:pointer;}
.ie-exorcist-panel button:hover,.ie-exorcist-file:hover{border-color:var(--lumiverse-primary,#d49cbb);}
.ie-exorcist-primary{background:var(--lumiverse-primary,#9b6089)!important;color:var(--lumiverse-bg,#16131b)!important;border-color:transparent!important;}
.ie-exorcist-row{display:flex;gap:9px;align-items:center;flex-wrap:wrap;}
.ie-exorcist-switch{display:flex!important;align-items:center;gap:9px;cursor:pointer;}
.ie-exorcist-switch input{width:17px;height:17px;accent-color:var(--lumiverse-primary,#d49cbb);}
.ie-exorcist-preview{height:122px;border:1px dashed var(--lumiverse-border,#66546b);border-radius:13px;background-color:#211b28;background-size:cover;background-position:center;display:grid;place-items:center;overflow:hidden;}
.ie-exorcist-status{font-size:11px;min-height:16px;color:var(--lumiverse-text-muted,#bcb2c4);line-height:1.5;word-break:break-word;}
.ie-exorcist-panel input[type=file]{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;}
`;

function mountControls(root, settings, onChange) {
  root.classList.add('ie-exorcist-panel');
  root.innerHTML = `
    <section class="ie-exorcist-hero">
      <div class="ie-exorcist-kicker">visual felony control center</div>
      <div class="ie-exorcist-title">Image Exorcist ✕</div>
      <div class="ie-exorcist-muted">No avatars. No inline art. No surprise eyeballs. Just your preferred flavor of visual destruction.</div>
    </section>
    <label class="ie-exorcist-switch"><input data-ie-input="enabled" type="checkbox"> Enable the nonsense</label>
    <label>Choose the crime
      <select data-ie-input="mode">
        <option value="placeholder">Replace with censored placeholder</option>
        <option value="custom">Replace with MY chosen image</option>
        <option value="hide">Vanish completely (keep layout)</option>
      </select>
    </label>
    <div class="ie-exorcist-preview" data-ie-input="preview" aria-label="Current replacement preview"></div>
    <label class="ie-exorcist-switch"><input data-ie-input="includeBackgrounds" type="checkbox"> Also attack CSS background images</label>
    <label>Custom image URL (http or https)
      <input type="url" data-ie-input="source" placeholder="https://example.com/your-curse.png" autocomplete="off" spellcheck="false">
    </label>
    <div class="ie-exorcist-row">
      <label class="ie-exorcist-file" for="ie-exorcist-file-input">Choose a local image</label>
      <input id="ie-exorcist-file-input" data-ie-input="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml">
      <button type="button" data-ie-input="clear">Clear custom image</button>
    </div>
    <div class="ie-exorcist-status" data-ie-input="status" role="status" aria-live="polite"></div>
    <div class="ie-exorcist-muted">Only the visible browser DOM gets styled. Your actual images, chats and character cards are untouched. Turn this off to restore them instantly. Local uploads are stored in this browser, not uploaded to Lumi.</div>
  `;
  const get = (name) => root.querySelector(`[data-ie-input="${name}"]`);
  const enabled = get('enabled');
  const mode = get('mode');
  const backgrounds = get('includeBackgrounds');
  const source = get('source');
  const preview = get('preview');
  const file = get('file');
  const status = get('status');
  let message = '';
  let fileChosen = false;

  function refresh() {
    enabled.checked = settings.enabled;
    mode.value = settings.mode;
    backgrounds.checked = settings.includeBackgrounds;
    const src = imageUrl(settings);
    preview.style.backgroundImage = cssUrl(src);
    preview.style.visibility = settings.mode === 'hide' ? 'hidden' : 'visible';
    // A large data URI isn't useful in a text field. Keep file selection intact.
    if (!fileChosen) source.value = settings.source.startsWith('data:') ? '' : settings.source;
    const statusText = message || (settings.mode === 'custom' && !settings.source
      ? 'No custom image yet — showing the built-in placeholder.'
      : settings.source.startsWith('data:') ? 'Local image selected and stored only in this browser.'
      : settings.enabled ? 'Image suppression enabled.' : 'Image suppression disabled.');
    status.textContent = statusText;
  }

  function update(patch) {
    Object.assign(settings, patch);
    message = onChange();
    refresh();
  }

  enabled.addEventListener('change', () => update({ enabled: enabled.checked }));
  mode.addEventListener('change', () => update({ mode: mode.value }));
  backgrounds.addEventListener('change', () => update({ includeBackgrounds: backgrounds.checked }));
  source.addEventListener('change', () => {
    const text = source.value.trim();
    if (text && !/^https?:\/\//i.test(text)) {
      message = 'Use a full http(s) image URL, or select a local image instead.';
      refresh();
      return;
    }
    fileChosen = false;
    update({ source: text, mode: text ? 'custom' : settings.mode });
  });
  file.addEventListener('change', async () => {
    const selected = file.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      message = 'That file is not an image.';
      refresh();
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      message = 'File is over 1.2 MB. Use a smaller image or its URL (browser storage is tiny).';
      refresh();
      return;
    }
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(selected);
      });
      if (!isAllowedImageSource(data)) {
        message = 'Could not use that image format.';
        refresh();
        return;
      }
      fileChosen = true;
      source.value = '';
      update({ source: data, mode: 'custom' });
    } catch {
      message = 'Could not read that image file.';
      refresh();
    }
  });
  get('clear').addEventListener('click', () => {
    fileChosen = false;
    source.value = '';
    file.value = '';
    update({ source: '' });
  });
  refresh();
  return { refresh };
}

export function setup(ctx) {
  const settings = readSettings();
  let disposed = false;
  const svgOriginals = new Map();
  const pending = new Map();
  let frame = 0;
  let removePresentation = () => {};

  const removePanelCss = ctx.dom.addStyle(PANEL_CSS);
  const tab = ctx.ui.registerDrawerTab({
    id: 'image-exorcist',
    title: 'Image Exorcist',
    shortName: 'EXORCIST',
    headerTitle: 'Image Exorcist',
    description: 'Hide or replace all images in the current browser UI',
    keywords: ['hide', 'images', 'avatars', 'censor', 'replace'],
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 3-3 4 4M3 3l18 18"/></svg>',
  });

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return '';
    } catch {
      return 'Browser storage is full or unavailable. Setting works now, but may reset when you reload.';
    }
  }

  function restoreSvg() {
    for (const [element, original] of svgOriginals) {
      if (original.href === null) element.removeAttribute('href');
      else element.setAttribute('href', original.href);
      if (original.xlink === null) element.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
      else element.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', original.xlink);
    }
    svgOriginals.clear();
  }

  function patchSvgImage(node) {
    if (!(node instanceof Element) || node.localName !== 'image' || node.namespaceURI !== 'http://www.w3.org/2000/svg') return;
    if (node.closest('.ie-exorcist-panel')) return;
    if (!settings.enabled || settings.mode === 'hide') return;
    const original = svgOriginals.get(node);
    const target = imageUrl(settings);
    if (!original) svgOriginals.set(node, {
      href: node.getAttribute('href'),
      xlink: node.getAttributeNS('http://www.w3.org/1999/xlink', 'href'),
    });
    else if (node.getAttribute('href') !== original.lastReplacement && node.getAttribute('href') !== original.href) {
      original.href = node.getAttribute('href');
    }
    const record = svgOriginals.get(node);
    record.lastReplacement = target;
    if (node.getAttribute('href') !== target) node.setAttribute('href', target);
    if (node.hasAttributeNS('http://www.w3.org/1999/xlink', 'href')) {
      node.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
    }
  }

  function markElement(element) {
    if (disposed || !settings.enabled || !settings.includeBackgrounds) return;
    if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) return;
    if (element.closest('.ie-exorcist-panel')) return;
    if (element.localName === 'image' && element.namespaceURI === 'http://www.w3.org/2000/svg') {
      patchSvgImage(element);
      return;
    }
    if (element.localName === 'img' || element.localName === 'source') return;
    let main;
    try { main = getComputedStyle(element); } catch { return; }
    if (hasUrl(main.backgroundImage)) element.setAttribute(MARKERS.background, '');
    for (const [pseudo, bg, content] of [
      ['::before', MARKERS.beforeBackground, MARKERS.beforeContent],
      ['::after', MARKERS.afterBackground, MARKERS.afterContent],
    ]) {
      let style;
      try { style = getComputedStyle(element, pseudo); } catch { continue; }
      if (hasUrl(style.backgroundImage)) element.setAttribute(bg, '');
      if (hasUrl(style.content)) element.setAttribute(content, '');
    }
  }

  function scanElement(element) {
    if (disposed || !(element instanceof Element)) return;
    if (element.closest('.ie-exorcist-panel')) return;
    if (element.localName === 'image' && element.namespaceURI === 'http://www.w3.org/2000/svg') {
      patchSvgImage(element);
    } else if (settings.includeBackgrounds) {
      markElement(element);
    }
  }

  function flush() {
    frame = 0;
    if (!settings.enabled || disposed) { pending.clear(); return; }
    let count = 0;
    // Limited per frame: big virtualized chats should never get a 20,000-element sync scan.
    for (const [element, recurse] of pending) {
      pending.delete(element);
      if (element.isConnected) {
        scanElement(element);
        if (recurse && !element.closest('.ie-exorcist-panel')) {
          for (const child of element.children) {
            if (!pending.has(child)) pending.set(child, true);
          }
        }
      }
      if (++count >= 240) break;
    }
    if (pending.size && !frame) frame = requestAnimationFrame(flush);
  }

  function queue(element, recursive = false) {
    if (!settings.enabled || disposed) return;
    if (element instanceof Element) pending.set(element, recursive || pending.get(element) || false);
    if (!frame) frame = requestAnimationFrame(flush);
  }

  const observer = new MutationObserver((records) => {
    if (disposed || !settings.enabled) return;
    for (const record of records) {
      if (record.type === 'childList') {
        for (const node of record.addedNodes) {
          queue(node, true);
          if (node instanceof Element && (node.localName === 'style' ||
              (node.localName === 'link' && node.getAttribute('rel') === 'stylesheet'))) {
            queue(document.body, true);
          }
        }
      } else if (record.type === 'attributes') {
        // SVG <image> can be changed by React after we patch it.
        if (record.target === document.documentElement) continue;
        if (record.target.localName === 'image' || settings.includeBackgrounds) {
          queue(record.target, record.attributeName === 'class');
        }
      }
    }
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'href'],
  });

  function applyPresentation() {
    removePresentation();
    removePresentation = () => {};
    document.documentElement.classList.toggle('ie-exorcist-active', settings.enabled);
    if (!settings.enabled || settings.mode === 'hide') restoreSvg();
    if (!settings.enabled) return;
    removePresentation = ctx.dom.addStyle(replacementCss(settings));
    queue(document.body, true);
    if (settings.mode !== 'hide' && settings.includeBackgrounds) {
      // Previously mounted SVG <image> nodes aren't automatically reobserved after a mode change.
      for (const node of document.querySelectorAll('svg image')) patchSvgImage(node);
    }
  }

  const controls = mountControls(tab.root, settings, () => {
    const saveMessage = persist();
    applyPresentation();
    quickAction?.setLabel(settings.enabled ? 'Exorcist: images OFF' : 'Exorcist: images ON');
    return saveMessage;
  });

  let quickAction = null;
  let detachQuick = () => {};
  try {
    quickAction = ctx.ui.registerInputBarAction({
      id: 'toggle-image-exorcist',
      label: settings.enabled ? 'Exorcist: images OFF' : 'Exorcist: images ON',
    });
    detachQuick = quickAction.onClick(() => {
      settings.enabled = !settings.enabled;
      persist();
      applyPresentation();
      quickAction.setLabel(settings.enabled ? 'Exorcist: images OFF' : 'Exorcist: images ON');
      controls.refresh();
    });
  } catch { /* Older Lumi builds may not expose the input action; the drawer still works. */ }

  applyPresentation();
  return () => {
    disposed = true;
    observer.disconnect();
    cancelAnimationFrame(frame);
    pending.clear();
    removePresentation();
    removePanelCss();
    document.documentElement.classList.remove('ie-exorcist-active');
    restoreSvg();
    // DOM flags are inert without our stylesheet; remove them from currently mounted nodes.
    for (const marker of Object.values(MARKERS)) {
      for (const node of document.querySelectorAll(`[${marker}]`)) node.removeAttribute(marker);
    }
    detachQuick();
    quickAction?.destroy();
    tab.destroy();
  };
}
