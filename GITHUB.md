# رفع منصة KIUR إلى GitHub (مستودع خاص)

## الطريقة الأولى — من موقع GitHub مباشرة (الأسهل وتضمن الخصوصية)

### ١. أنشئ المستودع الخاص
1. افتح https://github.com/new
2. **Repository name**: `kiur-platform` (أو أي اسم تريده)
3. **Private** ← مهم: اختر خاص وليس عام
4. لا تختار "Add a README" ولا .gitignore (موجودة هنا بالفعل)
5. اضغط **Create repository**

### ٢. من مجلد المشروع على جهازك، نفّذ هذه الأوامر بالترتيب
```bash
git init
git add .
git commit -m "KIUR: منصة اختبارات المجموعة الطبية"
git branch -M main
git remote add origin https://github.com/اسمك/kiur-platform.git
git push -u origin main
```
> استبدل `اسمك` باسم حسابك على GitHub.
> سيطلب منك GitHub تسجيل الدخول — استخدم **Personal Access Token** بدل كلمة المرور:
> أنشئه من GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic) مع صلاحية `repo` كاملة.

## الطريقة الثانية — بسطر واحد عبر GitHub CLI
```bash
# ثبّت gh من https://cli.github.com ثم:
gh auth login
gh repo create kiur-platform --private --source=. --remote --push
```
هذا الأمر ينشئ المستودع **خاصًا** ويرفع الكود دفعة واحدة.

## أي تحديث لاحق
```bash
git add .
git commit -m "تحديث"
git push
```

## النشر المجاني من مستودع خاص
مستودعك الخاص يعمل مباشرة مع:
- **Netlify**: https://app.netlify.com → "Import from Git" → اختر المستودع الخاص → Build: `npm run build` → Publish: `dist` (مجاني بالكامل ويدعم المستودعات الخاصة)
- **Vercel**: https://vercel.com/new → نفس الخطوات (يكتشف Vite تلقائيًا)
- ملاحظة: GitHub Pages المجاني يتطلب مستودعًا **عامًا** — لذلك مع الخصوصية استخدم Netlify أو Vercel.

## تنبيهات أمنية
- الكود يحتوي حسابات تجريبية بكلمات مرور افتراضية (مثل `kiur2024`) — لا مشكلة لأن المستودع خاص، لكن غيّرها من داخل المنصة قبل الإطلاق الفعلي.
- لا ترفع ملف `.env` يحتوي مفاتيح Supabase الحقيقية — `.gitignore` يحجب ذلك تلقائيًا.
- البيانات الحالية تُحفظ في متصفح كل مستخدم (localStorage)؛ للمزامنة الفعلية اربط Supabase.
