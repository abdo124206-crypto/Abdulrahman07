import {
  auth, db, doc, setDoc, getDoc, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "./firebase.js";

export async function getUserRole(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data().role || "" : "";
}

function esc(v="") {
  return String(v).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}

export function mountAuthGate({requiredRole="", signup=false, title="تسجيل الدخول"}) {
  const gate = document.getElementById("authGate");
  if (!gate) return;
  gate.innerHTML = `<div class="auth-card">
    <div class="auth-logo">البرنس <small>FOOD</small></div>
    <span class="auth-eyebrow">SECURE ACCESS</span>
    <h1>${esc(title)}</h1>
    <p class="auth-sub">سجّل الدخول للمتابعة إلى النظام.</p>
    <form id="authForm">
      <label>البريد الإلكتروني<input id="authEmail" type="email" required autocomplete="email" placeholder="name@example.com"></label>
      <label>كلمة المرور<input id="authPassword" type="password" required minlength="6" autocomplete="current-password" placeholder="••••••••"></label>
      ${signup ? `<label id="authNameWrap">الاسم<input id="authName" type="text" autocomplete="name" placeholder="اسمك"></label>` : ""}
      <button class="auth-submit" type="submit" id="authSubmit">دخول</button>
      ${signup ? `<button class="auth-switch" type="button" id="authMode">إنشاء حساب جديد</button>` : ""}
      <div id="authMsg" class="auth-msg"></div>
    </form>
  </div>`;
  gate.hidden = false;

  let registerMode = false;
  const form = document.getElementById("authForm");
  const msg = document.getElementById("authMsg");
  const modeBtn = document.getElementById("authMode");
  if (modeBtn) modeBtn.onclick = () => {
    registerMode = !registerMode;
    document.getElementById("authNameWrap").style.display = registerMode ? "grid" : "none";
    document.getElementById("authSubmit").textContent = registerMode ? "إنشاء الحساب" : "دخول";
    modeBtn.textContent = registerMode ? "عندي حساب بالفعل" : "إنشاء حساب جديد";
  };
  if (signup) document.getElementById("authNameWrap").style.display = "none";

  form.onsubmit = async e => {
    e.preventDefault();
    msg.textContent = "جاري التحقق...";
    msg.className = "auth-msg";
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    try {
      if (signup && registerMode) {
        const name = document.getElementById("authName").value.trim();
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Customer profile. Firestore rules permit only role=customer here.
        await setDoc(doc(db, "users", cred.user.uid), {role:"customer", name, email, createdAt:new Date().toISOString()});
        msg.textContent = "تم إنشاء الحساب ✓";
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        msg.textContent = "تم تسجيل الدخول ✓";
      }
    } catch (err) {
      console.error(err);
      const map={
        "auth/invalid-credential":"البريد أو كلمة المرور غير صحيحة.",
        "auth/email-already-in-use":"البريد مستخدم بالفعل.",
        "auth/weak-password":"كلمة المرور ضعيفة.",
        "auth/invalid-email":"البريد الإلكتروني غير صحيح."
      };
      msg.textContent = map[err.code] || "تعذر تسجيل الدخول. حاول مرة أخرى.";
      msg.className = "auth-msg error";
    }
  };

  onAuthStateChanged(auth, async user => {
    if (!user) { gate.hidden=false; return; }
    try {
      const role = await getUserRole(user.uid);
      if (requiredRole && role !== requiredRole) {
        await signOut(auth);
        msg.textContent = "هذا الحساب ليس لديه صلاحية لهذه الواجهة.";
        msg.className = "auth-msg error";
        return;
      }
      gate.hidden = true;
      document.body.classList.add("authenticated");
      window.currentUser = user;
      window.currentRole = role;
      document.dispatchEvent(new CustomEvent("app:authenticated", {detail:{user,role}}));
    } catch (err) {
      console.error(err);
      await signOut(auth);
      msg.textContent = "تعذر قراءة صلاحيات الحساب.";
      msg.className = "auth-msg error";
    }
  });
}
