// /api/generate-calligraphy.js
// Replicate API - Ideogram V2 (best model for text/typography rendering)

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
    'رومانسي كلاسيكي': 'romantic classical Diwani Arabic calligraphy style with elegant flowing curves',
    'ملكي فاخر': 'royal luxurious Thuluth Arabic calligraphy with majestic strokes',
    'حديث أنيق': 'modern elegant Arabic calligraphy with clean refined lines',
    'تراثي عربي أصيل': 'traditional authentic Arabic Kufic-Thuluth calligraphy'
  };
  const styleDesc = styleMap[style] || styleMap['رومانسي كلاسيكي'];

  // Ideogram works best with explicit text instructions
  const prompt = `Beautiful Arabic wedding calligraphy artwork on pure black background. The Arabic text "${groomName} و ${brideName}" written in elegant flowing metallic gold Arabic script. ${styleDesc}. The two names are connected by an ornate gold flourish in the middle. Gold ink color, soft golden glow effect, centered composition, masterpiece quality. Pure matte black background with no other elements.`;

  try {
    // Using Ideogram V3 Turbo - best for text rendering
    const submitRes = await fetch('https://api.replicate.com/v1/models/ideogram-ai/ideogram-v3-turbo/predictions', {
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
          resolution: 'None',
          magic_prompt_option: 'On',
          style_type: 'General'
        }
      })
    });

    const data = await submitRes.json();
    console.log('Replicate response:', JSON.stringify(data).substring(0, 500));

    if (!submitRes.ok) {
      return res.status(submitRes.status).json({
        error: 'فشل Replicate API',
        detail: data.detail || data.error || JSON.stringify(data),
        status: submitRes.status
      });
    }

    // Handle response - Ideogram returns single URL string
    let imageUrl = null;

    if (data.status === 'succeeded' && data.output) {
      imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    }

    // Poll if not ready
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
