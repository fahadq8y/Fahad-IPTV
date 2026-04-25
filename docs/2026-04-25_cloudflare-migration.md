# التعديل رقم 3 — نقل الـ Proxy من Vercel إلى Cloudflare Workers

**التاريخ:** 2026-04-25
**الإصدار قبل الإصلاح:** 1.0.2
**الإصدار بعد الإصلاح:** 1.0.3
**السبب:** حل مشكلة الـ proxy المعطّل على Vercel واستخدام Cloudflare للحصول على bandwidth غير محدود

## المشاكل المُبلَّغ عنها
1. الـ proxy على Vercel يعلّق (Hang) ولا يرد
2. تسجيل الدخول يتوقف عند محاولة جلب البيانات
3. استهلاك Bandwidth من حصة Vercel المحدودة (100 GB/شهر)

## الحل المُطبَّق

### 1. إنشاء Cloudflare Worker Proxy
- ملف جديد: `wrangler/src/index.ts`
- يدعم نفس الوظائف الأساسية (API + Streaming)
- يعيد كتابة HLS playlists
- يدعم Range Requests

### 2. تعديل الكود
- `client/src/lib/xtream.ts`: تغيير `toProxiedUrl()` لاستخدام Cloudflare بدلاً من Vercel
- إضافة `cfB64UrlEncode()` للترميز الآمن
- دعم متغير بيئة `VITE_CLOUDFLARE_PROXY_URL`

### 3. إضافة ملفات التكوين
- `wrangler/wrangler.toml`: تكوين Cloudflare Worker
- `wrangler/package.json`: Dependencies
- `wrangler/tsconfig.json`: TypeScript config
- `wrangler/README.md`: تعليمات النشر

### 4. حذف Vercel Proxy
- حذف `api/xtream.ts`
- حذف `api/stream.ts`
- الاحتفاظ بـ `vercel.json` للتوافق

## خطوات النشر على Cloudflare

### المتطلبات
- حساب Cloudflare (مجاني)
- Node.js 18+
- Wrangler CLI

### الخطوات
```bash
# 1. تثبيت Wrangler
npm install -g wrangler

# 2. الدخول إلى Cloudflare
wrangler login

# 3. الذهاب لمجلد Wrangler
cd wrangler

# 4. تثبيت Dependencies
npm install

# 5. النشر
wrangler deploy
```

### بعد النشر
ستحصل على URL مثل:
```
https://fahad-iptv-proxy.{subdomain}.workers.dev
```

### تحديث الكود
أضف المتغير البيئي في `.env`:
```
VITE_CLOUDFLARE_PROXY_URL=https://fahad-iptv-proxy.{subdomain}.workers.dev
```

## المميزات الجديدة
- ✅ Bandwidth غير محدود
- ✅ أداء أفضل (شبكة Cloudflare العالمية)
- ✅ 99.95% uptime
- ✅ مجاني للـ 10 مليون طلب/شهر

## النسخ الاحتياطية
- `backup/xtream.ts.v2.bak` — النسخة السابقة

## ملاحظات
- الخطة المجانية تكفي لـ استخدام شخصي/عائلي
- لو تجاوزت 10 مليون طلب، قد تحتاج خطة مدفوعة ($5/شهر)
- بعض خوادم IPTV قد تكون محظورة من Cloudflare
