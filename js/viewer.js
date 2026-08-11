// js/viewer.js — SVG/HTML表示(ズーム/パン)、読込、コード編集、単体保存/ダウンロード、スリープ防止、全体表示
// 依存: js/storage.js (getSaved/setSaved, currentMode), js/strings.js (STR)。list.js/print.jsより先に読み込むこと。
// list.js/print.js から参照されるグローバル: stage, wrap, currentName, isDirty,
//   loadContent(), guardedLoad(), fitToView(), showContextMenu()(list.jsで定義, ここから呼ぶ)

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

// SVGモードはgetBBox(SVG自身の座標系)、HTMLモードはiframeの固定サイズ(HTML_FRAME_WIDTH/HEIGHT)
// を使って、内容が枠の86%に収まるよう自動でスケール・中央寄せする
function fitToView(){
  const isHtml = currentMode === 'html';
  const targetEl = isHtml ? stage.querySelector('.html-content-wrap') : stage.querySelector('svg');
  if(!targetEl){ scale = 1; tx = 0; ty = 0; applyTransform(); return; }

  let box = null;
  if(isHtml){
    // iframeはCSSで固定サイズにしてあるので、実測せずその値をそのまま使う
    box = { x: 0, y: 0, width: HTML_FRAME_WIDTH, height: HTML_FRAME_HEIGHT };
  } else {
    try{ box = targetEl.getBBox(); }catch(e){}
  }
  if(!box || !box.width || !box.height){ scale = 1; tx = 0; ty = 0; applyTransform(); return; }

  const rect = wrap.getBoundingClientRect();
  const availW = rect.width * 0.86;
  const availH = rect.height * 0.86;
  let s = Math.min(availW / box.width, availH / box.height);
  if(!isFinite(s) || s <= 0) s = 1;
  scale = Math.min(s, 10);
  // center the content's actual box (not just its 0,0 origin)
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
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

// SVGモード: <svg>タグを厳密に取り出して読み込む
function loadSvgContent(text, name){
  const svgSource = extractSvgElement(text);
  if(!svgSource){
    alert(STR.svg.parseError);
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

// HTMLモード: 読み込んだHTMLをそのままメイン画面に埋め込むと、そのHTML内のポップアップや
// 固定表示要素がうちのアプリのUIごと覆ってしまう事故が起きるため、iframe(sandbox属性つき)に
// 完全隔離して表示する。読み込んだHTML側のCSS/JSがアプリ本体に一切影響しない。
// currentHtmlSource に元のテキストを保持しておき、保存/ダウンロード/コード編集はそちらを使う
// (sandbox="allow-scripts"のみでallow-same-originを付けないため、iframeの中身をJSから
//  直接読み返すことはできない設計)
let currentHtmlSource = null;
const HTML_FRAME_WIDTH = 1280;
const HTML_FRAME_HEIGHT = 800;
// false=閲覧モード(ズーム/ドラッグ優先、iframe内はクリック不可)
// true=操作モード(iframe内のボタン/プルダウン等を直接操作できるが、その上でのズーム/ドラッグは効かない)
let htmlInteractMode = false;

function updateHtmlInteractButton(){
  const btn = document.getElementById('btnHtmlInteract');
  if(!btn) return;
  if(currentMode !== 'html'){ btn.style.display = 'none'; return; }
  btn.style.display = '';
  btn.textContent = htmlInteractMode ? STR.common.htmlModeViewLabel : STR.common.htmlModeInteractLabel;
  btn.classList.toggle('active', htmlInteractMode);
}

// 操作モードの実体: iframeを#stage(拡大縮小のtransformがかかっている)から、
// transformの影響を一切受けない#interactStageへ物理的に移動させる。
// スケール1にリセットするだけでは、ブラウザによっては祖先のtranslateだけでも
// ネイティブのプルダウン位置がズレることがあるため、要素ごと外に出すのが確実。
const interactStage = document.getElementById('interactStage');
function setHtmlInteractMode(on){
  htmlInteractMode = on;
  const frame = on ? interactStage.querySelector('.html-content-wrap') : stage.querySelector('.html-content-wrap');
  if(!frame){ updateHtmlInteractButton(); return; }
  frame.style.pointerEvents = 'auto'; // 移動先ではどちらの場合も直接操作可能にする
  if(on){
    frame.style.width = '';
    frame.style.height = '';
    interactStage.appendChild(frame);
    interactStage.style.display = 'block';
    stage.style.display = 'none';
  } else {
    frame.style.pointerEvents = 'none';
    frame.style.width = HTML_FRAME_WIDTH + 'px';
    frame.style.height = HTML_FRAME_HEIGHT + 'px';
    stage.appendChild(frame);
    interactStage.style.display = 'none';
    stage.style.display = 'block';
  }
  updateHtmlInteractButton();
}
document.getElementById('btnHtmlInteract').onclick = ()=> setHtmlInteractMode(!htmlInteractMode);

function loadHtmlContent(text, name){
  if(!text || !text.trim()){
    alert(STR.html.parseError);
    return;
  }
  stage.innerHTML = '';
  const frame = document.createElement('iframe');
  frame.className = 'html-content-wrap';
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.style.width = HTML_FRAME_WIDTH + 'px';
  frame.style.height = HTML_FRAME_HEIGHT + 'px';
  frame.style.border = 'none';
  frame.style.display = 'block';
  frame.srcdoc = text;
  stage.appendChild(frame);
  stage.style.display = 'block';
  empty.style.display = 'none';
  currentName = name || null;
  currentHtmlSource = text;
  htmlInteractMode = false; // 新しく読み込んだら毎回、安全な閲覧モードから始める
  frame.style.pointerEvents = 'none';
  updateHtmlInteractButton();
  fitToView();
}

function loadContent(text, name){
  if(currentMode === 'html') loadHtmlContent(text, name);
  else loadSvgContent(text, name);
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

/* ---- wheel zoom (PC向け。カーソル位置を中心に拡大縮小) ---- */
wrap.addEventListener('wheel', (e)=>{
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.08 : 1/1.08;
  const newScale = Math.min(20, Math.max(0.05, scale * factor));
  const rect = wrap.getBoundingClientRect();
  const cx = e.clientX - rect.left - rect.width/2;
  const cy = e.clientY - rect.top - rect.height/2;
  tx = cx - (cx - tx) * (newScale/scale);
  ty = cy - (cy - ty) * (newScale/scale);
  scale = newScale;
  applyTransform();
}, { passive:false });

/* ---- zoom/reset ---- */
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
    guardedLoad(()=>{ loadContent(text, STR.common.fromClipboardName); isDirty = true; });
  }catch(err){
    alert(STR.common.clipboardReadFailed);
  }
};

/* ---- paste sheet ---- */
const pasteSheet = document.getElementById('pasteSheet');
const pasteBackdrop = document.getElementById('pasteBackdrop');
function openPaste(){ closeAllSheets(); pasteSheet.classList.add('open'); pasteBackdrop.classList.add('open'); }
function closePaste(){ pasteSheet.classList.remove('open'); pasteBackdrop.classList.remove('open'); }
document.getElementById('btnPaste').onclick = openPaste;
document.getElementById('pasteCancel').onclick = closePaste;
pasteBackdrop.onclick = closePaste;
document.getElementById('btnPasteLoad').onclick = ()=>{
  const val = document.getElementById('pasteBox').value;
  closePaste();
  guardedLoad(()=>{ loadContent(val, STR.common.manualPasteName); isDirty = true; });
};

/* ---- file input ---- */
document.getElementById('btnFile').onclick = ()=> document.getElementById('fileInput').click();
document.getElementById('fileInput').onchange = (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=> guardedLoad(()=>{ loadContent(reader.result, file.name); isDirty = true; });
  reader.readAsText(file);
  e.target.value = '';
};

// SVG/HTML両モードで「今表示中の内容」を一貫して取得するためのヘルパー
function hasStageContent(){
  return currentMode === 'html' ? !!stage.querySelector('.html-content-wrap') : !!stage.querySelector('svg');
}
function currentContentString(){
  if(currentMode === 'html'){
    // iframeはsandbox(allow-same-origin無し)で中身を読み返せないため、
    // 読込時に保持しておいた元テキスト(currentHtmlSource)をそのまま使う
    return currentHtmlSource;
  }
  const el = stage.querySelector('svg');
  return el ? el.outerHTML : null;
}

/* ---- save current ---- */
function saveCurrent(){
  if(!hasStageContent()){ alert(STR.mode().noSaveContent); return false; }
  const arr = getSaved();
  let suggested = currentName || ((currentMode === 'html' ? 'HTML ' : 'SVG ') + new Date().toLocaleString('ja-JP'));
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
  const name = prompt(STR.common.savePrompt, suggested);
  if(name === null) return false;
  const now = new Date().toISOString();
  arr.unshift({ id: 's' + Date.now() + Math.random().toString(36).slice(2,7), name, content: currentContentString(), savedAt: now, modifiedAt: now, pinned:false, group:null });
  setSaved(arr.slice(0, 100));
  isDirty = false;
  return true;
}

document.getElementById('btnSave').onclick = ()=>{
  if(saveCurrent()) alert(STR.common.saveSuccess);
};

wrap.addEventListener('contextmenu', (ev)=>{
  if(!hasStageContent()) return;
  ev.preventDefault();
  showContextMenu(ev.clientX, ev.clientY, [
    { label: STR.mode().registerMenu, onClick: ()=>{
      if(saveCurrent()) alert(STR.common.saveSuccess);
    }},
    { label: STR.mode().downloadMenu, onClick: downloadCurrentFile },
    { label: STR.common.itemMenuPrint, submenu: printSubmenuOptions((mode)=>{
      const content = currentContentString();
      if(!content){ alert(STR.mode().noStageContent); return; }
      openSinglePrint(currentName, content, mode);
    })}
  ]);
});

// 未保存の作業中データを守るための確認モーダル
function showUnsavedPrompt(onProceed){
  const backdrop = document.createElement('div');
  backdrop.className = 'color-pick-backdrop';
  const panel = document.createElement('div');
  panel.className = 'color-pick-panel';
  panel.innerHTML = `<div class="color-pick-title">${STR.common.unsavedPromptHtml}</div>`;
  const row1 = document.createElement('button');
  row1.className = 'btn accent';
  row1.style.width = '100%'; row1.style.marginBottom = '8px';
  row1.textContent = STR.common.unsavedSaveThenOpen;
  row1.onclick = ()=>{
    document.body.removeChild(backdrop);
    if(saveCurrent()) onProceed();
  };
  const row2 = document.createElement('button');
  row2.className = 'btn';
  row2.style.width = '100%'; row2.style.marginBottom = '8px';
  row2.textContent = STR.common.unsavedOpenWithoutSave;
  row2.onclick = ()=>{
    document.body.removeChild(backdrop);
    onProceed();
  };
  const row3 = document.createElement('button');
  row3.className = 'color-pick-cancel';
  row3.textContent = STR.common.cancel;
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

function downloadCurrentFile(){
  const content = currentContentString();
  if(!content){ alert(STR.mode().noSaveContent); return; }
  const isHtml = currentMode === 'html';
  const defaultName = (currentName || STR.mode().defaultExportName).replace(/\.[a-zA-Z0-9]+$/, '');
  const name = prompt(STR.common.downloadNamePrompt, defaultName);
  if(name === null) return;
  let outText = content;
  if(!isHtml && !outText.includes('xmlns=')){
    outText = outText.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const blob = new Blob([outText], { type: isHtml ? 'text/html' : 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (name.trim() || STR.mode().defaultExportName) + (isHtml ? '.html' : '.svg');
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
      else alert(STR.common.wakeLockFailed);
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
  closeAllSheets();
  codeBox.value = currentContentString() || '';
  codeSheet.classList.add('open'); codeBackdrop.classList.add('open');
}
function closeCode(){ codeSheet.classList.remove('open'); codeBackdrop.classList.remove('open'); }
document.getElementById('codeBtn').onclick = openCode;
document.getElementById('codeCancel').onclick = closeCode;
codeBackdrop.onclick = closeCode;
document.getElementById('btnCodeApply').onclick = ()=>{
  const val = codeBox.value;
  if(!val.trim()){ alert(STR.common.codeEmpty); return; }
  loadContent(val, currentName);
  isDirty = true;
  closeCode();
};
