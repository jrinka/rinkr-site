const API = '/api/clippings';
const PAGE_SIZE = 10;

let allClippings = [];
let activeTag = 'all';
let visibleCount = PAGE_SIZE;
let unfurling = false;

// DOM refs
const titleInput    = document.getElementById('clip-title');
const tagInput      = document.getElementById('clip-tag');
const urlInput      = document.getElementById('clip-url');
const noteInput     = document.getElementById('clip-note');
const submitBtn     = document.getElementById('clip-submit');
const errorEl       = document.getElementById('clip-error');
const listEl        = document.getElementById('clip-list');
const form          = document.getElementById('clip-form');
const formToggle    = document.getElementById('form-toggle');
const quickclipUrl  = document.getElementById('quickclip-url');
const quickclipForm = document.getElementById('quickclip-form');
const statusEl      = document.getElementById('quickclip-status');

// Form toggle
formToggle.addEventListener('click', () => {
  const isOpen = form.style.display !== 'none';
  form.style.display = isOpen ? 'none' : 'grid';
  formToggle.classList.toggle('open', !isOpen);
  if (!isOpen) titleInput.focus();
});

// Quick-clip: paste or submit
quickclipUrl.addEventListener('paste', () => {
  setTimeout(() => {
    const val = quickclipUrl.value.trim();
    if (isUrl(val)) unfurlAndOpen(val);
  }, 20);
});

quickclipForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = quickclipUrl.value.trim();
  if (isUrl(val)) unfurlAndOpen(val);
});

async function unfurlAndOpen(url) {
  if (unfurling) return;
  unfurling = true;
  quickclipUrl.disabled = true;
  setStatus('fetching…', 'fetching');

  try {
    const res = await fetch(`/api/unfurl?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'could not fetch');

    urlInput.value = url;
    titleInput.value = data.title || '';
    if (data.tag) tagInput.value = data.tag;
    noteInput.value = data.description ? data.description.slice(0, 280) : '';

    form.style.display = 'grid';
    formToggle.classList.add('open');
    setStatus('prefilled — review and save', 'success');

    quickclipUrl.value = '';
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => { noteInput.focus(); }, 300);
    setTimeout(() => setStatus('', ''), 4000);
  } catch (e) {
    urlInput.value = url;
    form.style.display = 'grid';
    formToggle.classList.add('open');
    setStatus(`couldn't prefill: ${e.message}`, 'error');
    quickclipUrl.value = '';
    titleInput.focus();
    setTimeout(() => setStatus('', ''), 4000);
  } finally {
    unfurling = false;
    quickclipUrl.disabled = false;
  }
}

function setStatus(msg, cls) {
  statusEl.textContent = msg;
  statusEl.className = 'quickclip-status' + (cls ? ` ${cls}` : '');
}

function isUrl(str) {
  try { new URL(str); return str.startsWith('http'); } catch { return false; }
}

// Load clippings
async function loadClippings() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error(`server error ${res.status}`);
    allClippings = await res.json();
    renderList();
    renderFlagged();
  } catch (e) {
    listEl.innerHTML = `<div class="error-banner">Failed to load clippings: ${e.message}</div>`;
  }
}

// Render main list
function renderList() {
  const filtered = activeTag === 'all'
    ? allClippings
    : allClippings.filter(c => c.tag === activeTag);

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="clip-empty">${
      activeTag === 'all' ? 'Nothing clipped yet.' : `No ${activeTag} clippings.`
    }</div>`;
    return;
  }

  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visible.length;

  listEl.innerHTML = visible.map((c, i) => `
    <div class="clip-card ${c.flagged ? 'flagged' : ''}" style="animation-delay:${i * 22}ms">
      <div class="clip-main">
        <div class="clip-meta">
          <span class="clip-tag tag-${c.tag}">${c.tag}</span>
          <span class="clip-date">${fmtDate(c.created_at)}</span>
        </div>
        <div class="clip-title">${esc(c.title)}</div>
        ${c.url ? `<a class="clip-url" href="${escAttr(c.url)}" target="_blank" rel="noopener">${esc(truncUrl(c.url))}</a>` : ''}
        ${c.note ? `<div class="clip-note">${esc(c.note)}</div>` : ''}
      </div>
      <div class="clip-actions">
        <button class="clip-action-btn ${c.flagged ? 'flag-active' : ''}" data-id="${c.id}" data-flagged="${!!c.flagged}" title="${c.flagged ? 'Unflag' : 'Flag'}">★</button>
        ${c.url ? `<button class="clip-action-btn share-btn" data-url="${escAttr(c.url)}" title="Copy URL">⎘</button>` : ''}
        <button class="clip-action-btn delete-btn" data-id="${c.id}" title="Delete">×</button>
      </div>
    </div>
  `).join('');

  if (remaining > 0) {
    const btn = document.createElement('button');
    btn.className = 'btn-load-more';
    btn.textContent = `load ${Math.min(remaining, PAGE_SIZE)} more — ${remaining} remaining`;
    btn.addEventListener('click', () => { visibleCount += PAGE_SIZE; renderList(); });
    listEl.appendChild(btn);
  }

  listEl.querySelectorAll('[data-flagged]').forEach(btn => {
    btn.addEventListener('click', () => toggleFlag(btn.dataset.id, btn.dataset.flagged === 'true'));
  });

  listEl.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.url).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    });
  });

  listEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteClipping(btn.dataset.id));
  });
}

// Render flagged strip
function renderFlagged() {
  const flagged = allClippings.filter(c => c.flagged);
  const section = document.getElementById('on-my-mind-section');
  const list = document.getElementById('flagged-list');
  const count = document.getElementById('flagged-count');

  if (flagged.length === 0) { section.style.display = 'none'; return; }

  section.style.display = 'block';
  count.textContent = flagged.length;

  list.innerHTML = flagged.map(c => `
    <div class="flagged-card">
      <div class="flagged-card-main">
        <span class="clip-tag tag-${c.tag}">${c.tag}</span>
        <span class="flagged-title">${esc(c.title)}</span>
        ${c.url ? `<a class="clip-url" href="${escAttr(c.url)}" target="_blank" rel="noopener">${esc(truncUrl(c.url))}</a>` : ''}
      </div>
      <button class="clip-action-btn flag-active" data-id="${c.id}" data-flagged="true" title="Unflag">★</button>
    </div>
  `).join('');

  list.querySelectorAll('[data-flagged]').forEach(btn => {
    btn.addEventListener('click', () => toggleFlag(btn.dataset.id, true));
  });
}

// Add clipping
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  submitBtn.disabled = true;
  submitBtn.textContent = 'saving…';

  const body = {
    title: titleInput.value.trim(),
    tag:   tagInput.value,
    url:   urlInput.value.trim() || null,
    note:  noteInput.value.trim() || null,
  };

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || res.status); }
    const clipping = await res.json();
    allClippings.unshift(clipping);
    renderList();
    renderFlagged();
    form.reset();
    form.style.display = 'none';
    formToggle.classList.remove('open');
  } catch (e) {
    showError(`Could not save: ${e.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'save clipping';
  }
});

// Toggle flag
async function toggleFlag(id, currentFlagged) {
  try {
    const res = await fetch(`/api/clipping/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagged: !currentFlagged }),
    });
    if (!res.ok) throw new Error(res.status);
    const updated = await res.json();
    allClippings = allClippings.map(c => c.id === id ? updated : c);
    renderList();
    renderFlagged();
  } catch (e) {
    showError(`Could not update: ${e.message}`);
  }
}

// Delete clipping
async function deleteClipping(id) {
  if (!confirm('Delete this clipping?')) return;
  try {
    const res = await fetch(`/api/clipping/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(res.status);
    allClippings = allClippings.filter(c => c.id !== id);
    renderList();
    renderFlagged();
  } catch (e) {
    showError(`Could not delete: ${e.message}`);
  }
}

// Tag filters
document.querySelectorAll('.tag-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tag-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTag = btn.dataset.tag;
    visibleCount = PAGE_SIZE;
    renderList();
  });
});

// Review tabs
document.querySelectorAll('.review-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.review-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.review-panel').forEach(p => { p.hidden = true; });
    btn.classList.add('active');
    document.getElementById(`reviews-${btn.dataset.panel}`).hidden = false;
  });
});

// Reviews
async function loadReviews() {
  try {
    const res = await fetch('/api/reviews');
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    renderReviews('games', data.games);
    renderReviews('film',  data.film);
    renderReviews('music', data.music);
  } catch {
    ['games', 'film', 'music'].forEach(k => {
      document.getElementById(`reviews-${k}`).innerHTML = `<div class="clip-empty">Could not load.</div>`;
    });
  }
}

function renderReviews(key, items) {
  const el = document.getElementById(`reviews-${key}`);
  if (!items || items.length === 0) { el.innerHTML = `<div class="clip-empty">Nothing yet.</div>`; return; }
  el.innerHTML = items.map(item => `
    <a class="review-item" href="${escAttr(item.link)}" target="_blank" rel="noopener">
      ${item.thumb ? `<img class="review-thumb" src="${escAttr(item.thumb)}" alt="" loading="lazy">` : ''}
      <div class="review-item-body">
        <div class="review-item-title">${esc(item.title)}</div>
        ${item.date ? `<div class="review-item-date">${fmtDate(item.date)}</div>` : ''}
      </div>
    </a>
  `).join('');
}

// Helpers
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncUrl(url) {
  try { const u = new URL(url); return u.hostname + (u.pathname === '/' ? '' : u.pathname); }
  catch { return url; }
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escAttr(str) { return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function showError(msg) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
function hideError() { errorEl.style.display = 'none'; }

loadClippings();
loadReviews();
