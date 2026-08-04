# SVG Viewer — ファイル構成

最終更新: 2026-08-05（個別レイアウト分岐とチェックリスト3/4択の出し分けを巻き戻し、常に4択・常にフロー表示に統一）

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

## 修正履歴
### 前回分
1. **選んで印刷でチェックボックスが押せない**: グループが折りたたまれた状態のまま選択モードに入ると中身が `display:none` で見えなくなっていたため、`enterPrintSelectMode()` で対象グループを自動展開するよう修正 (print.js)
2. **グループフォルダが空でも残留する**: ピン留め中のアイテムは `attachDrag` が付与されずドラッグでグループ移動できなかったため、ピン留めに関わらずドラッグでグループ移動できるよう修正 (list.js `buildItemRow`)。並び順は引き続きピン留めが優先される。

### 今回分
3. **① 印刷サムネイルが大きいSVGだとはみ出て文字が消える**: `svgForThumbnail()` を単純な`width/height:100%`頼みから、ビューアの`fitToView()`と同じ「`getBBox()`で実際の描画範囲を測って`viewBox`を引き直す」方式に変更 (print.js)。viewBoxが無い/実際の描画範囲とズレているSVGでも正しく縮小されるようになったはず。
4. **③ 選んで印刷が2回目に反応しない**: 印刷シートを閉じる処理(`printCancel`/`printBackdrop`/印刷完了後の`afterprint`)で選んで印刷モードの状態を必ずリセットするよう保険を追加。またiOSで`window.print()`を連続実行すると反応しなくなる既知の挙動を避けるため、印刷実行前に`requestAnimationFrame`で1フレーム待つよう変更 (print.js)。→ **実機で改善せず、要再調査**(症状の切り分け待ち: ①フローティングメニュー自体が出ないのか ②印刷プレビューまでは開くのか ③ブラウザの印刷ダイアログが反応しないのか)
5. **印刷メニューを4択に再編**: `SVG/コード/SVG+コード`の3択 →「☑️チェックリスト印刷／🖼SVG印刷／🔤コード印刷／🖼🔤SVG+コード印刷」の4択に変更。チェックリストは複数件印刷時に自動で混ぜるのをやめ、独立した選択肢に (print.js `printSubmenuOptions`)。単体(1件)印刷ではチェックリストの意味が薄いため非表示 — これを「選んで印刷」でチェックが1件だけの場合・グループの中身が1件だけの場合にも適用 (list.js)。
6. **個別(1件)印刷は専用レイアウトに分離**: `buildPrintOutput()`が渡された件数を見て、1件なら小さいフロー枠でなく大きく見せる`buildSingleImageSection()`(新設)を使うよう分岐 (print.js)。件数判定は呼び出し元に関わらず自動なので、グループ一括印刷や選んで印刷でも対象が1件になれば自動的にこの専用レイアウトが使われる。対応するCSSを`.single-page`/`.single-svg-frame`として`style.css`に追加。

### 巻き戻し(今回)
上記5・6を実機確認したところ「①4択のはずが3択になった」「①SVGだけの印刷でまたはみ出しが再発した」との報告があり、原因切り分けのため下記2点を撤回・元に戻した:
- 5の「単体印刷ではチェックリストを隠す」出し分け → 撤回、常に4択(チェックリスト/SVG/コード/SVG+コード)で固定。`printSubmenuOptions()`から`includeChecklist`引数を削除。`openSinglePrint()`は`checklist`モードにも対応するよう追加対応。
- 6の個別専用レイアウト(`buildSingleImageSection`) → 撤回・削除、`buildPrintOutput()`は件数に関わらず常に`buildFlowSection()`(確認済みで動いていたレイアウト)を使うよう統一。対応するCSSも削除。
→ これで③(選んで印刷2回目に反応しない)の調査に集中する。list.jsの`btnPrintSelectGo`ハンドラにtry/catch診断(エラー時にアラート表示)は維持したまま。
