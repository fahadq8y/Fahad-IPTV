# تشغيل البث (Live + Movies + Series) وتحسين الأداء

**التاريخ:** 2026-04-25
**الإصدار قبل الإصلاح:** 1.0.1
**الإصدار بعد الإصلاح:** 1.0.2
**رقم التعديل:** 2

## المشاكل المُبلَّغ عنها
1. الموقع بطيء جداً عند تحميل القنوات.
2. القنوات المباشرة لا تفتح.
3. عند تشغيل فيلم، تظهر رسالة:
   > This stream format can't be played in the browser.

## السبب الجذري
الإصلاح السابق (1.0.1) كان يمرّر فقط طلبات `player_api.php` عبر الـ proxy، لكن روابط البث الفعلية كانت لا تزال تُرسَل مباشرة من المتصفح إلى خادم IPTV عبر HTTP، فيمنعها المتصفح بسبب Mixed Content، أو يفشل تحميل أجزاء `.ts` لقوائم HLS بسبب CORS.

## الحل المُطبَّق

### أولاً: Stream Proxy جديد (`api/stream.ts`)
- يستقبل: `?u=<base64url-encoded-original-url>`
- يدعم Range Requests لـ seeking في الأفلام (MP4/MKV).
- يعيد كتابة قوائم HLS (`.m3u8`) بحيث كل segment فرعي يمر هو الآخر عبر نفس الـ proxy.
- يستعمل streaming pass-through (`Readable.fromWeb`) فلا يحتجز الذاكرة.
- ترويسات CORS كاملة بما فيها `Accept-Ranges` و `Content-Range`.

### ثانياً: تعديل بناة الروابط (`client/src/lib/xtream.ts`)
- `buildLiveStreamUrl`, `buildVodStreamUrl`, `buildSeriesStreamUrl` ترجع الآن `/api/stream?u=<encoded>` بدلاً من URL خام.

### ثالثاً: تعديل VideoPlayer
- `isHlsUrl` يفك تشفير الـ `u` parameter ليكتشف ما إذا كان الأصل `.m3u8` أم لا، فيختار بين hls.js والمشغل الأصلي.

### رابعاً: تحسين أداء API proxy
- إضافة AbortController مع timeout 9 ثوانٍ (قبل حد Vercel 10 ثوانٍ).
- إضافة `Accept-Encoding: gzip, deflate` لتقليل حجم الردود.
- streaming الرد إلى المتصفح بدلاً من تحميله كاملاً ثم إرساله.
- كاش متصفح قصير (`max-age=120`) لقوائم التصنيفات.

## النسخ الاحتياطية
- `backup/api_xtream.ts.bak`
- `backup/lib/xtream.ts.v1.bak`
- `backup/VideoPlayer.tsx.bak`

## ملاحظة استهلاك الـ Bandwidth
بسبب أن البث يمر عبر Vercel، كل ميجابايت تتفرّج عليه يُحسب من حصة Vercel الشهرية (100 GB في الخطة المجانية). الحل المستقبلي إن زاد الاستخدام: نقل الـ stream proxy إلى Cloudflare Workers.

## الاختبار
يُترك للمستخدم اختبار:
1. تشغيل قناة مباشرة.
2. تشغيل فيلم والـ seek.
3. تشغيل حلقة من مسلسل.
4. سرعة تحميل القوائم.
