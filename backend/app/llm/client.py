"""
LLM Client: バックエンドでLLM APIを呼び出してJSON-DSLを生成
OpenAI、Anthropic、Google Gemini、ローカルモデル（vLLM）に対応
"""

import os
import json
import re
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# .env.localファイルを読み込む（ルートディレクトリから）
# プロジェクトルートの.env.localを読み込む
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env.local")
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"✅ Loaded environment variables from {env_path}")
else:
    # 代わりにルートディレクトリで.env.localを探す
    root_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env.local")
    if os.path.exists(root_env_path):
        load_dotenv(root_env_path)
        print(f"✅ Loaded environment variables from {root_env_path}")
    else:
        print(f"⚠️ .env.local not found at {env_path} or {root_env_path}")


# ==================== プロンプトテンプレート ====================

SYSTEM_PROMPT = """You are an expert in multi-robot reinforcement learning and cooperative control.
Your task is to design Prior Policy and Reward Function for multi-robot coordination tasks.

IMPORTANT: Return ONLY valid JSON in the specified format. Do not include any prose, explanation, or markdown formatting.

Output format:
{
  "prior": {
    "type": "prior_policy_v1",
    "combination": "weighted_sum",
    "terms": [
      {"op": "move_to_shape_center", "weight": 0.6},
      {"op": "avoid_neighbors", "weight": 0.3, "radius": 0.12},
      {"op": "synchronize_velocity", "weight": 0.1}
    ],
    "clamp": {"max_speed": 0.5}
  },
  "reward": {
    "type": "reward_v1",
    "formula": "1.0*coverage - 0.5*collisions - 0.2*uniformity",
    "clamp": {"min": -1.0, "max": 1.0}
  }
}

Available Prior Policy Operations:
- move_to_shape_center: Move toward the center of the target shape
- avoid_neighbors: Repulsion force from nearby robots (params: radius)
- keep_grid_uniformity: Maintain uniform distribution (params: cell_size)
- synchronize_velocity: Align velocity with neighbors
- explore_empty_cells: Move toward unoccupied cells

Available Reward Metrics:
- coverage: Ratio of occupied target cells (0-1, higher is better)
- uniformity: Variance of Voronoi regions (0-1, lower is better)
- collisions: Number of collision pairs (0+, lower is better)

Reward formula must use only: +, -, *, /, abs(), min(), max(), clamp()
"""


def build_user_prompt(
    task_description: str,
    env_params: Dict[str, Any],
    use_cot: bool = True,
    use_basic_apis: bool = True
) -> str:
    """
    ユーザープロンプトを構築
    
    Args:
        task_description: タスクの自然言語記述
        env_params: 環境パラメータ
        use_cot: Chain-of-Thought推論を有効化
        use_basic_apis: Basic API仕様を含める
    
    Returns:
        プロンプト文字列
    """
    prompt = f"""Task: {task_description}

Environment Parameters:
- Shape: {env_params.get('shape', 'circle')}
- Number of robots: {env_params.get('n_robot', 30)}
- Sensing radius: {env_params.get('r_sense', 0.4)} m
- Collision avoidance radius: {env_params.get('r_avoid', 0.1)} m
- Max neighbors observed: {env_params.get('n_hn', 6)}
- Max cells observed: {env_params.get('n_hc', 80)}
"""

    if use_cot:
        prompt += """
First, analyze the task step-by-step:
1. What are the main constraints? (e.g., enter region, avoid collision, synchronize, explore)
2. What basic skills are needed? (e.g., move, avoid, sync)
3. What are the key sub-goals?

Then, design:
- Prior Policy: Combination of operations with appropriate weights
- Reward Function: Formula that encourages the desired behavior
"""

    if use_basic_apis:
        prompt += """
Use the provided operations and metrics. Do not invent new ones.
"""

    prompt += """
Return ONLY the JSON object, with no additional text.
"""
    
    return prompt


# ==================== モックLLM（開発用） ====================

def mock_llm_generate(task_description: str, env_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    モックLLM生成（実際のLLM APIを使わずにテスト用の固定DSLを返す）
    
    Args:
        task_description: タスク記述
        env_params: 環境パラメータ
    
    Returns:
        DSL辞書
    """
    shape = env_params.get("shape", "circle")
    
    # 形状に応じた簡単なヒューリスティック
    if shape == "circle":
        return {
            "prior": {
                "type": "prior_policy_v1",
                "combination": "weighted_sum",
                "terms": [
                    {"op": "move_to_shape_center", "weight": 0.5},
                    {"op": "avoid_neighbors", "weight": 0.3, "radius": 0.12},
                    {"op": "synchronize_velocity", "weight": 0.2}
                ],
                "clamp": {"max_speed": 0.5}
            },
            "reward": {
                "type": "reward_v1",
                "formula": "1.0*coverage - 0.5*collisions - 0.3*uniformity",
                "clamp": {"min": -1.0, "max": 1.0}
            },
            "cot_reasoning": """
Step 1: Constraint Analysis
- Enter region: Robots must reach the target shape area
- Avoid collision: Maintain minimum distance of 0.1m
- Synchronize: Align velocities for stable formation
- Explore: Distribute evenly across the shape

Step 2: Basic Skills
- move_to_shape_center: Attraction to target region
- avoid_neighbors: Repulsion for collision avoidance
- synchronize_velocity: Velocity alignment for coordination

Step 3: Sub-goals
1. Reach target region (move_to_shape_center)
2. Maintain safe distance (avoid_neighbors)
3. Form stable formation (synchronize_velocity)

Step 4: Reward Design
- Coverage (M1): Reward for occupying target cells
- Collisions: Penalty for safety violations
- Uniformity (M2): Reward for even distribution
"""
        }
    else:
        # その他の形状用の汎用DSL
        return {
            "prior": {
                "type": "prior_policy_v1",
                "combination": "weighted_sum",
                "terms": [
                    {"op": "move_to_shape_center", "weight": 0.4},
                    {"op": "avoid_neighbors", "weight": 0.3, "radius": 0.12},
                    {"op": "keep_grid_uniformity", "weight": 0.2, "cell_size": 1.0},
                    {"op": "explore_empty_cells", "weight": 0.1}
                ],
                "clamp": {"max_speed": 0.5}
            },
            "reward": {
                "type": "reward_v1",
                "formula": "1.0*coverage - 0.4*collisions - 0.3*uniformity",
                "clamp": {"min": -1.0, "max": 1.0}
            },
            "cot_reasoning": f"""
Step 1: Constraint Analysis for {shape} shape
- Complex shape requires more exploration
- Need to balance coverage and uniformity
- Collision avoidance is critical

Step 2: Basic Skills
- move_to_shape_center: Initial positioning
- avoid_neighbors: Safety maintenance
- keep_grid_uniformity: Even distribution
- explore_empty_cells: Fill uncovered areas

Step 3: Reward Design
- High weight on coverage (shape completion)
- Moderate penalty on collisions
- Moderate penalty on non-uniformity
"""
        }


# ==================== OpenAI API（本番用） ====================

def openai_generate(
    task_description: str,
    env_params: Dict[str, Any],
    model: str = "gpt-4",
    temperature: float = 0.7,
    use_cot: bool = True,
    use_basic_apis: bool = True
) -> Dict[str, Any]:
    """
    OpenAI APIを使用してDSLを生成
    
    Args:
        task_description: タスク記述
        env_params: 環境パラメータ
        model: モデル名
        temperature: 生成温度
        use_cot: CoT推論を有効化
        use_basic_apis: Basic API仕様を含める
    
    Returns:
        DSL辞書
    
    Raises:
        ImportError: openaiパッケージがインストールされていない
        Exception: API呼び出しエラー
    """
    try:
        import openai
    except ImportError:
        raise ImportError("openai package is required. Install with: pip install openai")
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    
    client = openai.OpenAI(api_key=api_key)
    
    user_prompt = build_user_prompt(task_description, env_params, use_cot, use_basic_apis)
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        temperature=temperature,
        response_format={"type": "json_object"}  # JSON mode（GPT-4 Turbo以降）
    )
    
    content = response.choices[0].message.content
    dsl = json.loads(content)
    
    # メタデータを追加
    dsl["metadata"] = {
        "model": model,
        "temperature": temperature,
        "usage": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens
        }
    }
    
    return dsl


# ==================== Google Gemini API（本番用） ====================

def gemini_generate(
    task_description: str,
    env_params: Dict[str, Any],
    model: str = "gemini-2.0-flash-exp",
    temperature: float = 0.7,
    use_cot: bool = True,
    use_basic_apis: bool = True
) -> Dict[str, Any]:
    """
    Google Gemini APIを使用してDSLを生成
    
    Args:
        task_description: タスク記述
        env_params: 環境パラメータ
        model: モデル名
        temperature: 生成温度
        use_cot: CoT推論を有効化
        use_basic_apis: Basic API仕様を含める
    
    Returns:
        DSL辞書
    
    Raises:
        ImportError: google.generativeaiパッケージがインストールされていない
        Exception: API呼び出しエラー
    """
    try:
        import google.generativeai as genai
    except ImportError:
        raise ImportError("google-generativeai package is required. Install with: pip install google-generativeai")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")
    
    # Gemini APIの初期化
    genai.configure(api_key=api_key)
    
    user_prompt = build_user_prompt(task_description, env_params, use_cot, use_basic_apis)
    
    # Geminiモデルの作成
    generation_config = {
        "temperature": temperature,
        "response_mime_type": "application/json",  # JSON形式で返答させる
    }
    
    gemini_model = genai.GenerativeModel(
        model_name=model,
        generation_config=generation_config,
        system_instruction=SYSTEM_PROMPT
    )
    
    # メッセージ生成
    response = gemini_model.generate_content(user_prompt)
    
    # レスポンステキストを取得
    content = response.text
    
    # JSONを抽出（```json...```の場合も対応）
    if "```json" in content:
        start = content.find("```json") + 7
        end = content.find("```", start)
        content = content[start:end].strip()
    elif "```" in content:
        start = content.find("```") + 3
        end = content.find("```", start)
        content = content[start:end].strip()
    
    # JSONのパース
    try:
        dsl = json.loads(content)
    except json.JSONDecodeError as e:
        # JSONパースエラーの場合、コメントを削除して再試行
        content_cleaned = re.sub(r'//.*?\n|/\*.*?\*/', '', content, flags=re.S)
        try:
            dsl = json.loads(content_cleaned)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse JSON from Gemini response: {e}\nContent: {content}")
    
    # メタデータを追加
    dsl["metadata"] = {
        "model": model,
        "temperature": temperature,
        "usage": {
            "prompt_tokens": response.usage_metadata.prompt_token_count if hasattr(response, 'usage_metadata') else 0,
            "completion_tokens": response.usage_metadata.candidates_token_count if hasattr(response, 'usage_metadata') else 0,
            "total_tokens": response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else 0,
        }
    }
    
    return dsl


# ==================== Anthropic API（本番用） ====================

def anthropic_generate(
    task_description: str,
    env_params: Dict[str, Any],
    model: str = "claude-3-5-sonnet-20241022",
    temperature: float = 0.7,
    use_cot: bool = True,
    use_basic_apis: bool = True
) -> Dict[str, Any]:
    """
    Anthropic APIを使用してDSLを生成
    
    Args:
        task_description: タスク記述
        env_params: 環境パラメータ
        model: モデル名
        temperature: 生成温度
        use_cot: CoT推論を有効化
        use_basic_apis: Basic API仕様を含める
    
    Returns:
        DSL辞書
    
    Raises:
        ImportError: anthropicパッケージがインストールされていない
        Exception: API呼び出しエラー
    """
    try:
        import anthropic
    except ImportError:
        raise ImportError("anthropic package is required. Install with: pip install anthropic")
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
    
    client = anthropic.Anthropic(api_key=api_key)
    
    user_prompt = build_user_prompt(task_description, env_params, use_cot, use_basic_apis)
    
    response = client.messages.create(
        model=model,
        max_tokens=2048,
        temperature=temperature,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": user_prompt}
        ]
    )
    
    content = response.content[0].text
    
    # JSONを抽出（```json...```の場合も対応）
    if "```json" in content:
        start = content.find("```json") + 7
        end = content.find("```", start)
        content = content[start:end].strip()
    elif "```" in content:
        start = content.find("```") + 3
        end = content.find("```", start)
        content = content[start:end].strip()
    
    dsl = json.loads(content)
    
    # メタデータを追加
    dsl["metadata"] = {
        "model": model,
        "temperature": temperature,
        "usage": {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
        }
    }
    
    return dsl


# ==================== 統一インターフェース ====================

def generate_prior_reward_dsl(
    task_description: str,
    env_params: Dict[str, Any],
    model: str = "mock",
    temperature: float = 0.7,
    use_cot: bool = True,
    use_basic_apis: bool = True
) -> Dict[str, Any]:
    """
    LLMを使用してPrior/Reward DSLを生成（統一インターフェース）
    
    Args:
        task_description: タスク記述
        env_params: 環境パラメータ
        model: モデル名（"mock", "gpt-4", "claude-3-5-sonnet-20241022" など）
        temperature: 生成温度
        use_cot: CoT推論を有効化
        use_basic_apis: Basic API仕様を含める
    
    Returns:
        DSL辞書
    """
    if model == "mock":
        return mock_llm_generate(task_description, env_params)
    elif model.startswith("gpt-"):
        return openai_generate(task_description, env_params, model, temperature, use_cot, use_basic_apis)
    elif model.startswith("claude-"):
        return anthropic_generate(task_description, env_params, model, temperature, use_cot, use_basic_apis)
    elif model.startswith("gemini-"):
        return gemini_generate(task_description, env_params, model, temperature, use_cot, use_basic_apis)
    else:
        raise ValueError(f"Unsupported model: {model}")

