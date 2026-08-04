// js/print.js — 印刷プレビュー構築(SVG手順/コード一覧/チェックリスト)、選んで印刷モード
// 依存: js/storage.js (getSaved/getGroups)。list.jsから呼ばれる関数をここに定義。
// list.js から参照されるグローバル: printSelectGroupId, printSelectedIds,
//   enterPrintSelectMode(), exitPrintSelectMode(), updatePrintSelectBar(),
//   printSubmenuOptions(), openSinglePrint(), openGroupPrint(), openMultiPrint()

const printSheet = document.getElementById('printSheet');
const printBackdrop = document.getElementById('printBackdrop');

function escHtml(s){
  return (s == null ? '' : String(s)).replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function fmtDate(iso){
  if(!iso) return '-';
  try{ return new Date(iso).toLocaleString('ja-JP'); }catch(e){ return '-'; }
}

// ビューア表示用に固定px幅/高さが焼き付いたSVGコードを、
// 印刷の小さな枠にきれいに収まるよう相対サイズに作り替える
function svgForThumbnail(code){
  try{
    const tmp = document.createElement('div');
    tmp.innerHTML = code;
    const svgEl = tmp.querySelector('svg');
    if(svgEl){
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');
      svgEl.style.width = '100%';
      svgEl.style.height = '100%';
      svgEl.style.maxWidth = '100%';
      svgEl.style.maxHeight = '100%';
      svgEl.style.overflow = 'visible';
      if(!svgEl.getAttribute('preserveAspectRatio')){
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      }
      return tmp.innerHTML;
    }
  }catch(e){}
  return code;
}

// ① 画像モード: 折り紙の手順書のように「①SVG+ファイル名」を→でつないで並べる
function buildFlowSection(items){
  const cells = items.map((it, i)=>{
    const nameEsc = escHtml(it.name || '(無題)');
    return `
      <div class="flow-step">
        <div class="flow-num">${i+1}</div>
        <div class="flow-svg">${svgForThumbnail(it.content)}</div>
        <div class="flow-name">${nameEsc}</div>
      </div>`;
  });
  const parts = [];
  cells.forEach((c,i)=>{
    parts.push(c);
    if(i < cells.length - 1) parts.push('<div class="flow-arrow">→</div>');
  });
  return `
    <div class="print-page flow-page">
      <div class="print-title">SVG 手順</div>
      <div class="flow-grid">${parts.join('')}</div>
      <div class="print-note-label">備考・メモ欄（タップして入力できるよ）</div>
      <div class="print-note-box" contenteditable="true"></div>
    </div>
  `;
}

// ② コードモード: ファイル名+作成日時+修正日時の一覧表 → その下に各コード
function buildCodeListSection(items){
  const rows = items.map((it,i)=>{
    const nameEsc = escHtml(it.name || '(無題)');
    return `<tr><td>${i+1}</td><td>${nameEsc}</td><td>${fmtDate(it.savedAt)}</td><td>${fmtDate(it.modifiedAt || it.savedAt)}</td></tr>`;
  }).join('');
  const entries = items.map((it,i)=>{
    const nameEsc = escHtml(it.name || '(無題)');
    const codeEsc = escHtml(it.content);
    return `
      <div class="code-entry">
        <div class="code-entry-title">${i+1}. ${nameEsc}</div>
        <pre class="print-code">${codeEsc}</pre>
      </div>`;
  }).join('');
  return `
    <div class="print-page">
      <div class="print-title">SVG コード一覧</div>
      <table class="code-list-table">
        <thead><tr><th>#</th><th>ファイル名</th><th>作成日時</th><th>修正日時</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${entries}
    </div>
  `;
}

// mode: 'image' | 'code' | 'both'  /  items: [{name, content, savedAt, modifiedAt}, ...]
function buildPrintOutput(items, mode){
  let html = '';
  if(mode === 'image' || mode === 'both') html += buildFlowSection(items);
  if(mode === 'code' || mode === 'both') html += buildCodeListSection(items);
  return html;
}

function printModeLabel(mode){
  return mode === 'image' ? 'SVG' : mode === 'code' ? 'コード' : 'SVG＋コード';
}

function openPrintSheet(html, title){
  document.getElementById('printArea').innerHTML = html;
  document.getElementById('printSheetTitle').textContent = title || '印刷プレビュー';
  const area = document.getElementById('printArea');
  if(area) area.scrollTop = 0;
  window.scrollTo(0, 0);
  printSheet.classList.add('open'); printBackdrop.classList.add('open');
}

function printSubmenuOptions(onPick){
  return [
    { label: '🖼 SVG(画像)のみ', onClick: ()=> onPick('image') },
    { label: '🔤 コードのみ', onClick: ()=> onPick('code') },
    { label: '🖼🔤 SVG＋コード', onClick: ()=> onPick('both') }
  ];
}

function openSinglePrint(name, code, mode, meta){
  const now = new Date().toISOString();
  const item = {
    name,
    content: code,
    savedAt: (meta && meta.savedAt) || now,
    modifiedAt: (meta && meta.modifiedAt) || (meta && meta.savedAt) || now
  };
  openPrintSheet(buildPrintOutput([item], mode), `${name || '(無題)'}　印刷（${printModeLabel(mode)}）`);
}

function buildChecklistHTML(groupName, items){
  const dateText = new Date().toLocaleString('ja-JP');
  const rows = items.map((it,i)=>{
    const nameEsc = escHtml(it.name || '(無題)');
    return `
      <div class="checklist-row">
        <span class="checklist-box">☐</span>
        <span class="checklist-num">${i+1}.</span>
        <span class="checklist-name">${nameEsc}</span>
      </div>`;
  }).join('');
  const nameEsc = escHtml(groupName || 'チェックリスト');
  return `
    <div class="print-page checklist-page">
      <div class="print-title">${nameEsc}　一覧</div>
      <div class="print-meta">作成日時: ${dateText}</div>
      <div class="print-meta">項目数: ${items.length}件</div>
      <div class="checklist-list">${rows}</div>
    </div>`;
}

function openGroupPrint(groupId, groupName, mode){
  const items = getSaved().filter(it => (it.group||null) === groupId);
  if(items.length === 0){ alert('このグループにはSVGが無いみゅ'); return; }
  // 複数件まとめて印刷する時は先頭に一覧(チェックリスト)ページを付ける
  const indexHtml = buildChecklistHTML(groupName, items);
  openPrintSheet(indexHtml + buildPrintOutput(items, mode), `${groupName || 'グループ'}　一括印刷（${printModeLabel(mode)}・全${items.length}件）`);
}

// 選んだ項目だけをまとめて印刷する
function openMultiPrint(items, mode, title){
  if(items.length === 0){ alert('1件も選ばれてないみゅ'); return; }
  const indexHtml = buildChecklistHTML(title, items);
  openPrintSheet(indexHtml + buildPrintOutput(items, mode), `${title || '選択した項目'}　印刷（${printModeLabel(mode)}・全${items.length}件）`);
}

// ---- 選んで印刷モード ----
let printSelectGroupId = null;
const printSelectedIds = new Set();

function enterPrintSelectMode(groupId){
  printSelectGroupId = groupId;
  printSelectedIds.clear();
  // 折りたたまれたグループのまま選択モードに入るとチェックボックスが
  // 見えなくて押せなくなるので、対象グループを強制的に展開する
  const groups = getGroups();
  const g = groups.find(x => x.id === groupId);
  if(g && g.collapsed){ g.collapsed = false; setGroups(groups); }
  renderList();
}
function exitPrintSelectMode(){
  printSelectGroupId = null;
  printSelectedIds.clear();
  renderList();
}
function updatePrintSelectBar(){
  const bar = document.getElementById('printSelectBar');
  if(!bar) return;
  if(printSelectGroupId === null){ bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  const count = document.querySelectorAll('#savedList .print-select-box:checked').length;
  document.getElementById('printSelectCount').textContent = `選択中: ${count}件`;
}

document.getElementById('printCancel').onclick = ()=>{
  printSheet.classList.remove('open'); printBackdrop.classList.remove('open');
};
printBackdrop.onclick = ()=>{
  printSheet.classList.remove('open'); printBackdrop.classList.remove('open');
};
document.getElementById('btnDoPrint').onclick = ()=>{
  const area = document.getElementById('printArea');
  if(area) area.scrollTop = 0;
  window.scrollTo(0, 0);
  setTimeout(()=> window.print(), 50);
};
