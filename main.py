"""
報-HOU- main.py v0.4.0
自動ストック監視スレッド + draft1秒保存の土台
"""
import time
import threading
from pathlib import Path
from stock import add_stock, save_draft, ClipboardGuard

CONFIG_PATH = Path("./config.json")

# pyperclipが無ければダミーで動くように
try:
    import pyperclip
    def get_clip(): return pyperclip.paste()
except:
    def get_clip(): return ""

guard = ClipboardGuard()

def clipboard_watcher(ai_name_getter, auto_stock_getter, source_getter):
    """バックグラウンドでクリップボードを監視"""
    while True:
        try:
            if auto_stock_getter():
                text = get_clip()
                if not guard.should_ignore(text):
                    ai = ai_name_getter()
                    src = source_getter()
                    add_stock(CONFIG_PATH, ai, text, src)
                    guard.update(text)
                    print(f"[積-BOU-] {ai} <- {src} {len(text)} chars")
        except Exception as e:
            print(f"[watcher error] {e}")
        time.sleep(0.5)

def start_watcher(ai_name_getter, auto_stock_getter, source_getter):
    t = threading.Thread(target=clipboard_watcher, args=(ai_name_getter, auto_stock_getter, source_getter), daemon=True)
    t.start()
    return t

if __name__ == "__main__":
    print("報-HOU- v0.4.0 積-BOU- standalone test")
    print("gui.pyから start_watcher() を呼んでください")
