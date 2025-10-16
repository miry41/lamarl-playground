"""
LAMARL LLM Module - Pydantic Schemas
JSON-DSLベースの安全な関数生成用スキーマ定義
"""

from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any


# ==================== Prior Policy DSL ====================

class PriorTerm(BaseModel):
    """
    Prior Policy の個別オペレーション
    ホワイトリスト方式: 定義された op のみ許可
    """
    op: Literal[
        "move_to_shape_center",      # 形状中心への引力
        "avoid_neighbors",            # 近傍ロボットからの斥力
        "keep_grid_uniformity",       # グリッド均一性の維持
        "synchronize_velocity",       # 速度同期
        "explore_empty_cells",        # 空セルへの探索
    ]
    weight: float = Field(ge=0, le=1, description="重み係数 (0-1)")
    radius: Optional[float] = Field(default=None, ge=0, le=1, description="影響半径 (m)")
    cell_size: Optional[float] = Field(default=None, ge=0, le=2, description="セルサイズ (m)")


class PriorDSL(BaseModel):
    """
    Prior Policy の完全な定義
    - type: バージョン管理用
    - combination: 複数項の組み合わせ方法
    - terms: オペレーションのリスト
    - clamp: 出力の制約
    """
    type: Literal["prior_policy_v1"] = "prior_policy_v1"
    combination: Literal["weighted_sum"] = "weighted_sum"
    terms: List[PriorTerm]
    clamp: Dict[str, float] = Field(default={"max_speed": 0.5})


# ==================== Reward Function DSL ====================

class RewardDSL(BaseModel):
    """
    Reward Function の定義
    - formula: 安全なAST式（coverage, uniformity, collisions のみ許可）
    - clamp: 報酬値の範囲制限
    """
    type: Literal["reward_v1"] = "reward_v1"
    formula: str = Field(
        description="報酬計算式 (例: '1.0*coverage - 0.5*collisions - 0.2*uniformity')"
    )
    clamp: Dict[str, float] = Field(default={"min": -1.0, "max": 1.0})


# ==================== LLM Generation API ====================

class GenerateRequest(BaseModel):
    """
    LLM生成リクエスト
    タスク記述と環境パラメータから Prior/Reward を生成
    """
    task_description: str = Field(
        description="自然言語でのタスク記述",
        examples=["30台のロボットで円形を形成し、均等に配置する"]
    )
    
    # 環境パラメータ（LLMに文脈を与えるため）
    shape: str = Field(default="circle", description="目標形状")
    n_robot: int = Field(default=30, ge=1, le=100, description="ロボット数")
    r_sense: float = Field(default=0.4, ge=0.1, le=1.0, description="感知半径 (m)")
    r_avoid: float = Field(default=0.1, ge=0.01, le=0.5, description="衝突回避半径 (m)")
    n_hn: int = Field(default=6, ge=1, le=20, description="近傍ロボット最大数")
    n_hc: int = Field(default=80, ge=10, le=200, description="観測セル最大数")
    
    # LLM設定
    use_cot: bool = Field(default=True, description="Chain-of-Thought推論を有効化")
    use_basic_apis: bool = Field(default=True, description="Basic API仕様を提供")
    model: str = Field(default="gemini-2.0-flash-exp", description="使用するLLMモデル")
    temperature: float = Field(default=0.7, ge=0, le=2, description="生成温度")


class GenerateResponse(BaseModel):
    """
    LLM生成レスポンス
    - prior: Prior Policy DSL
    - reward: Reward Function DSL
    - cot_reasoning: Chain-of-Thought推論プロセス（オプション）
    - metadata: 生成メタデータ
    """
    prior: PriorDSL
    reward: RewardDSL
    cot_reasoning: Optional[str] = Field(default=None, description="CoT推論プロセス")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="生成メタデータ（モデル名、トークン数など）"
    )


# ==================== Validation Response ====================

class ValidationResult(BaseModel):
    """
    DSLバリデーション結果
    """
    valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

