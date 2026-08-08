// js/strings.js — ユーザー向け文言の一元管理
// 依存: なし。storage.jsの次、他の全js(viewer.js/print.js/list.js/mode.js)より先に読み込むこと。
//
// 【狙い】
// これまでalert()/confirm()/prompt()の文言や空状態メッセージがviewer.js/print.js/list.js/
// storage.js/mode.jsに散らばっていて、「みゅ」を外す時に取りこぼしが起きた。
// 全部この1ファイルに集約することで、口調の統一や今後の多言語対応もここだけ触れば済むようにする。
//
// 使い方:
//   STR.common.saveFailed              … モードに関係ない共通文言
//   STR.mode().parseError              … 現在のcurrentModeに応じてsvg/htmlを自動で切り替える
//   STR.svg.xxx / STR.html.xxx         … 特定モードを明示したい時に直接参照も可能

const STR = {
  common: {
    saveFailed: '保存に失敗しました（容量オーバーの可能性があります）',
    saveSuccess: '保存しました！',
    noSelection: '1件も選ばれていません',
    printMenuError: (msg)=> `印刷メニューでエラーが発生しました: ${msg}`,
    printStartFailed: '印刷を開始できませんでした。もう一度試してください',
    wakeLockFailed: 'スリープ防止をオンにできませんでした',
    codeEmpty: 'コードが空です',
    clipboardReadFailed: 'クリップボードを読み取れませんでした。Safariの設定で許可が必要な場合があります。「貼り付け」ボタンから手動で貼ってください',
    unsavedPromptHtml: '今表示中の内容が保存されていません。<br>どうしますか？',
    unsavedSaveThenOpen: '保存してから開く',
    unsavedOpenWithoutSave: '保存せず開く',
    cancel: 'キャンセル',
    savePrompt: '保存名を入れてね',
    downloadNamePrompt: 'ファイル名を入れてね（拡張子は自動でつくよ）',
    itemRenamePrompt: '名前を変更',
    groupNamePrompt: 'グループ名を入れてね',
    groupRenamePrompt: 'グループ名を変更',
    groupColorPickTitle: 'グループの色を選んでね',
    newGroupDefaultName: '新しいグループ',
    itemDeleteConfirm: (name)=> `「${name}」を削除する？元に戻せないよ`,
    groupDeleteConfirm: (name, noun)=> `「${name}」を削除する？中の${noun}は消えずにバラバラに戻るよ`
  },
  svg: {
    appTitle: 'SVG VIEWER',
    listBtn: '📂 マイSVG',
    listSheetTitle: 'マイSVG',
    pasteSheetTitle: 'SVGコードを貼り付け',
    pasteBoxPlaceholder: '<svg>...</svg> をここにペースト',
    codeSheetTitle: 'SVGコードを編集',
    codeBoxPlaceholder: '表示中のSVGがありません',
    emptyBig: 'まだSVGが読み込まれていません',
    savedEmpty: 'まだ何も保存されていません',
    fileAccept: '.svg,image/svg+xml',
    registerMenu: '＋ マイSVGに登録',
    downloadMenu: '📥 SVGファイル保存',
    parseError: 'SVGとして読み込めませんでした。中身がSVGコードか確認してください（HTMLや他のテキストは読み込めません）',
    noGroupItems: 'このグループにはSVGがありません',
    noStageContent: '表示中の内容がありません',
    noSaveContent: '保存する内容がありません',
    defaultExportName: 'svg-export',
    groupItemsNoun: 'SVG'
  },
  html: {
    appTitle: 'HTML VIEWER',
    listBtn: '📂 マイHTML',
    listSheetTitle: 'マイHTML',
    pasteSheetTitle: 'HTMLコードを貼り付け',
    pasteBoxPlaceholder: '<html>...</html> をここにペースト',
    codeSheetTitle: 'HTMLコードを編集',
    codeBoxPlaceholder: '表示中のHTMLがありません',
    emptyBig: 'まだHTMLが読み込まれていません',
    savedEmpty: 'まだ何も保存されていません',
    fileAccept: '.html,.htm,text/html',
    registerMenu: '＋ マイHTMLに登録',
    downloadMenu: '📥 HTMLファイル保存',
    parseError: 'HTMLとして読み込めませんでした。中身が空のようです',
    noGroupItems: 'このグループにはHTMLがありません',
    noStageContent: '表示中の内容がありません',
    noSaveContent: '保存する内容がありません',
    defaultExportName: 'html-export',
    groupItemsNoun: 'HTML'
  }
};
// 現在のモード(currentMode、storage.jsで定義)に応じたSTR.svg/STR.htmlを返す
STR.mode = function(){ return STR[currentMode]; };
