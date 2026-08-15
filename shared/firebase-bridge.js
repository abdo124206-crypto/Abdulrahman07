(function(){
  const config={apiKey:"AIzaSyC77sPNpLHd_X6kSNfWu6n3ck628yFR24",authDomain:"al-prince-food.firebaseapp.com",projectId:"al-prince-food",storageBucket:"al-prince-food.firebasestorage.app",messagingSenderId:"603504917575",appId:"1:603504917575:web:c9b422ee46733da2c60562",measurementId:"G-VZC4QDNLBC"};
  window.firebaseReady=false;
  if(typeof firebase!=="undefined"){
    try{if(!firebase.apps.length) firebase.initializeApp(config); window.firebaseReady=true;}catch(e){console.error(e)}
  }
  if(window.firebaseReady){
    window.auth=firebase.auth(); window.db=firebase.firestore();
    window.collection=(d,n)=>d.collection(n); window.doc=(d,id)=>d.doc(id);
    window.addDoc=(r,data)=>r.add(data); window.updateDoc=(r,data)=>r.update(data);
    window.setDoc=(r,data)=>r.set(data,{merge:true}); window.getDoc=r=>r.get();
    window.onSnapshot=(r,cb,err)=>r.onSnapshot(cb,err);
    window.query=(r,...cs)=>cs.reduce((q,c)=>c(q),r);
    window.where=(f,op,v)=>q=>q.where(f,op,v);
    window.orderBy=(f,dir)=>q=>q.orderBy(f,dir);
    window.serverTimestamp=()=>firebase.firestore.FieldValue.serverTimestamp();
    window.createUserWithEmailAndPassword=(e,p)=>auth.createUserWithEmailAndPassword(e,p);
    window.signInWithEmailAndPassword=(e,p)=>auth.signInWithEmailAndPassword(e,p);
    window.signInAnonymously=()=>auth.signInAnonymously();
    window.signOut=()=>auth.signOut(); window.onAuthStateChanged=cb=>auth.onAuthStateChanged(cb);
  } else {
    // Local preview fallback: UI remains fully usable even if opened as file://.
    window.auth={currentUser:null,onAuthStateChanged(cb){setTimeout(()=>cb(null),0);return()=>{}},signOut:async()=>{},signInWithEmailAndPassword:async()=>{throw new Error("Firebase غير متاح في المعاينة المحلية")},createUserWithEmailAndPassword:async()=>{throw new Error("Firebase غير متاح في المعاينة المحلية")}};
    window.db={collection(){return {add:async()=>{throw new Error("Firebase غير متاح في المعاينة المحلية")}}},doc(){return {}}};
    window.collection=(d,n)=>d.collection(n); window.doc=(d,id)=>d.doc(id); window.addDoc=async()=>{throw new Error("Firebase غير متاح في المعاينة المحلية")}; window.updateDoc=async()=>{}; window.setDoc=async()=>{}; window.getDoc=async()=>({exists:false,data:()=>({})}); window.onSnapshot=()=>()=>{}; window.query=r=>r; window.where=()=>q=>q; window.orderBy=()=>q=>q; window.serverTimestamp=()=>new Date();
    window.createUserWithEmailAndPassword=window.auth.createUserWithEmailAndPassword; window.signInWithEmailAndPassword=window.auth.signInWithEmailAndPassword; window.signInAnonymously=async()=>({user:null}); window.signOut=()=>window.auth.signOut(); window.onAuthStateChanged=cb=>window.auth.onAuthStateChanged(cb);
  }
})();
