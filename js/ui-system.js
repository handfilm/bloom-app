/* ══════════════════════════════════════════════
   BRAND HUB (external link tabs, mobile)
══════════════════════════════════════════════ */
function toggleBrandHub(){document.getElementById('brandHubSheet').classList.toggle('on');}

/* ══════════════════════════════════════════════
   MODAL UTILS
══════════════════════════════════════════════ */
function closeModal(id){document.getElementById(id).classList.remove('on');}
function modalBg(ev,id){if(ev.target.id===id)closeModal(id);}
function toast(msg,type=''){const el=document.createElement('div');el.className=`toast ${type}`;el.textContent=msg;document.getElementById('toastWrap').appendChild(el);setTimeout(()=>el.remove(),3000);}


/* ══════════════════════════════════════════════
   KEYBOARD
══════════════════════════════════════════════ */
document.addEventListener('keydown',ev=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(ev.target.tagName))return;
  if(ev.key==='n'||ev.key==='N')openAdd();
  if(ev.key==='Escape'){['detailModal','addModal','bulkModal'].forEach(id=>closeModal(id));closeZoom();closePost();closeCat();}
  if(ev.key==='/'){ev.preventDefault();if(curPage!=='library')go('library');setTimeout(()=>document.getElementById('searchInput').focus(),100);}
  if(ev.key==='ArrowRight'&&document.getElementById('detailModal').classList.contains('on'))stepDetail(1);
  if(ev.key==='ArrowLeft'&&document.getElementById('detailModal').classList.contains('on'))stepDetail(-1);
  if(ev.key==='h'||ev.key==='H')go('home');
  if(ev.key==='s'||ev.key==='S')go('stream');
  if(ev.key==='r'||ev.key==='R')go('refs');
});


/* ══════════════════════════════════════════════
   PIN LOCK
══════════════════════════════════════════════ */
let pinEntry = '';
const PIN_KEY = 'hf_bloom_pin';

function initPin() {
  const pin = localStorage.getItem(PIN_KEY);
  if(!pin) { document.getElementById('pinScreen').classList.add('hidden'); return; }
  document.getElementById('pinScreen').classList.remove('hidden');
}

function pinPress(d) {
  if(pinEntry.length >= 4) return;
  pinEntry += d;
  updatePinDots();
  if(pinEntry.length === 4) setTimeout(checkPin, 150);
}

function pinDel() {
  pinEntry = pinEntry.slice(0,-1);
  updatePinDots();
}

function updatePinDots() {
  for(let i=0;i<4;i++) {
    const dot = document.getElementById('pd'+i);
    dot.classList.toggle('filled', i < pinEntry.length);
    dot.classList.remove('error');
  }
}

function checkPin() {
  const saved = localStorage.getItem(PIN_KEY);
  if(pinEntry === saved) {
    document.getElementById('pinScreen').classList.add('hidden');
    pinEntry = '';
  } else {
    for(let i=0;i<4;i++) document.getElementById('pd'+i).classList.add('error');
    setTimeout(() => { pinEntry=''; updatePinDots(); }, 700);
  }
}

function pinSkip() {
  document.getElementById('pinScreen').classList.add('hidden');
  pinEntry = '';
}

function setPin() {
  const p = prompt('Set 4-digit PIN (leave blank to remove):','');
  if(p === null) return;
  if(p === '') { localStorage.removeItem(PIN_KEY); toast('PIN REMOVED','success'); return; }
  if(!/^\d{4}$/.test(p)) { toast('PIN must be 4 digits','error'); return; }
  localStorage.setItem(PIN_KEY, p);
  toast('PIN SET ✓','success');
}


/* ══════════════════════════════════════════════
   SLIDESHOW
══════════════════════════════════════════════ */
let ssItems = [], ssIdx = 0, ssTimer = null, ssInterval = 4000, ssPaused = false, ssProgTimer = null, ssProgVal = 0;

function startSlideshow(filterPage) {
  // collect all media across all entries
  ssItems = [];
  entries.forEach((e,ei) => {
    (e.media||[]).forEach((m,mi) => {
      ssItems.push({entry:e, ei, m, mi});
    });
  });
  if(!ssItems.length) { toast('NO MEDIA TO SHOW','error'); return; }
  ssIdx = 0; ssPaused = false;
  document.getElementById('slideshowOv').classList.add('on');
  ssShowCurrent();
  ssStartTimer();
}

function ssShowCurrent() {
  const item = ssItems[ssIdx];
  if(!item) return;
  const {entry, m} = item;
  const el = document.getElementById('ssMedia');
  el.classList.remove('fade');
  void el.offsetWidth;
  el.classList.add('fade');
  let inner = '';
  const thumb = getThumb(m);
  if(m.type==='image'||m.type==='blob') inner=`<img src="${esc(m.src)}" style="max-width:100%;max-height:100%;object-fit:contain">`;
  else if(m.type==='video') inner=`<video src="${esc(m.src)}" autoplay muted playsinline style="max-width:100%;max-height:100%;object-fit:contain"></video>`;
  else if(m.type==='youtube'){const id=getYTId(m.src);inner=id?`<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0" style="width:100%;height:100%;border:none"></iframe>`:'<div style="color:var(--tx3);font-size:12px">YT</div>';}
  else if(m.type==='gdrive'){const du=driveDirectUrl(m.src,false);inner=`<img src="${esc(du)}" style="max-width:100%;max-height:100%;object-fit:contain">`;}
  else inner=`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--tx3);gap:12px"><div style="font-size:48px">${tEmoji(m.type)}</div><div style="font-size:10px;letter-spacing:2px">${esc(m.label||'')}</div></div>`;
  el.innerHTML = inner;
  document.getElementById('ssTitle').textContent = entry.title;
  document.getElementById('ssCnt').textContent = `${ssIdx+1} / ${ssItems.length}`;
  ssProgVal = 0;
  document.getElementById('ssProg').style.width = '0%';
}

function ssStartTimer() {
  clearInterval(ssTimer); clearInterval(ssProgTimer);
  ssProgVal = 0;
  ssProgTimer = setInterval(() => {
    ssProgVal += (100 / (ssInterval/100));
    document.getElementById('ssProg').style.width = Math.min(ssProgVal,100)+'%';
  }, 100);
  ssTimer = setInterval(() => {
    if(!ssPaused) { ssIdx=(ssIdx+1)%ssItems.length; ssShowCurrent(); }
  }, ssInterval);
}

function ssPause() {
  ssPaused = !ssPaused;
  document.getElementById('ssPauseBtn').textContent = ssPaused ? '▶ PLAY' : '⏸';
}

function closeSlideshow() {
  clearInterval(ssTimer); clearInterval(ssProgTimer);
  document.getElementById('slideshowOv').classList.remove('on');
  document.getElementById('ssMedia').innerHTML = '';
}

/* swipe support for slideshow */
let _ssSwipeX = 0;
document.getElementById && document.addEventListener('DOMContentLoaded', () => {
  const ss = document.getElementById('slideshowOv');
  if(ss) {
    ss.addEventListener('touchstart', e=>{ _ssSwipeX = e.touches[0].clientX; }, {passive:true});
    ss.addEventListener('touchend', e=>{
      const dx = e.changedTouches[0].clientX - _ssSwipeX;
      if(Math.abs(dx) > 50) { ssIdx=(ssIdx+(dx<0?1:-1)+ssItems.length)%ssItems.length; ssShowCurrent(); ssStartTimer(); }
    });
  }
});


/* ══════════════════════════════════════════════
   STORAGE BAR
══════════════════════════════════════════════ */
function updateStorageBar() {
  try {
    let total = 0;
    for(let k in localStorage) {
      if(localStorage.hasOwnProperty(k)) total += localStorage[k].length * 2;
    }
    const pct = Math.min((total / (5*1024*1024))*100, 100);
    const kb = (total/1024).toFixed(0);
    const fill = document.getElementById('storageBarFill');
    const lbl  = document.getElementById('storageBarLbl');
    if(fill) { fill.style.width=pct+'%'; fill.className='storage-bar-fill'+(pct>75?' warn':''); }
    if(lbl)  lbl.textContent = `Storage: ${kb}KB / 5MB (${pct.toFixed(0)}%)`;
  } catch(e) {}
}


/* ══════════════════════════════════════════════
   SWIPE NAVIGATION (Library cards)
══════════════════════════════════════════════ */
(function initSwipe() {
  let tx=0, ty=0;
  document.addEventListener('touchstart', e=>{ tx=e.touches[0].clientX; ty=e.touches[0].clientY; }, {passive:true});
  document.addEventListener('touchend', e=>{
    if(document.getElementById('slideshowOv').classList.contains('on')) return;
    if(document.getElementById('detailModal').classList.contains('on')) {
      const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
      if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>60) { dx<0?stepDetail(1):stepDetail(-1); }
      return;
    }
  });
})();

