// /api/generate-calligraphy.js
// Ideogram V3 — يولّد monogram من أول حرف لكل اسم
// أسهل وأوضح للـ AI من كتابة اسم كامل

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

  const IDEOGRAM_KEY = process.env.IDEOGRAM_API_KEY;
  if (!IDEOGRAM_KEY) {
    return res.status(500).json({
      error: 'Ideogram API غير مُهيّأ',
      hint: 'أضف IDEOGRAM_API_KEY في Vercel Environment Variables'
    });
  }

  // استخراج أول حرف من كل اسم
  const groomInitial = groomName.trim().charAt(0);
  const brideInitial = brideName.trim().charAt(0);
  const monogram = `${groomInitial} ${brideInitial}`;

  const styleMap = {
    'رومانسي كلاسيكي': {
      desc: 'romantic classical Ottoman Diwani calligraphy with flowing elegant curves',
      mood: 'romantic and soft'
    },
    'ملكي فاخر': {
      desc: 'royal luxurious Thuluth calligraphy with bold majestic strokes',
      mood: 'bold and regal'
    },
    'حديث أنيق': {
      desc: 'modern elegant Arabic calligraphy with clean minimalist lines',
      mood: 'clean and contemporary'
    },
    'تراثي عربي أصيل': {
      desc: 'traditional authentic Arabic Diwani Jali calligraphy with intricate ornamental details',
      mood: 'ornate and heritage'
    }
  };

  const s = styleMap[style] || styleMap['رومانسي كلاسيكي'];

  // البرومبت المحسّن - حرفان فقط متداخلان
  const prompt = `A luxury Arabic wedding monogram calligraphy artwork. \
Pure solid matte black background (#000000). \
Two large Arabic letters "${groomInitial}" and "${brideInitial}" \
artistically intertwined and overlapping in the center of the composition, \
creating an elegant monogram logo. \
Style: ${s.desc}. \
Mood: ${s.mood}. \
The two letters must be beautifully interlocked and merged together as one unified design, \
like a wedding monogram seal or emblem. \
Color: rich polished metallic gold (#C9A961) with warm luminous glow and shimmer. \
The letters should flow into each other naturally with decorative flourishes and swashes. \
Perfectly centered. Symmetrical and balanced composition. \
Pure black background only — no texture, no patterns, no borders. \
Ultra premium quality, sharp details, luxury Saudi wedding aesthetic.`;

  try {
    console.log(`Monogram: ${groomInitial}+${brideInitial} | Style: ${style}`);

    const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      method: 'POST',
      headers: {
        'Api-Key': IDEOGRAM_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio:        '1x1',   // مربع أنسب للـ monogram
        style_type:          'DESIGN',
        magic_prompt_option: 'OFF',
        rendering_speed:     'QUALITY'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status, '| Response:', JSON.stringify(data).substring(0, 300));

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'فشل Ideogram API',
        detail: data.error || data.message || JSON.stringify(data)
      });
    }

    const imageUrl = data.data?.[0]?.url || data.images?.[0]?.url || data.url;

    if (!imageUrl) {
      return res.status(500).json({
        error: 'لم نستلم صورة',
        debug: JSON.stringify(data).substring(0, 300)
      });
    }

    console.log(`✅ Success: ${imageUrl.substring(0, 80)}`);

    return res.status(200).json({
      success: true,
      imageUrl,
      monogram,
      groomInitial,
      brideInitial,
      style,
      names: `${groomName} و ${brideName}`
    });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: 'خطأ تقني', detail: err.message });
  }
}
