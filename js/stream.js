/* ══════════════════════════════════════════════
   STREAM
══════════════════════════════════════════════ */
function initStream(ei){stIdx=ei;stMed=0;loadStream();}
function streamEntry(ei){go('stream');initStream(ei);}
function loadStream(){
  if(stIdx===null)return;
  const e=entries[stIdx];if(!e)return;
  const media=e.media||[],m=media[stMed]||null;
  const pl=document.getElementById('streamPlayer'),title=document.getElementById('streamTitle'),act=document.getElementById('streamAct');
  title.textContent=e.title+(media.length>1?` [${stMed+1}/${media.length}]`:'');
  if(!m){pl.innerHTML=`<div class="ph" style="height:100%"><div class="ph-icon">⊡</div><div>NO MEDIA</div></div>`;act.innerHTML='';renderQueue();return;}
  let inner='';
  if(m.type==='video'||m.type==='blob')inner=`<video src="${esc(m.src)}" controls autoplay playsinline style="width:100%;height:100%;display:block;background:#000;object-fit:contain"></video>`;
  else if(m.type==='gdrive'){const isVid=isDriveVideo(m.label||m.src),eu=driveDirectUrl(m.src,true),du=driveDirectUrl(m.src,false);inner=isVid?`<iframe src="${esc(eu)}" allowfullscreen allow="autoplay" style="width:100%;height:100%;border:none;display:block"></iframe>`:`<img src="${esc(du)}" style="width:100%;height:100%;object-fit:contain;background:#000;cursor:zoom-in" onclick="openZoom('${esc(du)}','${esc(m.label||'')}')">` ;}
  else if(m.type==='youtube'){const id=getYTId(m.src);inner=id?`<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" allowfullscreen allow="autoplay;encrypted-media" style="width:100%;height:100%;border:none;display:block"></iframe>`:`<div class="ph" style="height:100%"><div>INVALID URL</div></div>`;}
  else if(m.type==='vimeo'){const id=getVId(m.src);inner=id?`<iframe src="https://player.vimeo.com/video/${id}?autoplay=1" allowfullscreen style="width:100%;height:100%;border:none;display:block"></iframe>`:`<div class="ph" style="height:100%"><div>INVALID URL</div></div>`;}
  else if(m.type==='image')inner=`<img src="${esc(m.src)}" style="width:100%;height:100%;object-fit:contain;background:#000;cursor:zoom-in" onclick="openZoom('${esc(m.src)}','${esc(m.label||'')}')">`;
  else inner=`<div class="ph" style="height:100%"><div class="ph-icon">⊞</div><a href="${esc(m.src)}" target="_blank" style="color:var(--blue);font-size:10px;letter-spacing:2px">OPEN LINK ↗</a></div>`;
  pl.innerHTML=inner;
  act.innerHTML=`
    ${media.length>1?`<button class="btn btn-sm btn-ghost" onclick="stepStream(-1)">‹</button>`:''}
    ${media.length>1?`<button class="btn btn-sm btn-ghost" onclick="stepStream(1)">›</button>`:''}
    ${m.type==='image'?`<button class="btn btn-sm" onclick="openZoom('${esc(m.src)}','${esc(m.label||'')}')">⊕ ZOOM</button>`:''}
    <button class="btn btn-sm btn-post" onclick="openPostIdx(${stIdx},${stMed})">↑ POST</button>
    <button class="btn btn-sm" onclick="openCatIdx(${stIdx},${stMed})">⊞ CAT</button>
    <button class="btn btn-sm btn-ghost" onclick="showDetail(${stIdx})">ENTRY ↗</button>`;
  renderQueue();
}
function stepStream(d){if(stIdx===null)return;const len=(entries[stIdx].media||[]).length;stMed=(stMed+d+len)%len;loadStream();}
function renderQueue(){
  const list=document.getElementById('qList'),cnt=document.getElementById('qCount');
  const all=[];entries.forEach((e,ei)=>(e.media||[]).forEach((m,mi)=>all.push({e,ei,m,mi})));
  cnt.textContent=all.length;
  if(!all.length){list.innerHTML='<div style="padding:20px;color:var(--tx3);font-size:9px;letter-spacing:2px;text-align:center">NO MEDIA</div>';return;}
  list.innerHTML=all.map(({e,ei,m,mi})=>{
    const thumb=getThumb(m),isOn=ei===stIdx&&mi===stMed;
    return `<div class="q-item ${isOn?'on':''}" onclick="stIdx=${ei};stMed=${mi};loadStream()">
      <div class="q-thumb">${thumb?`<img src="${esc(thumb)}" onerror="this.outerHTML='${tEmoji(m.type)}'">`:tEmoji(m.type)}</div>
      <div class="q-info"><div class="q-title">${esc(e.title)}</div><div class="q-meta">${tLbl(m.type)} · BLOOM ${e.bloomLevel}</div></div>
    </div>`;
  }).join('');
}

