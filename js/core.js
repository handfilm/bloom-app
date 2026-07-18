/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */
let entries   = JSON.parse(localStorage.getItem('hf_bloom_v3') || '[]');
const DREFS   = Array.from({length:11},(_,i)=>({url:`assets/refs/ref${i+1}.jpg`,label:`REF ${String(i+1).padStart(2,'0')}`}));
let refs      = JSON.parse(localStorage.getItem('hf_bloom_refs') || 'null') ?? DREFS;
let catalogue = JSON.parse(localStorage.getItem('hf_bloom_cat')  || 'null') ?? [{name:'RAWx',items:[]},{name:'HANDFILM',items:[]},{name:'Favourites',items:[]}];
let curView   = 'grid';
let curMTab   = 'file';
let pendMedia = [];
let detIdx    = null;
let detMed    = 0;
let stIdx     = null;
let stMed     = 0;
let zoomLvl   = 1;
let heroIdx   = 0;
let heroTimer = null;
let curPage   = 'home';
let curPost   = null;
let curCat    = null;
let _saveT    = null;

/* CLAUDE_KEY / CLAUDE_URL now come from js/config.js (loaded before this file) */

/* ══════════════════════════════════════════════
   PERSIST
══════════════════════════════════════════════ */
function save() {
  try {
    const data = JSON.stringify(entries);
    // warn if approaching localStorage 5MB limit
    const kb = (data.length / 1024).toFixed(0);
    if(data.length > 4 * 1024 * 1024) {
      toast(`Storage ${kb}KB — near limit. Export CSV to free space.`, 'error');
    }
    localStorage.setItem('hf_bloom_v3', data);
    localStorage.setItem('hf_bloom_refs', JSON.stringify(refs));
    localStorage.setItem('hf_bloom_cat', JSON.stringify(catalogue));
    localStorage.setItem('hf_bloom_saved', Date.now());
    const el=document.getElementById('savedInd'),t=document.getElementById('savedTime');
    t.textContent=new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    el.classList.add('on'); clearTimeout(_saveT); _saveT=setTimeout(()=>el.classList.remove('on'),2400);
  } catch(e) {
    if(e.name==='QuotaExceededError'){
      toast('STORAGE FULL — images too large. Use GDrive links instead.','error');
    } else {
      toast('SAVE ERROR: '+e.message,'error');
    }
  }
}


/* ══════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════ */
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const detectType=src=>{
  if(!src)return'link';const s=src.toLowerCase();
  if(/youtube\.com|youtu\.be/.test(s))return'youtube';
  if(/vimeo\.com/.test(s))return'vimeo';
  if(/drive\.google\.com|docs\.google\.com\/file/.test(s))return'gdrive';
  if(/\.(mp4|webm|mov|avi|mkv)(\?|$)/.test(s))return'video';
  if(/\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/.test(s))return'image';
  if(/^[\w\-. ]+\.(jpg|jpeg|png|gif|webp)$/i.test(src))return'image';
  if(/^[\w\-. ]+\.(mp4|webm|mov)$/i.test(src))return'video';
  // blob URLs from file picker
  if(/^blob:/.test(src))return'blob';
  return'link';
};

/* extract Google Drive file ID from any Drive URL */
const getDriveId=url=>{
  const m=url.match(/\/d\/([a-zA-Z0-9_-]{10,})|id=([a-zA-Z0-9_-]{10,})/);
  return m?(m[1]||m[2]):null;
};

/* convert any Drive share URL to direct embed/download URL */
const driveDirectUrl=(url,forEmbed)=>{
  const id=getDriveId(url);
  if(!id)return url;
  return forEmbed
    ? `https://drive.google.com/file/d/${id}/preview`
    : `https://drive.google.com/uc?export=view&id=${id}`;
};

/* detect if Drive file is video by checking URL pattern or label */
const isDriveVideo=src=>{
  return /\.(mp4|webm|mov|avi|mkv)/i.test(src);
};
const getYTId=url=>{const m=url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/);return m?m[1]:null};
const getVId=url=>{const m=url.match(/vimeo\.com\/(\d+)/);return m?m[1]:null};
const getThumb=m=>{
  if(!m)return null;
  if(m.type==='youtube'){const id=getYTId(m.src);return id?`https://img.youtube.com/vi/${id}/mqdefault.jpg`:null;}
  if(m.type==='image')return m.src;
  if(m.type==='blob')return m.src; // blob URL works as img src
  if(m.type==='gdrive'){
    // use direct view URL as thumbnail for images, null for video
    if(!isDriveVideo(m.label||m.src)){return driveDirectUrl(m.src,false);}
    return null;
  }
  return null;
};
const tEmoji=t=>({video:'▶',image:'⊡',youtube:'▶',vimeo:'▶',link:'⊞',gdrive:'⊡',blob:'⊡'}[t]||'⊡');
const tLbl=t=>({video:'VIDEO',image:'IMAGE',youtube:'YT',vimeo:'VIMEO',link:'LINK',gdrive:'GDRIVE',blob:'LOCAL'}[t]||'FILE');
const tBadge=t=>({video:'badge-video',image:'badge-image',youtube:'badge-yt',vimeo:'badge-yt',link:'badge-link',gdrive:'badge-image',blob:'badge-image'}[t]||'badge-link');


/* ══════════════════════════════════════════════
   PAGE ROUTING
══════════════════════════════════════════════ */
function go(p) {
  curPage=p;
  document.querySelectorAll('.page').forEach(el=>el.classList.toggle('on',el.id===p+'Page'));
  document.querySelectorAll('.nl').forEach(el=>el.classList.toggle('on',el.textContent.toLowerCase().trim()===p));
  document.querySelectorAll('.mn-item').forEach((el,i)=>{const map=['home','stream','','library','refs'];el.classList.toggle('on',map[i]===p)});
  if(p==='home'){renderHero();renderTicker();renderFilm();renderRecent();renderVideoFeed();updateStats();}
  if(p==='stream'){renderQueue();if(stIdx===null&&entries.length)initStream(0);}
  if(p==='library')applyFilters();
  if(p==='refs')renderRefs();
}

