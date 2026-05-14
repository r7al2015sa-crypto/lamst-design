// /api/generate-calligraphy.js
// يستخدم SDK Higgsfield الرسمي عشان نضمن استخدام endpoints صحيحة
// Auth: HF_KEY_ID:HF_KEY_SECRET

import { createHiggsfieldClient } from '@higgsfield/client/v2';

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

  try {
    // إنشاء client باستخدام الـ SDK الرسمي
    const client = createHiggsfieldClient({
      credentials: `${HF_KEY_ID}:${HF_KEY_SECRET}`
    });

    // استخدام Nano Banana Pro - نموذج ممتاز للنصوص
    const jobSet = await client.subscribe('flux-pro/kontext/max/text-to-image', {
      input: {
        prompt: prompt,
        aspect_ratio: '16:9',
        safety_tolerance: 2
      },
      withPolling: true
    });

    console.log('JobSet status:', {
      isCompleted: jobSet.isCompleted,
      isFailed: jobSet.isFailed,
      isNsfw: jobSet.isNsfw
    });

    if (jobSet.isNsfw) {
      return res.status(400).json({ error: 'تم رفض المحتوى من قِبَل النظام' });
    }
    if (jobSet.isFailed) {
      return res.status(500).json({ error: 'فشل التوليد' });
    }
    if (!jobSet.isCompleted) {
      return res.status(504).json({ error: 'انتهت مهلة التوليد، حاول مرة أخرى' });
    }

    const imageUrl = jobSet.jobs?.[0]?.results?.raw?.url
                  || jobSet.jobs?.[0]?.results?.min?.url;

    if (!imageUrl) {
      return res.status(500).json({
        error: 'لم نتلقَ صورة',
        debug: JSON.stringify(jobSet.jobs?.[0])
      });
    }

    return res.status(200).json({
      success: true,
      imageUrl,
      style,
      names: `${groomName} و ${brideName}`
    });

  } catch (err) {
    console.error('Higgsfield error:', err.message, err.stack);
    return res.status(500).json({
      error: 'خطأ في الاتصال بـ Higgsfield',
      detail: err.message,
      name: err.name
    });
  }
}
