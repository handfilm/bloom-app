/* ══════════════════════════════════════════════
   LIBRARY FILTERS
══════════════════════════════════════════════ */
function applyFilters(){
  const q=document.getElementById('searchInput').value.toLowerCase().trim();
  const solo=document.getElementById('filterSolo').value,power=document.getElementById('filterPower').value,media=document.getElementById('filterMedia').value,sort=document.getElementById('sortBy').value;
  let res=entries.map((e,i)=>({...e,_i:i})).filter(e=>{
    const txt=(e.title+' '+(e.tags||'')+' '+(e.notes||'')).toLowerCase();
    if(q&&!txt.includes(q))return false;
    if(solo&&String(e.isSolo)!==solo)return false;
    if(power&&e.womanPower!==power)return false;
    if(media){const ms=e.media||[];
      if(media==='none'&&ms.length)return false;
      if(media==='video'&&!ms.some(m=>m.type==='video'))return false;
      if(media==='image'&&!ms.some(m=>m.type==='image'))return false;
      if(media==='youtube'&&!ms.some(m=>m.type==='youtube'))return false;
    }return true;
  });
  const sorts={newest:(a,b)=>b._i-a._i,oldest:(a,b)=>a._i-b._i,'bloom-desc':(a,b)=>b.bloomLevel-a.bloomLevel,'bloom-asc':(a,b)=>a.bloomLevel-b.bloomLevel,'media-desc':(a,b)=>(b.media||[]).length-(a.media||[]).length,alpha:(a,b)=>a.title.localeCompare(b.title)};
  res.sort(sorts[sort]||sorts.newest);
  const grid=document.getElementById('entriesGrid');
  document.getElementById('cntLbl').innerHTML=`<span class="live">${res.length}</span> / ${entries.length} ENTRIES`;
  document.getElementById('cntMeta').textContent=res.length<entries.length?'· FILTERED':'';
  if(!res.length){grid.innerHTML=`<div class="empty"><span class="empty-sym">∅</span><div class="empty-lbl">No entries match</div></div>`;return;}
  grid.innerHTML='';res.forEach(e=>grid.appendChild(buildCard(e,e._i,curView)));
  renderHistogram();
}


/* ══════════════════════════════════════════════
   CARD BUILDER
══════════════════════════════════════════════ */
function buildCard(entry,idx,vOverride) {
  const v=vOverride||curView,media=entry.media||[],first=media[0]||null,pct=(entry.bloomLevel/10)*100;
  const tags=(entry.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
  const card=document.createElement('div');card.className='card';
  let thumbHTML='';
  if(first){
    const thumb=getThumb(first),isPlay=['video','youtube','vimeo'].includes(first.type);
    const ovr=media.length>1?`<span class="media-count-badge">⊞ ${media.length}</span>`:'';
    const cmb=`<div class="cmb">
      <button class="cmb-btn" onclick="event.stopPropagation();streamEntry(${idx})"><div class="cmb-icon">▶</div>STREAM</button>
      ${first.type==='image'?`<button class="cmb-btn" onclick="event.stopPropagation();openZoom('${esc(first.src)}','${esc(first.label||'')}')"><div class="cmb-icon">⊕</div>ZOOM</button>`:''}
      <button class="cmb-btn" onclick="event.stopPropagation();openCatIdx(${idx},0)"><div class="cmb-icon">⊞</div>CAT</button>
      <button class="cmb-btn" onclick="event.stopPropagation();openPostIdx(${idx},0)"><div class="cmb-icon">↑</div>POST</button>
    </div>`;
    if(thumb){
      thumbHTML=`<div class="card-thumb"><img src="${esc(thumb)}" loading="lazy" onerror="this.style.display='none';this.nextSibling.style.display='flex'"><div class="ph" style="display:none"><div class="ph-icon">${tEmoji(first.type)}</div></div><div class="thumb-grad"></div>${isPlay?'<div class="play-icon">▶</div>':''}${ovr}<span class="type-badge ${tBadge(first.type)}">${tLbl(first.type)}</span>${cmb}</div>`;
    } else if(first.type==='video'){
      thumbHTML=`<div class="card-thumb"><video src="${esc(first.src)}" preload="metadata" muted playsinline style="pointer-events:none" onloadedmetadata="this.currentTime=1.5"></video><div class="thumb-grad"></div><div class="play-icon">▶</div>${ovr}<span class="type-badge ${tBadge(first.type)}">${tLbl(first.type)}</span>${cmb}</div>`;
    } else {
      thumbHTML=`<div class="card-thumb"><div class="ph"><div class="ph-icon">${tEmoji(first.type)}</div><div>${tLbl(first.type)}</div></div>${ovr}${cmb}</div>`;
    }
  }
  const noThumb=`<div class="card-thumb"><div class="ph"><div class="ph-icon">⊡</div></div></div>`;
  if(v==='list'){
    card.innerHTML=`${thumbHTML||noThumb}<div class="card-accent"></div><div class="card-body"><div class="card-idx"><span class="idx-dot"></span>${String(idx+1).padStart(3,'0')}</div><div class="card-title">${esc(entry.title)}</div><div class="pills">${entry.isSolo?'<span class="pill p-solo">SOLO</span>':''}<span class="pill ${entry.womanPower==='High'?'p-high':entry.womanPower==='Medium'?'p-med':'p-none'}">${entry.womanPower.toUpperCase()}</span>${media.length?`<span class="pill p-gold">⊞ ${media.length}</span>`:''}</div></div><div class="list-col"><div class="list-bloom">${entry.bloomLevel}</div><button class="btn btn-xs btn-ghost" onclick="event.stopPropagation();streamEntry(${idx})">▶</button><button class="btn-del" onclick="event.stopPropagation();deleteEntry(${idx})">✕</button></div>`;
  } else {
    card.innerHTML=`<div class="card-accent"></div>${thumbHTML||noThumb}<div class="card-body"><div class="card-idx"><span class="idx-dot"></span>${String(idx+1).padStart(3,'0')} ${media.length?`· ${media.length} MEDIA`:''}</div><div class="card-title">${esc(entry.title)}</div><div class="bloom-bar"><div class="bloom-track"><div class="bloom-fill" style="width:${pct}%"></div></div><div class="bloom-val">${entry.bloomLevel}</div></div><div class="pills">${entry.isSolo?'<span class="pill p-solo">SOLO</span>':''}<span class="pill ${entry.womanPower==='High'?'p-high':entry.womanPower==='Medium'?'p-med':'p-none'}">${entry.womanPower.toUpperCase()}</span>${tags.slice(0,2).map(t=>`<span class="pill p-gold">${esc(t)}</span>`).join('')}${tags.length>2?`<span class="pill p-none">+${tags.length-2}</span>`:''}</div></div>`;
  }
  card.addEventListener('click',ev=>{if(!ev.target.closest('.btn-del')&&!ev.target.closest('.cmb-btn'))showDetail(idx);});
  return card;
}

function setView(v){
  curView=v;
  const g=document.getElementById('entriesGrid');
  g.className='grid '+(v==='grid'?'gv':v==='list'?'lv':'cv');
  ['G','L','C'].forEach((id,i)=>document.getElementById('vb'+id).classList.toggle('on',['grid','list','cinema'][i]===v));
  applyFilters();
}

function renderHistogram(){
  const wrap=document.getElementById('histogram');
  const b=Array(10).fill(0);entries.forEach(e=>{if(e.bloomLevel>=1&&e.bloomLevel<=10)b[e.bloomLevel-1]++;});
  const max=Math.max(...b,1);
  wrap.innerHTML=b.map((v,i)=>`<div class="hb ${v>0?'on':''}" style="height:${Math.max(2,Math.round((v/max)*24))}px" title="Bloom ${i+1}: ${v}"></div>`).join('');
}

