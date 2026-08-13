// js/mode.js — SVGビューワー/HTMLビューワーのタブ切り替え
// 依存: js/storage.js(currentMode), js/strings.js(STR), js/viewer.js(guardedLoad/stage/empty), js/list.js(renderList)
// 最後に読み込むこと(タブ切り替え時に他の全モジュールの状態をリセットするため)

// document.getElementById()した要素が万一存在しなくても(HTML変更時の消し忘れ等)、
// そこで例外が起きて以降の行が実行されなくなる事故を防ぐための安全ヘルパー
function setText(id, val){ const el = document.getElementById(id); if(el) el.textContent = val; }
function setPlaceholder(id, val){ const el = document.getElementById(id); if(el) el.placeholder = val; }
// スペースの狭い一列レイアウト用: 先頭の絵文字だけを表示し、フルテキストはtitle(ホバー/長押しで見える)に retain する
function setCompact(id, fullLabel){
  const el = document.getElementById(id);
  if(!el) return;
  const m = fullLabel.match(/^(\S+)\s+(.+)$/);
  el.textContent = m ? m[1] : fullLabel;
  el.title = fullLabel;
}

function applyModeLabels(){
  const L = STR.mode();
  const C = STR.common;

  // タブ・上部バー
  setText('tabSvg', C.tabSvg);
  setText('tabHtml', C.tabHtml);
  setText('appTitle', L.appTitle);
  setText('codeBtnLabel', C.codeBtn);
  setText('listBtnLabel', L.listBtn);
  setText('btnSave', C.btnSaveLabel);

  // 空状態
  setText('emptyBig', L.emptyBig);
  setText('emptySub', C.emptySub);
  setText('exitFocusBtn', C.exitFocusBtn);

  // 下部バー
  setText('btnClipboard', C.btnClipboard);
  setText('btnPaste', C.btnPaste);
  setText('btnFile', C.btnFile);
  setText('bgBtnChecker', C.bgChecker);
  setText('bgBtnWhite', C.bgWhite);
  setText('bgBtnBlack', C.bgBlack);
  setCompact('btnWake', C.btnWake);
  setCompact('btnFocus', C.btnFocus);
  setCompact('btnDownloadFile', L.downloadMenu);

  // 貼り付けシート
  setText('pasteSheetTitle', L.pasteSheetTitle);
  setPlaceholder('pasteBox', L.pasteBoxPlaceholder);
  setText('btnPasteLoad', C.btnPasteLoad);
  setText('pasteCancel', C.sheetClose);

  // マイSVG/マイHTMLシート
  setText('listSheetTitle', L.listSheetTitle);
  setText('btnNewGroup', C.btnNewGroup);
  setText('btnStartSelectPrint', C.btnStartSelectPrint);
  setText('savedEmpty', L.savedEmpty);
  setText('btnPrintSelectGo', C.btnPrintSelectGo);
  setText('btnPrintSelectCancel', C.cancel);
  setText('listCancel', C.sheetClose);

  // コード編集シート
  setText('codeSheetTitle', L.codeSheetTitle);
  setPlaceholder('codeBox', L.codeBoxPlaceholder);
  setText('btnCodeApply', C.btnCodeApply);
  setText('codeCancel', C.sheetClose);

  // 印刷シート
  setText('printSheetTitle', C.printSheetTitleDefault);
  setText('printHint', C.printHint);
  setText('btnDoPrint', C.btnDoPrint);
  setText('printCancel', C.sheetClose);

  const fileInputEl = document.getElementById('fileInput');
  if(fileInputEl) fileInputEl.setAttribute('accept', L.fileAccept);

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

  // 操作モード中だとiframeが#interactStage側にあり#stageが空になっているため、
  // 退避する前に必ず閲覧モードへ戻して#stageにフレームを戻しておく
  if(currentMode === 'html' && typeof htmlInteractMode !== 'undefined' && htmlInteractMode && typeof setHtmlInteractMode === 'function'){
    setHtmlInteractMode(false);
  }

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
