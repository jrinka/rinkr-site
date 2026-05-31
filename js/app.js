// Theme
const root = document.documentElement;
const toggleBtn = document.getElementById('theme-toggle');

function updateThemeIcon() {
  toggleBtn.textContent = root.getAttribute('data-theme') === 'dark' ? '☀' : '☾';
}

root.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
updateThemeIcon();

toggleBtn.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon();
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

function renderLinks(id, items, emptyMsg, headerClass) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!items || items.length === 0) {
    el.innerHTML = `<div class="empty">${emptyMsg}</div>`;
    return;
  }
  // Card style on full pages (link-cards-grid), plain list on homepage
  if (el.classList.contains('link-cards-grid')) {
    el.innerHTML = items.map(l => `
      <div class="link-card">
        <div class="link-card-header${headerClass ? ' ' + headerClass : ''}">
          <a class="link-card-title" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a>
          ${l.url ? `<span class="link-card-domain">${esc(domain(l.url))}</span>` : ''}
        </div>
        <div class="link-card-body">
          ${l.note ? `<p class="link-card-note">${esc(l.note)}</p>` : ''}
          ${l.for === 'students' ? `<span class="link-card-badge">class</span>` : ''}
        </div>
      </div>
    `).join('');
  } else {
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
}

// File toggle handler (expand/collapse extra files)
document.addEventListener('click', e => {
  if (!e.target.matches('.files-toggle')) return;
  const overflow = e.target.previousElementSibling;
  const isHidden = overflow.style.display === 'none' || overflow.style.display === '';
  overflow.style.display = isHidden ? 'grid' : 'none';
  const count = overflow.querySelectorAll('.cabinet-file').length;
  e.target.textContent = isHidden ? 'Show less ↑' : `+${count} more`;
});

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

  // Currently Reading — card style on reading.html, plain entries on homepage
  const readingEl = document.getElementById('reading-list');
  if (readingEl) {
    if (!data.reading || data.reading.length === 0) {
      readingEl.innerHTML = '<div class="empty">Nothing assigned yet.</div>';
    } else if (readingEl.classList.contains('active-reading-grid')) {
      // Full card style on reading.html
      readingEl.innerHTML = data.reading.map(b => `
        <div class="work-card">
          <div class="work-header${b.class === 'E10' ? ' e10' : ''}">
            <div class="work-header-text">
              <div class="work-title">${esc(b.title)}</div>
              ${b.author ? `<div class="work-author">${esc(b.author)}</div>` : ''}
            </div>
            ${b.class ? `<span class="work-class-badge">${esc(b.class)}</span>` : ''}
          </div>
          ${b.note ? `<div class="active-card-note">${esc(b.note)}</div>` : '<div class="active-card-note" style="color:transparent">—</div>'}
        </div>
      `).join('');
    } else {
      // Simple entries on homepage
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
  renderLinks('rabbit-list', data.rabbit, 'Nothing posted yet.', 'plum');

  // Per-class column rendering (reading.html 3-column layout)
  const PREVIEW = 2;
  const renderFile = f => `
    <a class="cabinet-file" href="${esc(f.url)}" target="_blank" rel="noopener">
      <span class="cabinet-file-type">${esc(f.type || 'file')}</span>
      <span class="cabinet-file-name">${esc(f.name)}</span>
    </a>`;

  const headerCls = c => c === 'E10' ? ' e10' : c === 'IB LANG & LIT' ? ' lang-lit' : '';

  const renderWorkCard = w => {
    const filesHtml = (!w.files || w.files.length === 0)
      ? `<div class="cabinet-empty">No files yet.</div>`
      : (() => {
          const visible = w.files.slice(0, PREVIEW).map(renderFile).join('');
          const hidden  = w.files.slice(PREVIEW);
          return visible + (hidden.length ? `
            <div class="files-overflow" style="display:none">${hidden.map(renderFile).join('')}</div>
            <button class="files-toggle">+${hidden.length} more</button>` : '');
        })();
    return `
      <div class="work-card">
        <div class="work-header${headerCls(w.class)}">
          <div class="work-header-text">
            <div class="work-title">${esc(w.title)}</div>
            ${w.author ? `<div class="work-author">${esc(w.author)}</div>` : ''}
          </div>
        </div>
        <div class="work-cabinet">
          <div class="cabinet-drawer-label">Files &amp; Resources</div>
          ${filesHtml}
        </div>
      </div>`;
  };

  const classMap = { 'IB LIT': 'iblit', 'IB LANG & LIT': 'iblanglit', 'E10': 'e10' };
  Object.entries(classMap).forEach(([cls, suffix]) => {
    const rEl = document.getElementById(`reading-${suffix}`);
    if (rEl) {
      const items = (data.reading || []).filter(b => b.class === cls);
      rEl.innerHTML = items.length === 0
        ? '<div class="empty">Nothing assigned yet.</div>'
        : items.map(b => `
          <div class="work-card">
            <div class="work-header${headerCls(cls)}">
              <div class="work-header-text">
                <div class="work-title">${esc(b.title)}</div>
                ${b.author ? `<div class="work-author">${esc(b.author)}</div>` : ''}
              </div>
            </div>
            ${b.note ? `<div class="active-card-note">${esc(b.note)}</div>` : ''}
          </div>`).join('');
    }

    const wEl = document.getElementById(`works-${suffix}`);
    if (wEl) {
      const activeTitle = new Set((data.reading || []).map(b => b.title));
      const items = (data.works || []).filter(w => w.class === cls && !activeTitle.has(w.title));
      wEl.innerHTML = items.length === 0
        ? '<div class="empty">No works yet.</div>'
        : items.map(renderWorkCard).join('');
    }
  });
}

load();
