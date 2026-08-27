// js/strings.js — 言語データ(language/*.js)を束ねるディスパッチャー
// 依存: language/*.js(LANG_JA, LANG_EN等)が先に読み込まれていること。storage.jsの次、
// 他の全js(viewer.js/print.js/list.js/mode.js)より先に読み込むこと。
//
// 【役割分担】
// - language/xx.js … 実際の文言データ(LANG_JA / LANG_EN 等)。翻訳作業はここだけで完結する
// - js/strings.js(このファイル) … 「今どの言語を使うか(currentLanguage)」を管理し、
//   STR.common / STR.svg / STR.html / STR.mode() として他ファイルに文言を渡す窓口
//
// 呼び出し側(viewer.js/print.js/list.js)は STR.common.xxx / STR.mode().xxx のように
// これまで通り参照するだけでよく、言語を追加してもそちら側の変更は不要。
//
// 新しい言語を追加する手順:
//   1. language/ja.js をコピーして language/xx.js を作り、全キーを翻訳する
//   2. index.html に <script src="language/xx.js"></script> を追加(strings.jsより前)
//   3. 下のLANGUAGESに 'xx': LANG_XX を登録する

const LANGUAGES = {
  ja: LANG_JA,
  en: LANG_EN,
  es: LANG_ES,
  fr: LANG_FR,
  ko: LANG_KO,
  zh: LANG_ZH,
  de: LANG_DE,
  it: LANG_IT,
  pt: LANG_PT,
  ru: LANG_RU,
  el: LANG_EL
};

let currentLanguage = 'ja';

function setLanguage(lang){
  if(!LANGUAGES[lang]) return false;
  currentLanguage = lang;
  if(typeof applyModeLabels === 'function') applyModeLabels();
  if(typeof renderList === 'function') renderList();
  return true;
}

// STR.common.xxx / STR.svg.xxx / STR.html.xxx / STR.mode() という既存の呼び出し方を
// そのまま維持するため、常に「今選ばれている言語」を指すgetterとして定義する
const STR = {
  get common(){ return LANGUAGES[currentLanguage].common; },
  get svg(){ return LANGUAGES[currentLanguage].svg; },
  get html(){ return LANGUAGES[currentLanguage].html; },
  mode(){ return LANGUAGES[currentLanguage][currentMode]; }
};
