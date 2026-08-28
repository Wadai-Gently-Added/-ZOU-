# 報-HOU- v0.4.0 積-BOU- Edition

> AIさんたちにプロダクトレベル・研究書レベル・テクニカルバイブル・聖典といわれるアイディアを頑張ってちまちま作ってる

シリーズ: 撰-SEN- / 験-KEN- / 頒-MADARA- / 造-ZOU- / 導-SHIRUBE- / 戻-REI- / 收-SYU- / 斬-ZAN- / 報-HOU-

## これは何？
- 12AI無料枠ユーザーのための留守番PWA
- v0.3.0: Cloudflare Workers + KV + CronでPWA閉じてもPush (赤:制限解除 / 青:返信完了)
- v0.4.0 積-BOU-: 制限で詰まった時に打ち込むはずだったデータを失わずにストックし、制限解除後に報復(再投入)できるコピペスタンバイ機能

## フォルダ構成
- stock.py ... 積-BOU- ロジック本体 (今回のメイン)
- gui.py ... Tkinter UI ①ロング収納②自動ストック③旅立ち防止④出所プルダウン⑤報復実行[1/3]
- main.py ... クリップボード監視スレッド
- config.json ... 永続化 (stocks / draft / sources / push)
- worker/ ... Cloudflare Worker (KV + Cron)
- pwa/ ... PWA (manifest, sw.js, app.js) iOS16.4+ ホーム画面追加でPush対応
- extension/edge ... 返信検知拡張
- extension/safari ... 雛形

## セットアップ (ManusさんのiPhone最短テスト対応)
1. Cloudflareで `worker/wrangler.toml` のKV作成 & `wrangler deploy`
2. `config.json` の worker_url / connect_key を設定
3. `pip install pyperclip` (任意)
4. `python gui.py` で起動
5. iPhoneでPWAをホーム画面追加 → Push通知を接続 → 1分テスト通知

## 法的事項 (Manusさん整理)
- 私は弁護士ではありません。販売条件・利用規約は専門家へ確認してください
- Pushはベストエフォート。通知到達・時刻は保証しません
- 購入者ごとのWorker・秘密情報の分離、プライバシーポリシー整備が必要
- AI各社の利用規約・ロゴ利用条件・DOM監視可否を個別確認

## ライセンス
個人利用・ベータ配布前提。BOOTH販売時は利用規約を同梱すること。

