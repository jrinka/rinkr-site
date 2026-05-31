// Theme
const root = document.documentElement;
const toggleBtn = document.getElementById('theme-toggle');
root.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');
toggleBtn.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// Helpers
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function domain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

// Load & render content.json
async function load() {
  let data;
  try {
    const res = await fetch('/content.json');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch {
    ['reading-list', 'fresh-list', 'deep-list'].forEach(id => {
      document.getElementById(id).innerHTML = '<div class="empty">Could not load.</div>';
    });
    return;
  }

  // Reading list
  const readingEl = document.getElementById('reading-list');
  if (!data.reading || data.reading.length === 0) {
    readingEl.innerHTML = '<div class="empty">Nothing assigned yet.</div>';
  } else {
    readingEl.innerHTML = data.reading.map(b => `
      <div class="reading-entry">
        <div class="reading-class">${esc(b.class)}</div>
        <div class="reading-title">${esc(b.title)}</div>
        <div class="reading-author">${esc(b.author)}</div>
        ${b.note ? `<div class="reading-note">${esc(b.note)}</div>` : ''}
      </div>
    `).join('');
  }

  // Fresh + Deep Dive (same link format, different sections)
  renderLinks('fresh-list', data.fresh, 'Nothing posted yet.');
  renderLinks('deep-list', data.deep, 'Nothing posted yet.');
}

function renderLinks(id, items, emptyMsg) {
  const el = document.getElementById(id);
  if (!items || items.length === 0) {
    el.innerHTML = `<div class="empty">${emptyMsg}</div>`;
    return;
  }
  el.innerHTML = items.map(l => `
    <div class="link-item">
      <div class="link-row">
        <a class="link-title" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a>
        ${l.url ? `<span class="link-domain">${esc(domain(l.url))}</span>` : ''}
        ${l.for === 'students' ? `<span class="link-badge">class</span>` : ''}
      </div>
      ${l.note ? `<div class="link-note">${esc(l.note)}</div>` : ''}
    </div>
  `).join('');
}

load();
