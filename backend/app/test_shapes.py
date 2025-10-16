#!/usr/bin/env python3
"""
Shape選択機能のテスト
フロントエンドから送信される形状パラメータが正しく処理されるか確認
"""

import sys
import os
import json

# プロジェクトルートをPythonパスに追加
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.env import SwarmEnv
from app.shapes import grid_mask


def test_shape_creation():
    """各形状でエピソード作成をテスト"""
    
    print("=" * 60)
    print("🧪 Shape選択機能テスト")
    print("=" * 60)
    
    # フロントエンドで選択可能な形状
    shapes = ['circle', 'square', 'triangle', 'L', 'A', 'M', 'R']
    
    for shape in shapes:
        print(f"\n[テスト] Shape: {shape}")
        try:
            # 環境作成
            env = SwarmEnv(
                shape=shape,
                grid_size=64,
                n_robot=10,  # テスト用に少数
                r_sense=0.4,
                r_avoid=0.1,
                nhn=6,
                nhc=80,
                l_cell=1.0,
                seed=42
            )
            
            # 観測取得
            obs = env.observe()
            
            # 形状マスクの確認
            mask = env.mask
            cell_count = int((mask == 1).sum())
            
            print(f"  ✅ 環境作成成功")
            print(f"  📊 観測次元: {obs.shape}")
            print(f"  🎯 形状セル数: {cell_count}")
            print(f"  🤖 ロボット数: {env.n}")
            
            # 幾何条件チェック
            n_cell = cell_count
            l_cell = env.lc
            n_robot = env.n
            r_avoid = env.ra
            
            condition = 4 * n_robot * (r_avoid**2) <= n_cell * (l_cell**2)
            print(f"  📐 幾何条件: {'✅ OK' if condition else '❌ NG'}")
            
        except Exception as e:
            print(f"  ❌ エラー: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n" + "=" * 60)
    print("✅ Shape選択機能テスト完了")
    print("=" * 60)


def test_shape_visualization():
    """形状の可視化テスト（ASCII）"""
    
    print("\n🎨 形状可視化テスト（ASCII）")
    print("=" * 40)
    
    shapes = ['circle', 'square', 'triangle', 'L', 'A', 'M', 'R']
    
    for shape in shapes:
        print(f"\n{shape.upper()}:")
        mask = grid_mask(shape, 16)  # 小さなサイズで表示
        
        # ASCII表示（16x16）
        for y in range(16):
            line = ""
            for x in range(16):
                if mask[y, x] == 1:
                    line += "██"
                else:
                    line += "  "
            print(line)


if __name__ == "__main__":
    test_shape_creation()
    test_shape_visualization()
