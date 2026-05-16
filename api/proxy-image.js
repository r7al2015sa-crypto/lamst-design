// /api/proxy-image.js
// يمرر الصورة من Ideogram عبر السيرفر لتجنب مشاكل CORS

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL' });

  try {
    const imgRes = await fetch(decodeURIComponent(url));
    if (!imgRes.ok) return res.status(imgRes.status).end();

    const contentType = imgRes.headers.get('content-type') || 'image/png';
    const buffer = await imgRes.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
