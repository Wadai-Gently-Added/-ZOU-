// js/print.js — 印刷プレビュー構築、選んで印刷モード
// 依存: js/storage.js (getSaved/getGroups)。list.jsから呼ばれる関数をここに定義。
// list.js から参照されるグローバル: printSelectActive, printSelectedIds,
//   enterPrintSelectMode(), exitPrintSelectMode(), updatePrintSelectBar(),
//   printSubmenuOptions(), openSinglePrint(), openGroupPrint(), openGroupChecklist(), openMultiPrint()
//
// 【今回の設計】
// - グループ一括印刷 → チェックリスト(一覧)専用。
// - 選んで印刷(複数選択) → グループを跨いで好きな項目にチェックを付けられる「全体選択モード」。
//   画像は折り紙の手順書のような番号+矢印でつなぐフロー形式(buildFlowSection、以前廃止したが復活)。
// - 単品印刷(1件) → 大きいSVGプレビュー + サイズ/ViewBox表 + メモ欄(buildSingleImageSection)。
// 画像レイアウトは「1件だけなら個別表示、複数件ならフロー形式」で自動的に出し分ける。

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
// 印刷の枠にきれいに収まるよう「実際の描画範囲(getBBox)」を測って
// viewBoxを引き直す。viewBoxが無い/ズレているSVGでもこれで正しく縮小される。
function svgForThumbnail(code){
  let tmp = null;
  try{
    tmp = document.createElement('div');
    tmp.style.position = 'absolute';
    tmp.style.left = '-9999px';
    tmp.style.top = '-9999px';
    tmp.style.width = '0';
    tmp.style.height = '0';
    tmp.style.overflow = 'hidden';
    tmp.innerHTML = code;
    document.body.appendChild(tmp);
    const svgEl = tmp.querySelector('svg');
    if(svgEl){
      svgEl.style.overflow = 'visible';
      let bbox = null;
      try{ bbox = svgEl.getBBox(); }catch(e){}
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');
      if(bbox && bbox.width && bbox.height){
        svgEl.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      }
      svgEl.style.width = '100%';
      svgEl.style.height = '100%';
      svgEl.style.maxWidth = '100%';
      svgEl.style.maxHeight = '100%';
      svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      const result = tmp.innerHTML;
      document.body.removeChild(tmp);
      return result;
    }
  }catch(e){}
  if(tmp && tmp.parentNode) tmp.parentNode.removeChild(tmp);
  return code;
}

// SVGコードから「サイズ」「ViewBox」の表示用テキストを取り出す
function getSvgMeta(code){
  try{
    const tmp = document.createElement('div');
    tmp.innerHTML = code;
    const svgEl = tmp.querySelector('svg');
    if(!svgEl) return { size: '-', viewBox: '-' };
    const vb = svgEl.getAttribute('viewBox');
    const vbParts = vb ? vb.trim().split(/\s+/) : null;
    const w = svgEl.getAttribute('width') || (vbParts ? vbParts[2] : '-');
    const h = svgEl.getAttribute('height') || (vbParts ? vbParts[3] : '-');
    return { size: `${w} × ${h}`, viewBox: vb || '-' };
  }catch(e){ return { size: '-', viewBox: '-' }; }
}

// 複数グループから抜粋した時に「どのグループの項目か」が分かるよう名前を引く
function getGroupNameOf(item){
  if(!item.group) return null;
  const g = getGroups().find(x => x.id === item.group);
  return g ? g.name : null;
}

// 複数件用: 折り紙の手順書のように「①SVG+ファイル名」を→でつないで並べる
// withArrows=false にすると矢印を挟まない、ただの一覧(グリッド)として出力できる
function buildFlowSection(items, withArrows){
  const cells = items.map((it, i)=>{
    const nameEsc = escHtml(it.name || '(無題)');
    const groupName = getGroupNameOf(it);
    const groupLine = groupName ? `<div class="flow-group">${escHtml(groupName)}</div>` : '';
    return `
      <div class="flow-step">
        <div class="flow-num">${i+1}</div>
        <div class="flow-svg">${svgForThumbnail(it.content)}</div>
        <div class="flow-name">${nameEsc}</div>
        ${groupLine}
      </div>`;
  });
  const parts = [];
  cells.forEach((c,i)=>{
    parts.push(c);
    if(withArrows && i < cells.length - 1) parts.push('<div class="flow-arrow">→</div>');
  });
  const titleText = withArrows ? 'SVG 手順' : 'SVG 一覧';
  return `
    <div class="print-page flow-page">
      <div class="print-title">${titleText}</div>
      <div class="flow-grid${withArrows ? '' : ' flow-grid-noarrow'}">${parts.join('')}</div>
      <div class="print-note-label">備考・メモ欄（タップして入力できるよ）</div>
      <div class="print-note-box" contenteditable="true"></div>
    </div>
  `;
}

// 単品印刷用: 大きいSVGプレビュー + サイズ/ViewBox表 + メモ欄
function buildSingleImageSection(item){
  const nameEsc = escHtml(item.name || '(無題)');
  const meta = getSvgMeta(item.content);
  const groupName = getGroupNameOf(item);
  return `
    <div class="print-page single-page">
      <div class="print-title">${nameEsc}</div>
      ${groupName ? `<div class="print-meta">グループ: ${escHtml(groupName)}</div>` : ''}
      <div class="print-meta">作成日時: ${fmtDate(item.savedAt)}</div>
      <div class="single-svg-frame">${svgForThumbnail(item.content)}</div>
      <table class="code-list-table single-meta-table">
        <tr><th>サイズ</th><td>${escHtml(meta.size)}</td></tr>
        <tr><th>ViewBox</th><td>${escHtml(meta.viewBox)}</td></tr>
      </table>
      <div class="print-note-label">備考・メモ欄（タップして入力できるよ）</div>
      <div class="print-note-box" contenteditable="true"></div>
    </div>
  `;
}

// コードモード: ファイル名+グループ+作成日時+修正日時の一覧表 → その下に各コード
function buildCodeListSection(items){
  const rows = items.map((it,i)=>{
    const nameEsc = escHtml(it.name || '(無題)');
    const groupName = getGroupNameOf(it);
    return `<tr><td>${i+1}</td><td>${nameEsc}</td><td>${groupName ? escHtml(groupName) : '-'}</td><td>${fmtDate(it.savedAt)}</td><td>${fmtDate(it.modifiedAt || it.savedAt)}</td></tr>`;
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
        <thead><tr><th>#</th><th>ファイル名</th><th>グループ</th><th>作成日時</th><th>修正日時</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${entries}
    </div>
  `;
}

// mode: 'image'(矢印あり手順) | 'image-grid'(矢印なし一覧) | 'code' | 'both'
// items: [{name, content, savedAt, modifiedAt}, ...]
// 画像は「1件だけなら個別表示、複数件ならフロー形式(矢印の有無はmodeで指定)」で自動的に出し分ける
function buildPrintOutput(items, mode){
  let html = '';
  if(mode === 'image' || mode === 'image-grid' || mode === 'both'){
    html += (items.length === 1) ? buildSingleImageSection(items[0]) : buildFlowSection(items, mode !== 'image-grid');
  }
  if(mode === 'code' || mode === 'both') html += buildCodeListSection(items);
  return html;
}

function printModeLabel(mode){
  if(mode === 'image') return 'SVG手順';
  if(mode === 'image-grid') return 'SVG一覧';
  if(mode === 'code') return 'コード';
  return 'SVG＋コード';
}

function openPrintSheet(html, title){
  closeAllSheets();
  document.getElementById('printArea').innerHTML = html;
  document.getElementById('printSheetTitle').textContent = title || '印刷プレビュー';
  const area = document.getElementById('printArea');
  if(area) area.scrollTop = 0;
  window.scrollTo(0, 0);
  printSheet.classList.add('open'); printBackdrop.classList.add('open');
}

// 単品印刷・選んで印刷・グループ一括印刷で共通の4択。チェックリストはここには含めない
// (チェックリストはグループ一括印刷専用の別ボタンとして独立させたため)
function printSubmenuOptions(onPick){
  return [
    { label: '🖼 SVG印刷(手順・矢印あり)', onClick: ()=> onPick('image') },
    { label: '📋 SVG一覧印刷(矢印なし)', onClick: ()=> onPick('image-grid') },
    { label: '🔤 コード印刷', onClick: ()=> onPick('code') },
    { label: '🖼🔤 SVG＋コード印刷', onClick: ()=> onPick('both') }
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

// グループのチェックリスト(一覧)だけを印刷
function openGroupChecklist(groupId, groupName){
  const items = getSaved().filter(it => (it.group||null) === groupId);
  if(items.length === 0){ alert('このグループにはSVGが無いみゅ'); return; }
  openPrintSheet(buildChecklistHTML(groupName, items), `${groupName || 'グループ'}　チェックリスト（全${items.length}件）`);
}

// グループの中身をSVG/コードとしてまとめて印刷(フロー形式 or 矢印なし一覧 or コード)
function openGroupPrint(groupId, groupName, mode){
  const items = getSaved().filter(it => (it.group||null) === groupId);
  if(items.length === 0){ alert('このグループにはSVGが無いみゅ'); return; }
  openPrintSheet(buildPrintOutput(items, mode), `${groupName || 'グループ'}　一括印刷（${printModeLabel(mode)}・全${items.length}件）`);
}

// 選んだ項目だけをまとめて印刷する(グループを跨いだ選択にも対応)
function openMultiPrint(items, mode, title){
  if(items.length === 0){ alert('1件も選ばれてないみゅ'); return; }
  openPrintSheet(buildPrintOutput(items, mode), `${title || '選択した項目'}　印刷（${printModeLabel(mode)}・全${items.length}件）`);
}

// ---- 選んで印刷モード ----
// グループに縛られない全体選択モード。オンのあいだは全アイテムにチェックボックスが出て、
// 違うグループ同士から抜粋して1回の印刷にまとめられる。
let printSelectActive = false;
const printSelectedIds = new Set();

function enterPrintSelectMode(){
  printSelectActive = true;
  printSelectedIds.clear();
  // 折りたたまれたグループの中身が見えないとチェックできないので、全グループを強制展開する
  const groups = getGroups();
  let changed = false;
  groups.forEach(g=>{ if(g.collapsed){ g.collapsed = false; changed = true; } });
  if(changed) setGroups(groups);
  renderList();
}
function exitPrintSelectMode(){
  printSelectActive = false;
  printSelectedIds.clear();
  renderList();
}
function updatePrintSelectBar(){
  const bar = document.getElementById('printSelectBar');
  const startBtn = document.getElementById('btnStartSelectPrint');
  if(startBtn){
    startBtn.textContent = printSelectActive ? '✕ 選択をやめる' : '☑️ 選んで印刷';
    startBtn.classList.toggle('active', printSelectActive);
  }
  if(!bar) return;
  if(!printSelectActive){ bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  const count = document.querySelectorAll('#savedList .print-select-box:checked').length;
  document.getElementById('printSelectCount').textContent = `選択中: ${count}件`;
}

function closePrintSheet(){
  printSheet.classList.remove('open'); printBackdrop.classList.remove('open');
  // 選んで印刷モードのまま印刷シートだけ閉じて放置されるケースを防ぐため、
  // 念のためここでも状態を確実にクリアしておく(2回目に反応しなくなる不具合の保険)
  if(printSelectActive){ exitPrintSelectMode(); }
}
document.getElementById('printCancel').onclick = closePrintSheet;
printBackdrop.onclick = closePrintSheet;

document.getElementById('btnDoPrint').onclick = ()=>{
  const area = document.getElementById('printArea');
  if(area) area.scrollTop = 0;
  window.scrollTo(0, 0);
  // iOSは window.print() を連続で呼ぶと2回目以降無反応になることがあるため、
  // 直前に描画を確定させてから呼ぶ(requestAnimationFrameで1フレーム待つ)
  requestAnimationFrame(()=>{
    setTimeout(()=>{
      try{ window.print(); }
      catch(e){ alert('印刷を開始できなかったみゅ。もう一度試してみてね'); }
    }, 50);
  });
};
// 印刷ダイアログが閉じたあとに古い印刷内容が残らないよう、印刷完了後も一応リセットしておく
window.addEventListener('afterprint', ()=>{
  if(printSelectActive) exitPrintSelectMode();
});
