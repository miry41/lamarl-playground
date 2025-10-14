import numpy as np
from .shapes import grid_mask

class SwarmEnv:
    """
    群ロボットの2Dグリッド環境（形状組立タスク）
    - 位置/速度の連続空間を離散グリッドに重ねて扱う
    - 観測は局所（近傍ロボ/目標セル/未占有セル）で固定次元に整形
    """
    def __init__(self, shape="circle", grid_size=64, n_robot=30, r_sense=0.4, r_avoid=0.1, nhn=6, nhc=80, l_cell=1.0, dt=0.05, seed=0):
        # パラメータ保持
        self.shape = shape; self.grid_size = grid_size
        self.n = n_robot; self.rs = r_sense; self.ra = r_avoid
        self.nhn = nhn; self.nhc = nhc; self.lc = l_cell; self.dt = dt
        self.rng = np.random.default_rng(seed)
        # 形状マスク生成（1=形状セル）
        self.mask = grid_mask(shape, grid_size)
        # 質量（全ロボ1.0）
        self.m = np.ones(self.n, dtype=np.float32)
        # 初期化
        self.reset()

    def reset(self):
        """
        初期位置/速度を形状近傍に置く（ランダム）
        - 収束を速めるため、形状セル付近にノイズ付きで散布
        """
        ys, xs = np.where(self.mask == 1)
        idx = self.rng.choice(len(xs), self.n, replace=True)
        px = xs[idx] + self.rng.normal(0, 2.0, size=self.n)
        py = ys[idx] + self.rng.normal(0, 2.0, size=self.n)
        self.p = np.stack([px, py], axis=1).astype(np.float32)      # 位置 (n,2)
        self.v = self.rng.normal(0, 0.1, size=(self.n, 2)).astype(np.float32)  # 速度 (n,2)
        return self.observe()

    def observe(self):
        """全ロボット分の観測ベクトルを返す。"""
        obs = []
        for i in range(self.n):
            oi = self._obs_i(i)
            obs.append(oi)
        return np.array(obs, dtype=np.float32)

    def _obs_i(self, i):
        """
        エージェント i の観測を作る（固定長）
          - 自身(6): pos(x,y), vel(x,y), n近傍数, 乱数タグ(2) *簡易*
          - 近傍 nhn: 相対pos(2) + 相対vel(2) → 計4 * nhn
          - 目標セル(2): マスクからランダム1点の相対位置
          - 未占有セル(2*nhc): マスクからランダム抽出（簡略）
        """
        # 自身状態（6）: 最後の2つは簡易タグ（将来拡張用のダミー）
        self_state = np.array([*self.p[i], *self.v[i], 0, 0], dtype=np.float32)

        # 近傍（距離順に nhn 個）- 最適化版
        rel = self.p - self.p[i]                                    # 相対位置
        dist_sq = (rel**2).sum(axis=1)                              # 距離の2乗（平方根回避）
        max_dist_sq = (self.rs * self.grid_size/8) ** 2            # 閾値も2乗で事前計算
        idx = np.argsort(dist_sq)                                   # 近い順にソート
        neigh = []
        cnt = 0
        # rs は物理m想定。グリッド座標に換算するため grid_size/8 でスケール（経験的）
        for j in idx[1:]:  # 自己(=i)除外
            if dist_sq[j] <= max_dist_sq and cnt < self.nhn:
                neigh += [rel[j,0], rel[j,1], self.v[j,0]-self.v[i,0], self.v[j,1]-self.v[i,1]]
                cnt += 1
        # パディング（固定次元維持: 不足分のみゼロ埋め）
        neigh += [0.0] * (4*self.nhn - len(neigh))

        # 目標セル（ランダム1点）: 相対ベクトル
        ys, xs = np.where(self.mask == 1)
        k = self.rng.integers(0, len(xs))
        tgt = np.array([xs[k]-self.p[i,0], ys[k]-self.p[i,1]], dtype=np.float32)

        # 未占有セル: 厳密には「未占有」を検知していない簡略版（負荷軽減のため）
        k2 = min(self.nhc, len(xs))
        sel = self.rng.choice(len(xs), size=k2, replace=False)
        unocc = []
        for s in sel:
            unocc += [xs[s]-self.p[i,0], ys[s]-self.p[i,1]]
        unocc += [0.0] * (2*self.nhc - 2*k2)

        # 連結して固定長ベクトルに
        vec = np.concatenate([
            self_state,
            np.array(neigh[:4*self.nhn], dtype=np.float32),
            tgt,
            np.array(unocc[:2*self.nhc], dtype=np.float32)
        ], axis=0)
        return vec

    def step(self, actions):
        """
        1 ステップ環境更新
          - 入力 actions: [-1,1] の力ベクトル（n,2）
          - 速度/位置を semi-implicit Euler で更新
          - 簡易衝突（2*ra 未満）で反発
        戻り: (観測, 衝突ペアリスト)
        """
        # 能動力（スケーリングは1.0で固定。必要に応じて調整可）
        fa = np.clip(actions, -1.0, 1.0) * 1.0

        # 受動力: フック則的な減衰/中心引力（簡易）
        fb = self._passive_force()

        # 加速度 → 速度 → 位置
        acc = (fa + fb) / self.m[:,None]
        self.v = np.clip(self.v + acc * self.dt, -3.0, 3.0)
        self.p = self.p + self.v * self.dt

        # 領域外クランプ
        self.p = np.clip(self.p, 0, self.grid_size-1)

        # 簡易衝突: 2*ra 未満 → 反発（速度に小さな押し出しを加える）
        col_pairs = []
        thr = max(1.0, 2*self.ra * self.grid_size/16)  # グリッドスケール換算の閾値
        for i in range(self.n):
            for j in range(i+1, self.n):
                d = np.linalg.norm(self.p[i]-self.p[j])
                if d < thr:
                    col_pairs.append((i,j))
                    dir = (self.p[i]-self.p[j])/(d+1e-6)
                    self.v[i] += dir*0.2; self.v[j] -= dir*0.2

        obs = self.observe()
        return obs, col_pairs

    def _passive_force(self):
        """
        受動力：
          - 減衰（-k_damp * v）
          - 形状中心への弱い引力（収束安定性向上のため）
        """
        center = np.array([self.grid_size/2, self.grid_size/2], dtype=np.float32)
        k_damp = 0.1; k_center = 0.05
        return -k_damp*self.v + k_center*(center[None,:]-self.p)
