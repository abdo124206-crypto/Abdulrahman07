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
    console.error("Firebase SDK is not available.");
    return;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp(config);
    window.firebaseReady = true;
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    return;
  }

  window.auth = firebase.auth();
  window.db = firebase.firestore();

  // Keep authentication across browser restarts for Admin, Delivery and Customer.
  window.authPersistenceReady = window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch(err => { console.warn("Could not set local auth persistence", err); });
  window.waitForAuthReady = async () => {
    await (window.authPersistenceReady || Promise.resolve());
    return window.auth.currentUser;
  };

  let authReadyResolve;
  window.authReady = new Promise(resolve => { authReadyResolve = resolve; });
  let authReadyResolved = false;
  window.auth.onAuthStateChanged(user => {
    if (!authReadyResolved) {
      authReadyResolved = true;
      authReadyResolve(user || null);
    }
  });

  // Firestore helpers compatible with the code used by Customer/Admin/Delivery.
  window.collection = (db, ...segments) => {
    let ref = db.collection(segments[0]);
    for (let i = 1; i < segments.length; i += 2) {
      ref = ref.doc(segments[i]).collection(segments[i + 1]);
    }
    return ref;
  };

  window.doc = (db, ...segments) => {
    if (!segments.length) throw new Error("doc() needs a path");
    let ref = db.collection(segments[0]);
    for (let i = 1; i < segments.length - 1; i += 2) {
      ref = ref.doc(segments[i]).collection(segments[i + 1]);
    }
    return ref.doc(segments[segments.length - 1]);
  };

  window.addDoc = (ref, data) => ref.add(data);
  window.updateDoc = (ref, data) => ref.update(data);
  window.deleteDoc = ref => ref.delete();
  window.setDoc = (ref, data, options = { merge: true }) =>
    ref.set(data, options);
  window.getDoc = ref => ref.get();
  window.onSnapshot = (ref, callback, errorCallback) =>
    ref.onSnapshot(callback, errorCallback);

  window.query = (ref, ...constraints) =>
    constraints.reduce((q, constraint) => constraint(q), ref);

  window.where = (field, operator, value) => q =>
    q.where(field, operator, value);

  window.orderBy = (field, direction) => q =>
    q.orderBy(field, direction);

  window.serverTimestamp = () =>
    firebase.firestore.FieldValue.serverTimestamp();

  // Auth helpers support both styles used by the project:
  // signInWithEmailAndPassword(email, password)
  // and signInWithEmailAndPassword(auth, email, password)
  window.createUserWithEmailAndPassword = (a, b, c) => {
    if (a && typeof a.createUserWithEmailAndPassword === "function") {
      return a.createUserWithEmailAndPassword(b, c);
    }
    return window.auth.createUserWithEmailAndPassword(a, b);
  };

  window.signInWithEmailAndPassword = (a, b, c) => {
    if (a && typeof a.signInWithEmailAndPassword === "function") {
      return a.signInWithEmailAndPassword(b, c);
    }
    return window.auth.signInWithEmailAndPassword(a, b);
  };

  window.signInAnonymously = authInstance => {
    const a = authInstance || window.auth;
    return a.signInAnonymously();
  };

  window.signOut = authInstance => {
    const a = authInstance || window.auth;
    return a.signOut();
  };

  window.onAuthStateChanged = (a, b) => {
    if (typeof a === "function") {
      return window.auth.onAuthStateChanged(a);
    }
    return (a || window.auth).onAuthStateChanged(b);
  };

  console.log("Firebase connected successfully.");
})();
