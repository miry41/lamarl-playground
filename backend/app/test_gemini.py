#!/usr/bin/env python3
"""
Gemini API テストスクリプト
LLM生成機能が正常に動作するか確認する
"""

import sys
import os
import json

# プロジェクトルートをPythonパスに追加
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.llm.client import generate_prior_reward_dsl


def test_gemini_api():
    """Gemini APIを使ってPrior PolicyとReward Functionを生成"""
    
    print("=" * 60)
    print("🧪 Gemini API テスト開始")
    print("=" * 60)
    
    # テストパラメータ
    task_description = "30台のロボットで円形を形成し、均等に配置する"
    env_params = {
        "shape": "circle",
        "n_robot": 30,
        "r_sense": 0.4,
        "r_avoid": 0.1,
        "n_hn": 6,
        "n_hc": 80,
    }
    
    print(f"\n📝 タスク記述: {task_description}")
    print(f"🌐 環境パラメータ: {json.dumps(env_params, indent=2, ensure_ascii=False)}")
    
    try:
        print("\n🚀 Gemini APIを呼び出し中...")
        
        # Gemini APIで生成
        dsl = generate_prior_reward_dsl(
            task_description=task_description,
            env_params=env_params,
            model="gemini-2.0-flash-exp",  # または "gemini-1.5-pro"
            temperature=0.7,
            use_cot=True,
            use_basic_apis=True
        )
        
        print("\n✅ 生成成功！")
        print("\n" + "=" * 60)
        print("📦 生成されたDSL")
        print("=" * 60)
        
        # Prior Policy
        print("\n🎯 Prior Policy:")
        print(json.dumps(dsl["prior"], indent=2, ensure_ascii=False))
        
        # Reward Function
        print("\n🏆 Reward Function:")
        print(json.dumps(dsl["reward"], indent=2, ensure_ascii=False))
        
        # CoT Reasoning（もしあれば）
        if "cot_reasoning" in dsl and dsl["cot_reasoning"]:
            print("\n🧠 CoT推論プロセス:")
            print(dsl["cot_reasoning"])
        
        # メタデータ
        if "metadata" in dsl:
            print("\n📊 メタデータ:")
            print(json.dumps(dsl["metadata"], indent=2, ensure_ascii=False))
        
        print("\n" + "=" * 60)
        print("✅ テスト完了！")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_mock_api():
    """モックAPIを使ってテスト"""
    
    print("=" * 60)
    print("🧪 Mock API テスト開始")
    print("=" * 60)
    
    task_description = "30台のロボットでL字形状を形成する"
    env_params = {
        "shape": "L",
        "n_robot": 30,
        "r_sense": 0.4,
        "r_avoid": 0.1,
        "n_hn": 6,
        "n_hc": 80,
    }
    
    print(f"\n📝 タスク記述: {task_description}")
    
    try:
        print("\n🚀 Mock APIを呼び出し中...")
        
        dsl = generate_prior_reward_dsl(
            task_description=task_description,
            env_params=env_params,
            model="mock",
            temperature=0.7,
            use_cot=True,
            use_basic_apis=True
        )
        
        print("\n✅ 生成成功！")
        print("\n📦 生成されたDSL (Mock):")
        print(json.dumps(dsl, indent=2, ensure_ascii=False))
        
        return True
        
    except Exception as e:
        print(f"\n❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n🔧 LAMARL LLM生成機能テスト")
    print("=" * 60)
    
    # まずMockでテスト
    print("\n[1] Mock APIテスト")
    mock_success = test_mock_api()
    
    # 次にGemini APIでテスト
    print("\n\n[2] Gemini APIテスト")
    gemini_success = test_gemini_api()
    
    # 結果まとめ
    print("\n" + "=" * 60)
    print("📋 テスト結果まとめ")
    print("=" * 60)
    print(f"Mock API:   {'✅ 成功' if mock_success else '❌ 失敗'}")
    print(f"Gemini API: {'✅ 成功' if gemini_success else '❌ 失敗'}")
    print("=" * 60)
    
    if mock_success and gemini_success:
        print("\n🎉 すべてのテストが成功しました！")
        sys.exit(0)
    else:
        print("\n⚠️ 一部のテストが失敗しました")
        sys.exit(1)

