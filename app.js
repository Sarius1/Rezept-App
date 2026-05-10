/* ── Storage ─────────────────────────────────────────────── */
const STORE_KEY = 'rezepte-v1';
const THEME_KEY = 'rezepte-theme';

function loadRecipes() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { return []; }
}
function saveRecipes(list) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ── Theme ───────────────────────────────────────────────── */
function isDark() {
  const t = localStorage.getItem(THEME_KEY) || 'system';
  return t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
}
function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark() ? 'dark' : 'light');
  const dark = isDark();
  const sun = document.getElementById('themeIconSun');
  const moon = document.getElementById('themeIconMoon');
  if (sun && moon) { sun.style.display = dark ? 'block' : 'none'; moon.style.display = dark ? 'none' : 'block'; }
}
applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if ((localStorage.getItem(THEME_KEY) || 'system') === 'system') applyTheme();
});

document.getElementById('btnTheme').addEventListener('click', () => {
  localStorage.setItem(THEME_KEY, isDark() ? 'light' : 'dark');
  applyTheme();
});

/* ── View Router ─────────────────────────────────────────── */
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

/* ── Home ────────────────────────────────────────────────── */
const recipeGrid = document.getElementById('recipeGrid');
const emptyState = document.getElementById('emptyState');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');

function renderHome(query = '') {
  const recipes = loadRecipes();
  const q = query.trim().toLowerCase();
  const filtered = q
    ? recipes.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.text || '').toLowerCase().includes(q)
      )
    : recipes;

  recipeGrid.innerHTML = '';
  emptyState.classList.add('hidden');
  noResults.classList.add('hidden');

  if (recipes.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  if (filtered.length === 0) {
    noResults.classList.remove('hidden');
    return;
  }

  filtered.forEach(r => {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = r.image
      ? `<img class="card-img" src="${r.image}" alt="${escHtml(r.title)}" loading="lazy" />`
      : `<div class="card-img-placeholder">🍽️</div>`;
    card.innerHTML += `<div class="card-body"><div class="card-title">${escHtml(r.title)}</div></div>`;
    card.addEventListener('click', () => openDetail(r.id));
    recipeGrid.appendChild(card);
  });
}

searchInput.addEventListener('input', () => renderHome(searchInput.value));
document.getElementById('btnOpenAdd').addEventListener('click', () => openForm());

/* ── Detail ──────────────────────────────────────────────── */
let currentId = null;

function openDetail(id) {
  const r = loadRecipes().find(x => x.id === id);
  if (!r) return;
  currentId = id;

  document.getElementById('detailTitle').textContent = r.title;

  const imgWrap = document.getElementById('detailImage');
  if (r.image) {
    imgWrap.innerHTML = `<img src="${r.image}" alt="${escHtml(r.title)}" />`;
    imgWrap.classList.remove('hidden');
  } else {
    imgWrap.classList.add('hidden');
  }

  const textEl = document.getElementById('detailText');
  if (r.text) {
    textEl.textContent = r.text;
    textEl.classList.remove('hidden');
  } else {
    textEl.classList.add('hidden');
  }

  const linkEl = document.getElementById('detailLink');
  if (r.link) {
    linkEl.href = r.link;
    document.getElementById('detailLinkText').textContent = r.link;
    linkEl.classList.remove('hidden');
  } else {
    linkEl.classList.add('hidden');
  }

  // Extra images
  let extraSection = document.getElementById('detailExtraImgs');
  if (extraSection) extraSection.remove();
  if (r.extraImages && r.extraImages.length) {
    extraSection = document.createElement('div');
    extraSection.id = 'detailExtraImgs';
    extraSection.className = 'extra-imgs';
    r.extraImages.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.addEventListener('click', () => openLightbox(src));
      extraSection.appendChild(img);
    });
    document.querySelector('.detail-content').appendChild(extraSection);
  }

  showView('viewDetail');
}

document.getElementById('btnBackDetail').addEventListener('click', () => {
  showView('viewHome');
  renderHome(searchInput.value);
});

document.getElementById('btnEdit').addEventListener('click', () => {
  if (currentId) openForm(currentId);
});

document.getElementById('btnDelete').addEventListener('click', () => {
  document.getElementById('deleteModal').classList.remove('hidden');
});
document.getElementById('btnCancelDelete').addEventListener('click', () => {
  document.getElementById('deleteModal').classList.add('hidden');
});
document.getElementById('btnConfirmDelete').addEventListener('click', () => {
  let recipes = loadRecipes().filter(r => r.id !== currentId);
  saveRecipes(recipes);
  document.getElementById('deleteModal').classList.add('hidden');
  showView('viewHome');
  renderHome(searchInput.value);
});

/* ── Form ────────────────────────────────────────────────── */
let editingId = null;
let coverImageData = null;
let extraImagesData = [];

function openForm(id = null) {
  editingId = id;
  coverImageData = null;
  extraImagesData = [];

  document.getElementById('formTitle').textContent = id ? 'Rezept bearbeiten' : 'Rezept hinzufügen';
  document.getElementById('fTitle').value = '';
  document.getElementById('fText').value = '';
  document.getElementById('fLink').value = '';
  document.getElementById('fImage').value = '';
  document.getElementById('imgPreview').innerHTML = '';
  document.getElementById('imgPreview').classList.add('hidden');
  document.getElementById('imgPlaceholder').classList.remove('hidden');
  document.getElementById('btnRemoveImg').style.display = 'none';
  document.getElementById('extraImgList').innerHTML = '';

  if (id) {
    const r = loadRecipes().find(x => x.id === id);
    if (r) {
      document.getElementById('fTitle').value = r.title || '';
      document.getElementById('fText').value = r.text || '';
      document.getElementById('fLink').value = r.link || '';
      if (r.image) {
        coverImageData = r.image;
        showCoverPreview(r.image);
      }
      if (r.extraImages) {
        extraImagesData = [...r.extraImages];
        renderExtraImgList();
      }
    }
  }

  showView('viewForm');
}

document.getElementById('btnBackForm').addEventListener('click', () => {
  if (editingId) { openDetail(editingId); }
  else { showView('viewHome'); renderHome(searchInput.value); }
});

/* Cover image */
document.getElementById('imgPicker').addEventListener('click', () => {
  document.getElementById('fImage').click();
});
document.getElementById('fImage').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  readFileAsDataURL(file, data => {
    coverImageData = data;
    showCoverPreview(data);
  });
});
document.getElementById('btnRemoveImg').addEventListener('click', e => {
  e.stopPropagation();
  coverImageData = null;
  document.getElementById('imgPreview').innerHTML = '';
  document.getElementById('imgPreview').classList.add('hidden');
  document.getElementById('imgPlaceholder').classList.remove('hidden');
  document.getElementById('btnRemoveImg').style.display = 'none';
});

function showCoverPreview(src) {
  const prev = document.getElementById('imgPreview');
  prev.innerHTML = `<img src="${src}" />`;
  prev.classList.remove('hidden');
  document.getElementById('imgPlaceholder').classList.add('hidden');
  document.getElementById('btnRemoveImg').style.display = '';
}

/* Extra images */
document.getElementById('fExtraImages').addEventListener('change', e => {
  const files = [...e.target.files];
  let loaded = 0;
  files.forEach(file => {
    readFileAsDataURL(file, data => {
      extraImagesData.push(data);
      loaded++;
      if (loaded === files.length) renderExtraImgList();
    });
  });
  e.target.value = '';
});

function renderExtraImgList() {
  const list = document.getElementById('extraImgList');
  list.innerHTML = '';
  extraImagesData.forEach((src, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'extra-img-thumb';
    wrap.innerHTML = `<img src="${src}" /><button class="remove-img" data-i="${i}">✕</button>`;
    wrap.querySelector('.remove-img').addEventListener('click', () => {
      extraImagesData.splice(i, 1);
      renderExtraImgList();
    });
    list.appendChild(wrap);
  });
}

/* Save */
document.getElementById('btnSave').addEventListener('click', () => {
  const title = document.getElementById('fTitle').value.trim();
  if (!title) { document.getElementById('fTitle').focus(); return; }

  const recipe = {
    id: editingId || genId(),
    title,
    text: document.getElementById('fText').value.trim(),
    link: document.getElementById('fLink').value.trim(),
    image: coverImageData || null,
    extraImages: [...extraImagesData],
    updatedAt: Date.now()
  };

  let recipes = loadRecipes();
  if (editingId) {
    const idx = recipes.findIndex(r => r.id === editingId);
    if (idx > -1) { recipe.createdAt = recipes[idx].createdAt; recipes[idx] = recipe; }
  } else {
    recipe.createdAt = Date.now();
    recipes.unshift(recipe);
  }
  saveRecipes(recipes);

  openDetail(recipe.id);
});

/* ── Lightbox ────────────────────────────────────────────── */
function openLightbox(src) {
  const lb = document.createElement('div');
  lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;cursor:zoom-out';
  lb.innerHTML = `<img src="${src}" style="max-width:100%;max-height:100%;border-radius:8px;object-fit:contain" />`;
  lb.addEventListener('click', () => lb.remove());
  document.body.appendChild(lb);
}

/* ── Helpers ─────────────────────────────────────────────── */
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function readFileAsDataURL(file, cb) {
  const reader = new FileReader();
  reader.onload = e => cb(e.target.result);
  reader.readAsDataURL(file);
}

/* ── Import: Status Helper ───────────────────────────────── */
function setImportStatus(msg, type = 'loading') {
  const el = document.getElementById('importStatus');
  el.textContent = msg;
  el.className = `import-status ${type}`;
  el.classList.remove('hidden');
}
function clearImportStatus() {
  document.getElementById('importStatus').classList.add('hidden');
}

/* ── Import: Bild scannen (Tesseract.js) ─────────────────── */
document.getElementById('btnScanImg').addEventListener('click', () => {
  document.getElementById('ocrFileInput').click();
});

document.getElementById('ocrFileInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';

  setImportStatus('Tesseract wird geladen…');
  try {
    await loadTesseract();
    setImportStatus('Bild wird gescannt…');
    const result = await Tesseract.recognize(file, 'deu+eng', { logger: () => {} });
    const text = result.data.text.trim();
    if (!text) { setImportStatus('Kein Text erkannt. Versuche ein schärferes Bild.', 'err'); return; }
    const existing = document.getElementById('fText').value.trim();
    document.getElementById('fText').value = existing ? existing + '\n\n' + text : text;
    setImportStatus('Text erfolgreich erkannt und eingefügt.', 'ok');
    setTimeout(clearImportStatus, 3000);
  } catch (err) {
    setImportStatus('Fehler beim Scannen: ' + err.message, 'err');
  }
});

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Tesseract konnte nicht geladen werden'));
    document.head.appendChild(s);
  });
}

/* ── Import: Von Website ─────────────────────────────────── */
const SOCIAL = ['instagram.com', 'tiktok.com', 'youtube.com', 'youtu.be', 'twitter.com', 'x.com', 'facebook.com'];

document.getElementById('btnFromUrl').addEventListener('click', () => {
  const wrap = document.getElementById('urlImportWrap');
  wrap.classList.toggle('hidden');
  if (!wrap.classList.contains('hidden')) document.getElementById('importUrlInput').focus();
});

document.getElementById('btnFetchUrl').addEventListener('click', () => {
  const url = document.getElementById('importUrlInput').value.trim();
  if (!url) return;
  importFromUrl(url);
});

document.getElementById('importUrlInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btnFetchUrl').click();
});

async function importFromUrl(url) {
  if (SOCIAL.some(d => url.includes(d))) {
    setImportStatus('Instagram, TikTok & Co. erlauben keinen direkten Zugriff. Kopiere die Beschreibung und füge sie ins Textfeld ein.', 'err');
    return;
  }
  setImportStatus('Website wird geladen…');
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error('Seite nicht erreichbar');
    const data = await res.json();
    const html = data.contents;
    if (!html) throw new Error('Kein Inhalt erhalten');

    // Versuche zuerst JSON-LD (strukturierte Rezeptdaten)
    const recipe = parseJsonLd(html);
    if (recipe) {
      if (recipe.title) document.getElementById('fTitle').value = recipe.title;
      if (recipe.text)  document.getElementById('fText').value  = recipe.text;
      if (!document.getElementById('fLink').value) document.getElementById('fLink').value = url;
      document.getElementById('urlImportWrap').classList.add('hidden');
      setImportStatus('Rezept erfolgreich importiert.', 'ok');
      setTimeout(clearImportStatus, 3000);
      return;
    }

    // Fallback: einfacher Text aus HTML
    const text = stripHtml(html);
    if (text.length < 80) throw new Error('Zu wenig Text gefunden');
    document.getElementById('fText').value = text.slice(0, 4000);
    if (!document.getElementById('fLink').value) document.getElementById('fLink').value = url;
    document.getElementById('urlImportWrap').classList.add('hidden');
    setImportStatus('Text importiert — bitte überprüfen und anpassen.', 'ok');
    setTimeout(clearImportStatus, 4000);
  } catch (err) {
    setImportStatus('Fehler: ' + err.message, 'err');
  }
}

function parseJsonLd(html) {
  try {
    const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const m of matches) {
      let data;
      try { data = JSON.parse(m[1]); } catch { continue; }
      const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
      for (const item of items) {
        if (item['@type'] !== 'Recipe') continue;

        const title = item.name || '';
        const parts = [];

        // Zutaten
        const ings = item.recipeIngredient || [];
        if (ings.length) parts.push('Zutaten:\n' + ings.map(i => '• ' + i).join('\n'));

        // Schritte
        const steps = item.recipeInstructions || [];
        if (steps.length) {
          const stepTexts = steps.map((s, i) => {
            const txt = typeof s === 'string' ? s : (s.text || s.name || '');
            return `${i + 1}. ${txt}`;
          });
          parts.push('Zubereitung:\n' + stepTexts.join('\n'));
        }

        // Beschreibung
        if (item.description && !parts.length) parts.unshift(item.description);

        // Zeit
        const time = item.totalTime || item.cookTime || '';
        if (time) parts.push('Zeit: ' + time.replace('PT','').replace('M',' min').replace('H',' Std.'));

        if (title || parts.length) return { title, text: parts.join('\n\n') };
      }
    }
  } catch {}
  return null;
}

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,nav,footer,header,aside,iframe').forEach(el => el.remove());
  return (doc.body?.innerText || '').replace(/\n{3,}/g, '\n\n').trim();
}

/* ── Service Worker ──────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ── Init ────────────────────────────────────────────────── */
renderHome();
