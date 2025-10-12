import numpy as np, torch, torch.nn as nn, torch.optim as optim
from .buffer import ReplayBuffer

def mlp(in_dim, out_dim, hidden=[180,180,180], out_act=None):
    """
    汎用 MLP ブロック: LeakyReLU を採用（論文の記述に準拠）
    - out_act='tanh' の場合は最終出力に Tanh を適用（Actor用）
    """
    layers = []
    last = in_dim
    for h in hidden:
        layers += [nn.Linear(last, h), nn.LeakyReLU(0.1)]
        last = h
    layers += [nn.Linear(last, out_dim)]
    if out_act == "tanh":
        layers += [nn.Tanh()]
    return nn.Sequential(*layers)

class MADDPGAgent:
    """
    単一エージェントの DDPG（MADDPG の構成要素）
    - Actor: π(o) → a ∈ [-1,1]^2
    - Critic: Q(o, a)
    - Target Network: soft update
    - Noise: ガウスノイズ（探索）
    """
    def __init__(self, obs_dim, act_dim=2, lr_actor=1e-4, lr_critic=1e-3, gamma=0.99, tau=0.005, noise=0.1, device="cpu"):
        self.device = device
        self.obs_dim, self.act_dim = obs_dim, act_dim

        # ネットワーク初期化
        self.actor = mlp(obs_dim, act_dim, out_act="tanh").to(device)
        self.actor_t = mlp(obs_dim, act_dim, out_act="tanh").to(device)
        self.critic = mlp(obs_dim + act_dim, 1).to(device)
        self.critic_t = mlp(obs_dim + act_dim, 1).to(device)
        self.copy(self.actor_t, self.actor)
        self.copy(self.critic_t, self.critic)

        # オプティマイザ
        self.opt_a = optim.Adam(self.actor.parameters(), lr=lr_actor)
        self.opt_c = optim.Adam(self.critic.parameters(), lr=lr_critic)

        # ハイパラ
        self.gamma, self.tau, self.noise = gamma, tau, noise

    @staticmethod
    def copy(dst, src):
        """target ← online をハードコピー"""
        for d, s in zip(dst.parameters(), src.parameters()):
            d.data.copy_(s.data)

    def act(self, obs, deterministic=False):
        """
        観測 obs（np.ndarray shape=(1, obs_dim)）から行動 a を出力
        - 推論時は Tanh 出力（-1..1）にノイズを付与（学習中）
        """
        with torch.no_grad():
            a = self.actor(torch.as_tensor(obs, dtype=torch.float32, device=self.device))
        a = a.cpu().numpy()
        if not deterministic:
            a += np.random.normal(0, self.noise, size=a.shape)
        return np.clip(a, -1.0, 1.0)

    def update(self, batch, reward_scale=1.0):
        """
        1回分の学習ステップ
        - Critic: MSE(Q - y)
        - Actor: -Q(o, π(o)) を最小化（= Q を最大化）
        - Target: soft update
        """
        obs, act, rew, nobs, done = batch
        obs = torch.as_tensor(np.vstack(obs), dtype=torch.float32, device=self.device)
        act = torch.as_tensor(np.vstack(act), dtype=torch.float32, device=self.device)
        rew = torch.as_tensor(np.vstack(rew), dtype=torch.float32, device=self.device) * reward_scale
        nobs = torch.as_tensor(np.vstack(nobs), dtype=torch.float32, device=self.device)
        done = torch.as_tensor(np.vstack(done).astype(np.float32), dtype=torch.float32, device=self.device)

        # 目標Q
        with torch.no_grad():
            na = self.actor_t(nobs)
            q_t = self.critic_t(torch.cat([nobs, na], dim=1))
            y = rew + self.gamma * (1.0 - done) * q_t

        # クリティック更新
        q = self.critic(torch.cat([obs, act], dim=1))
        loss_c = ((q - y)**2).mean()
        self.opt_c.zero_grad(); loss_c.backward(); self.opt_c.step()

        # アクター更新
        a = self.actor(obs)
        loss_a = - self.critic(torch.cat([obs, a], dim=1)).mean()
        self.opt_a.zero_grad(); loss_a.backward(); self.opt_a.step()

        # ターゲットのソフト更新
        for tp, p in zip(self.actor_t.parameters(), self.actor.parameters()):
            tp.data.copy_(self.tau * p.data + (1 - self.tau) * tp.data)
        for tp, p in zip(self.critic_t.parameters(), self.critic.parameters()):
            tp.data.copy_(self.tau * p.data + (1 - self.tau) * tp.data)


        return float(loss_a.item()), float(loss_c.item())
        
class MADDPGSystem:
    """
    マルチエージェント版（各エージェントを独立 DDPG として束ねる）
    - 局所 Q: Critic 入力は (o_i, a_i) のみ（論文で述べた拡張に合わせた簡易形）
    - ReplayBuffer もエージェントごとに持つ
    """
    def __init__(self, n_agents, obs_dim, **kw):
        # MADDPGAgentに渡すパラメータをフィルタリング
        agent_kw = {k: v for k, v in kw.items() 
                   if k in ['act_dim', 'lr_actor', 'lr_critic', 'gamma', 'tau', 'noise', 'device']}
        self.agents = [MADDPGAgent(obs_dim, **agent_kw) for _ in range(n_agents)]
        self.buffers = [ReplayBuffer(capacity=kw.get("capacity", 1_000_000)) for _ in range(n_agents)]
        self.batch = kw.get("batch", 512)
        self.warmup = kw.get("warmup_steps", 5000)

    def act(self, obs_list, deterministic=False):
        """
        全エージェント分の行動をまとめて返す。
        obs_list: (n_agents, obs_dim) の np.ndarray
        """
        acts = []
        for a, obs in zip(self.agents, obs_list):
            acts.append(a.act(obs[None, ...], deterministic=deterministic)[0])
        return np.array(acts, dtype=np.float32)

    def step_update(self):
        """
        バッファが十分貯まっていれば、各エージェントを1ステップ更新。
        戻り: 代表的な actor/critic loss の平均（可視化用）
        """
        if min(len(b) for b in self.buffers) < self.warmup:
            return None
        la, lc = [], []
        for i, ag in enumerate(self.agents):
            b = self.buffers[i]
            obs, act, rew, nobs, done = b.sample(self.batch)
            la_i, lc_i = ag.update((obs, act, rew, nobs, done))
            la.append(la_i); lc.append(lc_i)
        return {"loss_actor": float(np.mean(la)), "loss_critic": float(np.mean(lc))}