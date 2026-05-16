// /api/generate-calligraphy.js
// Ideogram V3 API — أفضل نموذج للنصوص العربية
// الحصول على API key: https://developer.ideogram.ai

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

  // ── أنماط المخطوطة ──
  const styleMap = {
    'رومانسي كلاسيكي': 'classical Arabic Naskh calligraphy font, elegant and refined',
    'ملكي فاخر':        'royal Arabic Thuluth calligraphy font, majestic and bold',
    'حديث أنيق':        'modern clean Arabic calligraphy font, minimal and elegant',
    'تراثي عربي أصيل':  'traditional Arabic Ruqah calligraphy font, authentic heritage style'
  };
  const styleDesc = styleMap[style] || styleMap['رومانسي كلاسيكي'];

  // ── Prompt محسّن للحصول على مخطوطة مستقيمة واحترافية ──
  const prompt = [
    // الهدف الرئيسي
    `Arabic wedding calligraphy artwork on pure solid matte black background (#000000).`,

    // النصوص بدقة — مع تحديد الاتجاه صراحة
    `Display ONLY these two Arabic names in large gold calligraphy:`,
    `Right side: "${groomName}"`,
    `Left side: "${brideName}"`,
    `Center: the Arabic letter "و" as an elegant gold ornament connecting both names.`,

    // إلزامية الاستقامة — أهم جزء
    `CRITICAL TYPOGRAPHY RULES:`,
    `- Text must be PERFECTLY HORIZONTAL with ZERO tilt, ZERO rotation, ZERO diagonal angle.`,
    `- All text baseline must be completely flat and level, parallel to the bottom edge.`,
    `- Text reads right-to-left in proper Arabic direction.`,
    `- No slanted, italic, or angled letterforms. Upright vertical strokes only.`,

    // الأسلوب والألوان
    `Style: ${styleDesc}.`,
    `Color: rich metallic gold (#C9A961) with subtle luminous glow, on pure black.`,

    // التكوين
    `Composition: perfectly centered, balanced, wide landscape format.`,
    `Both names must be the same size and at the same vertical level.`,

    // ما لا نريده
    `No background texture, no ornamental borders, no frames, no decorations.`,
    `No English text. No watermarks. Pure black background only.`,
    `Ultra high quality, sharp crisp letterforms, premium wedding invitation style.`
  ].join(' ');

  try {
    console.log(`Generating for: ${groomName} و ${brideName} | Style: ${style}`);

    const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      method: 'POST',
      headers: {
        'Api-Key': IDEOGRAM_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt:               prompt,
        aspect_ratio:         '16x9',
        style_type:           'DESIGN',   // أفضل لـ typography والخطوط
        magic_prompt_option:  'OFF',      // نتحكم بالبرومبت بأنفسنا
        rendering_speed:      'QUALITY'   // أعلى جودة
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data).substring(0, 400));

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'فشل Ideogram API',
        detail: data.error || data.message || JSON.stringify(data),
        status: response.status
      });
    }

    // استخراج رابط الصورة
    const imageUrl = data.data?.[0]?.url
                  || data.images?.[0]?.url
                  || data.url;

    if (!imageUrl) {
      return res.status(500).json({
        error: 'لم يتم استلام الصورة',
        debug: JSON.stringify(data).substring(0, 400)
      });
    }

    console.log('✅ Success:', imageUrl.substring(0, 80));

    return res.status(200).json({
      success: true,
      imageUrl,
      style,
      names: `${groomName} و ${brideName}`,
      model: 'ideogram-v3'
    });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({
      error: 'خطأ تقني',
      detail: err.message
    });
  }
}
