"""
LLM API Router
FastAPIルーター: /llm/generate エンドポイント
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import json

from ..schemas import (
    GenerateRequest,
    GenerateResponse,
    PriorDSL,
    RewardDSL,
    ValidationResult
)
from .client import generate_prior_reward_dsl
from .dsl_runtime import build_prior_fn, build_reward_fn


router = APIRouter(prefix="/llm", tags=["llm"])


@router.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest) -> GenerateResponse:
    """
    LLMを使用してPrior PolicyとReward Functionを生成
    
    Args:
        req: 生成リクエスト（タスク記述、環境パラメータ、LLM設定）
    
    Returns:
        GenerateResponse: Prior/Reward DSL、CoT推論、メタデータ
    
    Raises:
        HTTPException: 生成失敗、バリデーションエラー
    """
    try:
        # 環境パラメータを辞書化
        env_params = {
            "shape": req.shape,
            "n_robot": req.n_robot,
            "r_sense": req.r_sense,
            "r_avoid": req.r_avoid,
            "n_hn": req.n_hn,
            "n_hc": req.n_hc,
        }
        
        # LLMでDSLを生成
        dsl = generate_prior_reward_dsl(
            task_description=req.task_description,
            env_params=env_params,
            model=req.model,
            temperature=req.temperature,
            use_cot=req.use_cot,
            use_basic_apis=req.use_basic_apis
        )
        
        # Pydanticでバリデーション（型と値域チェック）
        prior = PriorDSL.model_validate(dsl["prior"])
        reward = RewardDSL.model_validate(dsl["reward"])
        
        # CoT推論を抽出
        cot_reasoning = dsl.get("cot_reasoning")
        metadata = dsl.get("metadata", {})
        
        # 追加の安全チェック（式の妥当性）
        try:
            # 報酬式がコンパイル可能かテスト
            from .safe_expr import compile_reward_expr
            compile_reward_expr(reward.formula)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid reward formula: {str(e)}"
            )
        
        return GenerateResponse(
            prior=prior,
            reward=reward,
            cot_reasoning=cot_reasoning,
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate DSL: {str(e)}"
        )


@router.post("/validate", response_model=ValidationResult)
async def validate(prior: PriorDSL, reward: RewardDSL) -> ValidationResult:
    """
    Prior/Reward DSLの妥当性を検証
    
    Args:
        prior: Prior Policy DSL
        reward: Reward Function DSL
    
    Returns:
        ValidationResult: 検証結果（エラー、警告）
    """
    errors = []
    warnings = []
    
    try:
        # Prior Policyの検証
        try:
            prior_fn = build_prior_fn(prior.model_dump())
            # テスト実行
            test_state = {
                "position": [0.0, 0.0],
                "velocity": [0.0, 0.0],
                "target_center": [1.0, 1.0],
                "neighbors": [],
                "nearby_cells": []
            }
            result = prior_fn(test_state)
            if result is None or len(result) != 2:
                errors.append("Prior policy must return 2D action vector")
        except Exception as e:
            errors.append(f"Prior policy build failed: {str(e)}")
        
        # Reward Functionの検証
        try:
            reward_fn = build_reward_fn(reward.model_dump())
            # テスト実行
            test_metrics = {
                "coverage": 0.5,
                "uniformity": 0.3,
                "collisions": 1.0
            }
            result = reward_fn(test_metrics)
            if not isinstance(result, (int, float)):
                errors.append("Reward function must return scalar value")
        except Exception as e:
            errors.append(f"Reward function build failed: {str(e)}")
        
        # 警告: 重みの合計チェック
        total_weight = sum(term.weight for term in prior.terms)
        if total_weight > 1.5:
            warnings.append(f"Total weight is high ({total_weight:.2f}), may cause instability")
        elif total_weight < 0.3:
            warnings.append(f"Total weight is low ({total_weight:.2f}), policy may be weak")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
        
    except Exception as e:
        return ValidationResult(
            valid=False,
            errors=[f"Validation failed: {str(e)}"],
            warnings=[]
        )


@router.get("/operations")
async def get_operations() -> Dict[str, Any]:
    """
    利用可能なPrior Policy操作のリストを返す
    
    Returns:
        操作名と説明の辞書
    """
    return {
        "operations": [
            {
                "name": "move_to_shape_center",
                "description": "Move toward the center of the target shape",
                "parameters": ["weight"],
                "optional_parameters": []
            },
            {
                "name": "avoid_neighbors",
                "description": "Repulsion force from nearby robots",
                "parameters": ["weight"],
                "optional_parameters": ["radius"]
            },
            {
                "name": "keep_grid_uniformity",
                "description": "Maintain uniform distribution across cells",
                "parameters": ["weight"],
                "optional_parameters": ["cell_size"]
            },
            {
                "name": "synchronize_velocity",
                "description": "Align velocity with neighboring robots",
                "parameters": ["weight"],
                "optional_parameters": []
            },
            {
                "name": "explore_empty_cells",
                "description": "Move toward unoccupied cells in target region",
                "parameters": ["weight"],
                "optional_parameters": []
            }
        ],
        "metrics": [
            {
                "name": "coverage",
                "description": "Ratio of occupied target cells (0-1, higher is better)",
                "range": [0, 1]
            },
            {
                "name": "uniformity",
                "description": "Variance of Voronoi regions (0-1, lower is better)",
                "range": [0, 1]
            },
            {
                "name": "collisions",
                "description": "Number of collision pairs (0+, lower is better)",
                "range": [0, float("inf")]
            }
        ]
    }


@router.get("/health")
async def health() -> Dict[str, str]:
    """
    LLMモジュールのヘルスチェック
    """
    return {"status": "ok", "module": "llm"}

