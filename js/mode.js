// js/mode.js — SVGビューワー/HTMLビューワーのタブ切り替え
// 依存: js/storage.js(currentMode), js/viewer.js(guardedLoad/stage/empty), js/list.js(renderList)
// 最後に読み込むこと(タブ切り替え時に他の全モジュールの状態をリセットするため)

const MODE_LABELS = {
  svg: {
    appTitle: 'SVG VIEWER',
    codeBtn: '🖊 コード',
    listBtn: '📂 マイSVG',
    listSheetTitle: 'マイSVG',
    pasteSheetTitle: 'SVGコードを貼り付け',
    pasteBoxPlaceholder: '<svg>...</svg> をここにペースト',
    codeSheetTitle: 'SVGコードを編集',
    codeBoxPlaceholder: '表示中のSVGがありません',
    emptyBig: 'まだSVGが読み込まれていません',
    savedEmpty: 'まだ何も保存されていません',
    fileAccept: '.svg,image/svg+xml'
  },
  html: {
    appTitle: 'HTML VIEWER',
    codeBtn: '🖊 コード',
    listBtn: '📂 マイHTML',
    listSheetTitle: 'マイHTML',
    pasteSheetTitle: 'HTMLコードを貼り付け',
    pasteBoxPlaceholder: '<html>...</html> をここにペースト',
    codeSheetTitle: 'HTMLコードを編集',
    codeBoxPlaceholder: '表示中のHTMLがありません',
    emptyBig: 'まだHTMLが読み込まれていません',
    savedEmpty: 'まだ何も保存されていません',
    fileAccept: '.html,.htm,text/html'
  }
};

function applyModeLabels(){
  const L = MODE_LABELS[currentMode];
  document.getElementById('appTitle').textContent = L.appTitle;
  document.getElementById('codeBtnLabel').textContent = L.codeBtn;
  document.getElementById('listBtnLabel').textContent = L.listBtn;
  document.getElementById('listSheetTitle').textContent = L.listSheetTitle;
  document.getElementById('pasteSheetTitle').textContent = L.pasteSheetTitle;
  document.getElementById('pasteBox').placeholder = L.pasteBoxPlaceholder;
  document.getElementById('codeSheetTitle').textContent = L.codeSheetTitle;
  document.getElementById('codeBox').placeholder = L.codeBoxPlaceholder;
  document.getElementById('emptyBig').textContent = L.emptyBig;
  document.getElementById('savedEmpty').textContent = L.savedEmpty;
  document.getElementById('fileInput').setAttribute('accept', L.fileAccept);
}

function switchMode(mode){
  if(mode === currentMode) return;
  const doSwitch = ()=>{
    currentMode = mode;
    document.querySelectorAll('.mode-tab').forEach(t=>{
      t.classList.toggle('active', t.dataset.mode === mode);
    });
    applyModeLabels();
    // 表示中の内容はモードを跨いで意味を持たないためクリアする
    stage.innerHTML = '';
    stage.style.display = 'none';
    empty.style.display = 'flex';
    currentName = null;
    isDirty = false;
    scale = 1; tx = 0; ty = 0;
    applyTransform();
    // 選んで印刷中だった場合は状態をリセット
    if(typeof printSelectActive !== 'undefined' && printSelectActive) exitPrintSelectMode();
    closeAllSheets();
    renderList();
  };
  guardedLoad(doSwitch);
}

document.getElementById('tabSvg').onclick = ()=> switchMode('svg');
document.getElementById('tabHtml').onclick = ()=> switchMode('html');

applyModeLabels();
