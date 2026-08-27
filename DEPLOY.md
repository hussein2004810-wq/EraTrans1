# نشر منصة KIUR على استضافة مجانية

المنصة تطبيق React ثابت (Static SPA) — ملف `dist/` الناتج عن البناء يعمل على أي استضافة ثابتة.

## 1) البناء
```bash
npm install
npm run build
```
الناتج في مجلد `dist/` — هذا ما ترفعه.

## 2) خيارات مجانية

### Netlify (الأسهل — سحب وإفلات)
1. ادخل إلى https://app.netlify.com/drop
2. اسحب مجلد `dist` إلى الصفحة → ستحصل على رابط فوري مثل `https://kiur-xxxx.netlify.app`
3. ملفات `_redirects` داخل `dist` تعالج توجيه الصفحات تلقائيًا.
4. لربط GitHub: ارفع المشروع إلى مستودع، ثم New site from Git → Build command: `npm run build` → Publish directory: `dist`.

### Vercel
1. ارفع المشروع إلى GitHub ثم https://vercel.com/new
2. Vercel يكتشف Vite تلقائيًا (Build: `npm run build`, Output: `dist`).
3. ملف `vercel.json` داخل `public/` يُنسخ إلى الجذر ويعالج التوجيه.

### GitHub Pages
1. ثبّت: `npm i -D gh-pages`
2. في `package.json` أضف `"homepage": "https://USERNAME.github.io/REPO"`
3. نفّذ: `npm run build && npx gh-pages -d dist`

### Cloudflare Pages
1. https://pages.cloudflare.com → Create project → اربط المستودع
2. Build command: `npm run build` — Output: `dist`

## 3) ملاحظات مهمة

- **البيانات محلية**: النسخة الحالية تحفظ الحسابات والأسئلة والدرجات في `localStorage` متصفح كل مستخدم.
  هذا مثالي للتجربة الفردية، لكن الطالب الذي يسجّل على جهازه لا تظهر بياناته عندك.
- **للتشغيل الفعلي مع طلاب حقيقيين على أجهزة مختلفة** اربط المنصة بـ **Supabase** (مجاني):
  - حزم `@supabase/supabase-js` مثبّتة مسبقًا في المشروع.
  - أنشئ مشروعًا مجانيًا على https://supabase.com واحصل على URL و anon key.
  - أخبرني وسأنفذ طبقة المزامنة: جدول accounts / questions / exams / attempts / audit.

## 4) إرسال المنصة للطلبة

- أرسل لهم رابط الاستضافة + بيانات حساب المشرف لديك فقط.
- كل طالب يسجّل حسابًا ذاتيًا باختيار: الجامعة ← الكلية ← القسم ← المرحلة.
- تدخل لوحة المشرف ← «سجل الطلاب» لرؤية كل مسجّل ومحاولاته، و«تصدير الدرجات» لسحب النتائج Excel/Word.
