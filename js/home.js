/* ══════════════════════════════════════════════
   STATS
══════════════════════════════════════════════ */
function updateStats() {
  const tot=entries.length,med=entries.reduce((s,e)=>s+(e.media||[]).length,0);
  const avg=tot?(entries.reduce((s,e)=>s+e.bloomLevel,0)/tot).toFixed(1):'—';
  document.getElementById('nEnt').textContent=tot;
  document.getElementById('nMed').textContent=med;
  document.getElementById('srEnt').textContent=tot;
  document.getElementById('srMed').textContent=med;
  document.getElementById('srAvg').textContent=avg;
  document.getElementById('srRefs').textContent=refs.length;
  updateStorageBar();
}


/* ══════════════════════════════════════════════
   TICKER
══════════════════════════════════════════════ */
function renderTicker() {
  const tags=['HANDFILM','RAWx','BLOOM OS','VISUAL REFS','CINEMATIC','PRIVATE','LOCAL FIRST','NO BACKEND','BLOOM OS ULTRA'];
  const inner=document.getElementById('tickerInner');
  const items=[...tags,...tags].map(t=>`<span class="ti">${t}</span>`).join('');
  inner.innerHTML=items+items;
}


/* ══════════════════════════════════════════════
   FILMSTRIP
══════════════════════════════════════════════ */
function renderFilm() {
  const film=document.getElementById('film');
  const pool=entries.filter(e=>(e.media||[]).length).slice(0,12);
  if(!pool.length){film.innerHTML='<div style="display:flex;align-items:center;justify-content:center;width:100%;color:var(--tx4);font-size:9px;letter-spacing:3px">ADD ENTRIES WITH MEDIA</div>';return;}
  film.innerHTML=pool.map((e,i)=>{
    const m=e.media[0],thumb=getThumb(m);
    const bg=thumb?`background-image:url('${esc(thumb)}')`:'background:var(--bg3)';
    return `<div class="film-frame ${i===0?'on':''}" style="${bg}" onclick="filmClick(${i},${entries.indexOf(e)})">
      <div class="film-label">${esc(e.title)}</div>
    </div>`;
  }).join('');
  // drag-to-scroll inertia
  let isDragging=false,startX=0,scrollLeft=0;
  film.addEventListener('mousedown',e=>{isDragging=true;startX=e.pageX-film.offsetLeft;scrollLeft=film.scrollLeft});
  film.addEventListener('mousemove',e=>{if(!isDragging)return;e.preventDefault();const x=e.pageX-film.offsetLeft;film.scrollLeft=scrollLeft-(x-startX)});
  film.addEventListener('mouseup',()=>isDragging=false);
  film.addEventListener('mouseleave',()=>isDragging=false);
}
function filmClick(i,entryIdx) {
  document.querySelectorAll('.film-frame').forEach((f,fi)=>f.classList.toggle('on',fi===i));
  showDetail(entryIdx);
}


/* ══════════════════════════════════════════════
   HERO SLIDER
══════════════════════════════════════════════ */
function renderHero() {
  const track=document.getElementById('heroTrack'),dots=document.getElementById('heroDots');
  const pool=entries.filter(e=>(e.media||[]).length).slice(0,8);
  if(!pool.length){
    track.innerHTML=`<div class="hero-slide" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">
      <div style="font-family:var(--disp);font-size:clamp(60px,12vw,120px);line-height:.85;letter-spacing:.04em;color:var(--tx4)">BLOOM<br>OS</div>
      <div style="font-size:9px;letter-spacing:4px;color:var(--tx4)">ADD ENTRIES WITH MEDIA</div>
      <button class="btn btn-gold" onclick="openAdd()">＋ ADD FIRST ENTRY</button>
    </div>`;
    dots.innerHTML='';return;
  }
  track.innerHTML=pool.map((e,i)=>{
    const m=e.media[0],thumb=getThumb(m),ei=entries.indexOf(e);
    let media='';
    if(thumb)media=`<img class="hero-slide-media" src="${esc(thumb)}" loading="${i===0?'eager':'lazy'}">`;
    else if(m.type==='video')media=`<video class="hero-slide-media" src="${esc(m.src)}" muted playsinline preload="metadata" onloadedmetadata="this.currentTime=2"></video>`;
    else media=`<div style="width:100%;height:100%;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:60px;color:var(--e2)">▶</div>`;
    return `<div class="hero-slide">
      ${media}
      <div class="hero-grad"></div>
      <div class="hero-redbar"></div>
      <div class="hero-content">
        <div class="hero-eye">HANDFILM · BLOOM</div>
        <div class="hero-num">ENTRY ${String(ei+1).padStart(3,'0')} / ${entries.length}</div>
        <div class="hero-title">${esc(e.title.split(' ').slice(0,4).join(' '))}<em>${e.title.split(' ').length>4?' …':''}</em></div>
        <div class="hero-serif">Bloom Level ${e.bloomLevel} · ${e.womanPower}</div>
        <div class="hero-meta">${(e.media||[]).length} MEDIA · ${(e.tags||'').split(',')[0]||'UNTAGGED'}</div>
        <div class="hero-actions">
          <button class="btn btn-gold btn-sm" onclick="showDetail(${ei})">VIEW ENTRY</button>
          <button class="btn btn-sm" onclick="streamEntry(${ei})">▶ STREAM</button>
          <button class="btn btn-sm btn-post" onclick="openPostIdx(${ei},0)">↑ POST</button>
        </div>
      </div>
    </div>`;
  }).join('');
  dots.innerHTML=pool.map((_,i)=>`<div class="hero-dot ${i===0?'on':''}" onclick="gotoHero(${i})"></div>`).join('');
  heroIdx=0;startHeroAuto();
}
function startHeroAuto(){clearInterval(heroTimer);heroTimer=setInterval(()=>heroStep(1),5000);}
function heroStep(d){const t=document.querySelectorAll('.hero-slide').length;if(!t)return;heroIdx=(heroIdx+d+t)%t;document.getElementById('heroTrack').style.transform=`translateX(-${heroIdx*100}%)`;document.querySelectorAll('.hero-dot').forEach((d,i)=>d.classList.toggle('on',i===heroIdx));startHeroAuto();}
function gotoHero(i){heroIdx=i;document.getElementById('heroTrack').style.transform=`translateX(-${heroIdx*100}%)`;document.querySelectorAll('.hero-dot').forEach((d,di)=>d.classList.toggle('on',di===heroIdx));startHeroAuto();}
// progress bar
let _progV=0;setInterval(()=>{_progV=(_progV+.5)%100;const el=document.getElementById('heroProg');if(el)el.style.width=_progV+'%';},100);


/* ══════════════════════════════════════════════
   RECENT STRIP
══════════════════════════════════════════════ */
function renderRecent() {
  const strip=document.getElementById('recentStrip');
  const recent=entries.slice(0,12);
  if(!recent.length){strip.innerHTML='<div style="color:var(--tx3);font-size:10px;letter-spacing:2px;padding:20px">NO ENTRIES YET</div>';return;}
  strip.innerHTML=recent.map((e,i)=>{
    const m=(e.media||[])[0],thumb=m?getThumb(m):null;
    return `<div class="rs-card" onclick="showDetail(${i})">
      <div class="rs-thumb">
        ${thumb?`<img src="${esc(thumb)}" loading="lazy">`:`<div class="rs-play">${m?tEmoji(m.type):'⊡'}</div>`}
      </div>
      <div class="rs-name">${esc(e.title)}</div>
      <div class="rs-meta">BLOOM ${e.bloomLevel} · ${(e.media||[]).length} MEDIA</div>
    </div>`;
  }).join('');
}


/* ══════════════════════════════════════════════
   VIDEO FEED
══════════════════════════════════════════════ */
function renderVideoFeed() {
  const grid=document.getElementById('videoFeed');
  const pool=entries.filter(e=>(e.media||[]).some(m=>['video','youtube','vimeo'].includes(m.type))).slice(0,8);
  if(!pool.length){grid.innerHTML='<div class="empty"><span class="empty-sym">▶</span><div class="empty-lbl">No video entries yet</div></div>';return;}
  grid.innerHTML=''; pool.forEach(e=>grid.appendChild(buildCard(e,entries.indexOf(e),'cv')));
}

