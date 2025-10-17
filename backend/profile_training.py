#!/usr/bin/env python3
"""
学習ループのプロファイリング
各処理のボトルネックを特定する
"""
import time
import numpy as np
from app.env import SwarmEnv
from app.marl import MADDPGSystem
from app.metrics import coverage_m1, uniformity_m2

def profile_training():
    """学習ループのプロファイリングを実施"""
    print("🔍 学習ループのプロファイリング開始")
    print("=" * 60)
    
    # 環境とMADDPGの初期化
    print("📝 環境とMADDPGの初期化中...")
    env = SwarmEnv(shape="circle", grid_size=64, n_robot=10,
                   r_sense=0.4, r_avoid=0.1, nhn=6, nhc=80,
                   l_cell=1.0, seed=1234)
    
    obs0 = env.observe()
    obs_dim = obs0.shape[1]
    
    maddpg = MADDPGSystem(
        n_agents=10, obs_dim=obs_dim,
        gamma=0.99, batch=128, lr_actor=1e-4, lr_critic=1e-3,
        noise=0.1, tau=0.005, capacity=1_000_000, warmup_steps=1000
    )
    
    # タイマー初期化
    timings = {
        "env_step": [],
        "maddpg_act": [],
        "maddpg_update": [],
        "metrics_calc": [],
        "buffer_push": [],
        "total_iteration": []
    }
    
    # プロファイリング実行（100ステップ）
    print("🚀 100ステップのプロファイリング実行中...\n")
    obs = env.reset()
    
    for step in range(100):
        iter_start = time.perf_counter()
        
        # 1. 行動選択
        act_start = time.perf_counter()
        acts = maddpg.act(obs, deterministic=False, state_dicts=None)
        act_time = time.perf_counter() - act_start
        timings["maddpg_act"].append(act_time)
        
        # 2. 環境ステップ
        env_start = time.perf_counter()
        nobs, col_pairs = env.step(acts)
        env_time = time.perf_counter() - env_start
        timings["env_step"].append(env_time)
        
        # 3. バッファへプッシュ
        push_start = time.perf_counter()
        n_collisions = len(col_pairs)
        rew_scalar = -0.01 * n_collisions
        done = 0.0
        
        for i in range(10):
            maddpg.buffers[i].push(
                obs[i], acts[i],
                np.array([rew_scalar], dtype=np.float32),
                nobs[i], np.array([done], dtype=np.float32)
            )
        push_time = time.perf_counter() - push_start
        timings["buffer_push"].append(push_time)
        
        # 4. MADDPG更新
        update_start = time.perf_counter()
        upd = maddpg.step_update()
        update_time = time.perf_counter() - update_start
        timings["maddpg_update"].append(update_time)
        
        # 5. メトリクス計算（エピソード終了時のみ）
        if step == 99:
            metrics_start = time.perf_counter()
            M1 = coverage_m1(env.mask, env.p, 0.1)
            M2 = uniformity_m2(env.p, env.mask)
            metrics_time = time.perf_counter() - metrics_start
            timings["metrics_calc"].append(metrics_time)
        
        iter_time = time.perf_counter() - iter_start
        timings["total_iteration"].append(iter_time)
        
        obs = nobs
        
        # 進捗表示（10ステップごと）
        if (step + 1) % 10 == 0:
            print(f"  Step {step + 1:3d}/100 完了 (iteration: {iter_time*1000:.2f}ms)")
    
    # 結果サマリー
    print("\n" + "=" * 60)
    print("📊 プロファイリング結果")
    print("=" * 60)
    
    def print_stats(name, times):
        if not times:
            return
        times_ms = np.array(times) * 1000
        print(f"\n【{name}】")
        print(f"  平均: {times_ms.mean():.3f}ms")
        print(f"  中央値: {np.median(times_ms):.3f}ms")
        print(f"  最大: {times_ms.max():.3f}ms")
        print(f"  最小: {times_ms.min():.3f}ms")
        print(f"  合計: {times_ms.sum():.1f}ms")
        print(f"  割合: {times_ms.sum() / np.array(timings['total_iteration']).sum() / 1000 * 100:.1f}%")
    
    print_stats("1ステップ全体", timings["total_iteration"])
    print_stats("├─ MADDPG行動選択", timings["maddpg_act"])
    print_stats("├─ 環境ステップ", timings["env_step"])
    print_stats("├─ バッファプッシュ", timings["buffer_push"])
    print_stats("├─ MADDPG更新", timings["maddpg_update"])
    print_stats("└─ メトリクス計算", timings["metrics_calc"])
    
    # パフォーマンス評価
    avg_iter_time = np.array(timings["total_iteration"]).mean()
    steps_per_sec = 1.0 / avg_iter_time
    
    print("\n" + "=" * 60)
    print("⚡ パフォーマンス評価")
    print("=" * 60)
    print(f"平均処理速度: {steps_per_sec:.1f} steps/秒")
    print(f"1エピソード（100ステップ）推定時間: {avg_iter_time * 100:.2f}秒")
    print(f"2エピソード推定時間: {avg_iter_time * 200:.2f}秒")
    
    if steps_per_sec > 50:
        print("✅ 高速（50+ steps/秒）")
    elif steps_per_sec > 20:
        print("⚠️ 中速（20-50 steps/秒）")
    else:
        print("❌ 低速（< 20 steps/秒）")
    
    # ボトルネック特定
    print("\n" + "=" * 60)
    print("🎯 ボトルネック分析")
    print("=" * 60)
    
    component_times = {
        "MADDPG更新": np.array(timings["maddpg_update"]).sum() * 1000,
        "環境ステップ": np.array(timings["env_step"]).sum() * 1000,
        "MADDPG行動選択": np.array(timings["maddpg_act"]).sum() * 1000,
        "バッファプッシュ": np.array(timings["buffer_push"]).sum() * 1000,
    }
    
    sorted_components = sorted(component_times.items(), key=lambda x: x[1], reverse=True)
    
    for i, (name, time_ms) in enumerate(sorted_components, 1):
        percentage = time_ms / np.array(timings['total_iteration']).sum() / 1000 * 100
        print(f"{i}. {name}: {time_ms:.1f}ms ({percentage:.1f}%)")
    
    print("\n💡 改善提案:")
    top_bottleneck = sorted_components[0][0]
    if "MADDPG更新" in top_bottleneck:
        print("- ニューラルネットワーク更新が最大のボトルネック")
        print("  → 更新頻度を削減（5-10ステップごとに1回更新）")
        print("  → バッチサイズをさらに削減（128→64）")
        print("  → GPU使用を検討")
    elif "環境ステップ" in top_bottleneck:
        print("- 環境シミュレーションが最大のボトルネック")
        print("  → 観測計算の最適化")
        print("  → 衝突判定の簡略化")
    
    print("=" * 60)

if __name__ == "__main__":
    profile_training()

