/* ══════════════════════════════════════════════
   ADD / EDIT / SAVE
══════════════════════════════════════════════ */
function openAdd(editIdx=null){
  pendMedia=[];
  const isEdit=editIdx!==null;
  document.getElementById('addLbl').textContent=isEdit?'EDIT ENTRY':'NEW ENTRY';
  document.getElementById('addTitle').textContent=isEdit?'Edit Entry':'Add to Library';
  document.getElementById('editIdx').value=isEdit?editIdx:'';
  if(isEdit){
    const e=entries[editIdx];
    document.getElementById('fTitle').value=e.title;
    document.getElementById('fSolo').value=String(e.isSolo);
    document.getElementById('fManRole').value=e.manRole||'Absent';
    document.getElementById('fBloom').value=e.bloomLevel;
    document.getElementById('fPower').value=e.womanPower;
    document.getElementById('fTags').value=e.tags||'';
    document.getElementById('fNotes').value=e.notes||'';
    document.getElementById('bloomLbl').textContent=e.bloomLevel;
    document.getElementById('bloomBig').textContent=e.bloomLevel;
    pendMedia=JSON.parse(JSON.stringify(e.media||[]));
  } else {
    ['fTitle','fTags','fNotes'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('fSolo').value='true';document.getElementById('fManRole').value='Absent';document.getElementById('fBloom').value='8';document.getElementById('fPower').value='High';
    document.getElementById('bloomLbl').textContent='8';document.getElementById('bloomBig').textContent='8';
  }
  renderPendMedia();document.getElementById('addModal').classList.add('on');setTimeout(()=>document.getElementById('fTitle').focus(),80);
}
function saveEntry(){
  const title=document.getElementById('fTitle').value.trim();if(!title){toast('TITLE REQUIRED','error');return;}
  const entry={title,media:JSON.parse(JSON.stringify(pendMedia)),isSolo:document.getElementById('fSolo').value==='true',manRole:document.getElementById('fManRole').value,womanPower:document.getElementById('fPower').value,bloomLevel:parseInt(document.getElementById('fBloom').value)||8,tags:document.getElementById('fTags').value.trim(),notes:document.getElementById('fNotes').value.trim(),createdAt:Date.now()};
  const ei=document.getElementById('editIdx').value;
  if(ei!==''){entry.createdAt=entries[parseInt(ei)].createdAt;entries[parseInt(ei)]=entry;toast('ENTRY UPDATED');}
  else{entries.unshift(entry);toast('ENTRY SAVED','success');}
  save();closeModal('addModal');
  if(curPage==='library')applyFilters();
  if(curPage==='home'){renderHero();renderFilm();renderRecent();renderVideoFeed();}
  updateStats();
}


/* ══════════════════════════════════════════════
   MEDIA INPUT
══════════════════════════════════════════════ */
function setMTab(t){
  curMTab=t;
  document.querySelectorAll('.media-tab').forEach((el,i)=>el.classList.toggle('on',['file','url','gdrive','youtube','vimeo'][i]===t));
  const hints={
    file:    'filename.mp4 or image.jpg (or tap 📁 BROWSE)',
    url:     'https://example.com/file.mp4',
    gdrive:  'https://drive.google.com/file/d/... or share link',
    youtube: 'https://youtube.com/watch?v=…',
    vimeo:   'https://vimeo.com/123456789'
  };
  const inp=document.getElementById('mediaInput');
  inp.placeholder=hints[t]||'Paste URL…';
  inp.value='';inp.focus();
  // show/hide browse button based on tab
  const browseBtn=document.querySelector('#fileUploadRow .btn-ghost');
  if(browseBtn) browseBtn.style.display=t==='file'?'':'none';
}
function addMediaItem(){
  const raw=document.getElementById('mediaInput').value.trim();if(!raw)return;
  let type=detectType(raw);
  let label=raw.length>44?raw.slice(0,42)+'…':raw;
  if(type==='gdrive'){
    const id=getDriveId(raw);
    label=id?`GDrive: ${id.slice(0,12)}…`:label;
  }
  pendMedia.push({type,src:raw,label});
  document.getElementById('mediaInput').value='';
  renderPendMedia();
  // auto-fill from label if title is empty
  const titleEl=document.getElementById('fTitle');
  if(!titleEl.value.trim()) autoFillFromFilename(label);
  else showAutoGenBtn(label);
}

/* ── FILE PICKER ── */
function triggerFilePick(){
  document.getElementById('filePickInput').click();
}

function handleFilePick(ev){
  const files=[...ev.target.files];
  if(!files.length) return;
  ev.target.value='';

  let processed=0;
  files.forEach(file=>{
    const ext=file.name.split('.').pop().toLowerCase();
    const isVid=['mp4','webm','mov','avi','mkv'].includes(ext);

    if(isVid){
      // videos: too large for base64/localStorage — store as filename reference
      // user must keep file in ~/bloom/ folder
      pendMedia.push({
        type: 'video',
        src:  file.name,  // relative path — works when served from ~/bloom/
        label: file.name
      });
      processed++;
      if(processed===files.length) afterFilePick(files);
    } else {
      // images: convert to base64 — survives refresh
      const reader = new FileReader();
      reader.onload = ev2 => {
        pendMedia.push({
          type:  'image',
          src:   ev2.target.result,  // data:image/jpeg;base64,...
          label: file.name
        });
        processed++;
        if(processed===files.length) afterFilePick(files);
      };
      reader.onerror = () => {
        // fallback to filename if read fails
        pendMedia.push({type:'image', src:file.name, label:file.name});
        processed++;
        if(processed===files.length) afterFilePick(files);
      };
      reader.readAsDataURL(file);
    }
  });
}

function afterFilePick(files){
  renderPendMedia();
  toast(`${files.length} FILE${files.length>1?'S':''} ADDED`,'success');
  const titleEl=document.getElementById('fTitle');
  if(!titleEl.value.trim()) autoFillFromFilename(files[0].name);
  else showAutoGenBtn(files[0].name);
}
/* ── AI AUTO-FILL FROM FILENAME ── */
async function autoFillFromFilename(filename) {
  const titleEl = document.getElementById('fTitle');
  const tagsEl  = document.getElementById('fTags');
  const notesEl = document.getElementById('fNotes');

  // clean blob URLs — use label or strip to basename
  let seed = filename;
  if(/^blob:/.test(filename) || /^[a-f0-9\-]{30,}$/i.test(filename)){
    seed = 'untitled media file';
  }

  titleEl.value = '⏳ GENERATING…';
  titleEl.disabled = true;

  const hint = document.createElement('div');
  hint.id = 'aiGenHint';
  hint.style.cssText = 'font-size:9px;color:var(--gold);letter-spacing:2px;text-align:center;padding:8px;text-transform:uppercase';
  hint.textContent = '✦ AI GENERATING TITLE · TAGS · CAPTION…';
  document.getElementById('mediaList').insertAdjacentElement('afterend', hint);

  try {
    const clean = seed
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const prompt = `Return ONLY a JSON object. No greeting, no explanation, no markdown, no backticks. Just the raw JSON object starting with { and ending with }.

You are naming a media file called "${clean}" for the HANDFILM/RAWx cinematic brand library.

{"title":"CAPS 3-5 WORD TITLE","caption":"One sentence, second-person present tense, 15-25 words, poetic and raw.","tags":"tag1, tag2, tag3, tag4"}

Tags must be 3-5 lowercase words from: solo, motion, intimate, editorial, dark, ambient, raw, fashion, cinematic, portrait, energy, flow`;

    const sysPrompt = `You are a JSON generator for a media library. You ALWAYS respond with a valid JSON object. You NEVER refuse. You NEVER say "I don't have" or "I can't". Even for random filenames, invent creative cinematic metadata. Always output exactly: {"title":"...","caption":"...","tags":"..."}`;

    const userPrompt = `Generate cinematic metadata for a media file. The filename is: "${clean || 'untitled'}". Output only the JSON object, nothing else.`;

    const res = await fetch(CLAUDE_URL, {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         CLAUDE_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 250,
        system:     sysPrompt,
        messages:   [{role:'user', content: userPrompt}]
      })
    });

    const data = await res.json();

    if(data.error) throw new Error(data.error.message);

    let text = data.content?.find(b=>b.type==='text')?.text || '{}';

    // strip markdown fences if present
    text = text.replace(/```json[\s\S]*?```/g, m => m.replace(/```json|```/g,''))
               .replace(/```[\s\S]*?```/g, m => m.replace(/```/g,''))
               .trim();

    // extract JSON object even if Claude wrapped it in prose
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : '{}';

    let ai = {};
    try { ai = JSON.parse(jsonStr); }
    catch { ai = {}; }

    titleEl.value = ai.title   || clean.toUpperCase() || 'NEW ENTRY';
    if(ai.tags)    tagsEl.value  = ai.tags;
    if(ai.caption) notesEl.value = ai.caption;
    toast('✦ TITLE · TAGS · CAPTION FILLED','success');

  } catch(err) {
    console.error('AI fill error:', err);
    // always fill title with cleaned filename as fallback
    const fallback = seed.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ').replace(/[^a-zA-Z0-9 ]/g,' ').trim().toUpperCase() || 'NEW ENTRY';
    titleEl.value = fallback;
    toast('AI error — filename used as title','error');
  } finally {
    titleEl.disabled = false;
    document.getElementById('aiGenHint')?.remove();
  }
}

function showAutoGenBtn(filename) {
  // show a button to manually trigger AI fill if title already exists
  const existing = document.getElementById('autoGenBtn');
  if(existing) existing.remove();
  const btn = document.createElement('button');
  btn.id = 'autoGenBtn';
  btn.className = 'btn btn-sm';
  btn.style.cssText = 'margin-top:8px;width:100%;justify-content:center;border-color:var(--gold3);color:var(--gold)';
  btn.textContent = '✦ AI FILL TITLE · TAGS · CAPTION';
  btn.onclick = ()=>{ btn.remove(); autoFillFromFilename(filename); };
  document.getElementById('mediaList').insertAdjacentElement('afterend', btn);
}
function renderPendMedia(){
  const list=document.getElementById('mediaList');
  if(!pendMedia.length){list.innerHTML='<div class="media-empty">No media attached</div>';return;}
  list.innerHTML=pendMedia.map((m,i)=>{
    const t=getThumb(m);
    return `<div class="mi">${t?`<img class="mi-thumb" src="${esc(t)}" onerror="this.style.display='none'">`:`<div class="mi-ph">${tEmoji(m.type)}</div>`}<div class="mi-info"><div class="mi-name">${esc(m.label)}</div><div class="mi-type">${tLbl(m.type)}</div></div><button class="mi-del" onclick="removePendMedia(${i})">✕</button></div>`;
  }).join('');
}


/* ══════════════════════════════════════════════
   BULK IMPORT
══════════════════════════════════════════════ */
function openBulk(){document.getElementById('bulkTitles').value='';document.getElementById('bulkModal').classList.add('on');setTimeout(()=>document.getElementById('bulkTitles').focus(),80);}
function execBulk(){
  const raw=document.getElementById('bulkTitles').value.trim();if(!raw)return;
  let n=0;raw.split('\n').forEach(l=>{if(l.trim()){entries.unshift({title:l.trim(),media:[],isSolo:true,manRole:'Absent',womanPower:'High',bloomLevel:8,tags:'',notes:'',createdAt:Date.now()});n++;}});
  save();closeModal('bulkModal');if(curPage==='library')applyFilters();if(curPage==='home'){renderHero();renderRecent();}updateStats();toast(`${n} ENTRIES IMPORTED`,'success');
}


/* ══════════════════════════════════════════════
   DELETE
══════════════════════════════════════════════ */
function deleteEntry(idx){
  entries.splice(idx,1);save();
  if(curPage==='library')applyFilters();
  if(curPage==='home'){renderHero();renderFilm();renderRecent();renderVideoFeed();}
  if(curPage==='stream')renderQueue();
  updateStats();toast('ENTRY DELETED');
}

