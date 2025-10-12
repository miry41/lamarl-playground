import numpy as np
from scipy.spatial import Voronoi

def coverage_m1(shape_mask: np.ndarray, robots_xy: np.ndarray, r_avoid: float) -> float:
    """
    Coverage(M1): 形状セルのうち「ロボットが占有した」と見なせる割合
    - セル中心と最近ロボット距離がしきい値未満なら「占有」
    - しきい値はグリッドスケールと r_avoid から簡易スケーリング
    ※ 論文の定義に近づけつつ、実装コストと速度を優先した近似
    """
    size = shape_mask.shape[0]
    ys, xs = np.where(shape_mask == 1)
    if len(xs) == 0:
        return 0.0
    # shape セルの座標 → (N,2)
    pts = np.stack([xs, ys], axis=1).astype(np.float32)
    rob = robots_xy.astype(np.float32)  # (n,2)
    # 各セルと各ロボの距離行列（ベクトル化）
    d2 = ((pts[:, None, :] - rob[None, :, :])**2).sum(axis=2)
    min_d = np.sqrt(d2.min(axis=1))
    # スケール調整: グリッド座標系なので、r_avoid を格子に合わせて拡大
    thr = max(1.0, r_avoid*size/4)
    occupied = (min_d < thr).sum()
    return float(occupied) / float(len(xs))

def uniformity_m2(robots_xy: np.ndarray, shape_mask: np.ndarray, sample_k: int = 2000) -> float:
    """
    Uniformity(M2): Voronoi によるセル割当の分散（小さいほど均一）
    - 全セルでの厳密計算は重いので、形状セルをランダムサンプリング
    - サンプル点の最近ロボットを求め、ロボットごとの割当数の分散を算出
    ※ 速度と安定性のトレードオフで sample_k を設定
    """
    h, w = shape_mask.shape
    ys, xs = np.where(shape_mask == 1)
    if len(xs) == 0 or len(robots_xy) == 0:
        return 1.0  # 形状もしくはロボがない場合は悪値で返す
    # サンプリング
    idx = np.random.choice(len(xs), size=min(sample_k, len(xs)), replace=False)
    pts = np.stack([xs[idx], ys[idx]], axis=1).astype(np.float32)
    rob = robots_xy.astype(np.float32)
    # 最近ロボットを各点に割り当て
    d2 = ((pts[:, None, :] - rob[None, :, :])**2).sum(axis=2)
    nearest = d2.argmin(axis=1)
    counts = np.bincount(nearest, minlength=len(rob))
    nv = counts.mean()
    # 分散（= Σ (nv_i - 平均)^2 / n_robot）
    return float(((counts - nv)**2).sum() / len(rob))
