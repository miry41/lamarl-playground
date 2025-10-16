"""
Safe Expression Evaluator
ホワイトリスト方式で安全な数式のみを評価
"""

import ast
import operator
from typing import Dict, Callable, Any


# ==================== 許可された要素 ====================

# 許可された変数名（メトリクス）
ALLOWED_NAMES = {
    "coverage",      # Coverage (M1)
    "uniformity",    # Uniformity (M2)
    "collisions",    # 衝突回数
    "variance",      # 分散（uniformityの別名）
}

# 許可された関数
ALLOWED_FUNCS = {
    "abs": abs,
    "min": min,
    "max": max,
    "clamp": lambda x, a, b: max(a, min(b, x)),
}

# 許可されたASTノードタイプ
ALLOWED_NODES = (
    ast.Module,
    ast.Expr,
    ast.Expression,
    ast.BinOp,      # 二項演算 (+, -, *, /)
    ast.UnaryOp,    # 単項演算 (-, +)
    ast.Constant,   # 定数（Python 3.8+）
    ast.Num,        # 数値（Python 3.7以前の互換性）
    ast.Name,       # 変数名
    ast.Load,       # 変数読み込み
    ast.Call,       # 関数呼び出し
    ast.Add,        # +
    ast.Sub,        # -
    ast.Mult,       # *
    ast.Div,        # /
    ast.USub,       # 単項 -
    ast.UAdd,       # 単項 +
)

# 演算子マッピング
OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


# ==================== 式の検証 ====================

def validate_expr(expr: str) -> None:
    """
    式の構文を検証し、危険な要素がないかチェック
    
    Args:
        expr: 数式文字列
    
    Raises:
        ValueError: 危険なノードや未許可の変数が含まれている場合
    """
    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError as e:
        raise ValueError(f"Syntax error in expression: {e}")
    
    # ASTを走査して全ノードをチェック
    for node in ast.walk(tree):
        # ノードタイプのチェック
        if not isinstance(node, ALLOWED_NODES):
            raise ValueError(f"Unsafe node type: {type(node).__name__}")
        
        # 変数名のチェック
        if isinstance(node, ast.Name):
            if node.id not in ALLOWED_NAMES and node.id not in ALLOWED_FUNCS:
                raise ValueError(f"Undefined variable or function: {node.id}")
        
        # 関数呼び出しのチェック
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id not in ALLOWED_FUNCS:
                    raise ValueError(f"Unsafe function call: {node.func.id}")


# ==================== 式の評価 ====================

class SafeExprEvaluator(ast.NodeVisitor):
    """
    ASTを安全に評価するビジター
    """
    
    def __init__(self, variables: Dict[str, Any]):
        self.variables = variables
    
    def visit_Expression(self, node):
        return self.visit(node.body)
    
    def visit_Constant(self, node):
        return node.value
    
    def visit_Num(self, node):
        return node.n
    
    def visit_Name(self, node):
        if node.id in self.variables:
            return self.variables[node.id]
        elif node.id in ALLOWED_FUNCS:
            return ALLOWED_FUNCS[node.id]
        else:
            raise ValueError(f"Undefined variable: {node.id}")
    
    def visit_BinOp(self, node):
        left = self.visit(node.left)
        right = self.visit(node.right)
        op = OPERATORS.get(type(node.op))
        if op is None:
            raise ValueError(f"Unsupported operator: {type(node.op).__name__}")
        return op(left, right)
    
    def visit_UnaryOp(self, node):
        operand = self.visit(node.operand)
        op = OPERATORS.get(type(node.op))
        if op is None:
            raise ValueError(f"Unsupported operator: {type(node.op).__name__}")
        return op(operand)
    
    def visit_Call(self, node):
        func = self.visit(node.func)
        args = [self.visit(arg) for arg in node.args]
        
        if not callable(func):
            raise ValueError(f"Not a callable: {func}")
        
        return func(*args)


# ==================== 公開API ====================

def compile_reward_expr(expr: str) -> Callable[[Dict[str, float]], float]:
    """
    報酬式をコンパイルして実行可能な関数を返す
    
    Args:
        expr: 数式文字列（例: "1.0*coverage - 0.5*collisions"）
    
    Returns:
        評価関数 metrics -> reward
    
    Raises:
        ValueError: 式が安全でない場合
    """
    # 式の検証
    validate_expr(expr)
    
    # ASTをコンパイル
    tree = ast.parse(expr, mode="eval")
    
    def reward_fn(metrics: Dict[str, float]) -> float:
        """
        式を評価
        Args:
            metrics: メトリクス辞書
        Returns:
            計算結果
        """
        # メトリクスをfloatに変換
        safe_metrics = {k: float(v) for k, v in metrics.items() if k in ALLOWED_NAMES}
        
        # 不足している変数をゼロで埋める
        for name in ALLOWED_NAMES:
            if name not in safe_metrics:
                safe_metrics[name] = 0.0
        
        # 評価
        evaluator = SafeExprEvaluator(safe_metrics)
        result = evaluator.visit(tree)
        
        return float(result)
    
    return reward_fn


# ==================== テスト ====================

if __name__ == "__main__":
    # テストケース
    test_cases = [
        ("1.0*coverage - 0.5*collisions", {"coverage": 0.8, "collisions": 2}, True),
        ("coverage + uniformity", {"coverage": 0.7, "uniformity": 0.3}, True),
        ("max(0, coverage - 0.5)", {"coverage": 0.3}, True),
        ("abs(uniformity - 0.2)", {"uniformity": 0.15}, True),
        ("import os", {}, False),  # 危険
        ("eval('1+1')", {}, False),  # 危険
        ("__import__('os')", {}, False),  # 危険
    ]
    
    for expr, metrics, should_succeed in test_cases:
        try:
            fn = compile_reward_expr(expr)
            result = fn(metrics)
            if should_succeed:
                print(f"✅ {expr} = {result}")
            else:
                print(f"❌ {expr} should have failed but succeeded")
        except Exception as e:
            if not should_succeed:
                print(f"✅ {expr} correctly rejected: {e}")
            else:
                print(f"❌ {expr} failed unexpectedly: {e}")

