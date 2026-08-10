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
  document.getElementById('btnReset').textContent = C.btnReset;
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
  if(typeof updateHtmlInteractButton === 'function') updateHtmlInteractButton();
}

// モードごとの表示状態を退避しておく置き場。タブを切り替えても中身を消さず、
// 元のモードに戻ってきた時にそのまま復元できるようにする
const modeState = {
  svg:  { node: null, name: null, htmlSource: null, scale: 1, tx: 0, ty: 0, dirty: false },
  html: { node: null, name: null, htmlSource: null, scale: 1, tx: 0, ty: 0, dirty: false }
};

function switchMode(mode){
  if(mode === currentMode) return;

  // 今のモードの状態を退避(DOMノードは消さずに保持するだけ。iframeの中身もそのまま保たれる)
  const fromState = modeState[currentMode];
  fromState.name = currentName;
  fromState.htmlSource = currentHtmlSource;
  fromState.scale = scale; fromState.tx = tx; fromState.ty = ty;
  fromState.dirty = isDirty;
  fromState.node = stage.firstElementChild || null;
  if(fromState.node) stage.removeChild(fromState.node);

  currentMode = mode;
  document.querySelectorAll('.mode-tab').forEach(t=>{
    t.classList.toggle('active', t.dataset.mode === mode);
  });
  applyModeLabels();

  // 選んで印刷中だった場合は状態をリセット(選択対象がモードを跨いで意味を持たないため)
  if(typeof printSelectActive !== 'undefined' && printSelectActive) exitPrintSelectMode();
  closeAllSheets();

  // 切り替え先の状態を復元
  const toState = modeState[mode];
  stage.innerHTML = '';
  if(toState.node){
    stage.appendChild(toState.node);
    stage.style.display = 'block';
    empty.style.display = 'none';
  } else {
    stage.style.display = 'none';
    empty.style.display = 'flex';
  }
  currentName = toState.name;
  currentHtmlSource = toState.htmlSource;
  isDirty = toState.dirty;
  scale = toState.scale; tx = toState.tx; ty = toState.ty;
  applyTransform();

  // HTMLへの切替時は毎回、安全な閲覧モード(iframeクリック不可)から始める
  if(mode === 'html' && typeof setHtmlInteractMode === 'function') setHtmlInteractMode(false);

  renderList();
}

document.getElementById('tabSvg').onclick = ()=> switchMode('svg');
document.getElementById('tabHtml').onclick = ()=> switchMode('html');

const langSelect = document.getElementById('langSelect');
langSelect.value = currentLanguage;
langSelect.onchange = ()=> setLanguage(langSelect.value);

applyModeLabels();
