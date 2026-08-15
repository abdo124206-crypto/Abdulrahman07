const $=s=>document.querySelector(s);
let currentUser=null, allOrders=[], unsub=null, assignmentUnsub=null, previousAssigned=new Set();
const statusLabel={new:"تم تكليفك بالطلب",preparing:"جاري التحضير",ready:"جاهز للاستلام",on_the_way:"في الطريق",delivered:"تم التسليم"};

function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function showGate(msg=""){
  const gate=$("#authGate");gate.hidden=false;
  gate.innerHTML=`<div class="auth-card"><div class="auth-logo">البرنس <small>FOOD</small></div><span class="auth-eyebrow">DELIVERY ACCESS</span><h1>دخول الدليفري</h1><form id="driverLogin"><label>البريد الإلكتروني<input id="driverEmail" type="email" required></label><label>كلمة المرور<input id="driverPassword" type="password" required></label><button class="auth-submit">دخول</button><div id="driverMsg" class="auth-msg error">${escapeHtml(msg)}</div></form></div>`;
  $("#driverLogin").onsubmit=async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,$("#driverEmail").value.trim(),$("#driverPassword").value)}catch(err){$("#driverMsg").textContent="البريد أو كلمة المرور غير صحيحة."}};
}
async function roleOf(uid){const snap=await getDoc(doc(db,"users",uid));if(!snap.exists())return "";return String(snap.data()?.role||"").trim().toLowerCase()}
function todayStart(){const d=new Date();d.setHours(0,0,0,0);return d}
function isToday(o){const t=o.createdAt?.toDate?o.createdAt.toDate():new Date(o.createdAt||0);return t>=todayStart()}
function renderStats(){
  const today=allOrders.filter(isToday), active=today.filter(o=>["new","preparing","ready","on_the_way"].includes(o.status)), delivered=today.filter(o=>o.status==="delivered");
  $("#todayCount").textContent=today.length;$("#activeCount").textContent=active.length;$("#deliveredCount").textContent=delivered.length;
  $("#summaryToday").textContent=today.length;$("#summaryDelivered").textContent=delivered.length;$("#summaryTotal").textContent=delivered.reduce((s,o)=>s+Number(o.total||0),0)+" ج";
  $("#welcomeText").innerHTML=active.length?`عندك <b>${active.length} طلبات نشطة</b> مسندة ليك.`:`مفيش طلبات نشطة مسندة ليك حاليًا.`;
}
function orderCard(o,i){
  const action=o.status==="new"||o.status==="preparing"?"استلام الطلب":o.status==="ready"?"بدء التوصيل":o.status==="on_the_way"?"تأكيد التسليم":"تم التسليم";
  const next=o.status==="new"||o.status==="preparing"?"ready":o.status==="ready"?"on_the_way":o.status==="on_the_way"?"delivered":"";
  const phone=o.customer?.phone||"";
  return `<article class="order"><div class="order-top"><span class="order-id">#${escapeHtml(o.id.slice(0,7))} • ${o.status==="new"?"تكليف جديد":"توصيل"}</span><span class="status ${o.status==="on_the_way"?"route":"pickup"}">${escapeHtml(statusLabel[o.status]||o.status)}</span></div><h3>${escapeHtml(o.customer?.name||"العميل")}</h3><div class="address">📍 ${escapeHtml(o.customer?.address||"العنوان غير متوفر")}<br>📞 ${escapeHtml(phone||"رقم الهاتف غير متوفر")}</div><div class="items">${(o.items||[]).map(x=>`<div class="item"><span>${escapeHtml(x.name)} ×${Number(x.qty||0)}</span><b>${Number(x.unitPrice||0)*Number(x.qty||0)} ج</b></div>`).join("")}</div><div class="order-actions"><a class="contact-btn" href="${phone?`tel:${encodeURIComponent(phone)}`:"#"}" ${phone?"":"aria-disabled=\"true\""}>📞 اتصال بالعميل</a><button class="chat-btn" data-chat="${i}">💬 محادثة</button></div><div class="order-foot"><span class="total">${Number(o.total||0)} ج</span>${next?`<button class="primary" data-order="${i}" data-next="${next}">${action}</button>`:`<span class="done">✓ تم التسليم</span>`}</div></article>`;
}
function render(){
  renderStats();const box=$("#deliveryOrders");const active=allOrders.filter(o=>["new","preparing","ready","on_the_way"].includes(o.status));
  if(!active.length){box.innerHTML=`<div class="order empty-order"><h3>مفيش طلبات مسندة ليك حاليًا</h3><p class="address">أول ما الإدارة تسندلك طلب هيظهر هنا تلقائيًا.</p></div>`;return}
  box.innerHTML=active.map((o,i)=>orderCard(o,allOrders.indexOf(o))).join("");
}
function toast(t){const x=document.createElement("div");x.textContent=t;x.style.cssText="position:fixed;bottom:20px;left:20px;background:#4f0b1c;color:#fff;padding:12px 16px;border-radius:10px;z-index:9999;font-size:11px";document.body.appendChild(x);setTimeout(()=>x.remove(),2800)}
async function changeStatus(id,next){await updateDoc(doc(db,"orders",id),{status:next,updatedAt:serverTimestamp()})}
let chatUnsub=null;
function openChat(index){
  const o=allOrders[index];if(!o)return;const m=$("#modal");$("#modalTitle").textContent=`محادثة العميل — ${o.customer?.name||"العميل"}`;$("#modalBody").innerHTML=`<div class="chat-box" id="driverChatMessages"></div><form id="driverChatForm" class="chat-form"><input id="driverChatInput" maxlength="300" placeholder="اكتب رسالتك للعميل..." autocomplete="off"><button class="primary" type="submit">إرسال</button></form>`;m.hidden=false;
  if(chatUnsub)chatUnsub();const q=query(collection(db,"orders",o.id,"messages"),orderBy("createdAt","asc"));chatUnsub=onSnapshot(q,snap=>{const box=$("#driverChatMessages");if(!snap.size){box.innerHTML='<div class="chat-empty">مفيش رسائل لسه.</div>';return}box.innerHTML=snap.docs.map(d=>{const x=d.data(),mine=x.senderUid===currentUser.uid;const who=x.senderRole==="customer"?"العميل":x.senderRole==="driver"?"الدليفري":"المطعم";return `<div class="chat-bubble ${mine?"mine":"other"}"><span>${escapeHtml(x.text||"")}</span><small>${who}</small></div>`}).join("");box.scrollTop=box.scrollHeight},err=>console.error(err));
  $("#driverChatForm").onsubmit=async e=>{e.preventDefault();const input=$("#driverChatInput"),text=input.value.trim();if(!text)return;try{await addDoc(collection(db,"orders",o.id,"messages"),{text,senderUid:currentUser.uid,senderRole:"driver",createdAt:serverTimestamp()});input.value=""}catch(err){console.error(err);toast("تعذر إرسال الرسالة")}};
}
function closeModal(){if(chatUnsub){chatUnsub();chatUnsub=null}$("#modal").hidden=true}
function openProfile(){
  $("#profileName").textContent=currentUser?.displayName||$("#driverName").textContent||"مندوب الدليفري";
  $("#profileEmail").textContent=currentUser?.email||"";$("#profileMenu").hidden=false;
}
async function loadOrders(){
  if(unsub)unsub();
  if(assignmentUnsub)assignmentUnsub();
  previousAssigned=new Set(allOrders.map(o=>o.id));

  // Primary live feed: orders already assigned to this driver.
  const q=query(collection(db,"orders"),where("assignedDriverUid","==",currentUser.uid));
  unsub=onSnapshot(q,snap=>{
    const next=snap.docs.map(d=>({id:d.id,...d.data()}));
    next.filter(o=>o.status!=="delivered"&&o.status!=="cancelled"&&!previousAssigned.has(o.id)).forEach(o=>toast(`تم تكليفك بطلب #${o.id.slice(0,7)} للعميل ${o.customer?.name||""}`));
    previousAssigned=new Set(next.map(o=>o.id));
    allOrders=next;
    render();
  },err=>{console.error("orders listener",err);toast("تعذر تحميل الطلبات المسندة ليك")});

  // Guaranteed assignment channel: admin writes users/{driverUid}/assignments/{orderId}.
  const aq=collection(db,"users",currentUser.uid,"assignments");
  assignmentUnsub=onSnapshot(aq,async snap=>{
    const active=snap.docs.map(d=>({id:d.id,...d.data()})).filter(a=>a.active!==false&&a.orderId);
    for(const a of active){
      try{
        const os=await getDoc(doc(db,"orders",a.orderId));
        if(!os.exists()) continue;
        const order={id:os.id,...os.data()};
        if(!allOrders.some(x=>x.id===order.id)) toast(`تم تكليفك بطلب #${order.id.slice(0,7)} للعميل ${order.customer?.name||""}`);
        const idx=allOrders.findIndex(x=>x.id===order.id);
        if(idx>=0) allOrders[idx]=order; else allOrders.push(order);
      }catch(err){console.error("assignment order",err)}
    }
    const activeIds=new Set(active.map(a=>a.orderId));
    allOrders=allOrders.filter(o=>activeIds.has(o.id)||o.driver?.uid===currentUser.uid||o.assignedDriverUid===currentUser.uid);
    render();
  },err=>console.error("assignment listener",err));
}
document.addEventListener("click",async e=>{
  if(e.target.id==="profile")return openProfile();
  if(e.target.id==="closeProfile")return $("#profileMenu").hidden=true;
  if(e.target.id==="logout"){await signOut(auth);return}
  if(e.target.id==="close")return closeModal();
  if(e.target.id==="refresh")return loadOrders();
  const chat=e.target.closest("[data-chat]");if(chat)return openChat(Number(chat.dataset.chat));
  const b=e.target.closest("[data-order]");if(!b)return;const o=allOrders[Number(b.dataset.order)],next=b.dataset.next;if(!o||!next)return;try{await changeStatus(o.id,next)}catch(err){console.error(err);toast("تعذر تحديث حالة الطلب")}
});
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});

onAuthStateChanged(auth,async user=>{currentUser=user;if(!user){showGate();return}try{const role=await roleOf(user.uid);if(role!=="driver"){await signOut(auth);showGate("الحساب ده مش Driver.");return}$("#authGate").hidden=true;$("#driverName").textContent="مندوب الدليفري";$("#welcomeTitle").textContent="أهلاً بيك 👋";$("#profileName").textContent="مندوب الدليفري";await loadOrders()}catch(e){console.error(e);await signOut(auth);showGate("تعذر التحقق من الصلاحيات.")}});
