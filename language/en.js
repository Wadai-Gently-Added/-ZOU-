// language/en.js — English text data (covers the full UI, alerts, menus, print layouts)
// Depends on: nothing. Load before js/strings.js (see load order in index.html).
// To add a new language: copy this file to language/xx.js, translate every value,
// then register it in the LANGUAGES map in js/strings.js.

const LANG_EN = {
  common: {
    // --- alert/confirm/prompt ---
    saveFailed: 'Save failed (storage may be full)',
    saveSuccess: 'Saved!',
    noSelection: 'No items selected',
    printMenuError: (msg)=> `An error occurred in the print menu: ${msg}`,
    printStartFailed: 'Could not start printing. Please try again',
    wakeLockFailed: 'Could not enable Keep Awake',
    codeEmpty: 'Code is empty',
    clipboardReadFailed: 'Could not read the clipboard. Safari may require permission in Settings. Please paste manually using the "Paste" button',
    unsavedPromptHtml: 'The content currently shown has not been saved.<br>What would you like to do?',
    unsavedSaveThenOpen: 'Save then open',
    unsavedOpenWithoutSave: 'Open without saving',
    cancel: 'Cancel',
    savePrompt: 'Enter a name to save as',
    downloadNamePrompt: 'Enter a file name (the extension is added automatically)',
    itemRenamePrompt: 'Rename',
    groupNamePrompt: 'Enter a group name',
    groupRenamePrompt: 'Rename group',
    groupColorPickTitle: 'Choose a group color',
    newGroupDefaultName: 'New Group',
    itemDeleteConfirm: (name)=> `Delete "${name}"? This cannot be undone`,
    groupDeleteConfirm: (name, noun)=> `Delete "${name}"? Its ${noun} items will not be deleted, just ungrouped`,

    backupExportMenu: "Export backup",
    backupImportMenu: "Import backup",
    backupParseError: "Could not read this backup file (it may be corrupted or an unsupported format)",
    backupImportConfirm: "This will overwrite your current My SVGs / My HTML data. Continue?",
    backupImportSuccess: "Backup imported!",

    backupRestoreMenu: "Undo last import",
    backupRestoreSnapshotConfirm: "This restores the state just before your last import, overwriting current data. Continue?",
    backupNoSnapshot: "Nothing to restore yet (no backup has been imported)",    // --- tabs / language ---
    tabSvg: 'SVG Viewer',
    tabHtml: 'HTML Viewer',

    // --- top bar ---
    codeBtn: '🖊 Code',
    btnSaveLabel: '＋ Save',

    // --- bottom bar ---
    btnClipboard: '📋 Clipboard',
    btnPaste: '✏️ Paste',
    btnFile: '📁 File',
    bgChecker: 'Transparent',
    bgWhite: 'White',
    bgBlack: 'Black',
    btnReset: '⟲',
    btnWake: '☀️ Keep Awake',
    btnFocus: '⛶ Full Screen',
    exitFocusBtn: '⤢',

    // --- empty state (shared hint text) ---
    emptySub: 'Use the buttons below to paste, choose a file, or load from the clipboard',

    // --- paste sheet ---
    btnPasteLoad: 'Show',

    // --- My SVGs / My HTML sheet ---
    btnNewGroup: '＋ Group',
    btnStartSelectPrint: '☑️ Select & Print',
    btnStopSelectPrint: '✕ Cancel Selection',
    htmlModeInteractLabel: '🖱 Interact Mode',
    htmlModeViewLabel: '🔍 View Mode',
    printSelectCount: (n)=> `Selected: ${n}`,
    btnPrintSelectGo: '🖨 Print',
    sheetClose: 'Close',

    // --- code edit sheet ---
    btnCodeApply: 'Apply',

    // --- print sheet ---
    printSheetTitleDefault: 'Print Preview (2 pages)',
    printHint: 'You can scroll to check the preview here. The actual print/PDF output includes every page',
    btnDoPrint: '🖨 Print',

    // --- context/long-press menu (item) ---
    itemMenuRename: '✏️ Rename',
    itemMenuPrint: '🖨 Print',
    itemMenuNewGroup: '🆕 Create new group',
    itemMenuMoveToGroup: (name)=> `📁 Move to ${name}`,
    itemMenuUngroup: '🚫 Remove from group',
    itemMenuDelete: '🗑 Delete',
    noGroupOption: 'No group',
    pinTitle: 'Pin',
    dragHandleTitle: 'Drag to reorder / move to another group',
    dragHandleTitleGroup: 'Drag to reorder',

    // --- context/long-press menu (group) ---
    groupMenuColor: '🎨 Change color',
    groupMenuChecklist: '☑️ Print checklist',
    groupMenuSelectPrint: '☑️ Select & Print',
    groupMenuDelete: '🗑 Delete group',

    // --- print menu options ---
    printOptChecklist: '☑️ Print checklist',
    printOptImage: (noun)=> `🖼 Print ${noun} (steps, with arrows)`,
    printOptImageGrid: (noun)=> `📋 Print ${noun} list (no arrows)`,
    printOptCode: '🔤 Print code',
    printOptBoth: (noun)=> `🖼🔤 Print ${noun} + code`,
    modeLabelImage: (noun)=> noun + ' steps',
    modeLabelImageGrid: (noun)=> noun + ' list',
    modeLabelCode: 'Code',
    modeLabelBoth: (noun)=> noun + ' + code',

    // --- print layouts ---
    flowTitle: (noun, withArrows)=> withArrows ? (noun + ' Steps') : (noun + ' List'),
    codeListTitle: (noun)=> noun + ' Code List',
    noteLabel: 'Notes (tap to type — this is included when printed)',
    sizeLabel: 'Size',
    viewBoxLabel: 'ViewBox',
    groupPrintLabel: (name)=> `Group: ${name}`,
    createdAtLabel: (date)=> `Created: ${date}`,
    fileNameHeader: 'Name',
    groupHeader: 'Group',
    createdHeader: 'Created',
    modifiedHeader: 'Modified',
    itemCountLabel: (n)=> `${n} item(s)`,
    checklistTitle: (name)=> `${name} — Checklist`,
    untitled: '(Untitled)',
    selectedItemsTitle: 'Selected items',
    fromClipboardName: 'From clipboard',
    manualPasteName: 'Manual paste'
  },
  svg: {
    appTitle: '造 -ZOU-',
    listBtn: '📂 My SVGs',
    listSheetTitle: 'My SVGs',
    pasteSheetTitle: 'Paste SVG code',
    pasteBoxPlaceholder: 'Paste <svg>...</svg> here',
    codeSheetTitle: 'Edit SVG code',
    codeBoxPlaceholder: 'No SVG currently shown',
    emptyBig: 'No SVG loaded yet',
    savedEmpty: 'Nothing saved yet',
    fileAccept: '.svg,image/svg+xml',
    registerMenu: '＋ Save to My SVGs',
    downloadMenu: '📥 Save SVG file',
    parseError: 'Could not load this as SVG. Please check that the content is valid SVG code (HTML or other text cannot be loaded)',
    noGroupItems: 'This group has no SVGs',
    noStageContent: 'Nothing is currently shown',
    noSaveContent: 'Nothing to save',
    defaultExportName: 'svg-export',
    groupItemsNoun: 'SVG'
  },
  html: {
    appTitle: '造 -ZOU-',
    listBtn: '📂 My HTML',
    listSheetTitle: 'My HTML',
    pasteSheetTitle: 'Paste HTML code',
    pasteBoxPlaceholder: 'Paste <html>...</html> here',
    codeSheetTitle: 'Edit HTML code',
    codeBoxPlaceholder: 'No HTML currently shown',
    emptyBig: 'No HTML loaded yet',
    savedEmpty: 'Nothing saved yet',
    fileAccept: '.html,.htm,text/html',
    registerMenu: '＋ Save to My HTML',
    downloadMenu: '📥 Save HTML file',
    parseError: 'Could not load this as HTML. The content appears to be empty',
    noGroupItems: 'This group has no HTML items',
    noStageContent: 'Nothing is currently shown',
    noSaveContent: 'Nothing to save',
    defaultExportName: 'html-export',
    groupItemsNoun: 'HTML'
  }
};
