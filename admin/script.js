

const DELIVERY_UID = "VTC8spqKNOg05KT7aHEsniyB3Fm1";
const $ = s => document.querySelector(s);
let currentUser = null;
let orders = [];
let drivers = [];
let unsubOrders = null;
let unsubDrivers = null;
let menuItems = [];
let unsubMenu = null;

const statusLabel={new:"جديد",preparing:"تحضير",ready:"جاهز",on_the_way:"في الطريق",delivered:"تم التسليم",cancelled:"ملغي"};
const statusClass={new:"new",preparing:"prep",ready:"ready",on_the_way:"prep",delivered:"done",cancelled:"done"};


let adminChatUnsub=null;
function ensureOrderModal(){
  if($("#orderModal"))return;
  const el=document.createElement("div");
  el.id="orderModal";el.className="order-modal";el.hidden=true;
  el.innerHTML=`<div class="order-modal-card"><button class="order-modal-close" id="closeOrderModal">×</button><span class="eyebrow">ORDER CENTER</span><h2 id="orderModalTitle">تفاصيل الطلب</h2><div id="orderModalDetails"></div><div class="admin-chat"><div class="admin-chat-head"><b>محادثة العميل</b><span>💬</span></div><div id="adminChatMessages" class="admin-chat-messages"></div><form id="adminChatForm"><input id="adminChatInput" maxlength="300" placeholder="اكتب ردك للعميل..." autocomplete="off"><button type="submit">إرسال</button></form></div></div>`;
  document.body.appendChild(el);
  $("#closeOrderModal").onclick=closeOrderModal;
  el.addEventListener("click",e=>{if(e.target===el)closeOrderModal()});
  $("#adminChatForm").onsubmit=sendAdminMessage;
}
function closeOrderModal(){if(adminChatUnsub){adminChatUnsub();adminChatUnsub=null;}const m=$("#orderModal");if(m)m.hidden=true;}
async function openOrderModal(id){
  ensureOrderModal();
  const o=orders.find(x=>x.id===id);if(!o)return;
  $("#orderModal").hidden=false;
  $("#orderModalTitle").textContent=`طلب #${id.slice(0,7)}`;
  $("#orderModalDetails").innerHTML=`<div class="order-modal-summary"><div><span>العميل</span><b>${escapeHtml(o.customer?.name||"عميل")}</b></div><div><span>الهاتف</span><b>${escapeHtml(o.customer?.phone||"—")}</b></div><div><span>العنوان</span><b>${escapeHtml(o.customer?.address||"—")}</b></div><div><span>الإجمالي</span><b>${Number(o.total||0)} ج</b></div></div><div class="order-modal-items">${(o.items||[]).map(i=>`<div><span>${escapeHtml(i.name)} ×${i.qty}</span><b>${Number(i.unitPrice||0)*Number(i.qty||0)} ج</b></div>`).join("")}</div>`;
  if(adminChatUnsub)adminChatUnsub();
  const q=query(collection(db,"orders",id,"messages"),orderBy("createdAt","asc"));
  adminChatUnsub=onSnapshot(q,snap=>{const box=$("#adminChatMessages");if(!snap.size){box.innerHTML='<div class="admin-chat-empty">لا توجد رسائل من العميل.</div>';return;}box.innerHTML=snap.docs.map(d=>{const m=d.data();const mine=m.senderRole==="admin";const who=m.senderRole==="driver"?"الدليفري":m.senderRole==="customer"?"العميل":"المطعم";return `<div class="admin-chat-bubble ${mine?"mine":"customer"}"><span>${escapeHtml(m.text||"")}</span><small>${mine?"المطعم":who}</small></div>`}).join("");box.scrollTop=box.scrollHeight;},err=>console.error(err));
}
async function sendAdminMessage(e){
  e.preventDefault();const input=$("#adminChatInput");const text=input.value.trim();const title=$("#orderModalTitle")?.textContent||"";
  const id=(title.match(/#(.+)$/)||[])[1];if(!id||!text)return;
  try{await addDoc(collection(db,"orders",id,"messages"),{text,senderUid:currentUser.uid,senderRole:"admin",createdAt:serverTimestamp()});input.value="";}catch(err){console.error(err);toast("تعذر إرسال الرد");}
}

function showGate(message=""){
  const gate=$("#authGate");
  gate.hidden=false;
  gate.innerHTML=`<div class="auth-card"><div class="auth-logo">البرنس <small>FOOD</small></div><span class="auth-eyebrow">ADMIN ACCESS</span><h1>دخول لوحة الإدارة</h1><p class="auth-sub">استخدم حساب الإدارة المصرح به.</p><form id="adminLogin"><label>البريد الإلكتروني<input id="adminEmail" type="email" required></label><label>كلمة المرور<input id="adminPassword" type="password" required></label><button class="auth-submit">دخول</button><div id="adminMsg" class="auth-msg error">${message}</div></form></div>`;
  $("#adminLogin").onsubmit=async e=>{e.preventDefault();const msg=$("#adminMsg");try{await signInWithEmailAndPassword(auth,$("#adminEmail").value.trim(),$("#adminPassword").value);msg.className="auth-msg";msg.textContent="جاري الدخول..."}catch(err){msg.textContent="البريد أو كلمة المرور غير صحيحة."}};
}
async function roleOf(uid){
  try{
    const s=await getDoc(doc(db,"users",uid));
    const role=s.exists()?String(s.data()?.role||"").trim().toLowerCase():"";
    if(role) return role;
  }catch(err){ console.error("role lookup failed",err); }
  const email=String(currentUser?.email||"").trim().toLowerCase();
  if(email==="user1@abdo124206.com") return "admin";
  return "";
}
function renderOrders(){
  const tbody=$("#ordersTable");
  if(!orders.length){tbody.innerHTML=`<tr><td colspan="7"><div style="padding:35px;text-align:center;color:#938682">لا توجد طلبات حاليًا. أي طلب جديد من العميل سيظهر هنا لحظيًا.</div></td></tr>`;$("#recentOrders").innerHTML=`<div style="padding:30px;text-align:center;color:#938682">لا توجد طلبات جديدة.</div>`;return;}
  tbody.innerHTML=orders.map(o=>{
    const driverName=o.driver?.name||"غير مسند";
    const options=[`<option value="">غير مسند</option>`,...drivers.map(d=>`<option value="${d.uid}" ${o.driver?.uid===d.uid?"selected":""}>${d.name||"مندوب الدليفري"}</option>`)].join("");
    return `<tr><td><strong>#${o.id.slice(0,7)}</strong><small>${o.createdAtText}</small></td><td><strong>${escapeHtml(o.customer?.name||"عميل")}</strong><small>${escapeHtml(o.customer?.phone||"")}</small></td><td>${(o.items||[]).map(i=>`${escapeHtml(i.name)} ×${i.qty}`).join(" + ")}</td><td><strong>${Number(o.total||0)} ج</strong></td><td><select class="select" data-status="${o.id}">${Object.entries(statusLabel).map(([k,v])=>`<option value="${k}" ${o.status===k?"selected":""}>${v}</option>`).join("")}</select></td><td><select class="select" data-driver="${o.id}">${options}</select></td><td><button class="edit" data-open="${o.id}">فتح</button> <button class="edit danger" data-cancel-order="${o.id}" ${o.status==="cancelled"||o.status==="delivered"?"disabled":""}>إلغاء</button> <button class="edit danger" data-delete-order="${o.id}">حذف</button></td></tr>`;
  }).join("");
  $("#recentOrders").innerHTML=orders.slice(0,5).map(o=>`<div class="order-row"><b>#${o.id.slice(0,6)}</b><div><strong>${escapeHtml(o.customer?.name||"عميل")}</strong><small>${(o.items||[]).slice(0,2).map(i=>`${i.name} ×${i.qty}`).join(" + ")}</small></div><b>${Number(o.total||0)} ج</b><span class="badge ${statusClass[o.status]||"new"}">${statusLabel[o.status]||o.status}</span></div>`).join("");
  renderStats();
}
function renderStats(){
  const now=new Date();
  const todayKey=now.toDateString();
  const todays=orders.filter(o=>{
    const d=o.createdAt?.toDate?.() || (o.createdAt ? new Date(o.createdAt) : null);
    return d && d.toDateString()===todayKey;
  });
  const active=orders.filter(o=>["new","preparing","ready","on_the_way"].includes(o.status));
  const revenue=todays.reduce((sum,o)=>sum+Number(o.total||0),0);
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
  set("statToday",todays.length);set("statRevenue",revenue+" ج");set("statActive",active.length);set("statDrivers",drivers.length);

  const counts={};
  todays.forEach(o=>(o.items||[]).forEach(i=>{
    const key=i.name||"أصناف أخرى"; counts[key]=(counts[key]||0)+Number(i.qty||0);
  }));
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const box=document.getElementById("liveSummary");
  if(box){
    const max=top[0]?.[1]||1;
    box.innerHTML=top.length?top.map(([name,count])=>{const pct=Math.round(count/max*100);return `<div class="progress"><div><span>${escapeHtml(name)}</span><b>${count} قطعة</b></div><i><em style="width:${pct}%"></em></i></div>`}).join(""):`<div style="color:#938682;font-size:11px;padding:15px 0">لا توجد طلبات اليوم لعرض ملخص.</div>`;
  }
}

function renderDrivers(){
  const grid=$("#driverGrid");
  if(!drivers.length){grid.innerHTML=`<div class="panel" style="grid-column:1/-1">لم يتم إنشاء مستخدم دليفري في Firestore بعد.</div>`;return;}
  grid.innerHTML=drivers.map(d=>`<article class="driver"><div class="driver-top"><div class="driver-avatar">د</div><span class="online">● متاح</span></div><h3>${escapeHtml(d.name||"مندوب الدليفري")}</h3><small>${escapeHtml(d.email||d.uid)}</small><div class="driver-line"><span>UID</span><b>${d.uid.slice(0,8)}…</b></div></article>`).join("");
}
function renderMenuAdmin(){
  const grid = $("#menuAdmin");
  if(!grid) return;
  if(!menuItems.length){ grid.innerHTML=`<div class="panel" style="grid-column:1/-1;text-align:center;padding:40px">لا توجد أصناف في المنيو.</div>`; return; }
  const cats={grill:"المشويات",tajin:"الطواجن",main:"الأطباق الرئيسية",breakfast:"الفطار",soups:"الشوربة",appetizers:"المقبلات",hot:"مقبلات حارة",sandwiches:"السندويتشات",dessert:"الحلو",drinks:"المشروبات",special:"اختيارات خاصة"};
  grid.innerHTML=menuItems.map(i=>`<article class="dish"><img src="../customer/assets/images/${encodeURIComponent(i.img||'special.jpg')}" onerror="this.src='../customer/assets/images/special.jpg'" alt=""><div class="dish-body"><h3>${escapeHtml(i.ar||'بدون اسم')}</h3><small>${escapeHtml(i.en||'')} • ${escapeHtml(cats[i.cat]||i.cat||'')}</small><div class="dish-foot"><span class="price">${Number(i.price||0)?Number(i.price||0)+' ج':'حسب الاختيار'}</span><span><button class="edit" data-edit-dish="${i.id}">تعديل</button> <button class="edit" data-delete-dish="${i.id}">حذف</button></span></div></div></article>`).join('');
}
function openDishModal(item=null){
  let m=$("#dishModal");
  if(!m){m=document.createElement('div');m.id='dishModal';m.className='dish-modal';m.innerHTML=`<div class="dish-modal-card"><button class="dish-close" id="dishClose">×</button><span class="eyebrow">MENU EDITOR</span><h2 id="dishModalTitle">إضافة صنف</h2><form id="dishForm"><input type="hidden" id="dishId"><label>اسم الصنف بالعربي<input id="dishAr" required></label><label>الاسم بالإنجليزي<input id="dishEn"></label><div class="form-grid"><label>السعر<input id="dishPrice" type="number" min="0" step="1" required></label><label>الترتيب<input id="dishSort" type="number" min="0" step="1"></label></div><label>القسم<select id="dishCat"><option value="grill">المشويات</option><option value="tajin">الطواجن</option><option value="main">الأطباق الرئيسية</option><option value="breakfast">الفطار</option><option value="soups">الشوربة</option><option value="appetizers">المقبلات</option><option value="hot">مقبلات حارة</option><option value="sandwiches">السندويتشات</option><option value="dessert">الحلو</option><option value="drinks">المشروبات</option><option value="special">اختيارات خاصة</option></select></label><label>اسم صورة المنتج داخل customer/assets/images<input id="dishImg" placeholder="kofta.jpg"></label><label class="check"><input id="dishActive" type="checkbox" checked> الصنف ظاهر للعملاء</label><button class="primary" type="submit">حفظ الصنف</button><div id="dishMsg" class="auth-msg"></div></form></div>`;document.body.appendChild(m);$("#dishClose").onclick=()=>m.remove();$("#dishForm").onsubmit=saveDish;}
  $("#dishModalTitle").textContent=item?'تعديل الصنف':'إضافة صنف';$("#dishId").value=item?.id||'';$("#dishAr").value=item?.ar||'';$("#dishEn").value=item?.en||'';$("#dishPrice").value=item?.price??0;$("#dishSort").value=item?.sort??menuItems.length;$("#dishCat").value=item?.cat||'grill';$("#dishImg").value=item?.img||'special.jpg';$("#dishActive").checked=item?.active!==false;m.hidden=false;
}
async function saveDish(e){
 e.preventDefault();const id=$("#dishId").value.trim()||`dish-${Date.now()}`;const data={ar:$("#dishAr").value.trim(),en:$("#dishEn").value.trim(),price:Number($("#dishPrice").value||0),sort:Number($("#dishSort").value||0),cat:$("#dishCat").value,img:$("#dishImg").value.trim()||'special.jpg',active:$("#dishActive").checked,updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
 try{await db.collection('menu').doc(id).set(data,{merge:true});$("#dishModal")?.remove();toast('تم حفظ الصنف ✓')}catch(err){console.error(err);$("#dishMsg").textContent='تعذر الحفظ. تأكد من صلاحيات Admin.';$("#dishMsg").className='auth-msg error'}
}
async function deleteDish(id){if(!confirm('حذف الصنف نهائيًا؟'))return;try{await db.collection('menu').doc(id).delete();toast('تم حذف الصنف')}catch(err){console.error(err);toast('تعذر حذف الصنف')}}
async function seedMenu(){
 if(!window.DEFAULT_MENU?.length)return;
 try{const snap=await db.collection('menu').limit(1).get();if(!snap.empty)return;const batch=db.batch();window.DEFAULT_MENU.forEach((i,n)=>batch.set(db.collection('menu').doc(i.id),{...i,sort:n,active:true,createdAt:firebase.firestore.FieldValue.serverTimestamp()}));await batch.commit();toast('تم تجهيز المنيو الأساسية ✓')}catch(err){console.error('seed menu',err)}
}
function subscribeMenu(){if(unsubMenu)unsubMenu();unsubMenu=db.collection('menu').onSnapshot(snap=>{menuItems=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.sort??9999)-(b.sort??9999));renderMenuAdmin()});seedMenu()}

function subscribe(){
  if(unsubOrders)unsubOrders(); if(unsubDrivers)unsubDrivers();
  const oq=query(collection(db,"orders"),orderBy("createdAt","desc"));
  unsubOrders=onSnapshot(oq,snap=>{orders=snap.docs.map(d=>({id:d.id,...d.data(),createdAtText:d.data().createdAt?.toDate?d.data().createdAt.toDate().toLocaleString("ar-EG",{hour:"2-digit",minute:"2-digit"}):"الآن"}));renderOrders()},err=>console.error(err));
  const uq=collection(db,"users");
  unsubDrivers=onSnapshot(uq,snap=>{
    drivers=snap.docs.map(d=>({uid:d.id,...d.data()})).filter(d=>{
      const role=String(d.role||"").trim().toLowerCase();
      const email=String(d.email||"").trim().toLowerCase();
      return role==="driver" || /^driver[1-5]@abdo124206\.com$/.test(email);
    });
    renderDrivers();renderOrders();
  },err=>console.error(err));
}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
async function cancelOrder(id){
  const o=orders.find(x=>x.id===id);
  if(!o || o.status==="cancelled" || o.status==="delivered") return;
  if(!confirm(`تأكيد إلغاء الطلب #${id.slice(0,7)}؟`)) return;
  try{
    await updateDoc(doc(db,"orders",id),{status:"cancelled",cancelledAt:serverTimestamp(),updatedAt:serverTimestamp()});
    toast("تم إلغاء الطلب ✓");
  }catch(err){console.error(err);toast("تعذر إلغاء الطلب")}
}
async function deleteOrder(id){
  if(!confirm(`حذف الطلب #${id.slice(0,7)} نهائيًا؟\nهذا الإجراء لا يمكن التراجع عنه.`)) return;
  try{
    await deleteDoc(doc(db,"orders",id));
    if(adminChatUnsub){adminChatUnsub();adminChatUnsub=null;}
    const m=$("#orderModal"); if(m) m.hidden=true;
    toast("تم حذف الطلب ✓");
  }catch(err){console.error(err);toast("تعذر حذف الطلب")}
}

function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id));const titles={overview:"نظرة عامة",orders:"الطلبات",menu:"إدارة المنيو",drivers:"الدليفري"};$("#pageTitle").textContent=titles[id]||"الإدارة";$(".sidebar").classList.remove("open")}

document.addEventListener("click",e=>{const n=e.target.closest(".nav");if(n)showPage(n.dataset.page);const g=e.target.closest("[data-go]");if(g)showPage(g.dataset.go);if(e.target.id==="toggleSide")$(".sidebar").classList.toggle("open");if(e.target.id==="logout")signOut(auth);if(e.target.id==="addDish")openDishModal();
  const editDish=e.target.closest("[data-edit-dish]"); if(editDish)openDishModal(menuItems.find(x=>x.id===editDish.dataset.editDish));
  const delDish=e.target.closest("[data-delete-dish]"); if(delDish)deleteDish(delDish.dataset.deleteDish);
  const cancel=e.target.closest("[data-cancel-order]"); if(cancel)cancelOrder(cancel.dataset.cancelOrder);
  const delOrder=e.target.closest("[data-delete-order]"); if(delOrder)deleteOrder(delOrder.dataset.deleteOrder);
  const close=e.target.closest("#closeOrderModal"); if(close){e.preventDefault();closeOrderModal();return;}
  const open=e.target.closest("[data-open]");if(open)openOrderModal(open.dataset.open);
});
document.addEventListener("change",async e=>{const st=e.target.closest("[data-status]");const dr=e.target.closest("[data-driver]");try{if(st)await updateDoc(doc(db,"orders",st.dataset.status),{status:st.value});if(dr){const d=drivers.find(x=>x.uid===dr.value);await updateDoc(doc(db,"orders",dr.dataset.driver),{driver:d?{uid:d.uid,name:d.name||"مندوب الدليفري"}:{uid:"",name:""},assignedDriverUid:d?d.uid:"",assignedDriverName:d?(d.name||"مندوب الدليفري"):"",assignedAt:d?serverTimestamp():null,updatedAt:serverTimestamp()});
      if(d){await setDoc(doc(db,"users",d.uid,"assignments",dr.dataset.driver),{orderId:dr.dataset.driver,driverUid:d.uid,driverName:d.name||"مندوب الدليفري",active:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp()},{merge:true})}}}catch(err){console.error(err);toast("تعذر تحديث الطلب. تأكد من الصلاحيات.")}});
function toast(t){const x=document.createElement("div");x.textContent=t;x.style.cssText="position:fixed;bottom:20px;left:20px;background:#4f0b1c;color:#fff;padding:12px 16px;border-radius:10px;z-index:9999;font-size:11px";document.body.appendChild(x);setTimeout(()=>x.remove(),2500)}

const logout=document.createElement("button");logout.id="logout";logout.className="edit";logout.textContent="خروج";$(".user").appendChild(logout);

onAuthStateChanged(auth,async user=>{
  currentUser=user;
  if(!user){showGate();return;}
  try{
    await (window.authPersistenceReady||Promise.resolve());
    const role=await roleOf(user.uid);
    if(role!=="admin"){
      showGate("الحساب ده مش Admin.");
      return;
    }
    $("#authGate").hidden=true;
    subscribe();subscribeMenu();
  }catch(e){
    console.error("Admin auth/role error:",e);
    showGate("تعذر قراءة صلاحية الحساب. تأكد أن حسابك مسجل كـ Admin في users.");
  }
});
