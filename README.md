# 🌟 لمسة | Lamst Design

> منصة دعوات الزفاف الملكية مع توليد المخطوطات بالذكاء الاصطناعي

🔗 **حساباتنا**: [Instagram @lamst_design](https://instagram.com/lamst_design) · [TikTok @lamst_design](https://tiktok.com/@lamst_design)

---

## 📋 المحتويات

1. [خطوات النشر الكاملة](#-خطوات-النشر-الكاملة) (GitHub → Vercel)
2. [الحصول على Higgsfield API Keys](#-الحصول-على-higgsfield-api-keys)
3. [إضافة المفاتيح في Vercel](#-إضافة-المفاتيح-في-vercel)
4. [ربط مع متجر سلة](#-ربط-مع-متجر-سلة)
5. [التخصيص](#-التخصيص)
6. [حل المشاكل](#-حل-المشاكل)

---

## 🚀 خطوات النشر الكاملة

### الخطوة 1: رفع الملفات على GitHub

#### 1.1 إنشاء حساب GitHub
- اذهب لـ **https://github.com/signup**
- سجل بإيميلك (مجاني)

#### 1.2 إنشاء مستودع جديد (Repository)
1. اضغط على **+** في الأعلى → **New repository**
2. الاسم: `lamst-design`
3. اختر **Public** (أو Private لو تبي)
4. لا تضع شي في باقي الخيارات
5. اضغط **Create repository**

#### 1.3 رفع الملفات

**الطريقة الأسهل (بدون CLI):**

1. في صفحة الـ repository الفارغة، اضغط **"uploading an existing file"**
2. اسحب جميع ملفات مجلد `lamst-v2` (فك ضغط الـ ZIP أولاً)
3. اضغط **Commit changes**

**أو عبر Git (للمحترفين):**

```bash
cd lamst-v2
git init
git add .
git commit -m "Initial commit - Lamst Design platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lamst-design.git
git push -u origin main
```

---

### الخطوة 2: نشر الموقع على Vercel

#### 2.1 إنشاء حساب Vercel
- اذهب لـ **https://vercel.com/signup**
- اختر **Continue with GitHub** (سيربط حسابك تلقائياً)

#### 2.2 استيراد المشروع من GitHub
1. في Vercel Dashboard اضغط **Add New → Project**
2. تظهر قائمة مستودعاتك في GitHub
3. ابحث عن `lamst-design` واضغط **Import**

#### 2.3 إعدادات النشر
- **Framework Preset**: Other
- **Build Command**: اتركه فارغاً
- **Output Directory**: اتركه فارغاً  
- **Root Directory**: `./`

#### 2.4 الضغط على Deploy
بعد دقيقة، سيظهر لك رابط مثل:
```
https://lamst-design.vercel.app
```

**هذا الرابط الذي تشاركه مع أصدقائك وعملائك!** ✨

---

## 🔑 الحصول على Higgsfield API Keys

### خطوات استخراج المفاتيح:

1. **اذهب للرابط المباشر**:
   ```
   https://cloud.higgsfield.ai/api-keys
   ```

2. **سجل دخول بنفس حسابك** الذي فيه اشتراك Ultimate (1,140 كريديت)

3. **اضغط Create API Key** (أو + New Key)

4. **سيظهر لك**:
   - `Key ID` (مثال: `hf_abc123def456...`)
   - `Key Secret` (مثال: `secret_xyz789...`)

5. ⚠️ **انسخهم فوراً** ✏️ — لن يظهروا مرة أخرى!
   احفظهم في ملاحظات الجوال أو ملف نصي مؤقت

6. لو ضاعت المفاتيح، يمكنك إنشاء مفاتيح جديدة (بدون كلفة)

---

## ⚙️ إضافة المفاتيح في Vercel

### بعد نشر المشروع:

1. اذهب لـ Vercel Dashboard
2. اضغط على مشروعك `lamst-design`
3. من القائمة العلوية: **Settings**
4. من القائمة الجانبية: **Environment Variables**
5. أضف المتغير الأول:
   - **Name**: `HF_KEY_ID`
   - **Value**: ضع الـ Key ID اللي نسخته
   - **Environment**: حدد كل الخيارات (Production, Preview, Development)
   - اضغط **Save**
6. أضف المتغير الثاني:
   - **Name**: `HF_KEY_SECRET`
   - **Value**: ضع الـ Key Secret
   - **Save**

### إعادة النشر (Redeploy) ضرورية:

1. اذهب لـ **Deployments**
2. اضغط على آخر deployment → النقاط الثلاث `⋯` → **Redeploy**
3. اضغط **Redeploy** للتأكيد

✅ **الآن المخطوطات تتولد فعلياً وتُخصم من رصيدك في Higgsfield**

---

## 🛒 ربط مع متجر سلة

### إعدادات المنتج (دعوة الزفاف - 30 ريال):

1. في لوحة تحكم سلة، أنشئ منتج جديد:
   - الاسم: "دعوة زفاف ملكية رقمية"
   - السعر: 30 ريال
   - النوع: منتج رقمي
   
2. في **إعدادات المنتج → صفحة الشكر بعد الدفع**:
   ```
   https://lamst-design.vercel.app/?order={order_id}
   ```

3. **منتج المحاولات الإضافية** (15 ريال):
   - أنشئ منتج آخر بنفس الطريقة
   - في كود `purchaseExtra()` بالموقع، عدّل الرابط لرابط المنتج

### تدفق العميل:

1. يدخل المتجر ويختار الدعوة
2. يدفع 30 ريال
3. ينتقل تلقائياً للموقع
4. يدخل بياناته → يولّد المخطوطة → يحمّل الدعوة ✓

---

## 🎨 التخصيص

### تغيير رقم WhatsApp للدعم
في `public/index.html` ابحث عن:
```javascript
'https://wa.me/966500000000?text=' 
```
واستبدل `966500000000` برقمك السعودي بصيغة دولية

### تغيير الألوان
في الـ CSS بداية الصفحة:
```css
:root {
  --gold: #C9A961;       /* اللون الذهبي الأساسي */
  --gold-light: #E5C77C;  /* الذهبي الفاتح */
  --gold-deep: #8B6914;   /* الذهبي الغامق */
  --bg: #050403;          /* الخلفية السوداء */
}
```

### إضافة قوالب تصميم جديدة
1. أضف صورة جديدة في `public/assets/`
2. عدّل في الـ CSS:
```css
.invitation { background-image: url('/assets/template2.jpg'); }
```

أو ابني قائمة قوالب اختيارية - أرسل لي رسالة وأبنيها لك.

---

## 🔧 حل المشاكل

### المشكلة: "Higgsfield API غير مُهيّأ"
**الحل**: تأكد من إضافة `HF_KEY_ID` و `HF_KEY_SECRET` في Vercel Environment Variables، ثم Redeploy.

### المشكلة: المخطوطة تظهر بـ "وضع تجريبي"
**السبب**: لم يتم إعداد المفاتيح أو فشل الاتصال بـ Higgsfield  
**الحل**: تحقق من:
1. صحة المفاتيح في Vercel
2. وجود رصيد في حسابك على Higgsfield
3. مراجعة Logs في Vercel: **Deployments → Logs**

### المشكلة: الخط لا يظهر بشكل صحيح
**الحل**: تأكد من اتصال الإنترنت (الخط يحمّل من CDN). أو حمّل ملف الخط محلياً وضعه في `public/assets/fonts/`.

### المشكلة: الصورة لا تتحمل في الـ Canvas
**الحل**: تأكد من أن صورة `template.jpg` موجودة في `public/assets/` وأن حجمها أقل من 5MB.

---

## 📞 الدعم

لو احتجت مساعدة في أي خطوة:
- WhatsApp: [+966500000000](https://wa.me/966500000000)
- Instagram: [@lamst_design](https://instagram.com/lamst_design)

---

## 💎 الميزات

| الميزة | الحالة |
|---|---|
| تصميم ملكي بصورة احترافية | ✅ |
| دعم عربي RTL كامل | ✅ |
| توليد مخطوطة بـ Higgsfield AI | ✅ |
| 3 محاولات مجانية + 3 مدفوعة | ✅ |
| تحميل PNG عالي الجودة (Canvas) | ✅ |
| متجاوب للجوال | ✅ |
| ربط Instagram & TikTok | ✅ |
| ربط مع سلة عبر URL parameter | ✅ |
| دعم WhatsApp للدعم | ✅ |
| إضافة لاحقة: تأكيد حضور، باركود | 🚧 |

---

**صنع بإبداع ♥ — @lamst_design**
