/* ══════════════════════════════════════════════
   REFS
══════════════════════════════════════════════ */
function addRef(){
  const url=document.getElementById('refUrl').value.trim(),label=document.getElementById('refLabel').value.trim()||`REF ${String(refs.length+1).padStart(2,'0')}`;
  if(!url)return;refs.unshift({url,label});save();document.getElementById('refUrl').value='';document.getElementById('refLabel').value='';renderRefs();updateStats();
}
function deleteRef(i){refs.splice(i,1);save();renderRefs();updateStats();}
function renderRefs(){
  const grid=document.getElementById('refsGrid');
  if(!refs.length){grid.innerHTML='<div class="empty" style="grid-column:1/-1"><span class="empty-sym">⊡</span><div class="empty-lbl">No References</div></div>';return;}
  grid.innerHTML=refs.map((r,i)=>`
    <div class="ref-card">
      <div class="ref-img" onclick="openZoom('${esc(r.url)}','${esc(r.label)}')">
        <img src="${esc(r.url)}" loading="lazy" onerror="this.parentNode.innerHTML='<div style=\\'padding:20px;text-align:center;font-size:9px;color:var(--tx3)\\'>⊘<br>${esc(r.url)}</div>'">
        <div class="cmb" style="height:36px">
          <button class="cmb-btn" onclick="event.stopPropagation();openZoom('${esc(r.url)}','${esc(r.label)}')"><div class="cmb-icon">⊕</div>ZOOM</button>
          <button class="cmb-btn" onclick="event.stopPropagation();openPost({type:'image',src:'${esc(r.url)}',label:'${esc(r.label)}'})"><div class="cmb-icon">↑</div>POST</button>
          <button class="cmb-btn" onclick="event.stopPropagation();openCat({type:'image',src:'${esc(r.url)}',label:'${esc(r.label)}'})"><div class="cmb-icon">⊞</div>CAT</button>
        </div>
      </div>
      <div class="ref-info">
        <div style="flex:1;min-width:0"><div class="ref-lbl">${esc(r.label)}</div><div class="ref-sub">${esc(r.url)}</div></div>
        <button class="btn-del" onclick="deleteRef(${i})">✕</button>
      </div>
    </div>`).join('');
}

