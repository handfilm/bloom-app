/* ══════════════════════════════════════════════
   DETAIL MODAL
══════════════════════════════════════════════ */
function showDetail(idx){
  detIdx=idx;detMed=0;
  document.getElementById('detailLbl').textContent=`ENTRY ${String(idx+1).padStart(3,'0')}`;
  document.getElementById('detailTitleH').textContent=entries[idx].title;
  renderDetailPlayer();renderDetailStrip();renderDetailMact();renderDetailInfo();
  document.getElementById('detailModal').classList.add('on');
}
function renderDetailPlayer(){
  const e=entries[detIdx],media=e.media||[],el=document.getElementById('detailPlayer');
  if(!media.length){el.innerHTML='';return;}
  const m=media[detMed];let inner='';
  if(m.type==='image'||m.type==='blob')
    inner=`<img src="${esc(m.src)}" onclick="openZoom('${esc(m.src)}','${esc(m.label||'')}');" style="cursor:zoom-in">`;
  else if(m.type==='video')
    inner=`<video src="${esc(m.src)}" controls playsinline style="width:100%;height:100%;display:block;background:#000"></video>`;
  else if(m.type==='gdrive'){
    const isVid=isDriveVideo(m.label||m.src);
    const embedUrl=driveDirectUrl(m.src,true);
    const directUrl=driveDirectUrl(m.src,false);
    if(isVid){
      inner=`<iframe src="${esc(embedUrl)}" allowfullscreen style="width:100%;height:100%;border:none;display:block"></iframe>`;
    } else {
      inner=`<img src="${esc(directUrl)}" onclick="openZoom('${esc(directUrl)}','${esc(m.label||'')}');" style="cursor:zoom-in" onerror="this.outerHTML='<iframe src=\\'${esc(embedUrl)}\\' allowfullscreen style=\\'width:100%;height:100%;border:none\\'></iframe>'">`;
    }
  }
  else if(m.type==='youtube'){const id=getYTId(m.src);inner=id?`<iframe src="https://www.youtube.com/embed/${id}?rel=0" allowfullscreen></iframe>`:`<div class="ph" style="height:200px"><div>INVALID URL</div></div>`;}
  else if(m.type==='vimeo'){const id=getVId(m.src);inner=id?`<iframe src="https://player.vimeo.com/video/${id}" allowfullscreen></iframe>`:`<div class="ph" style="height:200px"><div>INVALID URL</div></div>`;}
  else inner=`<div class="ph" style="height:200px"><div class="ph-icon">⊞</div><a href="${esc(m.src)}" target="_blank" style="color:var(--blue);font-size:10px;letter-spacing:2px">OPEN LINK ↗</a></div>`;
  const nav=media.length>1?`<div class="dp-nav"><button class="dp-btn" onclick="stepDetail(-1)">‹</button><button class="dp-btn" onclick="stepDetail(1)">›</button></div>`:'';
  el.innerHTML=`<div class="detail-player-wrap">${inner}${nav}</div>`;
}
function renderDetailStrip(){
  const media=(entries[detIdx].media||[]),el=document.getElementById('detailStrip');
  if(media.length<=1){el.innerHTML='';return;}
  el.innerHTML=`<div class="detail-strip">${media.map((m,i)=>{
    const t=getThumb(m);
    return `<div class="strip-item ${i===detMed?'on':''}" onclick="jumpDetail(${i})">${t?`<img src="${esc(t)}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r)" onerror="this.outerHTML='${tEmoji(m.type)}'">`:tEmoji(m.type)}</div>`;
  }).join('')}</div>`;
}
function renderDetailMact(){
  const e=entries[detIdx],media=e.media||[],el=document.getElementById('detailMact');
  if(!media.length){el.innerHTML='';return;}
  const m=media[detMed];
  el.innerHTML=`<div class="detail-mact">
    ${m.type==='image'?`<button class="btn btn-sm" onclick="openZoom('${esc(m.src)}','${esc(m.label||'')}')">⊕ ZOOM</button>`:''}
    ${['video','youtube','vimeo'].includes(m.type)?`<button class="btn btn-sm" onclick="streamEntry(${detIdx});closeModal('detailModal')">▶ STREAM</button>`:''}
    <button class="btn btn-sm btn-post" onclick="openPostIdx(${detIdx},${detMed})">↑ POST</button>
    <button class="btn btn-sm" onclick="openCatIdx(${detIdx},${detMed})">⊞ CAT</button>
    <span style="font-size:9px;color:var(--tx3);letter-spacing:1px;margin-left:4px">${tLbl(m.type)} · ${detMed+1}/${media.length}</span>
  </div>`;
}
function renderDetailInfo(){
  const e=entries[detIdx],pct=(e.bloomLevel/10)*100;
  const tags=(e.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
  const date=e.createdAt?new Date(e.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—';
  document.getElementById('detailBody').innerHTML=`
    <div class="detail-info">
      <div class="detail-title">${esc(e.title)}</div>
      <div class="bloom-display">
        <div class="bloom-display-num">${e.bloomLevel}</div>
        <div class="bloom-display-track">
          <div class="bloom-display-lbl">BLOOM LEVEL</div>
          <div class="bloom-display-bar"><div class="bloom-display-fill" style="width:${pct}%"></div></div>
        </div>
      </div>
      <div class="detail-meta">
        <div class="dm-field"><label>Solo</label><div class="val">${e.isSolo?'YES':'NO'}</div></div>
        <div class="dm-field"><label>Man's Role</label><div class="val">${esc(e.manRole||'Absent')}</div></div>
        <div class="dm-field"><label>Woman's Power</label><div class="val">${esc(e.womanPower)}</div></div>
        <div class="dm-field"><label>Media Files</label><div class="val">${(e.media||[]).length}</div></div>
        <div class="dm-field"><label>Date Added</label><div class="val">${date}</div></div>
      </div>
      ${tags.length?`<div style="margin-bottom:18px"><div class="sec-lbl">Tags</div><div class="pills">${tags.map(t=>`<span class="pill p-gold">${esc(t)}</span>`).join('')}</div></div>`:''}
      ${e.notes?`<div style="margin-bottom:0"><div class="sec-lbl">Journal</div><div class="detail-notes">${esc(e.notes)}</div></div>`:''}
      <div class="ai-sec">
        <div class="ai-head"><div style="display:flex;align-items:center;gap:8px"><div class="ai-dot"></div>AI REFLECTION</div><button class="btn btn-ghost btn-sm" onclick="runAI(${detIdx})">GENERATE</button></div>
        <div class="ai-out" id="aiOut">Press GENERATE for a directorial reflection.</div>
      </div>
    </div>`;
  document.getElementById('detailFoot').innerHTML=`
    <button class="btn btn-gold" onclick="openAdd(${detIdx});closeModal('detailModal')">EDIT</button>
    <button class="btn btn-danger" onclick="deleteEntry(${detIdx});closeModal('detailModal')">DELETE</button>
    <button class="btn btn-ghost" onclick="closeModal('detailModal')">CLOSE</button>`;
}
function stepDetail(d){const len=(entries[detIdx].media||[]).length;if(!len)return;detMed=(detMed+d+len)%len;renderDetailPlayer();renderDetailStrip();renderDetailMact();}
function jumpDetail(i){detMed=i;renderDetailPlayer();renderDetailStrip();renderDetailMact();}


/* ══════════════════════════════════════════════
   ZOOM
══════════════════════════════════════════════ */
function openZoom(src,caption){
  const ov=document.getElementById('zoomOv'),img=document.getElementById('zoomImg');
  img.src=src;zoomLvl=1;img.style.transform='scale(1)';
  document.getElementById('zoomLbl').textContent='1×';
  document.getElementById('zoomBar').textContent=caption||'';
  ov.classList.add('on');
}
function handleZoomBg(ev){if(ev.target.id==='zoomOv')closeZoom();}
function closeZoom(){document.getElementById('zoomOv').classList.remove('on');}
function toggleZoomLevel(){zoomLvl=zoomLvl===1?2.5:1;applyZoom();document.getElementById('zoomImg').style.cursor=zoomLvl>1?'zoom-out':'zoom-in';}
function zoomIn(){zoomLvl=Math.min(zoomLvl+.5,5);applyZoom();}
function zoomOut(){zoomLvl=Math.max(zoomLvl-.5,.5);applyZoom();}
function resetZoom(){zoomLvl=1;applyZoom();}
function applyZoom(){document.getElementById('zoomImg').style.transform=`scale(${zoomLvl})`;document.getElementById('zoomLbl').textContent=zoomLvl.toFixed(1)+'×';}


/* ══════════════════════════════════════════════
   POST PANEL
══════════════════════════════════════════════ */
function openPostIdx(ei,mi){const m=(entries[ei].media||[])[mi];if(m)openPost(m);else toast('NO MEDIA','error');}
function openPost(m){
  curPost=typeof m==='string'?JSON.parse(m):m;
  const prev=document.getElementById('postPreview'),thumb=getThumb(curPost);
  prev.innerHTML=thumb?`<img src="${esc(thumb)}">`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;color:var(--tx4)">${tEmoji(curPost.type)}</div>`;
  document.getElementById('postPanel').classList.add('on');
}
function closePost(){document.getElementById('postPanel').classList.remove('on');}
function submitPost(){
  const pl=[...document.querySelectorAll('.pltf-btn.on')].map(b=>b.textContent);
  if(!pl.length){toast('SELECT A PLATFORM','error');return;}
  toast(`QUEUED: ${pl.join(', ')}`,'success');closePost();
}


/* ══════════════════════════════════════════════
   CATALOGUE PANEL
══════════════════════════════════════════════ */
function openCatIdx(ei,mi){const m=(entries[ei].media||[])[mi];if(m)openCat(m);else toast('NO MEDIA','error');}
function openCat(m){curCat=typeof m==='string'?JSON.parse(m):m;renderCatGroups();document.getElementById('catPanel').classList.add('on');}
function closeCat(){document.getElementById('catPanel').classList.remove('on');}
function renderCatGroups(){
  document.getElementById('catGroups').innerHTML=catalogue.map((g,gi)=>`
    <div class="cat-group">
      <div class="cat-group-head">${esc(g.name)} <span>${g.items.length}</span></div>
      ${g.items.slice(0,4).map(item=>`<div class="cat-item"><span style="font-size:12px">${tEmoji(item.type||'image')}</span><span style="flex:1;font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(item.label||item.src||'')}</span><button class="btn-del" onclick="removeCatItem(${gi},'${esc(item.src)}')">✕</button></div>`).join('')}
      ${g.items.length>4?`<div style="font-size:8px;color:var(--tx3);padding:6px 14px;letter-spacing:1px">+${g.items.length-4} MORE</div>`:''}
      <div class="cat-add-row"><button class="btn btn-xs btn-gold" onclick="addToCat(${gi})">ADD CURRENT</button></div>
    </div>`).join('');
}
function addToCat(gi){
  if(!curCat)return;
  if(catalogue[gi].items.some(i=>i.src===curCat.src)){toast('ALREADY IN CATALOGUE','error');return;}
  catalogue[gi].items.push({...curCat});save();renderCatGroups();toast(`ADDED TO ${catalogue[gi].name}`,'success');
}
function removeCatItem(gi,src){catalogue[gi].items=catalogue[gi].items.filter(i=>i.src!==src);save();renderCatGroups();}
function addCatGroup(){const n=prompt('Category name:');if(!n?.trim())return;catalogue.push({name:n.trim(),items:[]});save();renderCatGroups();}

