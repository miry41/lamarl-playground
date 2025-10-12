import random
from collections import deque

class ReplayBuffer:
    """
    単純な経験再生バッファ
    - 各エージェントごとに独立に持つ（局所Qを前提）
    - 要素: (obs, act, rew, next_obs, done)
    """
    def __init__(self, capacity:int):
        self.buf = deque(maxlen=capacity)

    def push(self, *transition):
        # transition はタプルで受け取り、そのまま保管
        self.buf.append(transition)

    def sample(self, batch_size:int):
        # ランダムに batch_size 件サンプルし、zipで列方向にまとめて返す
        batch = random.sample(self.buf, batch_size)
        return list(zip(*batch))

    def __len__(self):
        return len(self.buf)
