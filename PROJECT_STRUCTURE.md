# SVG/HTML Viewer — ファイル構成

最終更新: 2026-08-05（全ユーザー向け文言をjs/strings.jsに一元化。alert/confirm/promptや空状態メッセージが各ファイルに散らばっていたのを1箇所にまとめ、SVG/HTMLモードの出し分けもここで完結するように）

```
svg-viewer/
├── index.html          HTML骨組み(要素配置のみ)。style.css と js/*.js を読み込む
├── style.css            全スタイル(画面UI + 印刷用レイアウト)
└── js/
    ├── storage.js        データ保存層(localStorage読み書き、グループ/並び順の管理、SVG/HTMLでキーを分離)
    ├── strings.js         全ユーザー向け文言の一元管理(STRオブジェクト。SVG/HTML共通/モード別)
    ├── viewer.js         SVG/HTML表示(ズーム/パン)、読込、コード編集、単体保存/DL、スリープ防止、全体表示
    ├── print.js          印刷プレビュー構築(SVG/HTML両対応)、選んで印刷モード
    ├── list.js           マイSVG/マイHTML一覧の描画、グループ管理、ドラッグ並べ替え、右クリックメニュー
    └── mode.js           SVGビューワー/HTMLビューワーのタブ切り替え、ラベル・状態の一括更新
```

## 読み込み順序(重要)
`index.html` の `</body>` 直前で以下の順に読み込む。この順でないと関数の参照エラーが起きる。

```html
<script src="js/storage.js"></script>
<script src="js/strings.js"></script>
<script src="js/viewer.js"></script>
<script src="js/print.js"></script>
<script src="js/list.js"></script>
<script src="js/mode.js"></script>
```

## ファイル間の依存関係
- **storage.js**: 依存なし。他の全ファイルの土台。`currentMode`('svg'|'html')をここで保持し、保存先キー(`storeKey()`/`groupsKey()`/`topOrderKey()`)を切り替える。
- **strings.js**: storage.jsの`currentMode`を参照する(`STR.mode()`)。storage.jsの直後、他の全UIファイルより先に読み込む。
- **viewer.js**: storage.js / strings.js の関数・値を使う。print.js/list.js の関数(showContextMenu, printSubmenuOptions, openSinglePrint)を右クリックメニューから呼ぶため、実行時参照(遅延呼び出し)で問題なし。
- **print.js**: storage.js / strings.js を使う。list.js の renderList() を選んで印刷モードの出入りで呼ぶ。
- **list.js**: storage.js / strings.js / viewer.js(loadContent, guardedLoad, isDirty等) / print.js(印刷系関数) を使う。
- **mode.js**: 上記全ファイルの状態(currentMode, stage, printSelectActive等)をタブ切り替え時にまとめてリセットする。最後に読み込む。

(script タグに `type="module"` は使っていないため、`const`/`let`/`function` はブラウザの同一グローバルスコープを共有する。呼び出し時点で全ファイルが読み込み済みであれば、宣言順が多少前後しても実害はない)

## 文言管理について(strings.js)
- `STR.common.xxx` … SVG/HTMLどちらのモードでも同じ文言(保存失敗、削除確認、キャンセル等)
- `STR.svg.xxx` / `STR.html.xxx` … モードごとに違う文言(空状態メッセージ、パースエラー、メニューラベル等)
- `STR.mode()` … `currentMode`に応じて`STR.svg`か`STR.html`を自動で返すショートカット。JS内では基本的にこれを使う
- alert/confirm/promptの文言、および空状態メッセージ・タブ切り替え時のラベルは全てここ経由。今後トーンを変えたり多言語対応する時もこのファイルだけ触れば良い

## HTMLビューワー機能について
- SVGと全く同じ操作性(ピンチズーム/パン、拡大縮小できる一枚絵としての表示)でHTMLコンテンツも表示できる
- 保存データはSVGとHTMLで完全に別(localStorageのキーが異なる: `svgViewerSavedItems`系 / `htmlViewerSavedItems`系)。タブを切り替えると自動的にマイSVG⇔マイHTMLも切り替わる
- HTML読込は`extractSvgElement`のような厳密なタグ抽出はせず、そのまま`.html-content-wrap`に流し込んで表示する(スクリプトも実行される。ユーザー自身が作った/持ち込んだHTMLを信頼する前提)
- マイSVG/マイHTML一覧のサムネイルは、HTMLモードでは安全のため(スクリプト実行・レイアウト崩れ防止)実際のHTMLを埋め込まず汎用アイコン(📄)を表示
- 印刷機能もSVG/HTML両対応。SVGモードのみ「サイズ/ViewBox表」が付く(HTMLには意味が薄いため省略)
- 保存/ダウンロード/コード編集/印刷は`hasStageContent()`/`currentContentString()`という共通ヘルパー経由でモードを意識せず動くようにしてある

## 修正履歴
### 前回分
1. **選んで印刷でチェックボックスが押せない**: グループが折りたたまれた状態のまま選択モードに入ると中身が `display:none` で見えなくなっていたため、`enterPrintSelectMode()` で対象グループを自動展開するよう修正 (print.js)
2. **グループフォルダが空でも残留する**: ピン留め中のアイテムは `attachDrag` が付与されずドラッグでグループ移動できなかったため、ピン留めに関わらずドラッグでグループ移動できるよう修正 (list.js `buildItemRow`)。並び順は引き続きピン留めが優先される。

### 今回分
3. **① 印刷サムネイルが大きいSVGだとはみ出て文字が消える**: `svgForThumbnail()` を単純な`width/height:100%`頼みから、ビューアの`fitToView()`と同じ「`getBBox()`で実際の描画範囲を測って`viewBox`を引き直す」方式に変更 (print.js)。viewBoxが無い/実際の描画範囲とズレているSVGでも正しく縮小されるようになったはず。
4. **③ 選んで印刷が2回目に反応しない**: 印刷シートを閉じる処理(`printCancel`/`printBackdrop`/印刷完了後の`afterprint`)で選んで印刷モードの状態を必ずリセットするよう保険を追加。またiOSで`window.print()`を連続実行すると反応しなくなる既知の挙動を避けるため、印刷実行前に`requestAnimationFrame`で1フレーム待つよう変更 (print.js)。→ **実機で改善せず、要再調査**(症状の切り分け待ち: ①フローティングメニュー自体が出ないのか ②印刷プレビューまでは開くのか ③ブラウザの印刷ダイアログが反応しないのか)
5. **印刷メニューを4択に再編**: `SVG/コード/SVG+コード`の3択 →「☑️チェックリスト印刷／🖼SVG印刷／🔤コード印刷／🖼🔤SVG+コード印刷」の4択に変更。チェックリストは複数件印刷時に自動で混ぜるのをやめ、独立した選択肢に (print.js `printSubmenuOptions`)。単体(1件)印刷ではチェックリストの意味が薄いため非表示 — これを「選んで印刷」でチェックが1件だけの場合・グループの中身が1件だけの場合にも適用 (list.js)。
6. **個別(1件)印刷は専用レイアウトに分離**: `buildPrintOutput()`が渡された件数を見て、1件なら小さいフロー枠でなく大きく見せる`buildSingleImageSection()`(新設)を使うよう分岐 (print.js)。件数判定は呼び出し元に関わらず自動なので、グループ一括印刷や選んで印刷でも対象が1件になれば自動的にこの専用レイアウトが使われる。対応するCSSを`.single-page`/`.single-svg-frame`として`style.css`に追加。

### 巻き戻し
5・6を実機確認したところ「4択のはずが3択になった」「SVGだけの印刷でまたはみ出しが再発した」との報告があり、原因切り分けのため一旦撤回・元に戻した(常に4択・常にフロー表示に統一)。

### 印刷機能の再設計(今回)
役割が曖昧だったのをはっきり分離する方針に変更:
- **グループ一括印刷**(グループ右クリック→「☑️ チェックリスト印刷」): チェックリスト(一覧)専用。もう選択メニューを出さず、これ一択で直接印刷する (print.js `openGroupPrint()`から`mode`引数を削除)
- **選んで印刷**(グループ右クリック→「🖨 選んで印刷」→チェックボックスで複数選択): SVG/コード/SVG+コードの3択(list.js `printSubmenuOptions()`、チェックリストは含まない)。1件ずつ「個別表示ページ」を連続で並べる形式に統一 (旧来の「小さい枠を→で繋ぐフロー形式」`buildFlowSection`は廃止)
- **単品印刷**(1件だけ、右クリック or 表示中のSVG): 「個別表示ページ」形式そのもの — 大きいSVGプレビュー + サイズ/ViewBox表 + メモ欄、その後にコード(`buildSingleImageSection()`新設)

選んで印刷と単品印刷は同じ`buildSingleImageSection()`を経由する(`buildIndividualPages()`が件数ぶん並べる)ため、見た目は完全に統一される。対応するCSSを`.single-page`/`.single-svg-frame`/`.single-meta-table`として`style.css`に追加。

③(選んで印刷が2回目に反応しない)はまだ未解決。list.jsの`btnPrintSelectGo`ハンドラのtry/catch診断(エラー時にアラート表示)は維持したまま。

### ③の追加調査(今回)
診断用アラートを仕込んだ状態で再現してもらったところ「アラートも出ず本当に無反応」と判明 → クリックがハンドラに届いていない可能性が高いと判断。
原因候補: 印刷プレビュー画面(`printSheet`)をきちんと閉じずに(例: ブラウザの印刷ダイアログだけ閉じて)マイSVG一覧に戻ると、`printSheet`が裏で`open`状態のまま残り、DOM順で後に来る`printSheet`が同じz-indexで`listSheet`の上に透明に重なってクリックを吸い取ってしまう可能性がある。
対策: 全シート(貼り付け/マイSVG/コード編集/印刷)共通の`closeAllSheets()`を`storage.js`に追加し、`openPaste()`/`openCode()`/`openList()`/`openPrintSheet()`それぞれの冒頭で必ず他の全シートを閉じてから自分を開くよう変更。これで同時に複数シートが`open`状態になること自体を防ぐ。→ この対策後は選択印刷が無反応にならなくなった(診断アラートは撤去済み)。

### 今回の変更
1. **折り紙フロー形式を復活**: 個別表示ページ(`buildSingleImageSection`)に統一していたが、複数件をまとめて折る手順書として使う用途(番号+矢印でつなぐ`buildFlowSection`)が一番よく使われるとのことで復活。画像レイアウトは「1件だけなら個別表示、複数件ならフロー形式」で自動的に出し分ける (print.js `buildPrintOutput`)。
2. **選んで印刷をグループ横断のグローバル選択モードに変更**: 従来はグループ単位でしか選択できなかったが、色んなグループから抜粋して1回の印刷にまとめたい要望があったため、`printSelectGroupId`(グループID限定)を廃止し`printSelectActive`(真偽値)に変更。マイSVG一覧のヘッダーに「☑️ 選んで印刷」ボタンを新設 (index.html `#btnStartSelectPrint`)し、押すと全グループ(未グループのアイテムも含む)にチェックボックスが表示される。グループ単位の「🖨 選んで印刷」メニュー項目は廃止(グローバル版で代替可能なため)。グループ右クリックの「☑️ チェックリスト印刷」はそのまま維持。
3. 診断用に仮設置していたアラート(`btnPrintSelectGo`/選んで印刷メニュー)は撤去済み。

### 今回の変更(続き)
4. **グループのSVG/コード一括印刷を復活**: チェックリスト専用にしていたが「グループの中身をSVG/コードとして印刷する機能が消えた」との指摘で復活。グループ右クリックに「☑️ チェックリスト印刷」(一覧のみ、直接実行)と「🖨 印刷」(4択submenu、`openGroupPrint()`)の2項目が並ぶ形に (list.js / print.js `openGroupChecklist()`を新設し、`openGroupPrint()`は`mode`引数ありに戻した)。
5. **グループ名表示**: 複数グループから抜粋して印刷した時にどのグループの項目か分かるよう、フロー形式(`flow-group`)・個別表示(`print-meta`)・コード一覧表(グループ列)それぞれにグループ名を追加 (print.js `getGroupNameOf()`)。
6. **印刷順をチェックした順に**: 従来は保存順(DOM順)で印刷されていたが、`printSelectedIds`(Set、挿入順=チェック順を保持)をそのまま使うよう`btnPrintSelectGo`のロジックを変更 (list.js)。
7. **矢印なし一覧オプションを追加**: `printSubmenuOptions()`を3択→4択に変更、「📋 SVG一覧印刷(矢印なし)」を追加。`buildFlowSection(items, withArrows)`が第2引数で矢印の有無を切り替えられるように (print.js)。単品印刷では引き続き大きい個別表示が使われ、矢印の有無は複数件の時だけ影響する。

### 今回の統合(続き)
8. **チェックリストを「🖨 印刷」メニューの5択目に統合**: 別ボタンだった「☑️ チェックリスト印刷」を廃止し、`printSubmenuOptions()`の先頭に「☑️ チェックリスト印刷」を追加(5択に)。`openGroupPrint()`/`openMultiPrint()`/`openSinglePrint()`それぞれが`mode==='checklist'`を受け取れるよう対応(`openGroupChecklist()`は廃止・統合)。
9. **「選んで印刷」を右クリックメニューにも追加**: これまでマイSVG一覧ヘッダーのボタンからしか入れなかったが、グループ右クリックメニューとアイテム右クリックメニューの両方に「☑️ 選んで印刷」を追加 (list.js)。どこから開始しても同じグローバル選択モード(`enterPrintSelectMode()`、グループ横断)に入る。ヘッダーボタンはそのまま残してある。

### ③の追加調査(今回)
診断アラートが「本当に何も起きなかった(エラーも出ない)」との報告 → クリックがボタンまで届いていない可能性が高いと判断。
有力な原因候補: 印刷プレビュー(`printSheet`)を「閉じる」ボタン/背景タップできちんと閉じずに(例えばブラウザの印刷ダイアログだけ閉じて)マイSVGへ戻ると、`printSheet`が裏で`open`のまま残り、DOM順で後にある`printSheet`が同じz-indexで`listSheet`の上に重なってクリックを吸い取ってしまう。
対策: 全シート(貼り付け/マイSVG/コード編集/印刷)共通の強制クローズ関数`closeAllSheets()`を`storage.js`に追加し、各シートを開く関数(`openPaste`/`openList`/`openCode`/`openPrintSheet`)の先頭で必ず呼ぶよう変更。これでシートの多重オープンによる透明重なりを構造的に防ぐ。実機確認待ち。
