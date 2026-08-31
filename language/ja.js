// language/ja.js — 日本語の文言データ(UI全体・alert・メニュー・印刷レイアウトを網羅)
// 依存: なし。js/strings.jsより先に読み込むこと(index.htmlの読み込み順を参照)。
// 新しい言語を追加する時は、このファイルを丸ごとコピーして language/xx.js を作り、
// 全キーの値を翻訳したうえで js/strings.js の LANGUAGES に登録すればOK。

const LANG_JA = {
  common: {
    // --- alert/confirm/prompt ---
    saveFailed: '保存に失敗しました（容量オーバーの可能性があります）',
    saveSuccess: '保存しました！',
    noSelection: '1件も選ばれていません',
    printMenuError: (msg)=> `印刷メニューでエラーが発生しました: ${msg}`,
    printStartFailed: '印刷を開始できませんでした。もう一度試してください',
    wakeLockFailed: 'スリープ防止をオンにできませんでした',
    codeEmpty: 'コードが空です',

    codeApplyError: "コードの反映に失敗したよ。内容を確認してもう一度試してみて",    clipboardReadFailed: 'クリップボードを読み取れませんでした。Safariの設定で許可が必要な場合があります。「貼り付け」ボタンから手動で貼ってください',
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
    groupDeleteConfirm: (name, noun)=> `「${name}」を削除する？中の${noun}は消えずにバラバラに戻るよ`,

    backupExportMenu: "バックアップを書き出す（SVG＋HTML両方）",
    backupImportMenu: "バックアップを読み込む（SVG＋HTML両方を上書き）",
    backupParseError: "バックアップファイルを読み込めませんでした（壊れているか対応していない形式です）",
    backupImportConfirm: "読み込むと、今のマイSVG／マイHTMLのデータが上書きされるよ。よろしい？",
    backupImportSuccess: "バックアップを読み込みました！",

    backupRestoreMenu: "直前のインポート前の状態に戻す",

    backupSyncMenu: "🔗 バックアップと同期(追加・更新分だけ取り込む)",
    mergeResultTitle: "同期しました",
    mergeAddedLabel: "新規追加",
    mergeUpdatedLabel: "更新",    backupRestoreSnapshotConfirm: "インポート直前の状態に戻すよ。今のデータは上書きされるけど大丈夫？",
    backupNoSnapshot: "戻せるデータがまだ無いよ（一度もバックアップを読み込んでいない）",    // --- タブ / 言語 ---

    searchToggle: "🔍 検索/置換",
    searchPlaceholder: "検索する文字",
    replacePlaceholder: "置き換える文字",
    replaceOneBtn: "1件置換",
    replaceAllBtn: "全部置換",
    searchNoMatch: "見つからないよ",    tabSvg: 'SVGビューワー',
    tabHtml: 'HTMLビューワー',

    // --- 上部バー ---
    codeBtn: '🖊 コード',
    btnSaveLabel: '＋ 登録',

    // --- 下部バー ---
    btnClipboard: '📋 クリップボード',
    btnPaste: '✏️ 貼り付け',
    btnFile: '📁 ファイル',
    bgChecker: '透過',
    bgWhite: '白',
    bgBlack: '黒',
    btnReset: '⟲',
    btnWake: '☀️ 常時点灯',
    btnFocus: '⛶ 全体表示',
    exitFocusBtn: '⤢',

    // --- 空状態(共通の補足文) ---
    emptySub: '下のボタンから貼り付け・ファイル選択・クリップボードで読み込んでね',

    // --- 貼り付けシート ---
    btnPasteLoad: '表示する',

    // --- マイSVG/マイHTMLシート ---
    btnNewGroup: '＋ グループ',
    btnStartSelectPrint: '☑️ 選んで印刷',
    btnStopSelectPrint: '✕ 選択をやめる',
    htmlModeInteractLabel: "🖱 操作モード",
    htmlModeViewLabel: "🔍 閲覧中",
    printSelectCount: (n)=> `選択中: ${n}件`,
    btnPrintSelectGo: '🖨 印刷する',
    sheetClose: '閉じる',

    // --- コード編集シート ---
    btnCodeApply: '反映する',

    // --- 印刷シート ---
    printSheetTitleDefault: '印刷プレビュー（2ページ構成）',
    printHint: '画面ではスクロールで確認できます。実際の印刷/PDFは全ページぶん出力されるよ',
    btnDoPrint: '🖨 印刷する',

    // --- 右クリック/長押しメニュー(アイテム) ---
    itemMenuRename: '✏️ 名前を変更',

    itemMenuDuplicate: "📄 複製",

    listSearchPlaceholder: "名前で検索",
    sortNone: "並び替え",
    sortNameAsc: "名前(A→Z)",
    sortNameDesc: "名前(Z→A)",
    sortNewest: "新しい順",
    sortOldest: "古い順",

    sortGroupsMenu: "📁 グループの並び順",
    sortUngroupedMenu: "📄 未グループの並び順",
    sortGroupContentsMenu: "🔀 グループ内を並び替え",
    sortUndoMenu: "↩️ 直前の並び替えを元に戻す",
    sortNoSnapshot: "戻せる並び替えがまだ無いよ",    searchListNoResult: "見つからなかったよ",
    lockedEditBlocked: "これはロック中の項目だよ。編集や削除するには、先にロックを解除してね",

    lockedOpenCodeConfirm: "ロックがかかっているため直接編集できません。コピーを作って編集しますか？",    itemMenuLock: "🔒 ロックする",
    itemMenuUnlock: "🔓 ロック解除",
    itemLockedTitle: "ロック中(同期で取り込んだデータ)",    itemDuplicateSuffix: " (コピー)",    itemMenuPrint: '🖨 印刷',
    itemMenuNewGroup: '🆕 新しいグループを作る',
    itemMenuMoveToGroup: (name)=> `📁 ${name} へ移動`,
    itemMenuUngroup: '🚫 グループ解除',
    itemMenuDelete: '🗑 削除',
    noGroupOption: 'グループなし',
    pinTitle: 'ピン留め',
    dragHandleTitle: 'ドラッグで並べ替え / 別グループへ移動',
    dragHandleTitleGroup: 'ドラッグで並べ替え',

    // --- 右クリック/長押しメニュー(グループ) ---
    groupMenuColor: '🎨 色を変える',
    groupMenuChecklist: '☑️ チェックリスト印刷',
    groupMenuSelectPrint: '☑️ 選んで印刷',
    groupMenuDelete: '🗑 グループ削除',

    // --- 印刷メニューの選択肢 ---
    printOptChecklist: '☑️ チェックリスト印刷',
    printOptImage: (noun)=> `🖼 ${noun}印刷(手順・矢印あり)`,
    printOptImageGrid: (noun)=> `📋 ${noun}一覧印刷(矢印なし)`,
    printOptCode: '🔤 コード印刷',
    printOptBoth: (noun)=> `🖼🔤 ${noun}＋コード印刷`,
    modeLabelImage: (noun)=> noun + '手順',
    modeLabelImageGrid: (noun)=> noun + '一覧',
    modeLabelCode: 'コード',
    modeLabelBoth: (noun)=> noun + '＋コード',

    // --- 印刷レイアウト ---
    flowTitle: (noun, withArrows)=> withArrows ? (noun + ' 手順') : (noun + ' 一覧'),
    codeListTitle: (noun)=> noun + ' コード一覧',
    noteLabel: '備考・メモ欄（タップして入力できるよ）',
    sizeLabel: 'サイズ',
    viewBoxLabel: 'ViewBox',
    groupPrintLabel: (name)=> `グループ: ${name}`,
    createdAtLabel: (date)=> `作成日時: ${date}`,
    fileNameHeader: 'ファイル名',
    groupHeader: 'グループ',
    createdHeader: '作成日時',
    modifiedHeader: '修正日時',
    itemCountLabel: (n)=> `項目数: ${n}件`,
    checklistTitle: (name)=> `${name}　一覧`,
    untitled: '(無題)',
    selectedItemsTitle: '選択した項目',
    fromClipboardName: 'クリップボードから',
    manualPasteName: '手動貼り付け'
  },
  svg: {
    appTitle: '造 -ZOU-',
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
    appTitle: '造 -ZOU-',
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
