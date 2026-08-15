# AL PRINCE FOOD — Rebuilt

نسخة نظيفة من المشروع مع توحيد اتصال Firebase بين Customer / Admin / Delivery.

## أهم الإصلاحات

- Firebase config موحّد في `shared/firebase-bridge.js`.
- تصحيح Firebase API key.
- تصحيح `doc()` ليقبل المسارات متعددة الأجزاء مثل `orders/{id}/messages`.
- تصحيح `onAuthStateChanged()` ليقبل الصيغتين.
- منع خلط HTML مع JavaScript.
- Customer: جلسة Anonymous + إرسال الطلب + متابعة الطلب + المحادثة.
- Admin: تسجيل دخول + صلاحية Admin + الطلبات + المنيو + تعيين الدليفري + المحادثة.
- Delivery: تسجيل دخول + الطلبات المسندة + تغيير الحالة.
- Admin bootstrap للبريد `user1@abdo124206.com`.
