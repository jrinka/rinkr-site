const API = '/api/clippings';
const PAGE_SIZE = 10;

let allClippings = [];
let activeTag = 'all';
let visibleCount = PAGE_SIZE;

const titleInput  = document.getElementById('clip-title');
const tagInput    = document.getElementById('clip-tag');
const urlInput    = document.getElementById('clip-url');
const noteInput   = document.getElementById('clip-note');
const submitBtn   = document.getElementById('clip-submit');
const errorEl     = document.getElementById('clip-error');
const listEl      = document.getElementById('clip-list');
const form        = document.getElementById('clip-form');
const formToggle  = document.getElementById('form-toggle');

// Form toggle
formToggle.addEventListener('click', () => {
  const isOpen = form.style.display !== 'none';
  form.style.display = isOpen ? 'none' : 'grid';
  formToggle.classList.toggle('open', !isOpen);
  if (!isOpen) titleInput.focus();
});

// Load clippings
async function loadClippings() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error(`server error ${res.status}`);
    allClippings = await res.json();
    renderList();
  } catch (e) {
    listEl.innerHTML = `<div class="error-banner">Failed to load clippings: ${e.message}</div>`;
  }
}

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

  listEl.innerHTML = visible.map(c => `
    <div class="clip-card">
      <div class="clip-main">
        <div class="clip-meta">
          <span class="clip-tag tag-${c.tag}">${c.tag}</span>
          <span class="clip-date">${fmtDate(c.created_at)}</span>
        </div>
        <div class="clip-title">${esc(c.title)}</div>
        ${c.url ? `<a class="clip-url" href="${escAttr(c.url)}" target="_blank" rel="noopener">${esc(truncUrl(c.url))}</a>` : ''}
        ${c.note ? `<div class="clip-note">${esc(c.note)}</div>` : ''}
      </div>
      <button class="clip-delete" data-id="${c.id}" title="Delete">×</button>
    </div>
  `).join('');

  if (remaining > 0) {
    const btn = document.createElement('button');
    btn.className = 'btn-load-more';
    btn.textContent = `load ${Math.min(remaining, PAGE_SIZE)} more (${remaining} remaining)`;
    btn.addEventListener('click', () => { visibleCount += PAGE_SIZE; renderList(); });
    listEl.appendChild(btn);
  }

  listEl.querySelectorAll('.clip-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteClipping(btn.dataset.id));
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
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || res.status);
    }
    const clipping = await res.json();
    allClippings.unshift(clipping);
    renderList();
    form.reset();
    titleInput.focus();
  } catch (e) {
    showError(`Could not save: ${e.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'add clipping';
  }
});

// Delete clipping
async function deleteClipping(id) {
  if (!confirm('Delete this clipping?')) return;
  try {
    const res = await fetch(`/api/clipping/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(res.status);
    allClippings = allClippings.filter(c => c.id !== id);
    renderList();
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
  } catch (e) {
    ['games', 'film', 'music'].forEach(k => {
      document.getElementById(`reviews-${k}`).innerHTML =
        `<div class="clip-empty">Could not load.</div>`;
    });
  }
}

function renderReviews(key, items) {
  const el = document.getElementById(`reviews-${key}`);
  if (!items || items.length === 0) {
    el.innerHTML = `<div class="clip-empty">Nothing yet.</div>`;
    return;
  }
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
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname === '/' ? '' : u.pathname);
  } catch { return url; }
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showError(msg) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
function hideError() { errorEl.style.display = 'none'; }

loadClippings();
loadReviews();
