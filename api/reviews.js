const FEEDS = {
  games: 'https://www.eurogamer.net/feed/reviews',
  film:  'https://www.rogerebert.com/feed',
  music: 'https://pitchfork.com/feed/feed-album-reviews/rss',
};

const LIMIT = 6;

function extract(xml, tag) {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i').exec(xml);
  if (cdata) return cdata[1].trim();
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(xml);
  return plain ? plain[1].replace(/<[^>]+>/g, '').trim() : '';
}

function extractAttr(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i').exec(xml);
  return re ? re[1] : '';
}

function parseItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null && items.length < LIMIT) {
    const chunk = m[1];
    const thumb = extractAttr(chunk, 'media:thumbnail', 'url')
               || extractAttr(chunk, 'media:content', 'url');
    const title = extract(chunk, 'title');
    const link  = extract(chunk, 'link') || extractAttr(chunk, 'guid', 'isPermaLink') === 'false'
      ? extract(chunk, 'link')
      : extract(chunk, 'guid');
    const date  = extract(chunk, 'pubDate');
    if (title) items.push({ title, link: link || '', thumb: thumb || '', date });
  }
  return items;
}

async function fetchFeed(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; rinkr/1.0; +https://rinkr.net)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseItems(await res.text());
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  const [games, film, music] = await Promise.allSettled([
    fetchFeed(FEEDS.games),
    fetchFeed(FEEDS.film),
    fetchFeed(FEEDS.music),
  ]);

  return res.status(200).json({
    games: games.status === 'fulfilled' ? games.value : [],
    film:  film.status  === 'fulfilled' ? film.value  : [],
    music: music.status === 'fulfilled' ? music.value : [],
    errors: {
      games: games.status === 'rejected' ? games.reason.message : null,
      film:  film.status  === 'rejected' ? film.reason.message  : null,
      music: music.status === 'rejected' ? music.reason.message : null,
    },
  });
};
