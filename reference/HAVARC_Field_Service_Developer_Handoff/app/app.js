const STORAGE_KEY = 'havarc-field-service-draft-v1';
let currentStep = 1;
const maxSteps = 4;
const form = document.getElementById('serviceForm');
const screens = [...document.querySelectorAll('.screen')];
const progressBar = document.getElementById('progressBar');
const stepText = document.getElementById('stepText');
const backBtn = document.getElementById('backBtn');
const saveBtn = document.getElementById('saveBtn');
const nextBtn = document.getElementById('nextBtn');

function checkedValues(name){return [...document.querySelectorAll(`[name="${name}"]:checked`)].map(el=>el.value)}
function serializeForm(){
  const fd = new FormData(form); const data = {};
  for(const [k,v] of fd.entries()){
    if(data[k] !== undefined){ if(!Array.isArray(data[k])) data[k] = [data[k]]; data[k].push(v); }
    else data[k] = v;
  }
  ['serviceType','checks','findings','repairs','recommendations'].forEach(k=>data[k]=checkedValues(k));
  data.customerSignature = signatureData('customerSig');
  data.technicianSignature = signatureData('techSig');
  data.updatedAt = new Date().toISOString();
  return data;
}
function saveDraft(showMessage=false){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeForm()));
  if(showMessage) alert('Draft saved on this device.');
}
function loadDraft(){
  const raw = localStorage.getItem(STORAGE_KEY); if(!raw) return;
  let data; try{data=JSON.parse(raw)}catch{return}
  for(const [key,val] of Object.entries(data)){
    if(['customerSignature','technicianSignature','updatedAt'].includes(key)) continue;
    const els=[...document.querySelectorAll(`[name="${key}"]`)]; if(!els.length) continue;
    if(Array.isArray(val)) els.forEach(el=>el.checked=val.includes(el.value));
    else if(els[0].type!=='file') els[0].value=val ?? '';
  }
  if(data.systemStatus){document.querySelectorAll('[data-status]').forEach(b=>b.classList.toggle('selected', b.dataset.status===data.systemStatus));}
  if(data.customerSignature) drawDataUrl('customerSig', data.customerSignature);
  if(data.technicianSignature) drawDataUrl('techSig', data.technicianSignature);
}
function showStep(){
  screens.forEach(s=>s.classList.toggle('active', Number(s.dataset.step)===currentStep));
  stepText.textContent=`${currentStep} of ${maxSteps}`;
  progressBar.style.width=`${(currentStep/maxSteps)*100}%`;
  backBtn.disabled=currentStep===1;
  nextBtn.textContent=currentStep===maxSteps?'Complete':'Next';
  window.scrollTo({top:0,behavior:'smooth'});
}
function validateStep(){
  const active=document.querySelector(`.screen[data-step="${currentStep}"]`);
  let ok=true;
  active.querySelectorAll('[required]').forEach(el=>{
    const bad=!String(el.value||'').trim(); el.classList.toggle('field-error',bad); if(bad) ok=false;
  });
  if(!ok) alert('Please complete the required fields highlighted on this screen.');
  return ok;
}
backBtn.addEventListener('click',()=>{if(currentStep>1){saveDraft();currentStep--;showStep();}});
saveBtn.addEventListener('click',()=>saveDraft(true));
nextBtn.addEventListener('click',()=>{
  if(!validateStep()) return;
  saveDraft();
  if(currentStep<maxSteps){currentStep++;showStep();}
  else{document.getElementById('success').style.display='block'; generateSummary();}
});
form.addEventListener('input',()=>{clearTimeout(window.__saveTimer);window.__saveTimer=setTimeout(()=>saveDraft(false),450)});

// Status selection
for(const btn of document.querySelectorAll('[data-status]')) btn.addEventListener('click',()=>{
  document.querySelectorAll('[data-status]').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected'); document.getElementById('systemStatus').value=btn.dataset.status; saveDraft();
});

// Photo preview - demo only; files are intentionally not stored in localStorage.
const photos=document.getElementById('photos');
photos.addEventListener('change',()=>{
  const preview=document.getElementById('photoPreview'); preview.innerHTML='';
  document.getElementById('photoCount').textContent=`${photos.files.length} photo(s) selected`;
  [...photos.files].slice(0,12).forEach(file=>{const img=document.createElement('img');img.alt=file.name;img.src=URL.createObjectURL(file);preview.appendChild(img)});
});

// Signature pads
function setupSignature(id){
  const canvas=document.getElementById(id); const ctx=canvas.getContext('2d'); let drawing=false;
  function resize(){
    const data=canvas.width?canvas.toDataURL() : null; const rect=canvas.getBoundingClientRect(); const ratio=window.devicePixelRatio||1;
    canvas.width=Math.max(1,Math.floor(rect.width*ratio)); canvas.height=Math.max(1,Math.floor(rect.height*ratio));
    ctx.setTransform(ratio,0,0,ratio,0,0); ctx.lineWidth=2;ctx.lineCap='round';ctx.strokeStyle='#16212b'; if(data) drawDataUrl(id,data);
  }
  function point(e){const r=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return [p.clientX-r.left,p.clientY-r.top]}
  function start(e){drawing=true;ctx.beginPath();const [x,y]=point(e);ctx.moveTo(x,y);e.preventDefault()}
  function move(e){if(!drawing)return;const [x,y]=point(e);ctx.lineTo(x,y);ctx.stroke();e.preventDefault()}
  function end(){if(drawing){drawing=false;saveDraft();}}
  resize(); canvas.addEventListener('mousedown',start);canvas.addEventListener('mousemove',move);window.addEventListener('mouseup',end);
  canvas.addEventListener('touchstart',start,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});canvas.addEventListener('touchend',end);
}
function signatureData(id){const c=document.getElementById(id);return c.width?c.toDataURL('image/png'):''}
function drawDataUrl(id,url){const c=document.getElementById(id),ctx=c.getContext('2d'),img=new Image();img.onload=()=>{const r=c.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);ctx.drawImage(img,0,0,r.width,r.height)};img.src=url}
document.querySelectorAll('[data-clear]').forEach(btn=>btn.addEventListener('click',()=>{const c=document.getElementById(btn.dataset.clear);const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);saveDraft()}));
setupSignature('customerSig'); setupSignature('techSig');

function generateSummary(){
  const d=serializeForm(); const lines=[];
  lines.push(`Work Order: ${d.workOrder||'—'}\nCustomer: ${d.customer||'—'}\nAddress: ${d.address||'—'}`);
  lines.push(`Equipment: ${[d.equipmentId,d.manufacturer,d.model].filter(Boolean).join(' ')||'—'}\nSerial: ${d.serial||'—'} | Refrigerant: ${d.refrigerant||'—'}`);
  if((d.findings||[]).length) lines.push(`Findings: ${d.findings.join(', ')}`);
  if((d.repairs||[]).length) lines.push(`Repairs: ${d.repairs.join(', ')}`);
  if(d.techNotes) lines.push(`Technician Notes: ${d.techNotes}`);
  if((d.recommendations||[]).length) lines.push(`Recommendations: ${d.recommendations.join(', ')}`);
  if(d.recommendedWork) lines.push(`Recommended Work: ${d.recommendedWork}`);
  lines.push(`Final Status: ${d.systemStatus||'Not selected'}`);
  document.getElementById('finalSummary').textContent=lines.join('\n\n');
}
document.getElementById('reviewBtn').addEventListener('click',()=>{saveDraft();generateSummary()});
document.getElementById('printBtn').addEventListener('click',()=>{generateSummary();window.print()});
document.getElementById('exportBtn').addEventListener('click',()=>{
  const data=serializeForm(); const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`HAVARC-${data.workOrder||'service-call'}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
});

loadDraft(); showStep();
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
