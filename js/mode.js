// js/mode.js — SVGビューワー/HTMLビューワーのタブ切り替え
// 依存: js/storage.js(currentMode), js/strings.js(STR), js/viewer.js(guardedLoad/stage/empty), js/list.js(renderList)
// 最後に読み込むこと(タブ切り替え時に他の全モジュールの状態をリセットするため)

// document.getElementById()した要素が万一存在しなくても(HTML変更時の消し忘れ等)、
// そこで例外が起きて以降の行が実行されなくなる事故を防ぐための安全ヘルパー
function setText(id, val){ const el = document.getElementById(id); if(el) el.textContent = val; }
function setPlaceholder(id, val){ const el = document.getElementById(id); if(el) el.placeholder = val; }
// スペースの狭い一列レイアウト用: 小さめフォント+2行折り返しでフルテキストをそのまま表示する
function setCompact(id, fullLabel){
  const el = document.getElementById(id);
  if(!el) return;
  el.textContent = fullLabel;
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
  setText('btnCodeSearchToggle', C.searchToggle);
  setPlaceholder('codeSearchInput', C.searchPlaceholder);
  setPlaceholder('codeReplaceInput', C.replacePlaceholder);
  setText('codeReplaceOne', C.replaceOneBtn);
  setText('codeReplaceAll', C.replaceAllBtn);

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
  setLastMode(mode); // 次回起動時にこのタブから再開できるよう覚えておく
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

// CSSの:hover / background-color が一部環境で mode-tab に効かない事例への対策。
// 1) .is-hover クラス (style.css の box-shadow / background-color ルール)
// 2) インラインの inset box-shadow (background-color が死んでも影は効くため)
// クリックは従来どおり動く。
function applyTabHover(tab, on){
  tab.classList.toggle('is-hover', on);
  if(on){
    const active = tab.classList.contains('active');
    const c = active ? 'rgba(94,201,181,.12)' : 'rgba(94,201,181,.28)';
    tab.style.setProperty('box-shadow', 'inset 0 0 0 999px ' + c, 'important');
    if(!active){
      tab.style.setProperty('color', '#e8e9eb', 'important');
      tab.style.setProperty('-webkit-text-fill-color', '#e8e9eb', 'important');
    }
  } else {
    tab.style.removeProperty('box-shadow');
    tab.style.removeProperty('color');
    tab.style.removeProperty('-webkit-text-fill-color');
  }
}
document.querySelectorAll('.mode-tab').forEach(tab=>{
  tab.addEventListener('pointerenter', ()=> applyTabHover(tab, true));
  tab.addEventListener('pointerleave', ()=> applyTabHover(tab, false));
  tab.addEventListener('pointercancel', ()=> applyTabHover(tab, false));
});

const langSelect = document.getElementById('langSelect');
langSelect.value = currentLanguage;
langSelect.onchange = ()=> setLanguage(langSelect.value);

applyModeLabels();

// ---- 起動時の下書き自動復元 ----
// 明示的に「マイSVG/マイHTMLへ登録」していなくても、前回画面に表示していた内容を
// そのまま次回起動時に復元する(急いで閉じた場合の保険)。svg/html両方をmodeStateへ
// 仕込んでおき、初期表示分(svg)だけこの場で画面に反映、閉じる直前がhtmlタブだった場合は
// switchMode()で瞬時に切り替える。
function restoreDraftIntoState(mode){
  const draft = getDraft(mode);
  if(!draft || !draft.content) return;
  const st = modeState[mode];
  st.name = draft.name;
  // 下書きに保存しておいた「未登録かどうか」をそのまま復元する。ここを毎回trueに
  // 固定してしまうと、実際は何も変わってないのに開くたびに「保存しますか」と
  // 聞かれ続ける不具合になる。dirtyの記録が無い古い下書き(この仕組みを入れる前の
  // データ)は、安全側のtrueだと逆に毎回聞かれ続けて不便なため、falseとして扱う
  st.dirty = (draft.dirty === true);
  if(mode === 'html'){
    st.htmlSource = draft.content;
    const frame = document.createElement('iframe');
    frame.className = 'html-content-wrap';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.style.width = HTML_FRAME_WIDTH + 'px';
    frame.style.height = HTML_FRAME_HEIGHT + 'px';
    frame.style.border = 'none';
    frame.style.display = 'block';
    frame.style.pointerEvents = 'none';
    frame.srcdoc = draft.content;
    st.node = frame;
  } else {
    const svgSource = extractSvgElement(draft.content);
    if(!svgSource) return;
    const svgEl = document.importNode(svgSource, true);
    svgEl.style.overflow = 'visible';
    const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
    if(vb && vb.width && vb.height){
      svgEl.style.width = vb.width + 'px';
      svgEl.style.height = vb.height + 'px';
    }
    st.node = svgEl;
  }
}
restoreDraftIntoState('svg');
restoreDraftIntoState('html');

// 起動直後は必ずsvgタブがcurrentModeなので、その下書きがあればここで画面に反映する
if(modeState.svg.node){
  stage.innerHTML = '';
  stage.appendChild(modeState.svg.node);
  stage.style.display = 'block';
  empty.style.display = 'none';
  currentName = modeState.svg.name;
  isDirty = modeState.svg.dirty;
  fitToView();
}

// 閉じる直前がHTMLタブだった場合はそちらに切り替えて開く(switchMode内でrenderListも呼ばれる)
if(getLastMode() === 'html' && modeState.html.node){
  switchMode('html');
} else {
  renderList();
}
