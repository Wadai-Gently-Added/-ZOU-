// js/viewer.js — SVG表示(ズーム/パン)、読込、コード編集、単体保存/ダウンロード、スリープ防止、全体表示
// 依存: js/storage.js (getSaved/setSaved)。list.js/print.jsより先に読み込むこと。
// list.js/print.js から参照されるグローバル: stage, wrap, currentName, isDirty,
//   loadSVG(), guardedLoad(), fitToView(), showContextMenu()(list.jsで定義, ここから呼ぶ)

const stage = document.getElementById('stage');
const empty = document.getElementById('empty');
const wrap = document.getElementById('viewerWrap');

let scale = 1, tx = 0, ty = 0;
let currentName = null;
let suppressClickUntil = 0;
let isDirty = false;

function applyTransform(){
  stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

function fitToView(){
  const svgEl = stage.querySelector('svg');
  if(!svgEl){ scale = 1; tx = 0; ty = 0; applyTransform(); return; }
  let bbox = null;
  try{ bbox = svgEl.getBBox(); }catch(e){}
  if(!bbox || !bbox.width || !bbox.height){
    scale = 1; tx = 0; ty = 0; applyTransform(); return;
  }
  const rect = wrap.getBoundingClientRect();
  const availW = rect.width * 0.86;
  const availH = rect.height * 0.86;
  let s = Math.min(availW / bbox.width, availH / bbox.height);
  if(!isFinite(s) || s <= 0) s = 1;
  scale = Math.min(s, 10);
  // center the SVG's actual content box (not just its 0,0 origin)
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
  tx = -cx * scale;
  ty = -cy * scale;
  applyTransform();
}

function extractSvgElement(text){
  if(!text || !text.trim()) return null;
  // 1st try: strict XML parse (handles standalone SVG files, with/without xml prolog)
  try{
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    if(!doc.querySelector('parsererror')){
      const root = doc.documentElement;
      if(root && root.tagName && root.tagName.toLowerCase() === 'svg') return root;
    }
  }catch(e){}
  // 2nd try: parse as HTML fragment and look for an <svg> element inside
  try{
    const doc2 = new DOMParser().parseFromString(text, 'text/html');
    const svgEl = doc2.querySelector('svg');
    if(svgEl) return svgEl;
  }catch(e){}
  return null;
}

function loadSVG(text, name){
  const svgSource = extractSvgElement(text);
  if(!svgSource){
    alert('SVGとして読み込めなかったみゅ。中身がSVGコードか確認してね（HTMLや他のテキストは読み込めないよ）');
    return;
  }
  stage.innerHTML = '';
  const svgEl = document.importNode(svgSource, true);
  stage.appendChild(svgEl);
  stage.style.display = 'block';
  empty.style.display = 'none';
  currentName = name || null;

  svgEl.style.overflow = 'visible';
  const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
  if(vb && vb.width && vb.height){
    svgEl.style.width = vb.width + 'px';
    svgEl.style.height = vb.height + 'px';
  }
  fitToView();
}

/* ---- pinch / pan ---- */
let pointers = new Map();
let lastDist = null, lastMid = null;
let panStart = null;

wrap.addEventListener('pointerdown', e=>{
  wrap.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if(pointers.size === 1){
    panStart = { x:e.clientX, y:e.clientY, tx, ty };
  } else if(pointers.size === 2){
    const pts = [...pointers.values()];
    lastDist = Math.hypot(pts[0].x-pts[1].x, pts[0].y-pts[1].y);
    lastMid = { x:(pts[0].x+pts[1].x)/2, y:(pts[0].y+pts[1].y)/2 };
  }
});

wrap.addEventListener('pointermove', e=>{
  if(!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if(pointers.size === 1 && panStart){
    tx = panStart.tx + (e.clientX - panStart.x);
    ty = panStart.ty + (e.clientY - panStart.y);
    applyTransform();
  } else if(pointers.size === 2){
    const pts = [...pointers.values()];
    const dist = Math.hypot(pts[0].x-pts[1].x, pts[0].y-pts[1].y);
    const mid = { x:(pts[0].x+pts[1].x)/2, y:(pts[0].y+pts[1].y)/2 };
    if(lastDist){
      const factor = dist / lastDist;
      const newScale = Math.min(20, Math.max(0.05, scale * factor));
      const rect = wrap.getBoundingClientRect();
      const cx = mid.x - rect.left - rect.width/2;
      const cy = mid.y - rect.top - rect.height/2;
      tx = cx - (cx - tx) * (newScale/scale);
      ty = cy - (cy - ty) * (newScale/scale);
      scale = newScale;
      applyTransform();
    }
    lastDist = dist; lastMid = mid;
  }
});

function endPointer(e){
  pointers.delete(e.pointerId);
  if(pointers.size < 2){ lastDist = null; }
  if(pointers.size === 0){ panStart = null; }
}
wrap.addEventListener('pointerup', endPointer);
wrap.addEventListener('pointercancel', endPointer);

let lastTap = 0;
wrap.addEventListener('pointerup', e=>{
  const now = Date.now();
  if(now - lastTap < 280 && pointers.size === 0){
    fitToView();
  }
  lastTap = now;
});

/* ---- zoom buttons ---- */
document.getElementById('btnZoomIn').onclick = ()=>{ scale = Math.min(20, scale*1.3); applyTransform(); };
document.getElementById('btnZoomOut').onclick = ()=>{ scale = Math.max(0.05, scale/1.3); applyTransform(); };
document.getElementById('btnReset').onclick = fitToView;

/* ---- background toggle ---- */
document.querySelectorAll('.bgtoggle button').forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll('.bgtoggle button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    wrap.classList.remove('bg-white','bg-black','bg-checker');
    if(btn.dataset.bg === 'white') wrap.classList.add('bg-white');
    if(btn.dataset.bg === 'black') wrap.classList.add('bg-black');
    if(btn.dataset.bg === 'checker') wrap.classList.add('bg-checker');
  };
});

/* ---- clipboard ---- */
document.getElementById('btnClipboard').onclick = async ()=>{
  try{
    const text = await navigator.clipboard.readText();
    guardedLoad(()=>{ loadSVG(text, 'クリップボードから'); isDirty = true; });
  }catch(err){
    alert('クリップボードを読めなかったみゅ。Safariの設定で許可が必要な場合があるよ。「貼り付け」ボタンから手動で貼ってね');
  }
};

/* ---- paste sheet ---- */
const pasteSheet = document.getElementById('pasteSheet');
const pasteBackdrop = document.getElementById('pasteBackdrop');
function openPaste(){ pasteSheet.classList.add('open'); pasteBackdrop.classList.add('open'); }
function closePaste(){ pasteSheet.classList.remove('open'); pasteBackdrop.classList.remove('open'); }
document.getElementById('btnPaste').onclick = openPaste;
document.getElementById('pasteCancel').onclick = closePaste;
pasteBackdrop.onclick = closePaste;
document.getElementById('btnPasteLoad').onclick = ()=>{
  const val = document.getElementById('pasteBox').value;
  closePaste();
  guardedLoad(()=>{ loadSVG(val, '手動貼り付け'); isDirty = true; });
};

/* ---- file input ---- */
document.getElementById('btnFile').onclick = ()=> document.getElementById('fileInput').click();
document.getElementById('fileInput').onchange = (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=> guardedLoad(()=>{ loadSVG(reader.result, file.name); isDirty = true; });
  reader.readAsText(file);
  e.target.value = '';
};

/* ---- save current ---- */
function saveCurrent(){
  const svgEl = stage.querySelector('svg');
  if(!svgEl){ alert('保存する内容がまだ無いみゅ'); return false; }
  const arr = getSaved();
  let suggested = currentName || ('SVG ' + new Date().toLocaleString('ja-JP'));
  const base = suggested.replace(/\s*\(\d+\)\s*$/, '');
  const existingNums = arr
    .map(it => it.name)
    .filter(n => n === base || new RegExp('^' + base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\s*\\(\\d+\\)$').test(n))
    .map(n => {
      const m = n.match(/\((\d+)\)$/);
      return m ? parseInt(m[1], 10) : 1;
    });
  if(existingNums.length){
    const next = Math.max(...existingNums) + 1;
    suggested = base + '(' + next + ')';
  }
  const name = prompt('保存名を入れてね', suggested);
  if(name === null) return false;
  const now = new Date().toISOString();
  arr.unshift({ id: 's' + Date.now() + Math.random().toString(36).slice(2,7), name, content: stage.innerHTML, savedAt: now, modifiedAt: now, pinned:false, group:null });
  setSaved(arr.slice(0, 100));
  isDirty = false;
  return true;
}

document.getElementById('btnSave').onclick = ()=>{
  if(saveCurrent()) alert('保存したみゅ！');
};

wrap.addEventListener('contextmenu', (ev)=>{
  if(!stage.querySelector('svg')) return;
  ev.preventDefault();
  showContextMenu(ev.clientX, ev.clientY, [
    { label: '＋ マイSVGに登録', onClick: ()=>{
      if(saveCurrent()) alert('保存したみゅ！');
    }},
    { label: '📥 SVGファイル保存', onClick: downloadCurrentSVG },
    { label: '🖨 印刷', submenu: printSubmenuOptions((mode)=>{
      const svgEl = stage.querySelector('svg');
      if(!svgEl){ alert('表示中の内容がまだ無いみゅ'); return; }
      openSinglePrint(currentName, svgEl.outerHTML, mode);
    }, false)}
  ]);
});

// 未保存の作業中データを守るための確認モーダル
function showUnsavedPrompt(onProceed){
  const backdrop = document.createElement('div');
  backdrop.className = 'color-pick-backdrop';
  const panel = document.createElement('div');
  panel.className = 'color-pick-panel';
  panel.innerHTML = `<div class="color-pick-title">今表示中の内容が保存されてないみゅ。<br>どうする？</div>`;
  const row1 = document.createElement('button');
  row1.className = 'btn accent';
  row1.style.width = '100%'; row1.style.marginBottom = '8px';
  row1.textContent = '保存してから開く';
  row1.onclick = ()=>{
    document.body.removeChild(backdrop);
    if(saveCurrent()) onProceed();
  };
  const row2 = document.createElement('button');
  row2.className = 'btn';
  row2.style.width = '100%'; row2.style.marginBottom = '8px';
  row2.textContent = '保存せず開く';
  row2.onclick = ()=>{
    document.body.removeChild(backdrop);
    onProceed();
  };
  const row3 = document.createElement('button');
  row3.className = 'color-pick-cancel';
  row3.textContent = 'キャンセル';
  row3.onclick = ()=> document.body.removeChild(backdrop);
  panel.appendChild(row1);
  panel.appendChild(row2);
  panel.appendChild(row3);
  backdrop.appendChild(panel);
  backdrop.onclick = (e)=>{ if(e.target === backdrop) document.body.removeChild(backdrop); };
  document.body.appendChild(backdrop);
}
function guardedLoad(fn){
  if(isDirty){ showUnsavedPrompt(fn); }
  else{ fn(); }
}

function downloadCurrentSVG(){
  const svgEl = stage.querySelector('svg');
  if(!svgEl){ alert('保存する内容がまだ無いみゅ'); return; }
  const defaultName = (currentName || 'svg-export').replace(/\.[a-zA-Z0-9]+$/, '');
  const name = prompt('ファイル名を入れてね（拡張子は自動でつくよ）', defaultName);
  if(name === null) return;
  let svgText = svgEl.outerHTML;
  if(!svgText.includes('xmlns=')){
    svgText = svgText.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (name.trim() || 'svg-export') + '.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(()=> URL.revokeObjectURL(url), 3000);
}

/* ---- wake lock (常時点灯) ---- */
const wakeBtn = document.getElementById('btnWake');
const wakeSupported = ('wakeLock' in navigator) && ((navigator.maxTouchPoints || 0) > 0);
if(!wakeSupported){
  wakeBtn.style.display = 'none';
}
let wakeLock = null;
let wakeLockWanted = false;
async function requestWakeLock(){
  if(!('wakeLock' in navigator)) return false;
  try{
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', ()=>{ wakeLock = null; });
    return true;
  }catch(e){ return false; }
}
if(wakeSupported){
  wakeBtn.onclick = async ()=>{
    if(wakeLockWanted){
      wakeLockWanted = false;
      if(wakeLock){ try{ await wakeLock.release(); }catch(e){} wakeLock = null; }
      wakeBtn.classList.remove('active');
    } else {
      const ok = await requestWakeLock();
      if(ok){ wakeLockWanted = true; wakeBtn.classList.add('active'); }
      else alert('スリープ防止をオンにできなかったみゅ');
    }
  };
  document.addEventListener('visibilitychange', ()=>{
    if(wakeLockWanted && document.visibilityState === 'visible' && !wakeLock){
      requestWakeLock();
    }
  });
}

/* ---- focus mode (UIを隠す) ---- */
document.getElementById('btnFocus').onclick = ()=>{
  document.body.classList.add('focus-mode');
};
document.getElementById('exitFocusBtn').onclick = ()=>{
  document.body.classList.remove('focus-mode');
};

/* ---- code edit sheet ---- */
const codeSheet = document.getElementById('codeSheet');
const codeBackdrop = document.getElementById('codeBackdrop');
const codeBox = document.getElementById('codeBox');
function openCode(){
  const svgEl = stage.querySelector('svg');
  codeBox.value = svgEl ? svgEl.outerHTML : '';
  codeSheet.classList.add('open'); codeBackdrop.classList.add('open');
}
function closeCode(){ codeSheet.classList.remove('open'); codeBackdrop.classList.remove('open'); }
document.getElementById('codeBtn').onclick = openCode;
document.getElementById('codeCancel').onclick = closeCode;
codeBackdrop.onclick = closeCode;
document.getElementById('btnCodeApply').onclick = ()=>{
  const val = codeBox.value;
  if(!val.trim()){ alert('コードが空みゅ'); return; }
  loadSVG(val, currentName);
  isDirty = true;
  closeCode();
};
