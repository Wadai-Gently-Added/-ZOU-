# SVG Viewer — ファイル構成

最終更新: 2026-08-04（storage/viewer/print/list の4分割 + ピン留めドラッグ修正 + 選んで印刷の折りたたみバグ修正）

```
svg-viewer/
├── index.html          HTML骨組み(要素配置のみ)。style.css と js/*.js を読み込む
├── style.css            全スタイル(画面UI + 印刷用レイアウト)
└── js/
    ├── storage.js        データ保存層(localStorage読み書き、グループ/並び順の管理)
    ├── viewer.js         SVG表示(ズーム/パン)、読込、コード編集、単体保存/DL、スリープ防止、全体表示
    ├── print.js          印刷プレビュー構築(SVG手順/コード一覧/チェックリスト)、選んで印刷モード
    └── list.js           マイSVG一覧の描画、グループ管理、ドラッグ並べ替え、右クリックメニュー
```

## 読み込み順序(重要)
`index.html` の `</body>` 直前で以下の順に読み込む。この順でないと関数の参照エラーが起きる。

```html
<script src="js/storage.js"></script>
<script src="js/viewer.js"></script>
<script src="js/print.js"></script>
<script src="js/list.js"></script>
```

## ファイル間の依存関係
- **storage.js**: 依存なし。他の全ファイルの土台。
- **viewer.js**: storage.js の関数(getSaved/setSaved)を使う。print.js/list.js の関数(showContextMenu, printSubmenuOptions, openSinglePrint)を右クリックメニューから呼ぶため、実行時参照(遅延呼び出し)で問題なし。
- **print.js**: storage.js を使う。list.js の renderList() を選んで印刷モードの出入りで呼ぶ。
- **list.js**: storage.js / viewer.js(loadSVG, guardedLoad, isDirty等) / print.js(印刷系関数) を使う。

(script タグに `type="module"` は使っていないため、`const`/`let`/`function` はブラウザの同一グローバルスコープを共有する。呼び出し時点で全ファイルが読み込み済みであれば、宣言順が多少前後しても実害はない)

## 今回の修正点
1. **選んで印刷でチェックボックスが押せない**: グループが折りたたまれた状態のまま選択モードに入ると中身が `display:none` で見えなくなっていたため、`enterPrintSelectMode()` で対象グループを自動展開するよう修正 (print.js)
2. **グループフォルダが空でも残留する**: ピン留め中のアイテムは `attachDrag` が付与されずドラッグでグループ移動できなかったため、ピン留めに関わらずドラッグでグループ移動できるよう修正 (list.js `buildItemRow`)。並び順は引き続きピン留めが優先される。
