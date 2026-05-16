// /api/proxy-image.js
export const config = { maxDuration: 30 };
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();
  const { url } = req.query;
  if (!url) return res.status(400).end();
  try {
    const r = await fetch(decodeURIComponent(url));
    if (!r.ok) return res.status(r.status).end();
    const ct = r.headers.get('content-type') || 'image/png';
    const buf = await r.arrayBuffer();
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buf));
  } catch (e) { res.status(500).json({ error: e.message }); }
}
