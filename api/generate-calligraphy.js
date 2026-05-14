// /api/generate-calligraphy.js
// Higgsfield API integration - يجرب عدة endpoints موثقة

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { groomName, brideName, style } = req.body || {};
  if (!groomName || !brideName) {
    return res.status(400).json({ error: 'يُرجى إدخال اسم العريس والعروس' });
  }

  const HF_KEY_ID = process.env.HF_KEY_ID;
  const HF_KEY_SECRET = process.env.HF_KEY_SECRET;

  if (!HF_KEY_ID || !HF_KEY_SECRET) {
    return res.status(500).json({
      error: 'Higgsfield API غير مُهيّأ',
      hint: 'أضف HF_KEY_ID و HF_KEY_SECRET في Vercel'
    });
  }

  const styleMap = {
    'رومانسي كلاسيكي': 'romantic classical Diwani Arabic calligraphy with elegant flowing flourishes',
    'ملكي فاخر': 'royal luxurious Thuluth Arabic calligraphy with intricate detailed strokes',
    'حديث أنيق': 'modern elegant Arabic calligraphy with clean refined lines',
    'تراثي عربي أصيل': 'traditional authentic Arabic Kufic-Thuluth blended calligraphy'
  };
  const styleDesc = styleMap[style] || styleMap['رومانسي كلاسيكي'];

  const prompt = `Ultra-premium Arabic wedding calligraphy on PURE BLACK background. ONLY beautiful flowing metallic gold Arabic calligraphy showing these two Arabic names connected with an elegant ornate flourish: "${groomName} و ${brideName}". Style: ${styleDesc}. Gold ink #C9A961, soft golden glow, centered. NO English text, NO frames. PURE BLACK background. 4K masterpiece.`;

  const authHeader = `Key ${HF_KEY_ID}:${HF_KEY_SECRET}`;
  const BASE = 'https://platform.higgsfield.ai';

  // قائمة endpoints موثقة من SDK Higgsfield
  const endpoints = [
    {
      name: 'nano-banana-pro',
      url: '/v1/text2image/nano-banana-pro',
      body: { input: { prompt, aspect_ratio: '16:9', resolution: '2k' } }
    },
    {
      name: 'nano_banana_2',
      url: '/v1/text2image/nano_banana_2',
      body: { input: { prompt, aspect_ratio: '16:9', resolution: '2k' } }
    },
    {
      name: 'soul',
      url: '/v1/text2image/soul',
      body: {
        input: {
          prompt,
          width_and_height: '1536x1536',
          quality: 'hd',
          batch_size: 'single'
        }
      }
    },
    {
      name: 'flux-pro',
      url: '/flux-pro/kontext/max/text-to-image',
      body: { input: { prompt, aspect_ratio: '16:9', safety_tolerance: 2 } }
    }
  ];

  const tried = [];

  for (const ep of endpoints) {
    try {
      console.log(`▶ Trying: ${ep.name} (${ep.url})`);

      const submitRes = await fetch(`${BASE}${ep.url}`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'User-Agent': 'higgsfield-server-js/2.0'
        },
        body: JSON.stringify(ep.body)
      });

      const submitText = await submitRes.text();
      console.log(`◀ ${ep.name}: ${submitRes.status} - ${submitText.substring(0, 200)}`);
      tried.push({
        endpoint: ep.name,
        status: submitRes.status,
        body: submitText.substring(0, 200)
      });

      if (!submitRes.ok) continue;

      let submitData;
      try { submitData = JSON.parse(submitText); }
      catch { continue; }

      const requestId = submitData.request_id || submitData.id;
      const statusUrl = submitData.status_url || `${BASE}/requests/${requestId}/status`;

      if (!requestId) {
        console.log(`No request_id from ${ep.name}`);
        continue;
      }

      console.log(`✓ Submitted to ${ep.name}, request_id: ${requestId}`);

      // Poll
      let imageUrl = null;
      for (let i = 0; i < 25 && !imageUrl; i++) {
        await new Promise(r => setTimeout(r, 2000));

        const sRes = await fetch(statusUrl, {
          headers: {
            'Authorization': authHeader,
            'User-Agent': 'higgsfield-server-js/2.0'
          }
        });
        if (!sRes.ok) continue;
        const sd = await sRes.json();

        if (i % 3 === 0) console.log(`  Poll ${i+1}: ${sd.status}`);

        if (sd.status === 'completed') {
          imageUrl = sd.images?.[0]?.url
                  || sd.results?.[0]?.url
                  || sd.jobs?.[0]?.results?.raw?.url
                  || sd.url;
          break;
        }
        if (['failed', 'nsfw', 'cancelled'].includes(sd.status)) {
          return res.status(500).json({
            error: sd.status === 'nsfw' ? 'تم رفض المحتوى' : 'فشل التوليد',
            status: sd.status,
            endpoint: ep.name
          });
        }
      }

      if (imageUrl) {
        console.log(`✅ SUCCESS via ${ep.name}: ${imageUrl}`);
        return res.status(200).json({
          success: true,
          imageUrl,
          requestId,
          style,
          endpoint: ep.name,
          names: `${groomName} و ${brideName}`
        });
      }
    } catch (err) {
      console.error(`✗ ${ep.name} error:`, err.message);
      tried.push({ endpoint: ep.name, error: err.message });
    }
  }

  console.log('All endpoints failed');
  return res.status(500).json({
    error: 'لم تنجح أي نقطة API',
    debug: { tried }
  });
}
