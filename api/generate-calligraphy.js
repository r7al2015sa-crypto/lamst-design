// /api/generate-calligraphy.js
// Vercel Serverless Function — Higgsfield API integration
// Get keys from: https://cloud.higgsfield.ai/api-keys

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { groomName, brideName, style, orderId } = req.body || {};
  if (!groomName || !brideName) {
    return res.status(400).json({ error: 'يُرجى إدخال اسم العريس والعروس' });
  }

  // Credentials from Vercel env vars
  const HF_KEY_ID = process.env.HF_KEY_ID;
  const HF_KEY_SECRET = process.env.HF_KEY_SECRET;
  if (!HF_KEY_ID || !HF_KEY_SECRET) {
    return res.status(500).json({
      error: 'Higgsfield API غير مُهيّأ',
      hint: 'أضف HF_KEY_ID و HF_KEY_SECRET في Vercel Environment Variables'
    });
  }

  // Higgsfield uses: Authorization: Key {KEY_ID}:{KEY_SECRET}
  const authHeader = `Key ${HF_KEY_ID}:${HF_KEY_SECRET}`;
  const BASE_URL = 'https://platform.higgsfield.ai';

  // Build prompt
  const styleMap = {
    'رومانسي كلاسيكي': 'romantic classical Diwani Arabic calligraphy with elegant flowing flourishes',
    'ملكي فاخر': 'royal luxurious Thuluth Arabic calligraphy with intricate detailed strokes',
    'حديث أنيق': 'modern elegant Arabic calligraphy with clean refined lines',
    'تراثي عربي أصيل': 'traditional authentic Arabic Kufic-Thuluth blended calligraphy'
  };
  const styleDesc = styleMap[style] || styleMap['رومانسي كلاسيكي'];

  const prompt = `Ultra-premium Arabic wedding calligraphy on PURE BLACK background. ONLY beautiful flowing metallic gold Arabic calligraphy showing exactly these two Arabic names connected with an elegant ornate flourish in the middle: "${groomName} و ${brideName}". Style: ${styleDesc}. Gold ink color #C9A961, soft golden glow, perfectly centered composition, balanced. NO English text, NO symbols, NO frames, NO decorations. PURE BLACK background. 4K masterpiece quality.`;

  try {
    // Submit generation request to Higgsfield
    // Using bytedance/seedream/v4/text-to-image (from official SDK examples)
    const submitRes = await fetch(`${BASE_URL}/bytedance/seedream/v4/text-to-image`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        resolution: '2K',
        aspect_ratio: '16:9',
        camera_fixed: false
      })
    });

    const submitText = await submitRes.text();
    let submitData;
    try { submitData = JSON.parse(submitText); }
    catch {
      return res.status(500).json({
        error: 'استجابة غير متوقعة من Higgsfield',
        detail: submitText.substring(0, 300)
      });
    }

    if (!submitRes.ok) {
      return res.status(submitRes.status).json({
        error: submitData.error || submitData.message || 'فشل إرسال الطلب',
        statusCode: submitRes.status
      });
    }

    const requestId = submitData.request_id || submitData.id;
    const statusUrl = submitData.status_url || `${BASE_URL}/requests/${requestId}/status`;
    if (!requestId) return res.status(500).json({ error: 'لم يستلم رقم الطلب' });

    // Poll status
    let imageUrl = null;
    for (let i = 0; i < 25 && !imageUrl; i++) {
      await new Promise(r => setTimeout(r, 2000));

      const statusRes = await fetch(statusUrl, {
        headers: { 'Authorization': authHeader }
      });
      if (!statusRes.ok) continue;
      const sd = await statusRes.json();

      if (sd.status === 'completed') {
        imageUrl = sd.images?.[0]?.url || sd.results?.[0]?.url || sd.url;
        break;
      }
      if (sd.status === 'failed' || sd.status === 'nsfw') {
        return res.status(500).json({
          error: sd.status === 'nsfw' ? 'تم رفض المحتوى' : 'فشل التوليد'
        });
      }
    }

    if (!imageUrl) {
      return res.status(504).json({ error: 'انتهت مهلة التوليد، حاول مرة أخرى' });
    }

    return res.status(200).json({
      success: true,
      imageUrl,
      requestId,
      style,
      names: `${groomName} و ${brideName}`,
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'خطأ تقني', detail: err.message });
  }
}
