# AL PRINCE FOOD — Firebase Fix

The project is configured for:

- Project ID: `al-prince-food`
- Customer: `/customer/`
- Admin: `/admin/`
- Delivery: `/delivery/`

## Firebase Console requirements

1. Authentication → Sign-in method → enable **Email/Password**.
2. Authentication → Sign-in method → enable **Anonymous**.
3. Authentication → Settings → Authorized domains → add:
   `abdo124206-crypto.github.io`
4. Firestore Database → Rules → publish the included `firestore.rules`.

## Admin account

Use the Firebase Authentication account you created:

`user1@abdo124206.com`

The account must have a document at:

`users/<AUTH_UID>`

with:

```text
role: "admin"
```

## Delivery

A delivery account needs:

```text
users/<AUTH_UID>
role: "driver"
name: "..."
```

The driver UID must match the `driver.uid` stored on an order.
