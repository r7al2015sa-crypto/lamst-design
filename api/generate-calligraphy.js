// /api/generate-calligraphy.js
// Replicate API - Flux 1.1 Pro for Arabic calligraphy generation
// Get token from: https://replicate.com/account/api-tokens

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

  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_TOKEN) {
    return res.status(500).json({
      error: 'Replicate API غير مُهيّأ',
      hint: 'أضف REPLICATE_API_TOKEN في Vercel'
    });
  }

  const styleMap = {
    'رومانسي كلاسيكي': 'romantic classical Diwani Arabic calligraphy with elegant flowing flourishes',
    'ملكي فاخر': 'royal luxurious Thuluth Arabic calligraphy with intricate detailed strokes',
    'حديث أنيق': 'modern elegant Arabic calligraphy with clean refined lines',
    'تراثي عربي أصيل': 'traditional authentic Arabic Kufic-Thuluth blended calligraphy'
  };
  const styleDesc = styleMap[style] || styleMap['رومانسي كلاسيكي'];

  const prompt = `Ultra-premium Arabic wedding calligraphy on PURE BLACK background. ONLY beautiful flowing metallic gold Arabic calligraphy showing these two Arabic names connected with an elegant ornate flourish: "${groomName} و ${brideName}". Style: ${styleDesc}. Gold ink #C9A961, soft golden glow, perfectly centered. NO English text, NO frames. PURE BLACK background. 4K masterpiece.`;

  try {
    // ── Submit prediction to Replicate ──
    // Using Flux 1.1 Pro - excellent for text/typography
    const submitRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=60'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          aspect_ratio: '16:9',
          output_format: 'png',
          output_quality: 100,
          safety_tolerance: 5,
          prompt_upsampling: true
        }
      })
    });

    const data = await submitRes.json();
    console.log('Replicate response:', JSON.stringify(data).substring(0, 300));

    if (!submitRes.ok) {
      return res.status(submitRes.status).json({
        error: 'فشل Replicate API',
        detail: data.detail || data.error || 'Unknown error',
        status: submitRes.status
      });
    }

    // ── Handle response ──
    // If "Prefer: wait" succeeded, output should be ready
    let imageUrl = null;

    if (data.status === 'succeeded' && data.output) {
      imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    }

    // If not ready, poll
    if (!imageUrl && data.urls?.get) {
      for (let i = 0; i < 30 && !imageUrl; i++) {
        await new Promise(r => setTimeout(r, 2000));

        const pollRes = await fetch(data.urls.get, {
          headers: { 'Authorization': `Bearer ${REPLICATE_TOKEN}` }
        });
        if (!pollRes.ok) continue;
        const pd = await pollRes.json();

        if (pd.status === 'succeeded' && pd.output) {
          imageUrl = Array.isArray(pd.output) ? pd.output[0] : pd.output;
          break;
        }
        if (pd.status === 'failed' || pd.status === 'canceled') {
          return res.status(500).json({
            error: 'فشل التوليد',
            detail: pd.error || pd.status
          });
        }
      }
    }

    if (!imageUrl) {
      return res.status(504).json({ error: 'انتهت مهلة التوليد، حاول مرة أخرى' });
    }

    return res.status(200).json({
      success: true,
      imageUrl,
      style,
      names: `${groomName} و ${brideName}`
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      error: 'خطأ تقني',
      detail: err.message
    });
  }
}
