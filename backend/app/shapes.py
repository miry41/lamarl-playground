import numpy as np

def grid_mask(shape: str, size: int = 64) -> np.ndarray:
    """
    指定形状（circle/triangle/square/L/A/M/R）を 2D 二値マスクに変換して返す。
    戻り値: (size, size) の uint8 配列（1: 形状セル, 0: 背景）
    """
    m = np.zeros((size, size), dtype=np.uint8)
    yy, xx = np.mgrid[0:size, 0:size]
    cx, cy = size // 2, size // 2              # 図形中心
    r = size // 4                             # 基準半径（大幅に縮小）

    if shape == "circle":
        # 中心(cx,cy)・半径r の円内を1に
        m[((xx - cx) ** 2 + (yy - cy) ** 2) <= r * r] = 1

    elif shape == "triangle":
        # 正三角形（上頂点＋左右頂点）を NumPy の半平面判定で塗りつぶす
        p1 = (cx,            cy - r)                         # 上
        p2 = (cx - int(0.866 * r), cy + int(0.5 * r))       # 左下
        p3 = (cx + int(0.866 * r), cy + int(0.5 * r))       # 右下
        m = _triangle_mask(size, p1, p2, p3)

    elif shape == "square":
        # 中心正方形（やや大きめ）
        s = int(r * 1.1)
        m[cy - s:cy + s, cx - s:cx + s] = 1

    elif shape in ["L", "A", "M", "R"]:
        # ブロック字（学習用の安定した太めストローク）
        m = _letter_mask(shape, size)

    else:
        raise ValueError("unknown shape")
    return m


def _triangle_mask(size: int, p1: tuple[int, int], p2: tuple[int, int], p3: tuple[int, int]) -> np.ndarray:
    """
    三角形の内部（辺を含む）を NumPy ベクトル演算だけで塗りつぶす。
    半平面（クロス積の符号）で判定し、頂点列の向き（CW/CCW）で条件を切り替える。
    """
    yy, xx = np.mgrid[0:size, 0:size]

    # 3辺ベクトル
    (x1, y1), (x2, y2), (x3, y3) = p1, p2, p3
    v12 = (x2 - x1, y2 - y1)
    v23 = (x3 - x2, y3 - y2)
    v31 = (x1 - x3, y1 - y3)

    # 各ピクセルに対するクロス積（(P - Ai) × (Ai+1 - Ai)）
    c1 = (xx - x1) * v12[1] - (yy - y1) * v12[0]
    c2 = (xx - x2) * v23[1] - (yy - y2) * v23[0]
    c3 = (xx - x3) * v31[1] - (yy - y3) * v31[0]

    # 三角形の向き（符号付き面積の2倍）
    area2 = v12[0] * (y3 - y1) - v12[1] * (x3 - x1)

    if area2 >= 0:
        # 反時計回り(CCW): 全て >= 0 が内側
        mask = (c1 >= 0) & (c2 >= 0) & (c3 >= 0)
    else:
        # 時計回り(CW): 全て <= 0 が内側
        mask = (c1 <= 0) & (c2 <= 0) & (c3 <= 0)

    return mask.astype(np.uint8)


def _letter_mask(letter: str, size: int = 64) -> np.ndarray:
    """
    L/A/M/R を太めの矩形ストロークで近似。塗りつぶし領域を返す。
    ストローク太さ t は size 比で決定（細すぎる欠けを防止）。
    """
    m = np.zeros((size, size), dtype=np.uint8)
    t = size // 10  # ストローク太さ

    if letter == "L":
        m[size // 4: size * 3 // 4, size // 4: size // 4 + t] = 1             # 縦
        m[size * 3 // 4 - t: size * 3 // 4, size // 4: size // 2] = 1          # 下横

    elif letter == "A":
        m[size // 4: size * 3 // 4, size // 4: size // 4 + t] = 1              # 左縦
        m[size // 4: size * 3 // 4, size * 3 // 4 - t: size * 3 // 4] = 1      # 右縦
        m[size // 4: size // 4 + t, size // 4: size * 3 // 4] = 1              # 上横
        m[size // 2 - t // 2: size // 2 + t // 2, size // 3: size * 2 // 3] = 1# 中段横棒

    elif letter == "M":
        m[size // 4: size * 3 // 4, size // 4: size // 4 + t] = 1              # 左縦
        m[size // 4: size * 3 // 4, size * 3 // 4 - t: size * 3 // 4] = 1      # 右縦
        m[size // 4: size // 3, size // 4: size * 3 // 4] = 1                  # 上帯
        # 斜め（簡易）：左上→中央/右上→中央 を太めに
        for i in range(size // 6):
            m[size // 4 + i: size // 4 + i + t, size // 4 + i: size // 4 + i + t] = 1
            m[size // 4 + i: size // 4 + i + t, size * 3 // 4 - i - t: size * 3 // 4 - i] = 1

    elif letter == "R":
        m[size // 4: size * 3 // 4, size // 4: size // 4 + t] = 1              # 左縦
        m[size // 4: size // 3, size // 4: size * 3 // 4] = 1                  # 上帯
        m[size // 3 - t: size // 3, size // 4: size * 3 // 4] = 1              # 上横
        m[size // 3: size // 2, size * 3 // 4 - t: size * 3 // 4] = 1          # 右上縦
        m[size // 2: size * 3 // 4, size // 2: size // 2 + t] = 1              # 斜脚の起点

    return m
