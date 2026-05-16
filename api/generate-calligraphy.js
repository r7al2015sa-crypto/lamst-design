// /api/generate-calligraphy.js
// يولّد مونوجرام ديواني احترافي من خط الصمت الحقيقي
// بدون أي API خارجي - مجاني 100% - فوري

import { UPEM, GLYPHS } from './glyphs.js';

export const config = { maxDuration: 10 };

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

  // استخراج أول حرف من كل اسم
  const c1 = groomName.trim().charAt(0);
  const c2 = brideName.trim().charAt(0);

  const g1 = GLYPHS[c1];
  const g2 = GLYPHS[c2];

  if (!g1 || !g2) {
    return res.status(400).json({
      error: `الحرف "${!g1 ? c1 : c2}" غير متوفر في الخط`,
      available: Object.keys(GLYPHS).join('')
    });
  }

  // ألوان حسب النمط
  const styleColors = {
    'رومانسي كلاسيكي': { a: '#E5C77C', b: '#C9A961', c: '#8B6914', d: '#FFF5CC' },
    'ملكي فاخر':        { a: '#FFD700', b: '#DAA520', c: '#8B6914', d: '#FFFACD' },
    'حديث أنيق':        { a: '#E0C060', b: '#B89840', c: '#7A6420', d: '#F5E8A0' },
    'تراثي عربي أصيل':  { a: '#D4AF37', b: '#B8960C', c: '#7A6410', d: '#F5E6A0' },
  };
  const col = styleColors[style] || styleColors['رومانسي كلاسيكي'];

  // حساب التحويل
  const SIZE = 300;
  const scale = SIZE / UPEM;

  const W = 660, H = 360;
  const cx = W / 2, cy = H / 2;

  // دالة تحويل bounds الحرف لـ pixel
  function getGlyphDims(g) {
    const b = g.bounds;
    return {
      xMin: b[0] * scale, yMin: b[1] * scale,
      xMax: b[2] * scale, yMax: b[3] * scale,
      w: (b[2] - b[0]) * scale,
      h: (b[3] - b[1]) * scale,
    };
  }

  const d1 = getGlyphDims(g1);
  const d2 = getGlyphDims(g2);

  // توسيط وتداخل الحرفين
  const overlap = 0.25;
  const totalW = d1.w + d2.w - d1.w * overlap;
  const startX = cx - totalW / 2;

  // transform للحرف الأول (يمين - لأن العربي RTL)
  const t1x = startX + d2.w - d2.w * overlap - d1.xMin;
  const t1y = cy + d1.h / 2 - d1.yMax;

  // transform للحرف الثاني (يسار)
  const t2x = startX - d2.xMin;
  const t2y = cy + d2.h / 2 - d2.yMax;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="${col.c}"/>
      <stop offset="25%"  stop-color="${col.b}"/>
      <stop offset="50%"  stop-color="${col.a}"/>
      <stop offset="70%"  stop-color="${col.d}"/>
      <stop offset="85%"  stop-color="${col.a}"/>
      <stop offset="100%" stop-color="${col.b}"/>
    </linearGradient>
    <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="${col.b}"/>
      <stop offset="35%"  stop-color="${col.a}"/>
      <stop offset="60%"  stop-color="${col.d}"/>
      <stop offset="85%"  stop-color="${col.a}"/>
      <stop offset="100%" stop-color="${col.c}"/>
    </linearGradient>
    <filter id="glow1">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glow2">
      <feGaussianBlur stdDeviation="3.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="#000000"/>

  <!-- دوائر زخرفية -->
  <circle cx="${cx}" cy="${cy}" r="${Math.min(W,H)/2 - 15}" fill="none" stroke="${col.b}" stroke-width="0.8" opacity="0.2"/>
  <circle cx="${cx}" cy="${cy}" r="${Math.min(W,H)/2 - 30}" fill="none" stroke="${col.b}" stroke-width="0.4" opacity="0.12"/>

  <!-- الحرف الأول (يمين) - توهج كامل -->
  <g filter="url(#glow1)">
    <path d="${g1.path}" fill="url(#g1)"
      transform="translate(${t1x.toFixed(2)},${t1y.toFixed(2)}) scale(${scale.toFixed(6)},${(-scale).toFixed(6)})"/>
  </g>

  <!-- الحرف الثاني (يسار) - متداخل بشفافية -->
  <g filter="url(#glow2)" opacity="0.82">
    <path d="${g2.path}" fill="url(#g2)"
      transform="translate(${t2x.toFixed(2)},${t2y.toFixed(2)}) scale(${scale.toFixed(6)},${(-scale).toFixed(6)})"/>
  </g>

  <!-- نقطة مركزية -->
  <circle cx="${cx}" cy="${cy}" r="4" fill="${col.a}" opacity="0.7" filter="url(#glow1)"/>
</svg>`;

  // تحويل SVG لـ data URL
  const base64 = Buffer.from(svgContent).toString('base64');
  const dataUrl = `data:image/svg+xml;base64,${base64}`;

  return res.status(200).json({
    success: true,
    imageUrl: dataUrl,
    monogram: `${c1}+${c2}`,
    style,
    names: `${groomName} و ${brideName}`,
    model: 'alsamt-diwani-font'
  });
}
