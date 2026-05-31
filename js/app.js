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

function renderLinks(id, items, emptyMsg) {
  const el = document.getElementById(id);
  if (!el) return;
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

// Load & render content.json
async function load() {
  let data;
  try {
    const res = await fetch('/content.json');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch {
    ['reading-list', 'resources-list', 'rabbit-list'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<div class="empty">Could not load.</div>';
    });
    return;
  }

  // Currently Reading
  const readingEl = document.getElementById('reading-list');
  if (readingEl) {
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
  }

  // Class Resources + Reading Rabbit Hole
  renderLinks('resources-list', data.resources, 'Nothing posted yet.');
  renderLinks('rabbit-list', data.rabbit, 'Nothing posted yet.');

  // Works library (reading.html)
  const worksEl = document.getElementById('works-grid');
  if (worksEl) {
    if (!data.works || data.works.length === 0) {
      worksEl.innerHTML = '<div class="empty">No works yet.</div>';
    } else {
      worksEl.innerHTML = data.works.map(w => {
        const filesHtml = (!w.files || w.files.length === 0)
          ? `<div class="cabinet-empty">No files yet.</div>`
          : w.files.map(f => `
              <a class="cabinet-file" href="${esc(f.url)}" target="_blank" rel="noopener">
                <span class="cabinet-file-type">${esc(f.type || 'file')}</span>
                <span class="cabinet-file-name">${esc(f.name)}</span>
              </a>`).join('');
        return `
          <div class="work-card">
            <div class="work-header">
              <div class="work-header-text">
                <div class="work-title">${esc(w.title)}</div>
                <div class="work-author">${esc(w.author)}</div>
              </div>
              ${w.class ? `<span class="work-class-badge">${esc(w.class)}</span>` : ''}
            </div>
            <div class="work-cabinet">
              <div class="cabinet-drawer-label">Files &amp; Resources</div>
              ${filesHtml}
            </div>
          </div>`;
      }).join('');
    }
  }
}
