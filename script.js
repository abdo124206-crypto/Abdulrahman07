const menu = window.DEFAULT_MENU || [];

const cats = [
  {id:"all", ar:"الكل"},
  {id:"grill", ar:"المشويات"},
  {id:"tajin", ar:"الطواجن"},
  {id:"main", ar:"الأطباق الرئيسية"},
  {id:"breakfast", ar:"الفطار"},
  {id:"soups", ar:"الشوربة"},
  {id:"appetizers", ar:"المقبلات"},
  {id:"hot", ar:"مقبلات حارة"},
  {id:"sandwiches", ar:"السندويتشات"},
  {id:"dessert", ar:"الحلو"},
  {id:"drinks", ar:"المشروبات"},
  {id:"special", ar:"اختيارات خاصة"}
];




let activeCat = "all";
let search = "";
let cart = JSON.parse(localStorage.getItem("alPrinceCart") || "[]");
let currentUser = null;
let lastOrderUnsub = null;

const $ = (s) => document.querySelector(s);
const menuGrid = $("#menuGrid");
const menuTabs = $("#menuTabs");
const categoryScroller = $("#categoryScroller");

function money(n){ return n ? `${n} ج` : "حسب الاختيار"; }
function imgPath(item){ return `assets/images/${item.img}`; }
function esc(v=""){return String(v).replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function renderCategories(){
  const html = cats.map(c => `<button class="category-pill ${activeCat===c.id?"active":""}" data-cat="${c.id}">${c.ar}</button>`).join("");
  categoryScroller.innerHTML = html;
  menuTabs.innerHTML = cats.map(c => `<button class="tab ${activeCat===c.id?"active":""}" data-cat="${c.id}">${c.ar}</button>`).join("");
}
function getFiltered(){
  const q = search.trim().toLowerCase();
  return menu.filter(item => {
    const catOk = activeCat === "all" || item.cat === activeCat;
    const qOk = !q || item.ar.toLowerCase().includes(q) || item.en.toLowerCase().includes(q);
    return catOk && qOk;
  });
}
function renderMenu(){
  const items = getFiltered();
  menuGrid.innerHTML = items.map(item => `<article class="menu-card">
    <div class="menu-card-image"><img src="${imgPath(item)}" alt="${esc(item.ar)}" loading="lazy" /></div>
    <div class="menu-card-body"><div class="menu-card-top"><div><h3>${esc(item.ar)}</h3><div class="en">${esc(item.en)}</div></div><div class="price">${money(item.price)}</div></div>
    <div class="menu-card-bottom"><span></span><button class="add-btn" type="button" data-add="${item.id}">+</button></div></div></article>`).join("");
  $("#emptyState").hidden = items.length !== 0;
}
function saveCart(){localStorage.setItem("alPrinceCart",JSON.stringify(cart));}
function addToCart(id){const item=menu.find(x=>x.id===id);if(!item)return;const ex=cart.find(x=>x.id===id);if(ex)ex.qty++;else cart.push({id,qty:1});saveCart();renderCart();toast(`اتضافت ${item.ar} للسلة`);}
function changeQty(id,delta){const item=cart.find(x=>x.id===id);if(!item)return;item.qty+=delta;if(item.qty<=0)cart=cart.filter(x=>x.id!==id);saveCart();renderCart();}
function cartTotal(){return cart.reduce((sum,row)=>{const item=menu.find(x=>x.id===row.id);return sum+((item?.price||0)*row.qty)},0)}
function renderCart(){
  const count=cart.reduce((s,r)=>s+r.qty,0);$("#cartCount").textContent=count;const has=cart.length>0;$("#cartEmpty").hidden=has;$(".cart-footer").hidden=!has;
  $("#cartItems").innerHTML=cart.map(row=>{const item=menu.find(x=>x.id===row.id);if(!item)return"";return `<div class="cart-item"><img src="${imgPath(item)}" alt="${esc(item.ar)}"><div><h4>${esc(item.ar)}</h4><small>${money(item.price)}</small><div class="qty"><button data-qty="${item.id}" data-delta="-1">−</button><b>${row.qty}</b><button data-qty="${item.id}" data-delta="1">+</button></div></div><div class="cart-price">${item.price?item.price*row.qty+" ج":"—"}</div></div>`}).join("");
  $("#cartTotal").textContent=`${cartTotal()} ج`;
}
function openCart(){$("#cartDrawer").classList.add("open");$("#cartOverlay").hidden=false;document.body.classList.add("locked")}
function closeCart(){$("#cartDrawer").classList.remove("open");$("#cartOverlay").hidden=true;document.body.classList.remove("locked")}
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove("show"),2200)}

async function ensureCustomerSession(){
  if(currentUser) return currentUser;
  if(!window.firebaseReady) return null;
  try{
    await (window.authReady || Promise.resolve(null));
    if(currentUser) return currentUser;
    await (window.authPersistenceReady || Promise.resolve());
    const cred = await signInAnonymously();
    currentUser = cred.user;
    return currentUser;
  }catch(err){
    console.error("Anonymous auth failed:", err);
    const code = err?.code || "";
    let message = "تعذر تشغيل جلسة الطلب.";
    if(code.includes("operation-not-allowed")) message = "Anonymous غير مفعّل في Firebase.";
    else if(code.includes("unauthorized-domain")) message = "الدومين ده غير مضاف في Firebase Authorized domains.";
    else if(location.protocol === "file:") message = "شغّل الموقع من رابط الويب وليس من ملف HTML على الجهاز.";
    toast(message);
    return null;
  }
}
function watchLiveMenu(){
  if(!window.firebaseReady) return;
  try{
    db.collection("menu").onSnapshot(snap=>{
      if(snap.empty) return;
      const live=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.active!==false).sort((a,b)=>(a.sort??9999)-(b.sort??9999));
      if(live.length){
        const previousIds=new Set(menu.map(x=>x.id));
        menu.length=0; live.forEach(x=>menu.push(x));
        cart=cart.filter(r=>menu.some(x=>x.id===r.id)); saveCart(); renderCategories(); renderMenu(); renderCart();
      }
    },err=>console.error("menu listener",err));
  }catch(err){console.error(err)}
}

function ensureAccountUI(){
  if($("accountBtn")) return;
  const nav=$( ".site-header .nav" );
  const b=document.createElement("button");
  b.id="accountBtn";
  b.className="btn btn-ghost account-btn";
  b.type="button";
  b.textContent="متابعة الطلب";
  nav.insertBefore(b,$("#openCart"));
  b.addEventListener("click",()=>{
    const id=localStorage.getItem("alPrinceLastOrder");
    if(id){
      ensureTrackingUI();
      $("#trackingSection").hidden=false;
      $("#trackingSection").scrollIntoView({behavior:"smooth",block:"start"});
      watchLastOrder();
    }else{
      toast("لسه مفيش طلب عندك");
    }
  });
}
function updateAccountUI(){
  const b=$("#accountBtn");
  if(!b)return;
  b.textContent=localStorage.getItem("alPrinceLastOrder")?"متابعة الطلب":"طلباتي";
}
function openAuth(){
  toast("مش محتاج تعمل حساب. اكتب بيانات التوصيل وقت الطلب وخلاص.");
}

function ensureTrackingUI(){
  if($("#trackingSection"))return;
  const section=document.createElement("section");
  section.id="trackingSection";
  section.className="tracking-section";
  section.hidden=true;
  section.innerHTML=`<div class="container"><div class="tracking-card">
    <div class="tracking-head"><div><span class="eyebrow">LIVE ORDER</span><h2>متابعة طلبك</h2><p id="trackingMeta">—</p></div><span id="trackingStatus" class="tracking-badge">جاري التحميل</span></div>
    <div class="tracking-steps" id="trackingSteps"></div>
    <div class="tracking-details" id="trackingDetails"></div>
    <div class="order-chat">
      <div class="chat-head"><div><span class="eyebrow">DIRECT CHAT</span><h3>تواصل مع المطعم</h3></div><span>💬</span></div>
      <div id="chatMessages" class="chat-messages"><div class="chat-empty">مفيش رسائل لسه. ابعتلنا لو محتاج أي حاجة.</div></div>
      <form id="chatForm" class="chat-form"><input id="chatInput" maxlength="300" placeholder="اكتب رسالتك للمطعم..." autocomplete="off"><button type="submit">إرسال</button></form>
    </div>
  </div></div>`;
  $("main").insertBefore(section,$(".quick-menu"));
  $("#chatForm").addEventListener("submit",sendCustomerMessage);
}
let chatUnsub=null;
function watchOrderChat(){
  if(chatUnsub){chatUnsub();chatUnsub=null;}
  const id=localStorage.getItem("alPrinceLastOrder");
  if(!id || !window.firebaseReady || !currentUser)return;
  const q=query(collection(db,"orders",id,"messages"),orderBy("createdAt","asc"));
  chatUnsub=onSnapshot(q,snap=>{
    const box=$("#chatMessages");
    if(!box)return;
    if(snap.empty){box.innerHTML=`<div class="chat-empty">مفيش رسائل لسه. ابعتلنا لو محتاج أي حاجة.</div>`;return;}
    box.innerHTML=snap.docs.map(d=>{const m=d.data();const mine=m.senderUid===currentUser.uid;const who=m.senderRole==="driver"?"الدليفري":m.senderRole==="admin"?"المطعم":"أنت";return `<div class="chat-bubble ${mine?"mine":"restaurant"}"><span>${esc(m.text||"")}</span><small>${mine?"أنت":who}</small></div>`}).join("");
    box.scrollTop=box.scrollHeight;
  },err=>console.error("chat listener",err));
}
async function sendCustomerMessage(e){
  e.preventDefault();
  const input=$("#chatInput");const text=input.value.trim();
  const id=localStorage.getItem("alPrinceLastOrder");
  if(!text||!id)return;
  if(!currentUser) await ensureCustomerSession();
  if(!currentUser||!window.firebaseReady){toast("لا يمكن إرسال الرسالة الآن");return;}
  try{
    await addDoc(collection(db,"orders",id,"messages"),{text,senderUid:currentUser.uid,senderRole:"customer",createdAt:serverTimestamp()});
    input.value="";
  }catch(err){console.error(err);toast("تعذر إرسال الرسالة");}
}
const statusMap={new:{ar:"تم استلام الطلب",cls:"s1"},preparing:{ar:"جاري التحضير",cls:"s2"},ready:{ar:"الطلب جاهز",cls:"s3"},on_the_way:{ar:"في الطريق إليك",cls:"s4"},delivered:{ar:"تم التسليم",cls:"s5"},cancelled:{ar:"ملغي",cls:"sx"}};
function renderTracking(order){
  ensureTrackingUI();const sec=$("#trackingSection");sec.hidden=false;const st=order.status||"new";const labels=["تم استلام الطلب","جاري التحضير","الطلب جاهز","في الطريق إليك","تم التسليم"];const idx={new:0,preparing:1,ready:2,on_the_way:3,delivered:4}[st]??0;$("#trackingStatus").textContent=statusMap[st]?.ar||st;$("#trackingMeta").textContent=`إجمالي ${order.total||0} ج • ${order.items?.length||0} أصناف`;$("#trackingSteps").innerHTML=labels.map((x,i)=>`<div class="track-step ${i<=idx?"done":""}"><span>${i<idx?"✓":i+1}</span><b>${x}</b></div>`).join("");$("#trackingDetails").innerHTML=`<div><span>العميل</span><b>${esc(order.customer?.name||"")}</b></div><div><span>العنوان</span><b>${esc(order.customer?.address||"")}</b></div><div><span>الدليفري</span><b>${esc(order.driver?.name||"لم يتم التعيين بعد")}</b></div>${st==="new"?`<button class="btn btn-ghost full" id="cancelMyOrder" type="button">إلغاء الطلب</button>`:""}`;
}
function watchLastOrder(){if(lastOrderUnsub){lastOrderUnsub();lastOrderUnsub=null}const id=localStorage.getItem("alPrinceLastOrder");if(!id)return;if(!window.firebaseReady){const raw=localStorage.getItem("alPrinceLastOrderData");if(raw)renderTracking(JSON.parse(raw));return}lastOrderUnsub=onSnapshot(doc(db,"orders",id),snap=>{if(snap.exists){renderTracking(snap.data());watchOrderChat();}});}
document.addEventListener("click",async e=>{
  if(e.target.id!=="cancelMyOrder")return;
  const id=localStorage.getItem("alPrinceLastOrder");
  if(!id || !window.firebaseReady || !currentUser)return;
  if(!confirm("متأكد إنك عايز تلغي الطلب؟"))return;
  try{
    await updateDoc(doc(db,"orders",id),{status:"cancelled"});
    toast("تم إلغاء الطلب");
  }catch(err){console.error(err);toast("تعذر إلغاء الطلب");}
});
async function requireLoginThenCheckout(){
  if(!cart.length){toast("السلة فاضية");return;}
  if(window.firebaseReady){
    const user=await ensureCustomerSession();
    if(!user)return;
  }
  openCheckout();
}
function openCheckout(){if(!cart.length){toast("السلة فاضية");return}closeCart();$("#checkoutModal").hidden=false;document.body.classList.add("locked")}
function closeCheckout(){$("#checkoutModal").hidden=true;document.body.classList.remove("locked")}

document.addEventListener("click",e=>{const catBtn=e.target.closest("[data-cat]");if(catBtn){activeCat=catBtn.dataset.cat;renderCategories();renderMenu();if(catBtn.classList.contains("tab"))$("#menu").scrollIntoView({behavior:"smooth",block:"start"})}const addBtn=e.target.closest("[data-add]");if(addBtn)addToCart(addBtn.dataset.add);const qtyBtn=e.target.closest("[data-qty]");if(qtyBtn)changeQty(qtyBtn.dataset.qty,Number(qtyBtn.dataset.delta));const filterLink=e.target.closest("[data-filter-link]");if(filterLink){activeCat=filterLink.dataset.filterLink;renderCategories();renderMenu();}});
$("#searchInput").addEventListener("input",e=>{search=e.target.value;renderMenu()});$("#openCart").addEventListener("click",openCart);$("#openCartBottom").addEventListener("click",openCart);$("#closeCart").addEventListener("click",closeCart);$("#cartOverlay").addEventListener("click",closeCart);$("#checkoutBtn").addEventListener("click",requireLoginThenCheckout);$("#closeCheckout").addEventListener("click",closeCheckout);

$("#checkoutForm").addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);if(window.firebaseReady && !currentUser){await ensureCustomerSession();}if(window.firebaseReady && !currentUser){toast("تعذر إنشاء جلسة الطلب");return}const order={customer:{uid:currentUser?.uid||"guest",name:data.get("name"),phone:data.get("phone"),address:data.get("address")},notes:data.get("notes")||"",items:cart.map(row=>{const item=menu.find(x=>x.id===row.id);return{id:row.id,name:item?.ar||"",qty:row.qty,unitPrice:item?.price||0}}),total:cartTotal(),status:"new",driver:{uid:"",name:""},createdAt:window.firebaseReady?serverTimestamp():new Date()};try{
  if(window.firebaseReady && currentUser){
    await setDoc(doc(db,"users",currentUser.uid),{role:"customer",name:order.customer.name,phone:order.customer.phone,updatedAt:serverTimestamp()},{merge:true});
    const ref=await addDoc(collection(db,"orders"),order);localStorage.setItem("alPrinceLastOrder",ref.id);
    const ids=JSON.parse(localStorage.getItem("alPrinceOrderIds")||"[]"); if(!ids.includes(ref.id)) ids.push(ref.id); localStorage.setItem("alPrinceOrderIds",JSON.stringify(ids));
    watchLastOrder();
  }else{
    const localId="LOCAL-"+Date.now(); order.id=localId; order.status="new"; localStorage.setItem("alPrinceLastOrderData",JSON.stringify(order)); localStorage.setItem("alPrinceLastOrder",localId); renderTracking(order);
  }
  cart=[];saveCart();renderCart();closeCheckout();form.reset();$("#trackingSection")?.scrollIntoView({behavior:"smooth"});toast(window.firebaseReady?"تم إرسال الطلب للمطعم ✓":"تم تسجيل الطلب في المعاينة ✓");
}catch(err){console.error(err);toast("تعذر إرسال الطلب. تأكد من Firebase.")}});

if(window.firebaseReady && window.auth){
  window.auth.onAuthStateChanged(user=>{
    currentUser=user||null;
    if(currentUser){ updateAccountUI(); watchLastOrder(); }
  });
}
ensureAccountUI();ensureTrackingUI();renderCategories();renderMenu();renderCart();
(async()=>{
  if(window.firebaseReady){
    await ensureCustomerSession();
  }
  updateAccountUI();
  watchLiveMenu();
  watchLastOrder();
  if(localStorage.getItem("alPrinceLastOrder")){ensureTrackingUI();$("#trackingSection").hidden=false;watchOrderChat();}
})();
