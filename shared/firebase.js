// AL PRINCE FOOD — Firebase client setup
// 1) Create a Firebase Web App.
// 2) Copy its config into firebaseConfig below.
// 3) Enable Firestore Database and Authentication (Email/Password).
// 4) The app will then use the same database for Customer/Admin/Delivery.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, doc, setDoc, updateDoc, getDoc, onSnapshot,
  query, orderBy, serverTimestamp, getDocs, where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC77sPNpLHd_X6kSNfWu6n3ck628yFR24",
  authDomain: "al-prince-food.firebaseapp.com",
  projectId: "al-prince-food",
  storageBucket: "al-prince-food.firebasestorage.app",
  messagingSenderId: "603504917575",
  appId: "1:603504917575:web:c9b422ee46733da2c60562",
  measurementId: "G-VZC4QDNLBC"
};

export const firebaseConfigured =
  !Object.values(firebaseConfig).some(v => String(v).startsWith("PASTE_"));

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export {
  collection, addDoc, doc, setDoc, updateDoc, getDoc, onSnapshot, query, orderBy,
  serverTimestamp, getDocs, where,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut
};

export function requireFirebase() {
  if (!firebaseConfigured) {
    throw new Error("Firebase config is not filled in yet. Edit shared/firebase.js.");
  }
}
