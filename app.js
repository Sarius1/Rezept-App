/* ─── Theme ──────────────────────────────────────────────── */
const THEME_KEY = 'rezept-theme';
const API_KEY_STORAGE = 'rezept-api-key';

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'system';
  applyTheme(saved);
}

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.dataset.theme;
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  });
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if ((localStorage.getItem(THEME_KEY) || 'system') === 'system') applyTheme('system');
});

/* ─── Navigation ─────────────────────────────────────────── */
const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const settingsBtn = document.getElementById('settingsBtn');
let inSettings = false;

settingsBtn.addEventListener('click', () => {
  inSettings = !inSettings;
  mainView.classList.toggle('active', !inSettings);
  settingsView.classList.toggle('active', inSettings);
  settingsBtn.setAttribute('aria-label', inSettings ? 'Zurück' : 'Einstellungen');
  settingsBtn.innerHTML = inSettings
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
});

/* ─── Tabs ───────────────────────────────────────────────── */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

/* ─── API Key ────────────────────────────────────────────── */
const apiKeyInput = document.getElementById('apiKeyInput');
const keyStatus = document.getElementById('keyStatus');

function loadApiKey() {
  const key = localStorage.getItem(API_KEY_STORAGE) || '';
  apiKeyInput.value = key ? '••••••••' + key.slice(-4) : '';
}

document.getElementById('saveApiKey').addEventListener('click', () => {
  const val = apiKeyInput.value.trim();
  if (!val || val.startsWith('••')) { showToast('Kein neuer Key eingegeben'); return; }
  if (!val.startsWith('AIza')) {
    keyStatus.textContent = 'Ungültiger Key — muss mit AIza beginnen';
    keyStatus.className = 'key-status err';
    keyStatus.classList.remove('hidden');
    return;
  }
  localStorage.setItem(API_KEY_STORAGE, val);
  loadApiKey();
  keyStatus.textContent = 'API Key gespeichert ✓';
  keyStatus.className = 'key-status ok';
  keyStatus.classList.remove('hidden');
  setTimeout(() => keyStatus.classList.add('hidden'), 3000);
});

/* ─── Device Detection & Setup Instructions ─────────────── */
function detectDevice() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function renderSetupInstructions() {
  const box = document.getElementById('setupInstructions');
  const device = detectDevice();

  if (device === 'android') {
    box.innerHTML = `
      <strong>Android — Web Share Target</strong>
      <ol style="margin-top:10px">
        <li>Öffne diese App in <span class="step-tag">Chrome</span></li>
        <li>Tippe auf <span class="step-tag">⋮ Menü → Zum Startbildschirm hinzufügen</span></li>
        <li>App bestätigen — fertig!</li>
        <li>Öffne ein Instagram Reel → <span class="step-tag">Teilen</span> → <span class="step-tag">Rezept Extraktor</span></li>
      </ol>
      <p style="margin-top:10px;font-size:.8rem;color:var(--text-muted)">Die App erscheint automatisch im Teilen-Menü nach der Installation.</p>
    `;
  } else if (device === 'ios') {
    box.innerHTML = `
      <strong>iPhone — iOS Shortcut</strong>
      <ol style="margin-top:10px">
        <li>Öffne diese App in <span class="step-tag">Safari</span></li>
        <li>Tippe auf <span class="step-tag">Teilen → Zum Home-Bildschirm</span> um die App zu installieren</li>
        <li>Lade den Shortcut herunter:</li>
      </ol>
      <a class="download-link" href="shortcuts://run-shortcut?name=RezeptExtraktor" id="shortcutLink">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Shortcut installieren
      </a>
      <p style="margin-top:10px;font-size:.8rem;color:var(--text-muted)">Nach Installation: Instagram Reel → Teilen → Shortcuts → <em>Rezept Extraktor</em></p>
    `;
  } else {
    box.innerHTML = `
      <strong>Desktop</strong><br>
      <p style="margin-top:8px">Auf dem Desktop kannst du Links und Texte direkt in die App einfügen.</p>
      <p style="margin-top:6px;font-size:.8rem;color:var(--text-muted)">Für mobile Nutzung: Öffne die App auf deinem Smartphone.</p>
    `;
  }
}

/* ─── File Upload ────────────────────────────────────────── */
const fileDrop = document.getElementById('fileDrop');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const extractFileBtn = document.getElementById('extractFileBtn');
let selectedFile = null;

fileDrop.addEventListener('click', () => fileInput.click());
fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.classList.add('drag-over'); });
fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('drag-over'));
fileDrop.addEventListener('drop', e => {
  e.preventDefault();
  fileDrop.classList.remove('drag-over');
  const f = e.dataTransfer.files[0];
  if (f) setFile(f);
});
fileInput.addEventListener('change', () => { if (fileInput.files[0]) setFile(fileInput.files[0]); });

function setFile(f) {
  selectedFile = f;
  const mb = (f.size / 1024 / 1024).toFixed(1);
  fileInfo.textContent = `${f.name} (${mb} MB)`;
  fileInfo.classList.remove('hidden');
  extractFileBtn.classList.remove('hidden');
}

extractFileBtn.addEventListener('click', () => {
  if (!selectedFile) return;
  extractFromFile(selectedFile);
});

/* ─── Extract Helpers ────────────────────────────────────── */
function showLoading(msg = 'Rezept wird extrahiert...') {
  document.getElementById('inputCard').classList.add('hidden');
  document.getElementById('loadingCard').classList.remove('hidden');
  document.getElementById('resultCard').classList.add('hidden');
  document.getElementById('loadingText').textContent = msg;
}

function showResult(recipe, sourceUrl = '') {
  document.getElementById('loadingCard').classList.add('hidden');
  document.getElementById('resultCard').classList.remove('hidden');

  document.getElementById('recipeTitle').textContent = recipe.title || 'Rezept';
  document.getElementById('recipeDescription').textContent = recipe.description || '';

  // Difficulty badge
  const diff = document.getElementById('recipeDifficulty');
  const diffMap = { easy: 'Einfach', medium: 'Mittel', hard: 'Schwer' };
  diff.textContent = diffMap[recipe.difficulty] || recipe.difficulty || '';
  diff.className = 'badge ' + (recipe.difficulty || '');

  // Time
  const timeEl = document.getElementById('recipeTime');
  timeEl.textContent = recipe.estimated_time || '';
  timeEl.classList.toggle('hidden', !recipe.estimated_time);

  // Source
  const src = sourceUrl || recipe.source_url || '';
  const sourceSection = document.getElementById('sourceSection');
  if (src) {
    document.getElementById('sourceLink').href = src;
    sourceSection.classList.remove('hidden');
  } else {
    sourceSection.classList.add('hidden');
  }

  // Ingredients
  const ul = document.getElementById('ingredientsList');
  ul.innerHTML = (recipe.ingredients || []).map(ing => {
    const amt = [ing.amount, ing.unit].filter(Boolean).join(' ');
    return `<li><span>${ing.name}</span>${amt ? `<span class="ingredient-amount">${amt}</span>` : ''}</li>`;
  }).join('');

  // Steps
  const ol = document.getElementById('stepsList');
  ol.innerHTML = (recipe.steps || []).map((s, i) =>
    `<li><span class="step-num">${i + 1}</span><span>${s}</span></li>`
  ).join('');

  // Tips
  const tips = recipe.tips || [];
  const tipsSection = document.getElementById('tipsSection');
  if (tips.length) {
    document.getElementById('tipsList').innerHTML = tips.map(t => `<li>${t}</li>`).join('');
    tipsSection.classList.remove('hidden');
  } else {
    tipsSection.classList.add('hidden');
  }
}

function showInput() {
  document.getElementById('inputCard').classList.remove('hidden');
  document.getElementById('loadingCard').classList.add('hidden');
  document.getElementById('resultCard').classList.add('hidden');
}

/* ─── Gemini API Call (kostenlos) ────────────────────────── */
async function callGemini(text, sourceUrl = '') {
  const apiKey = localStorage.getItem(API_KEY_STORAGE);
  if (!apiKey) {
    showToast('Bitte zuerst API Key in Einstellungen eingeben');
    showInput();
    return null;
  }

  const prompt = `Du bist ein Rezept-Extraktions-Assistent. Analysiere den folgenden Text und extrahiere ein strukturiertes Rezept.

Gib NUR valides JSON zurück, kein Text davor oder danach, keine Markdown-Codeblöcke. Format:
{
  "title": "",
  "description": "",
  "source_url": "${sourceUrl}",
  "ingredients": [{"name": "", "amount": "", "unit": ""}],
  "steps": [""],
  "tips": [""],
  "estimated_time": "",
  "difficulty": "easy | medium | hard"
}

Regeln:
- Erfinde keine Details
- Bei unklaren Mengen: amount und unit leer lassen
- Schritte kurz und präzise
- difficulty: easy/medium/hard
- Wenn kein Titel: einfachen realistischen Titel generieren

Text:
${text}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1500 }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API Fehler ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error('Keine Antwort von Gemini');

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Kein JSON in Antwort gefunden');
  return JSON.parse(jsonMatch[0]);
}

/* ─── URL Helpers ────────────────────────────────────────── */
const SOCIAL_MEDIA = ['instagram.com', 'tiktok.com', 'youtube.com', 'youtu.be', 'twitter.com', 'x.com', 'facebook.com'];

function isSocialMedia(url) {
  return SOCIAL_MEDIA.some(d => url.includes(d));
}

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Remove scripts, styles, nav, footer
  doc.querySelectorAll('script,style,nav,footer,header,aside,[aria-hidden="true"]').forEach(el => el.remove());
  return (doc.body?.innerText || doc.body?.textContent || '').replace(/\s{3,}/g, '\n\n').trim().slice(0, 8000);
}

async function fetchPageText(url) {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error('Seite konnte nicht geladen werden');
  const data = await res.json();
  if (!data.contents) throw new Error('Kein Inhalt erhalten');
  return stripHtml(data.contents);
}

/* ─── Extract from URL ───────────────────────────────────── */
document.getElementById('extractUrlBtn').addEventListener('click', async () => {
  const url = document.getElementById('urlInput').value.trim();
  if (!url) { showToast('Bitte URL eingeben'); return; }

  if (isSocialMedia(url)) {
    showSocialMediaHint(url);
    return;
  }

  showLoading('Seite wird gelesen...');
  try {
    const pageText = await fetchPageText(url);
    if (!pageText || pageText.length < 50) throw new Error('Zu wenig Text auf der Seite gefunden');
    const recipe = await callGemini(`Quelle: ${url}\n\n${pageText}`, url);
    if (recipe) showResult(recipe, url);
  } catch (e) {
    showToast('Fehler: ' + e.message);
    showInput();
  }
});

function showSocialMediaHint(url) {
  document.getElementById('inputCard').classList.add('hidden');
  document.getElementById('loadingCard').classList.add('hidden');

  const resultCard = document.getElementById('resultCard');
  resultCard.classList.remove('hidden');
  resultCard.innerHTML = `
    <div style="text-align:center;padding:16px 0">
      <div style="font-size:2rem;margin-bottom:12px">📱</div>
      <h2 style="font-size:1.1rem;margin-bottom:10px">Social-Media-Link erkannt</h2>
      <p style="color:var(--text-muted);font-size:.88rem;line-height:1.5;margin-bottom:20px">
        Instagram, TikTok & Co. erlauben keinen direkten Zugriff auf Inhalte.<br>
        So geht's trotzdem:
      </p>
      <div style="text-align:left;background:var(--surface2);border-radius:12px;padding:16px;font-size:.88rem;line-height:1.8">
        <strong>Option 1 — Beschreibung kopieren</strong><br>
        Öffne das Reel → tippe auf <em>„..."</em> → <em>„Beschreibung kopieren"</em> → Tab „Text einfügen"
        <br><br>
        <strong>Option 2 — App installieren</strong><br>
        Installiere die App und nutze den <em>Teilen-Button</em> direkt im Reel (siehe Einstellungen)
      </div>
      <div style="display:flex;gap:8px;margin-top:20px;justify-content:center;flex-wrap:wrap">
        <button class="btn-primary" id="goToTextTab">Text einfügen</button>
        <button class="btn-ghost" id="backFromHint">Zurück</button>
      </div>
    </div>
  `;
  document.getElementById('goToTextTab').addEventListener('click', () => {
    showInput();
    document.querySelector('[data-tab="text"]').click();
  });
  document.getElementById('backFromHint').addEventListener('click', showInput);
}

/* ─── Extract from Text ──────────────────────────────────── */
document.getElementById('extractTextBtn').addEventListener('click', async () => {
  const text = document.getElementById('textInput').value.trim();
  if (!text) { showToast('Bitte Text eingeben'); return; }
  showLoading('Rezept wird extrahiert...');
  try {
    const recipe = await callGemini(text);
    if (recipe) showResult(recipe);
  } catch (e) {
    showToast('Fehler: ' + e.message);
    showInput();
  }
});

/* ─── Extract from File ──────────────────────────────────── */
async function extractFromFile(file) {
  showLoading('Audio wird transkribiert...');
  try {
    const apiKey = localStorage.getItem(API_KEY_STORAGE);
    if (!apiKey) {
      showToast('Bitte zuerst API Key in Einstellungen eingeben');
      showInput();
      return;
    }

    // Whisper transcription via OpenAI (requires separate key) or
    // read as base64 and send to Claude if it's a short audio.
    // For now: inform user that audio transcription needs a backend.
    showToast('Audio-Transkription benötigt Backend — kommt bald!');
    showInput();
  } catch (e) {
    showToast('Fehler: ' + e.message);
    showInput();
  }
}

/* ─── Result Actions ─────────────────────────────────────── */
document.getElementById('copyBtn').addEventListener('click', () => {
  const title = document.getElementById('recipeTitle').textContent;
  const ingredients = [...document.querySelectorAll('#ingredientsList li')].map(li => {
    const name = li.querySelector('span:first-child').textContent;
    const amt = li.querySelector('.ingredient-amount')?.textContent || '';
    return `• ${name}${amt ? ' — ' + amt : ''}`;
  }).join('\n');
  const steps = [...document.querySelectorAll('#stepsList li')].map((li, i) =>
    `${i + 1}. ${li.querySelector('span:last-child').textContent}`
  ).join('\n');

  const text = `${title}\n\nZutaten:\n${ingredients}\n\nZubereitung:\n${steps}`;
  navigator.clipboard.writeText(text).then(() => showToast('Rezept kopiert!'));
});

document.getElementById('newRecipeBtn').addEventListener('click', showInput);

/* ─── Share Target (Web Share Target API) ────────────────── */
async function handleShareTarget() {
  const params = new URLSearchParams(window.location.search);
  const sharedUrl = params.get('url') || params.get('text') || '';
  if (!sharedUrl) return;

  // Clear URL params
  window.history.replaceState({}, '', window.location.pathname);

  const url = sharedUrl.trim();
  document.getElementById('urlInput').value = url;
  document.querySelector('[data-tab="url"]').click();

  if (isSocialMedia(url)) {
    showSocialMediaHint(url);
    return;
  }

  showToast('Link empfangen — extrahiere Rezept...');
  showLoading('Seite wird gelesen...');
  try {
    const pageText = await fetchPageText(url);
    const recipe = await callGemini(`Quelle: ${url}\n\n${pageText}`, url);
    if (recipe) showResult(recipe, url);
  } catch (e) {
    showToast('Fehler: ' + e.message);
    showInput();
  }
}

/* ─── Toast ──────────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}

/* ─── Service Worker ─────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ─── Onboarding ─────────────────────────────────────────── */
function showOnboarding() {
  document.getElementById('onboarding').classList.remove('hidden');
}

function closeOnboarding() {
  document.getElementById('onboarding').classList.add('hidden');
}

document.getElementById('obSaveBtn').addEventListener('click', () => {
  const val = document.getElementById('obApiKeyInput').value.trim();
  const err = document.getElementById('obKeyError');
  if (!val) { err.textContent = 'Bitte Key eingeben.'; err.classList.remove('hidden'); return; }
  if (!val.startsWith('AIza')) {
    err.textContent = 'Ungültiger Key — muss mit AIza beginnen. Bitte nochmal kopieren.';
    err.classList.remove('hidden');
    return;
  }
  localStorage.setItem(API_KEY_STORAGE, val);
  localStorage.setItem('rezept-onboarded', '1');
  loadApiKey();
  closeOnboarding();
  showToast('API Key gespeichert — los geht\'s! 🎉');
});

document.getElementById('obSkipBtn').addEventListener('click', () => {
  localStorage.setItem('rezept-onboarded', '1');
  closeOnboarding();
});

/* ─── Init ───────────────────────────────────────────────── */
initTheme();
loadApiKey();
renderSetupInstructions();
handleShareTarget();

if (!localStorage.getItem('rezept-onboarded') && !localStorage.getItem(API_KEY_STORAGE)) {
  showOnboarding();
}
