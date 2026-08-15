# Authentication & Roles

- Admin UID: `mr68MyOHXNMo1uPPt3hKmYacuMe2`
- Driver UID: `VTC8spqKNOg05KT7aHEsniyB3Fm1`
- Firestore `users` collection stores `role`: `admin`, `driver`, or `customer`.
- Customer can create their own `users/{uid}` profile only with role `customer`.
- Admin can assign orders to the configured driver from the Admin order table.
- Delivery listens only to orders assigned to the signed-in driver's UID.
