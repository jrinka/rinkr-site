const API = '/api/clippings';

let allClippings = [];
let activeTag = 'all';

const titleInput = document.getElementById('clip-title');
const tagInput   = document.getElementById('clip-tag');
const urlInput   = document.getElementById('clip-url');
const noteInput  = document.getElementById('clip-note');
const submitBtn  = document.getElementById('clip-submit');
const errorEl    = document.getElementById('clip-error');
const listEl     = document.getElementById('clip-list');
const form       = document.getElementById('clip-form');

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
  const items = activeTag === 'all'
    ? allClippings
    : allClippings.filter(c => c.tag === activeTag);

  if (items.length === 0) {
    listEl.innerHTML = `<div class="clip-empty">${
      activeTag === 'all' ? 'Nothing clipped yet.' : `No ${activeTag} clippings.`
    }</div>`;
    return;
  }

  listEl.innerHTML = items.map(c => `
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

  listEl.querySelectorAll('.clip-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteClipping(btn.dataset.id));
  });
}

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

document.querySelectorAll('.tag-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tag-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTag = btn.dataset.tag;
    renderList();
  });
});

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname === '/' ? '' : u.pathname;
    return u.hostname + path;
  } catch {
    return url;
  }
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}

function hideError() {
  errorEl.style.display = 'none';
}

loadClippings();
