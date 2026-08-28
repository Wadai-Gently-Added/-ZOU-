"""
報-HOU- v0.4.0 積-BOU- Edition - stock.py
コピペスタンバイ / 旅立ち防止 / 賢い自動分割 のロジック本体
"""
from __future__ import annotations
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple

# v0.4.0 仕様書より
AI_MAX_TOKENS: Dict[str, int] = {
    "ChatGPT": 128000,
    "Claude": 200000,
    "Gemini": 1000000,
    "Copilot": 128000,
    "Perplexity": 128000,
    "Grok": 128000,
    "Grok(X)": 128000,
    "Grok(web)": 128000,
    "MetaAI": 128000,
    "Genspark": 80000,
    "GoogleAI": 1000000,
    "base44": 128000,
    "Manus": 200000,
}

DEFAULT_MAX = 128000
SAFETY_MARGIN = 5000
# 日本語混在を考慮したざっくり文字数換算係数 (トークン -> 文字数)
CHAR_SAFETY_RATIO = 0.7

def get_limit_chars(ai_name: str) -> int:
    tokens = AI_MAX_TOKENS.get(ai_name, DEFAULT_MAX)
    # Claude/Gemini等は公式が大きいが、実用上は分割しすぎないように上限をclampしたい場合はここで調整
    # 仕様書通り -5000
    return int((tokens - SAFETY_MARGIN) * CHAR_SAFETY_RATIO)

def load_config(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {"stocks": {}}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except:
        return {"stocks": {}}

def save_config(path: Path, data: Dict[str, Any]):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

def ensure_ai_stock(config: Dict[str, Any], ai_name: str) -> Dict[str, Any]:
    if "stocks" not in config:
        config["stocks"] = {}
    if ai_name not in config["stocks"]:
        config["stocks"][ai_name] = {
            "draft": "",
            "mode": "bottom",  # top / bottom
            "auto_stock": False,
            "current_source": "自分メモ",
            "sources": ["論文PDF", "Xポスト", "自分メモ"],
            "stacks": []
        }
    return config["stocks"][ai_name]

# ③ 旅立ち防止: draftは1秒ごとにGUI側から呼ばれる想定
def save_draft(config_path: Path, ai_name: str, draft_text: str):
    data = load_config(config_path)
    stock = ensure_ai_stock(data, ai_name)
    stock["draft"] = draft_text
    save_config(config_path, data)

def load_draft(config_path: Path, ai_name: str) -> str:
    data = load_config(config_path)
    stock = ensure_ai_stock(data, ai_name)
    return stock.get("draft", "")

# ② 自動ストック / ① 手動積み の共通ロジック
def add_stock(
    config_path: Path,
    ai_name: str,
    text: str,
    source: str = "",
    mode: str | None = None, # "top" or "bottom" Noneなら保存済み設定を使う
) -> Dict[str, Any]:
    if not text.strip():
        return ensure_ai_stock(load_config(config_path), ai_name)
    
    data = load_config(config_path)
    stock = ensure_ai_stock(data, ai_name)
    
    if not source:
        source = stock.get("current_source", "自分メモ")
    
    # 出所プルダウン: 新規ソースなら自動登録
    if source not in stock.get("sources", []):
        stock["sources"].append(source)
    stock["current_source"] = source

    # mode解決
    use_mode = mode or stock.get("mode", "bottom")

    # stacksへの追加は {text, source, time, char_count} 形式
    new_item = {
        "text": text,
        "source": source,
        "time": datetime.now().isoformat(timespec="seconds"),
        "char_count": len(text)
    }
    
    # 仕様書の「上に積む / 下に積む」は stacksの順序として実装
    # 将来的に全文結合時の順序にも使う
    if use_mode == "top":
        stock["stacks"].insert(0, new_item)
    else:
        stock["stacks"].append(new_item)
    
    save_config(config_path, data)
    return stock

def clear_stocks(config_path: Path, ai_name: str):
    data = load_config(config_path)
    stock = ensure_ai_stock(data, ai_name)
    stock["stacks"] = []
    stock["draft"] = ""
    save_config(config_path, data)

def get_full_text(config_path: Path, ai_name: str) -> str:
    """stacksを結合して全文を返す。表示用に [source time] ヘッダー付き"""
    data = load_config(config_path)
    stock = ensure_ai_stock(data, ai_name)
    parts = []
    for item in stock["stacks"]:
        header = f"[{item['source']} {item['time'][11:16]}]"  # 14:32 だけ表示
        parts.append(f"{header} {item['text']}")
    return "\n\n".join(parts)

def get_splitted_for_revenge(config_path: Path, ai_name: str) -> List[str]:
    """
    ⑤ 賢い自動分割 - 報復実行
    蓄積された全文を AIごとの上限-5000 で段落境界で分割
    """
    full = get_full_text(config_path, ai_name)
    if not full:
        return []
    
    limit = get_limit_chars(ai_name)
    
    # 段落で分割を試みる
    paragraphs = full.split("\n\n")
    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        # 1段落がlimit超えてたら、さらに文で切る
        if len(para) > limit:
            if current:
                chunks.append(current)
                current = ""
            # 強引にlimitで切る（最終手段）
            for i in range(0, len(para), limit):
                chunks.append(para[i:i+limit])
            continue

        if len(current) + len(para) + 2 <= limit:
            current = f"{current}\n\n{para}" if current else para
        else:
            if current:
                chunks.append(current)
            current = para
    
    if current:
        chunks.append(current)
    
    return chunks

# クリップボード監視用の重複抑止ヘルパー
class ClipboardGuard:
    def __init__(self):
        self.last_text = ""
        self.last_time = 0.0
        self.pause_until = 0.0

    def should_ignore(self, text: str) -> bool:
        now = time.time()
        if now < self.pause_until:
            return True
        if not text or not text.strip():
            return True
        if text == self.last_text and (now - self.last_time) < 1.0:
            return True
        return False

    def update(self, text: str):
        self.last_text = text
        self.last_time = time.time()

    def pause(self, sec: float = 0.5):
        self.pause_until = time.time() + sec

if __name__ == "__main__":
    # 簡易スモークテスト
    p = Path("./config.json")
    print("limit ChatGPT:", get_limit_chars("ChatGPT"))
    print("limit Claude:", get_limit_chars("Claude"))
    # add_stock(p, "ChatGPT", "テスト資料1", "論文PDF", "bottom")
    # print(get_splitted_for_revenge(p, "ChatGPT"))
