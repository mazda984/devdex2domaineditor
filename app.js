const el = sel => document.querySelector(sel);
const goBtn = el('#go');
const suggestionsEl = el('#suggestions');
suggestionsEl.style.display = 'none';
const editorModal = el('#editorModal');
const editorArea = el('#editorArea');
const closeEditor = el('#closeEditor');
const previewBtn = el('#previewBtn');
const openBtn = el('#openBtn');

function getSelectedTlds(){
  return Array.from(document.querySelectorAll('.options input[type=checkbox]:checked'))
    .map(i=>i.value);
}

// generate a random mixed-case string length 10-13
function randLabel(len){
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = '';
  for(let i=0;i<len;i++) s += chars.charAt(Math.floor(Math.random()*chars.length));
  return s;
}

function makeCandidates(_, tlds){
  tlds = tlds.length ? tlds : ['.com'];
  const set = new Set();
  for(let i=0;i<24;i++){
    const L = 10 + Math.floor(Math.random()*4);
    const name = randLabel(L);
    tlds.forEach(t=> set.add(name + t));
  }
  return Array.from(set);
}

function renderCard(name){
  const card = document.createElement('div');
  card.className = 'card';
  const nm = document.createElement('div');
  nm.className = 'name';
  const url = `https://${name}`;
  nm.textContent = url;
  const meta = document.createElement('div');
  meta.className = 'meta';
  const st = document.createElement('div');
  st.className = 'status available';
  st.textContent = 'Oluşturuldu';
  const actions = document.createElement('div');
  actions.className = 'actions';

  const copy = document.createElement('button');
  copy.className = 'btn copy';
  copy.textContent = 'Kopyala';
  copy.addEventListener('click', async ()=>{
    await navigator.clipboard.writeText(url).catch(()=>null);
    copy.textContent = 'Kopyalandı';
    setTimeout(()=>copy.textContent = 'Kopyala',1200);
  });

  const edit = document.createElement('button');
  edit.className = 'btn copy';
  edit.textContent = 'Siteyi düzenle';
  edit.addEventListener('click', ()=>{
    // open modal with default content
    editorModal.setAttribute('aria-hidden','false');
    editorArea.value = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${name}</title>
  <meta name="description" content="Düzenlenebilir sayfa: ${name}">
  <meta property="og:title" content="${name}">
</head>
<body style="font-family:system-ui,Arial;display:flex;align-items:center;justify-content:center;height:100vh">
  <div style="text-align:center">
    <h1>${name}</h1>
    <p>Bu, oluşturulmuş geçici sayfadır.</p>
  </div>
</body>
</html>`;
    // store current target name on modal for opening
    editorModal.dataset.target = name;
  });

  const open = document.createElement('button');
  open.className = 'btn register';
  open.textContent = 'Aç';
  open.addEventListener('click', ()=> {
    // always save a minimal preview into localStorage and open the persistent preview page
    const storageKey = `site_${name}`;
    const saved = localStorage.getItem(storageKey);
    if(!saved){
      const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${name}</title>
  <meta name="description" content="Geçici oluşturulmuş site: ${name}">
  <meta property="og:title" content="${name}">
</head>
<body style="font-family:system-ui,Arial;display:flex;align-items:center;justify-content:center;height:100vh">
  <div style="text-align:center">
    <h1>${name}</h1>
    <p>Geçici oluşturulmuş site.</p>
  </div>
</body>
</html>`;
      try{
        localStorage.setItem(storageKey, html);
      }catch(e){
        // fallback: if storage fails, still open preview without saving by using a transient key
        console.warn('localStorage.setItem failed', e);
      }
    }
    // always include an encoded data fallback so others can view the preview even without the localStorage key
    const data = btoa(encodeURIComponent(html));
    const base = `${location.origin}${location.pathname.replace(/\/[^/]*$/, '/') || '/'}preview.html`;
    const u = `${base}?id=${encodeURIComponent(storageKey)}&data=${encodeURIComponent(data)}`;
    window.open(u, '_blank');
  });

  actions.appendChild(copy);
  actions.appendChild(edit);
  actions.appendChild(open);
  meta.appendChild(st);
  meta.appendChild(actions);
  card.appendChild(nm);
  card.appendChild(meta);
  return card;
}

function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr }

async function generate(){
  // show suggestions area when generation starts
  suggestionsEl.style.display = 'grid';
  // ignore typed keywords — always create random labels
  const tlds = getSelectedTlds();
  suggestionsEl.innerHTML = '';
  const spinner = document.createElement('div');
  spinner.textContent = 'Rastgele URL\'ler oluşturuluyor…';
  spinner.style.color = '#666';
  suggestionsEl.appendChild(spinner);

  const candidates = makeCandidates('', tlds);
  const list = shuffle(candidates).slice(0,3);
  suggestionsEl.innerHTML = '';
  for(const name of list){
    const card = renderCard(name);
    suggestionsEl.appendChild(card);
  }
}

const domainModal = document.getElementById('domainModal');
const closeDomain = document.getElementById('closeDomain');
const createDomainBtn = document.getElementById('createDomainBtn');
const dashboardModal = document.getElementById('dashboardModal');
const closeDashboard = document.getElementById('closeDashboard');
const dashUrlEl = document.getElementById('dashUrl');
const dashCopy = document.getElementById('dashCopy');
const dashEdit = document.getElementById('dashEdit');
const dashOpen = document.getElementById('dashOpen');

goBtn.addEventListener('click', ()=>{
  domainModal.setAttribute('aria-hidden','false');
});

// domain modal controls
closeDomain.addEventListener('click', ()=> domainModal.setAttribute('aria-hidden','true'));

function getDomainModalSelectedTlds(){
  return Array.from(domainModal.querySelectorAll('.options input[type=checkbox]:checked')).map(i=>i.value);
}

// create domain inside app and open dashboard
createDomainBtn.addEventListener('click', ()=>{
  const tlds = getDomainModalSelectedTlds();
  if(!tlds.length){ alert('En az bir uzantı seçin'); return; }
  const L = 10 + Math.floor(Math.random()*4);
  const name = randLabel(L) + tlds[Math.floor(Math.random()*tlds.length)];
  const storageKey = `site_${name}`;
  const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${name}</title>
  <meta name="description" content="Oluşturulmuş geçici site: ${name}">
  <meta property="og:title" content="${name}">
</head>
<body style="font-family:system-ui,Arial;display:flex;align-items:center;justify-content:center;height:100vh">
  <div style="text-align:center">
    <h1>${name}</h1>
    <p>Oluşturuldu.</p>
  </div>
</body>
</html>`;
  try{ localStorage.setItem(storageKey, html); }catch(e){ console.warn('localStorage fail', e) }
  domainModal.setAttribute('aria-hidden','true');

  // show dashboard modal with details and actions
  dashUrlEl.textContent = `https://${name}`;
  dashboardModal.dataset.target = name;
  dashboardModal.dataset.key = storageKey;
  dashboardModal.setAttribute('aria-hidden','false');

  // update suggestions area to include the created domain at top
  suggestionsEl.prepend(renderCard(name));
});

// dashboard controls
closeDashboard.addEventListener('click', ()=> dashboardModal.setAttribute('aria-hidden','true'));
dashCopy.addEventListener('click', async ()=>{
  const name = dashboardModal.dataset.target;
  if(!name) return;
  await navigator.clipboard.writeText(`https://${name}`).catch(()=>null);
  dashCopy.textContent = 'Kopyalandı';
  setTimeout(()=>dashCopy.textContent = 'Kopyala',1200);
});
dashEdit.addEventListener('click', ()=>{
  const name = dashboardModal.dataset.target;
  if(!name) return;
  editorModal.setAttribute('aria-hidden','false');
  editorArea.value = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${name}</title>
  <meta name="description" content="Düzenlenebilir sayfa: ${name}">
  <meta property="og:title" content="${name}">
</head>
<body style="font-family:system-ui,Arial;display:flex;align-items:center;justify-content:center;height:100vh">
  <div style="text-align:center">
    <h1>${name}</h1>
    <p>Bu, oluşturulmuş sayfanızdır. Düzenleyin.</p>
  </div>
</body>
</html>`;
  editorModal.dataset.target = name;
  dashboardModal.setAttribute('aria-hidden','true');
});
dashOpen.addEventListener('click', ()=>{
  const key = dashboardModal.dataset.key;
  if(!key) return;
  const u = `${location.origin}${location.pathname.replace(/\/[^/]*$/, '/') || '/'}preview.html?id=${encodeURIComponent(key)}`;
  // open preview in a new browser tab — preview page reads localStorage
  window.open(u, '_blank');
  dashboardModal.setAttribute('aria-hidden','true');
});


// modal controls
closeEditor.addEventListener('click', ()=>{
  editorModal.setAttribute('aria-hidden','true');
});
previewBtn.addEventListener('click', ()=>{
  const html = editorArea.value;
  const target = editorModal.dataset.target || `site_${Date.now()}`;
  const storageKey = target.startsWith('site_') ? target : `site_${target}`;
  // save to localStorage for persistent preview
  localStorage.setItem(storageKey, html);
  // open persistent preview page with id query
  const u = `${location.origin}${location.pathname.replace(/\/[^/]*$/, '/') || '/'}preview.html?id=${encodeURIComponent(storageKey)}`;
  window.open(u, '_blank');
});

openBtn.addEventListener('click', ()=>{
  const html = editorArea.value;
  const target = editorModal.dataset.target || `site_${Date.now()}`;
  const storageKey = target.startsWith('site_') ? target : `site_${target}`;
  localStorage.setItem(storageKey, html);
  // open preview and include the page html as encoded data so others can load it without localStorage
  const data = btoa(encodeURIComponent(html));
  const base = `${location.origin}${location.pathname.replace(/\/[^/]*$/, '/') || '/'}preview.html`;
  const u = `${base}?id=${encodeURIComponent(storageKey)}&data=${encodeURIComponent(data)}`;
  window.open(u, '_blank');
  editorModal.setAttribute('aria-hidden','true');
});

 // starter: hide suggestions until user generates
 // (generation is triggered only when user clicks "Site Oluştur" which opens domain modal;
 // when a domain is created or generate() is explicitly called suggestions are shown)
