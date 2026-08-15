# AL PRINCE FOOD — Stable Connected Build

This build keeps the full UI working when opened locally and uses Firebase when hosted over HTTP/HTTPS (GitHub Pages).

- customer/
- admin/
- delivery/
- shared/firebase-bridge.js

Do not open the app as a raw module-only build. This version intentionally uses Firebase Compat + a bridge so the interface does not disappear when opened from file://.


## Customer experience
- Customer does NOT see an email/password login.
- Firebase Anonymous Authentication is used silently for customer sessions.
- The customer enters name, phone, address and notes at checkout.
- Orders are written to Firestore and tracked live on the customer site.
- The customer can cancel an order while its status is `new`.

### Firebase step required
In Firebase Console -> Authentication -> Sign-in method, enable **Anonymous**.
Without this one setting, real customer orders cannot be written securely to Firestore.
