/* AL PRINCE FOOD — Firebase compatibility bridge
   One Firebase implementation for Customer / Admin / Delivery.
   The page scripts use the namespaced API exposed below.
*/
(function () {
  const config = {
    apiKey: "AIzaSyC77sPNpLHd_x6kSNfWul6n3cK628yFR24",
    authDomain: "al-prince-food.firebaseapp.com",
    projectId: "al-prince-food",
    storageBucket: "al-prince-food.firebasestorage.app",
    messagingSenderId: "603504917575",
    appId: "1:603504917575:web:c9b422ee46733da2c60562",
    measurementId: "G-VZC4QDNLBC"
  };

  window.firebaseReady = false;

  if (typeof firebase === "undefined") {
    console.error("Firebase SDK is not available. Check the Firebase CDN scripts in the page.");
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    window.auth = firebase.auth();
    window.db = firebase.firestore();
    window.firebaseReady = true;

    // Firestore references: support any number of path segments.
    window.collection = function (dbRef, ...segments) {
      return dbRef.collection(segments.join("/"));
    };

    window.doc = function (dbRef, ...segments) {
      if (!segments.length || segments.length % 2 !== 0) {
        throw new Error(
          `Invalid document path: ${segments.join("/") || "<empty>"}. ` +
          "A document path must contain an even number of segments."
        );
      }
      return dbRef.doc(segments.join("/"));
    };

    window.addDoc = function (ref, data) {
      return ref.add(data);
    };

    window.updateDoc = function (ref, data) {
      return ref.update(data);
    };

    window.setDoc = function (ref, data, options) {
      return ref.set(data, options || { merge: true });
    };

    window.getDoc = function (ref) {
      return ref.get();
    };

    window.onSnapshot = function (ref, callback, errorCallback) {
      return ref.onSnapshot(callback, errorCallback);
    };

    window.query = function (ref, ...constraints) {
      return constraints.reduce((current, constraint) => constraint(current), ref);
    };

    window.where = function (field, operator, value) {
      return function (queryRef) {
        return queryRef.where(field, operator, value);
      };
    };

    window.orderBy = function (field, direction) {
      return function (queryRef) {
        return queryRef.orderBy(field, direction);
      };
    };

    window.serverTimestamp = function () {
      return firebase.firestore.FieldValue.serverTimestamp();
    };

    // Auth helpers support both styles:
    // signInWithEmailAndPassword(email, password)
    // signInWithEmailAndPassword(auth, email, password)
    window.signInWithEmailAndPassword = function (a, b, c) {
      if (a && typeof a.signInWithEmailAndPassword === "function") {
        return a.signInWithEmailAndPassword(b, c);
      }
      return window.auth.signInWithEmailAndPassword(a, b);
    };

    window.createUserWithEmailAndPassword = function (a, b, c) {
      if (a && typeof a.createUserWithEmailAndPassword === "function") {
        return a.createUserWithEmailAndPassword(b, c);
      }
      return window.auth.createUserWithEmailAndPassword(a, b);
    };

    window.signInAnonymously = function (authInstance) {
      const target = authInstance || window.auth;
      return target.signInAnonymously();
    };

    window.signOut = function (authInstance) {
      const target = authInstance || window.auth;
      return target.signOut();
    };

    // Supports both:
    // onAuthStateChanged(callback)
    // onAuthStateChanged(auth, callback)
    window.onAuthStateChanged = function (a, b) {
      let authInstance = window.auth;
      let callback = a;

      if (a && typeof a.onAuthStateChanged === "function") {
        authInstance = a;
        callback = b;
      }

      if (typeof callback !== "function") {
        console.error("onAuthStateChanged: callback is not a function");
        return function () {};
      }

      return authInstance.onAuthStateChanged(callback);
    };

    window.firebaseErrorMessage = function (err) {
      const code = err?.code || "";
      if (code.includes("api-key-not-valid")) {
        return "مفتاح Firebase غير صحيح. تأكد من إعداد المشروع.";
      }
      if (code.includes("unauthorized-domain")) {
        return "الدومين غير مضاف في Firebase Authorized domains.";
      }
      if (code.includes("operation-not-allowed")) {
        return "طريقة تسجيل الدخول المطلوبة غير مفعّلة في Firebase Authentication.";
      }
      if (code.includes("permission-denied")) {
        return "Firebase رفض العملية بسبب صلاحيات Firestore.";
      }
      return "حدث خطأ في الاتصال بـ Firebase.";
    };

    console.log("Firebase connected successfully.");
  } catch (error) {
    window.firebaseReady = false;
    console.error("Firebase initialization failed:", error);
  }
})();
