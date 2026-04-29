function getOGTag(html, prop) {
  const patterns = [
    new RegExp(`<meta[^>]*property=["']og:${prop}["'][^>]*content=["']([^"']*?)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*?)["'][^>]*property=["']og:${prop}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = re.exec(html);
    if (m) return m[1].trim();
  }
  return '';
}

function getMeta(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*?)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*?)["'][^>]*name=["']${name}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = re.exec(html);
    if (m) return m[1].trim();
  }
  return '';
}

function getTitle(html) {
  return getOGTag(html, 'title')
    || (/<title[^>]*>([^<]+)<\/title>/i.exec(html) || [])[1]?.trim()
    || '';
}

function suggestTag(url, ogType) {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    if (/instagram|flickr|unsplash|imgur|500px|behance|dribbble|pinterest|deviantart/.test(domain)) return 'image';
    if (/poetryfoundation|poets\.org|allpoetry|poetryarchive/.test(domain)) return 'poem';
    if (/twitter|x\.com|linkedin|wikipedia/.test(domain)) return 'person';
    if (/arxiv|jstor|springer|academia\.edu|researchgate|coursera|edx|khanacademy|scholar\.google/.test(domain)) return 'edu';
    if (/artsy|moma|tate|guggenheim|artnet|nga\.gov|metmuseum/.test(domain)) return 'art';
  } catch {}
  if (ogType === 'article') return 'article';
  return 'article';
}

module.exports = async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try { new URL(url); } catch {
    return res.status(400).json({ error: 'invalid url' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; rinkr/1.0; +https://rinkr.net)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('html')) {
      return res.status(200).json({ title: new URL(url).hostname, description: '', tag: 'other', image: '' });
    }

    const html = await response.text();
    const ogType = getOGTag(html, 'type');

    return res.status(200).json({
      title: getTitle(html),
      description: getOGTag(html, 'description') || getMeta(html, 'description'),
      tag: suggestTag(url, ogType),
      image: getOGTag(html, 'image'),
    });
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') return res.status(408).json({ error: 'timed out fetching that URL' });
    return res.status(500).json({ error: e.message });
  }
};
