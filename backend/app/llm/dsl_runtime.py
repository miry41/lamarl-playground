"""
DSL Runtime: JSON-DSL → 実行可能な関数への変換
ホワイトリスト方式で安全性を保証
"""

import numpy as np
from typing import Callable, Dict, Any


# ==================== State型定義 ====================

class RobotState:
    """
    ロボットの観測状態（DSL実行時に使用）
    """
    def __init__(self, obs_dict: Dict[str, Any]):
        self.pos = np.array(obs_dict.get("position", [0, 0]))
        self.vel = np.array(obs_dict.get("velocity", [0, 0]))
        self.target_center = np.array(obs_dict.get("target_center", [0, 0]))
        self.neighbors = obs_dict.get("neighbors", [])
        self.nearby_cells = obs_dict.get("nearby_cells", [])


# ==================== Prior Policy オペレーション ====================

def op_move_to_shape_center(state: RobotState, weight: float, **kwargs) -> np.ndarray:
    """
    形状中心への引力
    Args:
        state: ロボット状態
        weight: 重み係数
    Returns:
        2次元力ベクトル
    """
    dir_vec = state.target_center - state.pos
    norm = np.linalg.norm(dir_vec)
    if norm < 1e-6:
        return np.zeros(2)
    return weight * (dir_vec / norm)


def op_avoid_neighbors(state: RobotState, weight: float, radius: float = 0.1, **kwargs) -> np.ndarray:
    """
    近傍ロボットからの斥力
    Args:
        state: ロボット状態
        weight: 重み係数
        radius: 影響半径
    Returns:
        2次元力ベクトル
    """
    repulse = np.zeros(2)
    for neighbor in state.neighbors:
        neighbor_pos = np.array(neighbor.get("position", [0, 0]))
        diff = state.pos - neighbor_pos
        dist = np.linalg.norm(diff)
        
        if dist < radius and dist > 1e-6:
            # 逆二乗則的な斥力
            repulse += diff / (dist ** 2 + 1e-6)
    
    return weight * repulse


def op_keep_grid_uniformity(state: RobotState, weight: float, cell_size: float = 1.0, **kwargs) -> np.ndarray:
    """
    グリッド均一性を保つ力
    Args:
        state: ロボット状態
        weight: 重み係数
        cell_size: セルサイズ
    Returns:
        2次元力ベクトル
    """
    # Voronoi領域の均一化（簡易実装）
    if len(state.neighbors) == 0:
        return np.zeros(2)
    
    # 近傍との中間点への移動
    center_of_neighbors = np.mean([np.array(n.get("position", [0, 0])) for n in state.neighbors], axis=0)
    diff = center_of_neighbors - state.pos
    
    return weight * diff * 0.1  # 小さな係数でゆっくり調整


def op_synchronize_velocity(state: RobotState, weight: float, **kwargs) -> np.ndarray:
    """
    近傍ロボットとの速度同期
    Args:
        state: ロボット状態
        weight: 重み係数
    Returns:
        2次元力ベクトル
    """
    if len(state.neighbors) == 0:
        return np.zeros(2)
    
    avg_vel = np.mean([np.array(n.get("velocity", [0, 0])) for n in state.neighbors], axis=0)
    diff = avg_vel - state.vel
    
    return weight * diff


def op_explore_empty_cells(state: RobotState, weight: float, **kwargs) -> np.ndarray:
    """
    空セルへの探索
    Args:
        state: ロボット状態
        weight: 重み係数
    Returns:
        2次元力ベクトル
    """
    if len(state.nearby_cells) == 0:
        return np.zeros(2)
    
    # 最も近い空セルへ移動
    empty_cells = [c for c in state.nearby_cells if c.get("occupied", False) == False]
    if len(empty_cells) == 0:
        return np.zeros(2)
    
    target_cell = np.array(empty_cells[0].get("position", [0, 0]))
    diff = target_cell - state.pos
    norm = np.linalg.norm(diff)
    
    if norm < 1e-6:
        return np.zeros(2)
    
    return weight * (diff / norm)


# ==================== オペレーション登録 ====================

OP_REGISTRY: Dict[str, Callable] = {
    "move_to_shape_center": op_move_to_shape_center,
    "avoid_neighbors": op_avoid_neighbors,
    "keep_grid_uniformity": op_keep_grid_uniformity,
    "synchronize_velocity": op_synchronize_velocity,
    "explore_empty_cells": op_explore_empty_cells,
}


# ==================== Prior Policy ビルダー ====================

def build_prior_fn(prior_dsl: dict) -> Callable:
    """
    Prior Policy DSL から実行可能な関数を生成
    
    Args:
        prior_dsl: PriorDSL の辞書表現
    
    Returns:
        prior_policy(state_dict) -> action (np.ndarray)
    """
    terms = prior_dsl.get("terms", [])
    clamp_config = prior_dsl.get("clamp", {"max_speed": 0.5})
    max_speed = clamp_config.get("max_speed", 0.5)
    
    def prior_policy(state_dict: Dict[str, Any]) -> np.ndarray:
        """
        Prior Policy 関数
        Args:
            state_dict: 観測状態の辞書
        Returns:
            action: 2次元行動ベクトル
        """
        state = RobotState(state_dict)
        action = np.zeros(2, dtype=np.float32)
        
        for term in terms:
            op_name = term.get("op")
            if op_name not in OP_REGISTRY:
                print(f"⚠️ Unknown operation: {op_name}")
                continue
            
            fn = OP_REGISTRY[op_name]
            try:
                force = fn(state, **term)
                action += force
            except Exception as e:
                print(f"⚠️ Error in operation {op_name}: {e}")
        
        # クランプ（最大速度制限）
        norm = np.linalg.norm(action)
        if norm > max_speed:
            action = action / norm * max_speed
        
        return action
    
    return prior_policy


# ==================== Reward Function ビルダー ====================

def build_reward_fn(reward_dsl: dict) -> Callable:
    """
    Reward DSL から実行可能な関数を生成
    
    Args:
        reward_dsl: RewardDSL の辞書表現
    
    Returns:
        reward_fn(metrics) -> reward (float)
    """
    from .safe_expr import compile_reward_expr
    
    formula = reward_dsl.get("formula", "coverage")
    clamp_config = reward_dsl.get("clamp", {"min": -1.0, "max": 1.0})
    
    # 安全な式評価器を作成
    expr_fn = compile_reward_expr(formula)
    
    def reward_fn(metrics: Dict[str, float]) -> float:
        """
        Reward Function
        Args:
            metrics: メトリクス辞書 (coverage, uniformity, collisions など)
        Returns:
            reward: スカラー報酬値
        """
        try:
            raw_reward = expr_fn(metrics)
            
            # クランプ
            min_val = clamp_config.get("min", -1.0)
            max_val = clamp_config.get("max", 1.0)
            clamped = max(min_val, min(max_val, raw_reward))
            
            return float(clamped)
        except Exception as e:
            print(f"⚠️ Error in reward calculation: {e}")
            return 0.0
    
    return reward_fn

