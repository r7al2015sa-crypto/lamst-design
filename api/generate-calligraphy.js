// /api/generate-calligraphy.js
// Ideogram V3 API - أفضل نموذج في العالم لتوليد النصوص
// الحصول على API key: https://developer.ideogram.ai
// التوثيق: https://developer.ideogram.ai/api-reference/api-reference/generate-v3

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

  // بناء البرومبت المثالي للمخطوطة العربية
  const styleMap = {
    'رومانسي كلاسيكي': 'romantic classical Diwani Arabic calligraphy with elegant flowing flourishes and curves',
    'ملكي فاخر': 'royal luxurious Thuluth Arabic calligraphy with majestic detailed strokes and ornate design',
    'حديث أنيق': 'modern elegant Arabic calligraphy with clean refined lines and contemporary aesthetic',
    'تراثي عربي أصيل': 'traditional authentic Naskh Arabic calligraphy with heritage Saudi artistic style'
  };
  const styleDesc = styleMap[style] || styleMap['رومانسي كلاسيكي'];

  // Ideogram V3 يتعامل مع النصوص بشكل ممتاز - نحدد الأسماء بدقة بين علامات اقتباس
  const prompt = `Beautiful Arabic wedding calligraphy artwork on pure matte black background. \
The Arabic names "${groomName}" and "${brideName}" written together in magnificent flowing metallic gold Arabic script, \
connected by an ornate decorative flourish "و" in the center. \
Style: ${styleDesc}. \
The calligraphy should be perfectly readable Arabic text with authentic letter forms. \
Color: rich metallic gold #C9A961 with soft luminous glow effect. \
Composition: centered on black background, wide landscape format. \
No background patterns, no borders, no decorative frames. Pure matte black background only. \
The text must be the focal point. Premium quality artwork.`;

  try {
    console.log(`Generating calligraphy for: ${groomName} و ${brideName}`);

    // Ideogram V3 API - endpoint رسمي
    const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      method: 'POST',
      headers: {
        'Api-Key': IDEOGRAM_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        aspect_ratio: 'ASPECT_16_9',
        style_type: 'DESIGN',        // DESIGN أفضل للخطوط والـ typography
        magic_prompt_option: 'OFF',  // OFF عشان نتحكم بالبرومبت بدقة
        rendering_speed: 'QUALITY'   // أعلى جودة
      })
    });

    const data = await response.json();
    console.log('Ideogram response status:', response.status);
    console.log('Ideogram response:', JSON.stringify(data).substring(0, 400));

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
        error: 'لم يتم الحصول على صورة',
        debug: JSON.stringify(data).substring(0, 400)
      });
    }

    console.log('✅ Success:', imageUrl.substring(0, 60));

    return res.status(200).json({
      success: true,
      imageUrl,
      style,
      names: `${groomName} و ${brideName}`,
      model: 'ideogram-v3'
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      error: 'خطأ تقني',
      detail: err.message
    });
  }
}
