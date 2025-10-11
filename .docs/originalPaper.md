LAMARL: LLM-Aided Multi-Agent Reinforcement Learning for Cooperative Policy Generation
IEEE Robotics and Automation Letters Vol. 10 No. 7 (July 2025)
Authors : Guobin Zhu, Rui Zhou, Wenkang Ji, Shiyu Zhao (Senior Member, IEEE)

Abstract

Multi-Agent Reinforcement Learning (MARL) is effective for complex multi-robot tasks but suffers from low sample efficiency and manual reward tuning. This paper introduces LAMARL, which integrates LLMs with MARL to automatically generate prior policies and reward functions. The LLM-aided module fully automates design via Chain-of-Thought and basic API prompts. Simulation and real-world experiments on shape assembly show that LAMARL improves sample efficiency by ≈ 185.9 % and LLM output success rates by 28.5–67.5 %.

I. Introduction

Multi-robot systems excel at tasks like collaborative transportation and formation control but traditionally require hand-crafted control designs based on precise models.

MARL automatically optimizes policies but depends on well-designed rewards and suffers from low sample efficiency.

Prior automation of reward design includes exploration-based, agent-based, and expert-based (IRL) methods, each with drawbacks.

LLMs have been applied to single-robot tasks but rarely to multi-robot coordination. Online LLMs require heavy computation; offline “Code as Policies” approaches are simpler but limited and can hallucinate.

LAMARL combines LLM knowledge with MARL for autonomous cooperative policy generation.

II. Methodology

Two modules (Fig. 2):

LLM-aided function generation – automatically creates Python policy and reward functions through
 (a) user instruction input (task description + auxiliary prompt with CoT & APIs);
 (b) constraint analysis (basic vs. complex constraints, deriving basic skills and key sub-goals);
 (c) function generation (construct policy as sum of skill actions and reward as logical conditions);
 (d) function review (check logical completeness and request revision if needed).

MARL module – integrates LLM-generated functions.
 Actor loss is modified to maximize Q – α ‖a – a_prior‖² so that RL mimics the prior policy.
 Reward is plugged into the environment to train full task policies.
 MADDPG is used as the example algorithm, but LAMARL is algorithm-agnostic.

III. Task Statement – Shape Assembly Benchmark

Robots must form a given shape with equal spacing, no collisions, and uniform distribution.

Environment: region grid of cells (size l_cell), robots as disks with state [p,v], forces f_a (active) + f_b (Hooke’s law).

Observation: self state + relative neighbors + target cell + nearby cells, padded to (6 + 4 n_hn + 2 n_hc) dims.

LLM function generation example: constraints = {enter region, avoid collision, synchronize neighbors, explore cells}.
 → basic skills = {move to region, collision avoidance, synchronization}.
 → sub-goals = {1, 2, 4}.
 → LLM outputs Python policy combining three forces (attraction, repulsion, synchronization) and a reward = 1 iff all conditions true.
 → verified and passed to MARL.

Training: MADDPG with Leaky-ReLU/Tanh MLPs, critic simplified to Q(o_i,a_i) for scalability.

IV. Simulation Experiments

Metrics – Coverage rate (M₁ = n_occ / n_cell) and Uniformity (M₂ = Σ (n_v,i – n_v)² / n_robot).

Compared methods

Mean-shift (control-theory baseline)

MDR (MARL + manually designed reward)

AIRL (expert-data inverse RL)

LAMARL (proposed)

Setup: n_robot = 30, r_sense = 0.4 m, r_avoid = 0.1 m, n_hn = 6, n_hc = 80, episodes = 3000, γ = 0.99, etc.

Results: LAMARL ≈ Mean-shift in M₁ & M₂; both better than MDR and AIRL.
LAMARL automates design and is more adaptable since it only requires 4 n_robot r_avoid² ≤ n_cell l_cell².
Performance loss on complex shapes (L, T) is due to simple LLM reward.

V. Ablation Experiments

Prior Policy Effect: Uniformity M₂ converges ~1.86× faster on average (185.9 % gain). Without prior policy, collisions and poor uniformity persist.

Structured Prompt Effect: Removing basic APIs or CoT reduces LLM success rate by 28–67 %. APIs give deterministic knowledge; CoT provides reasoning structure. Both essential.

VI. Real-World Experiments

Eight omnidirectional robots physically assembled into shapes.
LAMARL formed uniform patterns without collision; Mean-shift was similar but slightly less uniform in “B”. MDR and AIRL failed on complex shapes (“R”, “T”).
→ Real-world results confirm simulation findings.

VII. Conclusion

LAMARL combines LLM-aided function generation and MARL integration for fully automatic cooperative policy design.
It achieves high sample efficiency and competitive performance without manual rewards or expert data.
Limitations: LLM rewards are simplistic for complex shapes.
Future work: enhancing reward generation and extending to other tasks since the pipeline (CoT + API framework) is task-independent.