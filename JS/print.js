// js/print.js — 印刷プレビュー構築(SVG手順/コード一覧/チェックリスト)、選んで印刷モード
// 依存: js/storage.js (getSaved/getGroups)。list.jsから呼ばれる関数をここに定義。
// list.js から参照されるグローバル: printSelectGroupId, printSelectedIds,
//   enterPrintSelectMode(), exitPrintSelectMode(), updatePrintSelectBar(),
//   printSubmenuOptions(), openSinglePrint(), openGroupPrint(), openMultiPrint()
//
// 【今回の変更点】
// ① svgForThumbnail(): 単純なwidth/height:100%頼みだったのをやめ、ビューアのfitToView()と
//    同じ「getBBoxで実際の描画範囲を測ってviewBoxを引き直す」方式に変更。viewBoxが無い/
//    ズレているSVGでもはみ出さず自動リサイズされる。
// ③ btnDoPrint/printCancel/printBackdrop: 選んで印刷の状態(printSelectGroupId等)が
//    印刷シートを閉じても残ってしまうケースに備え、閉じるタイミングで確実にリセットするよう
//    ガードを追加。iOSのwindow.print()を連続で呼ぶと反応しなくなる既知の挙動を避けるため、
//    印刷実行前に軽い遅延(requestAnimationFrame)を挟む。
// ④ printSubmenuOptions(): 3択(SVG/コード/SVG+コード)→
//    「チェックリスト/SVG/コード/SVG+コード」の4択に変更。チェックリストは複数件印刷時に
//    自動で混ぜるのをやめ、独立した選択肢にした(includeChecklist引数で単体印刷では非表示に)。
//    さらに1件だけの印刷では、小さいフロー枠ではなく大きく見せる専用レイアウトを使う。

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

// 複数件用: 折り紙の手順書のように「①SVG+ファイル名」を→でつないで並べる
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

// 1件だけの個別印刷用: 小さいフロー枠ではなく大きく見せる専用レイアウト
function buildSingleImageSection(item){
  const nameEsc = escHtml(item.name || '(無題)');
  return `
    <div class="print-page single-page">
      <div class="print-title">${nameEsc}</div>
      <div class="single-svg-frame">${svgForThumbnail(item.content)}</div>
      <div class="print-note-label">備考・メモ欄（タップして入力できるよ）</div>
      <div class="print-note-box" contenteditable="true"></div>
    </div>
  `;
}

// コードモード: ファイル名+作成日時+修正日時の一覧表 → その下に各コード
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
// 'checklist' は openGroupPrint/openMultiPrint 側で個別に処理するのでここには来ない
function buildPrintOutput(items, mode){
  let html = '';
  if(mode === 'image' || mode === 'both'){
    html += (items.length === 1) ? buildSingleImageSection(items[0]) : buildFlowSection(items);
  }
  if(mode === 'code' || mode === 'both') html += buildCodeListSection(items);
  return html;
}

function printModeLabel(mode){
  if(mode === 'checklist') return 'チェックリスト';
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

// includeChecklist: 単体印刷(1件だけ)ではチェックリストの意味が薄いので選択肢から外す
function printSubmenuOptions(onPick, includeChecklist = true){
  const opts = [];
  if(includeChecklist){
    opts.push({ label: '☑️ チェックリスト印刷', onClick: ()=> onPick('checklist') });
  }
  opts.push({ label: '🖼 SVG印刷', onClick: ()=> onPick('image') });
  opts.push({ label: '🔤 コード印刷', onClick: ()=> onPick('code') });
  opts.push({ label: '🖼🔤 SVG＋コード印刷', onClick: ()=> onPick('both') });
  return opts;
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
  if(mode === 'checklist'){
    openPrintSheet(buildChecklistHTML(groupName, items), `${groupName || 'グループ'}　チェックリスト（全${items.length}件）`);
    return;
  }
  openPrintSheet(buildPrintOutput(items, mode), `${groupName || 'グループ'}　一括印刷（${printModeLabel(mode)}・全${items.length}件）`);
}

// 選んだ項目だけをまとめて印刷する
function openMultiPrint(items, mode, title){
  if(items.length === 0){ alert('1件も選ばれてないみゅ'); return; }
  if(mode === 'checklist'){
    openPrintSheet(buildChecklistHTML(title, items), `${title || '選択した項目'}　チェックリスト（全${items.length}件）`);
    return;
  }
  openPrintSheet(buildPrintOutput(items, mode), `${title || '選択した項目'}　印刷（${printModeLabel(mode)}・全${items.length}件）`);
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

function closePrintSheet(){
  printSheet.classList.remove('open'); printBackdrop.classList.remove('open');
  // 選んで印刷モードのまま印刷シートだけ閉じて放置されるケースを防ぐため、
  // 念のためここでも状態を確実にクリアしておく(2回目に反応しなくなる不具合の保険)
  if(printSelectGroupId !== null){ exitPrintSelectMode(); }
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
  if(printSelectGroupId !== null) exitPrintSelectMode();
});
