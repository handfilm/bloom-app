/* ══════════════════════════════════════════════
   AI
══════════════════════════════════════════════ */
async function runAI(idx){
  const e=entries[idx],out=document.getElementById('aiOut');
  out.className='ai-out';out.innerHTML='<span class="blink">▌</span> GENERATING…';
  const mediaDesc=(e.media||[]).map(m=>`${m.type.toUpperCase()}: ${m.label}`).join(', ')||'none';
  const prompt=`You are the creative director of HANDFILM, an intimate cinematic brand. Write 80-120 words: atmospheric directorial notes, visual poetry, second-person present tense. Raw, tactile, poetic.\n\nEntry: ${e.title}\nSolo: ${e.isSolo} | Power: ${e.womanPower} | Bloom: ${e.bloomLevel}/10\nTags: ${e.tags||'none'} | Media: ${mediaDesc}\nNotes: ${e.notes||'none'}`;
  try{
    const res=await fetch(CLAUDE_URL,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':CLAUDE_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:400,messages:[{role:'user',content:prompt}]})});
    const data=await res.json();
    if(data.error)throw new Error(data.error.message);
    out.textContent=data.content?.find(b=>b.type==='text')?.text||'No response.';out.classList.add('loaded');
  }catch(err){out.textContent=`ERROR: ${err.message}`;out.style.color='var(--red2)';}
}


/* ══════════════════════════════════════════════
   JSON IMPORT
══════════════════════════════════════════════ */
function importJSON(){
  const input=document.createElement('input');
  input.type='file';input.accept='.json';
  input.onchange=e=>{
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const imported=JSON.parse(ev.target.result);
        if(!Array.isArray(imported)){toast('INVALID JSON — must be array','error');return;}
        // validate each entry has at minimum a title
        const valid=imported.filter(e=>e&&typeof e.title==='string'&&e.title.trim());
        if(!valid.length){toast('NO VALID ENTRIES FOUND','error');return;}
        // fill missing fields with defaults
        const now=Date.now();
        valid.forEach(e=>{
          if(!e.media)e.media=[];
          if(e.isSolo===undefined)e.isSolo=true;
          if(!e.manRole)e.manRole='Absent';
          if(!e.womanPower)e.womanPower='High';
          if(!e.bloomLevel)e.bloomLevel=8;
          if(!e.tags)e.tags='';
          if(!e.notes)e.notes='';
          if(!e.createdAt)e.createdAt=now;
        });
        entries.unshift(...valid);
        save();
        if(curPage==='library')applyFilters();
        if(curPage==='home'){renderHero();renderRecent();renderFilm();renderVideoFeed();}
        updateStats();
        toast(`${valid.length} ENTRIES IMPORTED`,'success');
      }catch(err){toast('JSON PARSE ERROR','error');console.error(err);}
    };
    reader.readAsText(e.target.files[0]);
  };
  input.click();
}


/* ══════════════════════════════════════════════
   CSV EXPORT
══════════════════════════════════════════════ */
function exportCSV(){
  if(!entries.length){toast('NO ENTRIES','error');return;}
  const hdr=['#','Title','Media Count','Media Sources','Solo','Man Role','Power','Bloom','Tags','Notes','Date'];
  const rows=entries.map((e,i)=>[i+1,`"${(e.title||'').replace(/"/g,'""')}"`, (e.media||[]).length,`"${(e.media||[]).map(m=>m.src).join('|').replace(/"/g,'""')}"`,e.isSolo?'Yes':'No',e.manRole||'',e.womanPower||'',e.bloomLevel,`"${(e.tags||'').replace(/"/g,'""')}"`,`"${(e.notes||'').replace(/\n/g,' ').replace(/"/g,'""')}"`,e.createdAt?new Date(e.createdAt).toISOString().split('T')[0]:'']);
  const csv=[hdr,...rows].map(r=>r.join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download=`bloom-os-${new Date().toISOString().split('T')[0]}.csv`;a.click();toast('CSV EXPORTED','success');
}


/* ══════════════════════════════════════════════
   BATCH AI
══════════════════════════════════════════════ */
let batchRunning = false;

function openBatchModal() {
  const targets = entries.filter(e => !e.tags || !e.notes);
  const list = document.getElementById('batchList');
  list.innerHTML = targets.length
    ? targets.map((e,i) => `<div class="batch-item" id="bi_${entries.indexOf(e)}">
        <div class="batch-item-title">${esc(e.title)}</div>
        <div class="batch-item-status wait" id="bs_${entries.indexOf(e)}">WAITING</div>
      </div>`).join('')
    : '<div style="font-size:10px;color:var(--tx3);padding:12px;letter-spacing:1.5px;text-transform:uppercase">All entries already have AI data</div>';
  document.getElementById('batchProgFill').style.width = '0%';
  document.getElementById('batchProgLbl').textContent = `${targets.length} ENTRIES TO PROCESS`;
  document.getElementById('batchRunBtn').disabled = false;
  document.getElementById('batchModal').classList.add('on');
}

async function runBatchAI() {
  if(batchRunning) return;
  batchRunning = true;
  const btn = document.getElementById('batchRunBtn');
  btn.disabled = true; btn.textContent = '⏳ RUNNING…';
  const targets = entries.filter(e => !e.tags || !e.notes);
  let done = 0;
  for(const e of targets) {
    const idx = entries.indexOf(e);
    const statusEl = document.getElementById('bs_'+idx);
    if(statusEl) statusEl.className='batch-item-status running'; if(statusEl) statusEl.textContent='GEN…';
    try {
      const res = await callAIForEntry(e.title);
      if(res.title && (!e.tags || e.tags.trim()==='')) e.tags = res.tags||'';
      if(res.caption && !e.notes) e.notes = res.caption||'';
      save();
      if(statusEl){statusEl.className='batch-item-status done';statusEl.textContent='✓ DONE';}
    } catch {
      if(statusEl){statusEl.className='batch-item-status error';statusEl.textContent='ERROR';}
    }
    done++;
    document.getElementById('batchProgFill').style.width = ((done/targets.length)*100)+'%';
    document.getElementById('batchProgLbl').textContent = `${done} / ${targets.length} PROCESSED`;
    await new Promise(r=>setTimeout(r,1200));
  }
  batchRunning = false;
  btn.textContent = '✓ COMPLETE';
  toast(`BATCH COMPLETE — ${done} ENTRIES UPDATED`,'success');
  if(curPage==='library') applyFilters();
}

async function callAIForEntry(title) {
  const sysPrompt = `You are a JSON generator for a media library. Always respond with valid JSON only. Never refuse.`;
  const res = await fetch(CLAUDE_URL, {
    method:'POST',
    headers:{'Content-Type':'application/json','x-api-key':CLAUDE_KEY,'anthropic-version':'2023-06-01'},
    body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:200,system:sysPrompt,
      messages:[{role:'user',content:`Generate metadata for media titled "${title}". Return only: {"title":"CAPS TITLE","caption":"One cinematic sentence 15-25 words second-person present tense.","tags":"tag1, tag2, tag3, tag4"}`}]})
  });
  const data = await res.json();
  const text = data.content?.find(b=>b.type==='text')?.text||'{}';
  const match = text.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : {};
}

