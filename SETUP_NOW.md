# AL PRINCE FOOD — تشغيل النسخة الجديدة

## 1) Firebase
المشروع مربوط بالفعل بإعدادات Firebase التالية:

- Project ID: `al-prince-food`
- Admin email: `user1@abdo124206.com`

## 2) Authentication
في Firebase Console → Authentication → Sign-in method:

- فعّل **Email/Password**.
- فعّل **Anonymous** لأن العميل يستخدم جلسة مؤقتة قبل إرسال الطلب.

## 3) Authorized domains
في Authentication → Settings → Authorized domains أضف:

- `abdo124206-crypto.github.io`

## 4) Admin
بعد إنشاء مستخدم:

`user1@abdo124206.com`

وتسجيل الدخول من `/admin/`، النسخة الجديدة تنشئ تلقائيًا:

`users/{UID}`

بـ:

```text
role: admin
name: مدير المطعم
```

وذلك مقيد في Firestore Rules بهذا البريد فقط.

## 5) Delivery
أنشئ حساب الدليفري من Firebase Authentication بنفس الطريقة، ثم أنشئ في Firestore:

`users/{DRIVER_UID}`

```json
{
  "role": "driver",
  "name": "اسم المندوب",
  "email": "driver@example.com"
}
```

بعدها سيظهر تلقائيًا في لوحة الإدارة، ويمكن إسناد الطلب له.

## 6) Firestore Rules
انشر محتوى `firestore.rules` في Firebase → Firestore Database → Rules.

## 7) GitHub Pages
ارفع الملفات كما هي مع الحفاظ على الهيكل:

```text
admin/
customer/
delivery/
shared/
firestore.rules
index.html
```

لا تنقل `script.js` إلى داخل `index.html` ولا تضع `<script>` tags داخل ملفات JavaScript.
