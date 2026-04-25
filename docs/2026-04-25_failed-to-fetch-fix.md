# إصلاح مشكلة "Failed to fetch" عند تسجيل الدخول

**التاريخ:** 2026-04-25
**الإصدار قبل الإصلاح:** 1.0.0
**الإصدار بعد الإصلاح:** 1.0.1

## المشكلة
عند محاولة تسجيل الدخول من الموقع المنشور `https://fahad-iptv.vercel.app` تظهر رسالة:
> Failed to fetch

## السبب الجذري
1. **Mixed Content**: الموقع يعمل على HTTPS بينما خوادم Xtream Codes غالباً HTTP، والمتصفحات تمنع طلبات HTTP من صفحة HTTPS.
2. **CORS**: خوادم IPTV لا ترسل عادةً ترويسات CORS تسمح للمتصفح بقراءة الرد.

## الحل المطبق
إنشاء Vercel Serverless Function تعمل كـ Proxy:
- مسار الـ proxy: `/api/xtream`
- يستقبل: `target` (URL الكامل لخادم Xtream)
- يقوم بالطلب من السيرفر (Node.js) ثم يُعيد الرد للمتصفح
- يضيف ترويسات CORS اللازمة
- يحل مشكلتي HTTPS و CORS معاً

## الملفات المعدّلة
- `api/xtream.ts` (جديد) — Vercel serverless proxy
- `client/src/lib/xtream.ts` — توجيه الطلبات عبر `/api/xtream` في الإنتاج
- `vercel.json` — السماح بمسارات `/api/*`
- `package.json` — رفع الإصدار إلى 1.0.1

## النسخ الاحتياطية
- `backup/lib/xtream.ts.bak`

## الاختبار
يُترك للمستخدم اختبار تسجيل الدخول بعد النشر.
