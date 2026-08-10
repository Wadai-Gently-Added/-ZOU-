// js/mode.js — SVGビューワー/HTMLビューワーのタブ切り替え
// 依存: js/storage.js(currentMode), js/strings.js(STR), js/viewer.js(guardedLoad/stage/empty), js/list.js(renderList)
// 最後に読み込むこと(タブ切り替え時に他の全モジュールの状態をリセットするため)

function applyModeLabels(){
  const L = STR.mode();
  const C = STR.common;

  // タブ・上部バー
  document.getElementById('tabSvg').textContent = C.tabSvg;
  document.getElementById('tabHtml').textContent = C.tabHtml;
  document.getElementById('appTitle').textContent = L.appTitle;
  document.getElementById('codeBtnLabel').textContent = C.codeBtn;
  document.getElementById('listBtnLabel').textContent = L.listBtn;
  document.getElementById('btnSave').textContent = C.btnSaveLabel;

  // 空状態
  document.getElementById('emptyBig').textContent = L.emptyBig;
  document.getElementById('emptySub').textContent = C.emptySub;
  document.getElementById('exitFocusBtn').textContent = C.exitFocusBtn;

  // 下部バー
  document.getElementById('btnClipboard').textContent = C.btnClipboard;
  document.getElementById('btnPaste').textContent = C.btnPaste;
  document.getElementById('btnFile').textContent = C.btnFile;
  document.getElementById('bgBtnChecker').textContent = C.bgChecker;
  document.getElementById('bgBtnWhite').textContent = C.bgWhite;
  document.getElementById('bgBtnBlack').textContent = C.bgBlack;
  document.getElementById('btnZoomOut').textContent = C.btnZoomOut;
  document.getElementById('btnReset').textContent = C.btnReset;
  document.getElementById('btnZoomIn').textContent = C.btnZoomIn;
  document.getElementById('btnWake').textContent = C.btnWake;
  document.getElementById('btnFocus').textContent = C.btnFocus;

  // 貼り付けシート
  document.getElementById('pasteSheetTitle').textContent = L.pasteSheetTitle;
  document.getElementById('pasteBox').placeholder = L.pasteBoxPlaceholder;
  document.getElementById('btnPasteLoad').textContent = C.btnPasteLoad;
  document.getElementById('pasteCancel').textContent = C.sheetClose;

  // マイSVG/マイHTMLシート
  document.getElementById('listSheetTitle').textContent = L.listSheetTitle;
  document.getElementById('btnNewGroup').textContent = C.btnNewGroup;
  document.getElementById('btnStartSelectPrint').textContent = C.btnStartSelectPrint;
  document.getElementById('savedEmpty').textContent = L.savedEmpty;
  document.getElementById('btnPrintSelectGo').textContent = C.btnPrintSelectGo;
  document.getElementById('btnPrintSelectCancel').textContent = C.cancel;
  document.getElementById('listCancel').textContent = C.sheetClose;

  // コード編集シート
  document.getElementById('codeSheetTitle').textContent = L.codeSheetTitle;
  document.getElementById('codeBox').placeholder = L.codeBoxPlaceholder;
  document.getElementById('btnCodeApply').textContent = C.btnCodeApply;
  document.getElementById('codeCancel').textContent = C.sheetClose;

  // 印刷シート
  document.getElementById('printSheetTitle').textContent = C.printSheetTitleDefault;
  document.getElementById('printHint').textContent = C.printHint;
  document.getElementById('btnDoPrint').textContent = C.btnDoPrint;
  document.getElementById('printCancel').textContent = C.sheetClose;

  document.getElementById('fileInput').setAttribute('accept', L.fileAccept);

  // 選んで印刷バーの件数表示(現在の選択数を保ったまま文言だけ差し替え)
  if(typeof updatePrintSelectBar === 'function') updatePrintSelectBar();
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
    currentHtmlSource = null;
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

const langSelect = document.getElementById('langSelect');
langSelect.value = currentLanguage;
langSelect.onchange = ()=> setLanguage(langSelect.value);

applyModeLabels();
