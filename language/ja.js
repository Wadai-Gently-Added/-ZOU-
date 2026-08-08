// language/ja.js — 日本語の文言データ
// 依存: なし。js/strings.jsより先に読み込むこと(index.htmlの読み込み順を参照)。
// 新しい言語を追加する時は、このファイルを丸ごとコピーして language/xx.js を作り、
// 全キーの値を翻訳したうえで js/strings.js の LANGUAGES に登録すればOK。

const LANG_JA = {
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
