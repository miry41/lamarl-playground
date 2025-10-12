import os, json, time, random, string
from pathlib import Path
from PIL import Image, ImageDraw

# 結果出力用のルートディレクトリ
RESULTS_DIR = Path(__file__).resolve().parent.parent / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

def make_id(prefix="ep"):
    """
    一意なエピソードIDを作る（タイムスタンプ + ランダム4文字）。
    例: ep-173******-a1b2
    """
    t = int(time.time()*1000)
    r = ''.join(random.choices(string.ascii_lowercase+string.digits, k=4))
    return f"{prefix}-{t}-{r}"
