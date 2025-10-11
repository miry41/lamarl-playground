# 🧩 LAMARL の Prompt & Basic API に関する記述
## Prompt Design（プロンプト設計）
### 概要
論文の該当箇所では「LLM-assisted module」内で説明されています。  
LLMには「自然言語によるタスク記述＋API仕様」を入力し、そこから Python コード（policy/reward）を生成させるという設計です。

---

### 論文記述（要約）

> The LLM-aided module receives a task description  
> (e.g., “Form a circle shape using multiple robots”)  
> and basic API documentation as context.  
> It generates both the prior policy π_prior(s) and reward function R(s,a)  
> through a chain-of-thought reasoning process.

> The prompt template includes:  
> - Task description in natural language  
> - State and action variable definitions  
> - API reference for perception and actuation  
> - Output format requirements (Python functions)

---

# 🧠 LAMARL におけるプロンプト設計（全3種）

---

## ① Policy Generation Prompt（事前ポリシー生成）

**目的**：ロボットの行動方針 π_prior(s) を生成する  
**出力**：`def prior_policy(state): ...`

```
You are an expert in multi-robot reinforcement learning.
Task: Form a "circle" shape with 30 robots.
Robots can sense neighbors within 0.4 m and avoid collisions within 0.1 m.
Use the provided API functions to compute attraction, repulsion, and synchronization forces.

Available APIs:
- get_neighbors(state)
- get_distance(a, b)
- get_direction(a, b)
- avoid_collision(state)
- synchronize_velocity(state)
- attract_to_goal(state)

Return Python code implementing:
def prior_policy(state): ...

```
---

## ② Reward Design Prompt（報酬関数生成）

**目的**：報酬関数 R(s,a) を設計する  
**出力**：def reward_function(global_state): ...
```
Design a reward function R(s,a) that encourages robots to form the target shape.
Use the provided APIs for measuring performance.

Available APIs:
- compute_coverage(global_state)
- compute_uniformity(global_state)

Return Python code implementing:
def reward_function(global_state): ...
```
## ③ Review / Chain-of-Thought Prompt（自己評価・改善提案）

**目的**：生成したポリシーと報酬を自己レビューし、理由と改善点を出力する  
**出力**：自然言語による説明文（CoT）
```
Review the generated prior_policy and reward_function.
Explain why each term is used and how it contributes to cooperative behavior.
If potential issues exist, suggest improvements.
Return your reasoning as a step-by-step explanation.
```
## ✅ まとめ
| No | プロンプト名 | 目的 | 出力形式 |
|----|---------------|------|-----------|
| ① | Policy Generation | 事前ポリシー生成 | Python関数 |
| ② | Reward Design | 報酬関数生成 | Python関数 |
| ③ | Review / CoT | 自己評価と改善提案 | 自然言語テキスト |
