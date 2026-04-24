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
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme',
    t === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t
  );
}
applyTheme(localStorage.getItem(THEME_KEY) || 'system');
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if ((localStorage.getItem(THEME_KEY) || 'system') === 'system') applyTheme('system');
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

/* ── Service Worker ──────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ── Init ────────────────────────────────────────────────── */
renderHome();
