export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid book id' });
  }

  const urls = [
    `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`,
    `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
  ];

  for (const url of urls) {
    let resp;
    try {
      resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    } catch {
      continue;
    }
    if (!resp.ok) continue;
    const text = await resp.text();
    if (text.length < 500) continue;

    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    return res.status(200).send(text);
  }

  return res.status(404).json({ error: 'Could not fetch book' });
}
