"""
報-HOU- gui.py v0.4.0 積-BOU- Edition
①ロング収納 ②自動ストック ③旅立ち防止 ④出所プルダウン ⑤報復実行[1/3]UI
"""
import tkinter as tk
from tkinter import ttk, messagebox
from pathlib import Path
import json
from stock import (
    load_config, save_config, ensure_ai_stock, save_draft,
    add_stock, clear_stocks, get_full_text, get_splitted_for_revenge,
    get_limit_chars, ClipboardGuard
)
import pyperclip if True else None
try:
    import pyperclip
except:
    pyperclip = None

CONFIG_PATH = Path("./config.json")

class HouApp:
    def __init__(self, root):
        self.root = root
        self.root.title("報-HOU- v0.4.0 積-BOU- Edition")
        self.root.geometry("800x650")

        self.data = load_config(CONFIG_PATH)
        self.current_ai = tk.StringVar(value="ChatGPT")
        self.auto_stock_var = tk.BooleanVar(value=False)
        self.mode_var = tk.StringVar(value="bottom")
        self.source_var = tk.StringVar(value="自分メモ")
        self.guard = ClipboardGuard()
        self.chunks = []
        self.chunk_idx = 0

        self.build_ui()
        self.load_ai_data()
        # ③旅立ち防止 1秒ごとdraft保存
        self.root.after(1000, self.auto_save_draft)

    def build_ui(self):
        top = ttk.Frame(self.root)
        top.pack(fill=tk.X, padx=10, pady=5)

        ttk.Label(top, text="AI:").pack(side=tk.LEFT)
        ai_list = ["ChatGPT","Claude","Gemini","Grok","Perplexity","MetaAI","Genspark","Copilot","GoogleAI","base44","Manus","その他"]
        ttk.Combobox(top, textvariable=self.current_ai, values=ai_list, width=12).pack(side=tk.LEFT, padx=5)
        ttk.Button(top, text="切替", command=self.load_ai_data).pack(side=tk.LEFT)

        ttk.Checkbutton(top, text="☑ 自動ストックON", variable=self.auto_stock_var).pack(side=tk.LEFT, padx=10)
        ttk.Radiobutton(top, text="○上に積む", variable=self.mode_var, value="top").pack(side=tk.LEFT)
        ttk.Radiobutton(top, text="●下に積む", variable=self.mode_var, value="bottom").pack(side=tk.LEFT)

        # 出所プルダウン
        src_frame = ttk.Frame(self.root)
        src_frame.pack(fill=tk.X, padx=10, pady=5)
        ttk.Label(src_frame, text="出所:").pack(side=tk.LEFT)
        self.source_combo = ttk.Combobox(src_frame, textvariable=self.source_var, width=20)
        self.source_combo.pack(side=tk.LEFT, padx=5)
        ttk.Button(src_frame, text="+新規追加", command=self.add_source).pack(side=tk.LEFT)

        # draftテキストボックス
        ttk.Label(self.root, text="draft (旅立ち防止:1秒自動保存)").pack(anchor=tk.W, padx=10)
        self.draft_text = tk.Text(self.root, height=8)
        self.draft_text.pack(fill=tk.BOTH, expand=False, padx=10, pady=5)

        btn_frame = ttk.Frame(self.root)
        btn_frame.pack(fill=tk.X, padx=10)
        ttk.Button(btn_frame, text="積む", command=self.do_stack).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="全部コピー", command=self.copy_all).pack(side=tk.LEFT)
        ttk.Button(btn_frame, text="クリア", command=self.clear_all).pack(side=tk.LEFT)
        ttk.Button(btn_frame, text="報復実行", command=self.do_revenge).pack(side=tk.LEFT, padx=15)

        # stacks表示
        ttk.Label(self.root, text="積み上がったもの (stocks)").pack(anchor=tk.W, padx=10)
        self.stacks_text = tk.Text(self.root, height=12, state="disabled", bg="#f5f5f5")
        self.stacks_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        # ⑤報復実行の分割UI
        self.revenge_frame = ttk.Frame(self.root)
        self.revenge_frame.pack(fill=tk.X, padx=10, pady=5)
        self.revenge_label = ttk.Label(self.revenge_frame, text="")
        self.revenge_label.pack(side=tk.LEFT)
        self.copy_chunk_btn = ttk.Button(self.revenge_frame, text="クリップボードにコピー", command=self.copy_chunk, state="disabled")
        self.copy_chunk_btn.pack(side=tk.LEFT, padx=5)
        self.next_btn = ttk.Button(self.revenge_frame, text="次へ", command=self.next_chunk, state="disabled")
        self.next_btn.pack(side=tk.LEFT)

    def get_stock(self):
        return ensure_ai_stock(self.data, self.current_ai.get())

    def load_ai_data(self):
        self.data = load_config(CONFIG_PATH)
        stock = self.get_stock()
        self.auto_stock_var.set(stock.get("auto_stock", False))
        self.mode_var.set(stock.get("mode", "bottom"))
        self.source_var.set(stock.get("current_source", "自分メモ"))
        self.source_combo["values"] = stock.get("sources", [])
        self.draft_text.delete("1.0", tk.END)
        self.draft_text.insert("1.0", stock.get("draft", ""))
        self.refresh_stacks_view()

    def refresh_stacks_view(self):
        stock = self.get_stock()
        self.stacks_text.config(state="normal")
        self.stacks_text.delete("1.0", tk.END)
        for item in stock.get("stacks", []):
            self.stacks_text.insert(tk.END, f"[{item['source']} {item['time'][11:16]} {item['char_count']}字]\n{item['text']}\n\n")
        self.stacks_text.config(state="disabled")

    def auto_save_draft(self):
        try:
            draft = self.draft_text.get("1.0", tk.END).rstrip()
            save_draft(CONFIG_PATH, self.current_ai.get(), draft)
            # 設定も保存
            self.data = load_config(CONFIG_PATH)
            st = ensure_ai_stock(self.data, self.current_ai.get())
            st["auto_stock"] = self.auto_stock_var.get()
            st["mode"] = self.mode_var.get()
            st["current_source"] = self.source_var.get()
            save_config(CONFIG_PATH, self.data)
        except Exception as e:
            print(e)
        self.root.after(1000, self.auto_save_draft)

    def add_source(self):
        src = self.source_var.get().strip()
        if not src: return
        self.data = load_config(CONFIG_PATH)
        st = ensure_ai_stock(self.data, self.current_ai.get())
        if src not in st["sources"]:
            st["sources"].append(src)
        st["current_source"] = src
        save_config(CONFIG_PATH, self.data)
        self.source_combo["values"] = st["sources"]

    def do_stack(self):
        text = self.draft_text.get("1.0", tk.END).strip()
        if not text: return
        add_stock(CONFIG_PATH, self.current_ai.get(), text, self.source_var.get(), self.mode_var.get())
        self.draft_text.delete("1.0", tk.END)
        self.data = load_config(CONFIG_PATH)
        save_draft(CONFIG_PATH, self.current_ai.get(), "")
        self.refresh_stacks_view()

    def copy_all(self):
        txt = get_full_text(CONFIG_PATH, self.current_ai.get())
        if pyperclip: pyperclip.copy(txt)
        self.guard.pause(0.8)

    def clear_all(self):
        if messagebox.askyesno("確認", "全部クリアする？"):
            clear_stocks(CONFIG_PATH, self.current_ai.get())
            self.refresh_stacks_view()

    def do_revenge(self):
        self.chunks = get_splitted_for_revenge(CONFIG_PATH, self.current_ai.get())
        if not self.chunks:
            messagebox.showinfo("報復", "積まれてるものが無いよ")
            return
        self.chunk_idx = 0
        limit = get_limit_chars(self.current_ai.get())
        self.revenge_label.config(text=f"AI:{self.current_ai.get()} 上限~{limit}字  [{self.chunk_idx+1}/{len(self.chunks)}] 合計{sum(len(c) for c in self.chunks)}字")
        self.copy_chunk_btn.config(state="normal")
        self.next_btn.config(state="normal" if len(self.chunks)>1 else "disabled")
        self.copy_chunk()

    def copy_chunk(self):
        if not self.chunks: return
        chunk = self.chunks[self.chunk_idx]
        if pyperclip: pyperclip.copy(chunk)
        self.guard.pause(0.8)
        self.revenge_label.config(text=f"コピーした [{self.chunk_idx+1}/{len(self.chunks)}] {len(chunk)}字")

    def next_chunk(self):
        if self.chunk_idx+1 < len(self.chunks):
            self.chunk_idx+=1
            self.revenge_label.config(text=f"[{self.chunk_idx+1}/{len(self.chunks)}] {len(self.chunks[self.chunk_idx])}字")
            self.copy_chunk()
            if self.chunk_idx+1 >= len(self.chunks):
                self.next_btn.config(state="disabled")

if __name__ == "__main__":
    root = tk.Tk()
    app = HouApp(root)
    root.mainloop()
