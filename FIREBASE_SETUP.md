# Firebase Setup — AL PRINCE FOOD

## Required
1. Create/choose the Firebase project.
2. Register the Web App using the config already included in `shared/firebase.js` and `shared/firebase-bridge.js`.
3. Firestore Database: create the database.
4. Authentication > Sign-in method: **enable Anonymous**.
5. Authentication > Settings > Authorized domains: add the domain where the website is actually hosted.

> The customer website must be opened from a web origin. Do not rely on `file://.../customer/index.html` for Firebase Authentication.

## Firestore
Publish `firestore.rules` to Firestore.

## Roles
Create admin and driver users using Email/Password, then create matching documents in `/users/{uid}`:
- `{ role: "admin", name: "..." }`
- `{ role: "driver", name: "...", email: "..." }`

Customer accounts are anonymous and get a `/users/{uid}` document after the customer submits the first order.

## Order flow
Customer → Firestore `orders` → Admin live listener → Driver assignment → Driver status updates → Customer live tracking.

Customer messages are stored under:
`/orders/{orderId}/messages/{messageId}`
