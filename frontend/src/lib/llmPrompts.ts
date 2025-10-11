// LAMARL Prompt Templates
// Reference: Zhu et al., "LLM-Aided Multi-Agent Reinforcement Learning for Cooperative Policy Generation" (IEEE RA-L, 2025)

// === 1️⃣ Prior Policy Generation ===
export const PRIOR_PROMPT = `
You are an expert in multi-agent reinforcement learning and robotic swarm control.
Your task is to design a **prior policy** π_prior(s) that guides cooperative robots
to form the desired shape efficiently and safely.

---
### Task Description
{task_description}  // e.g., "Form a circle shape with 30 robots."

### Environment Parameters
- Number of robots: {n_robot}
- Sensing radius: {r_sense} m
- Collision avoidance radius: {r_avoid} m
- Neighbor limit: {n_hn}
- Observation cell limit: {n_hc}

### Basic APIs (available functions)
{api_doc}

### Requirements
1. Use **only** the APIs listed above. Do not access external libraries or files.
2. Combine attraction, repulsion, and synchronization forces to achieve cooperation.
3. Return a valid Python function named **prior_policy(state)** that outputs a 2D NumPy vector (velocity or direction).
4. Include clear, readable code with explanatory comments.

### Output Format
\`\`\`python
def prior_policy(state):
    """
    Input: state (includes robot position, velocity, neighbors, and environment)
    Output: np.ndarray(2,) representing action vector
    """
    # Your code here
\`\`\`

Think step by step (Chain-of-Thought) before producing the final code.
Explain your reasoning first, then provide the Python function.
---`;

// === 2️⃣ Reward Function Generation ===
export const REWARD_PROMPT = `
You are an expert in multi-agent reinforcement learning and cooperative robotics.
Your task is to design a **reward function** R(s, a) that encourages robots
to achieve the target shape formation effectively.

---
### Task Description
{task_description}  // e.g., "Robots form a square pattern."

### Environment Parameters
- Number of robots: {n_robot}
- Total cells: {n_cell}
- Observation radius: {r_sense} m
- Avoidance radius: {r_avoid} m

### Basic APIs (available functions)
{api_doc}

### Requirements
1. Use **only** the given APIs.
2. Consider key performance metrics:
   - Coverage (how much of the target region is filled)
   - Uniformity (how evenly robots are distributed)
   - Collision penalty (avoid overlapping robots)
3. Return a Python function named **reward_function(global_state)** that outputs a float reward.
4. Higher reward should correspond to better shape completion and fewer collisions.

### Output Format
\`\`\`python
def reward_function(global_state):
    """
    Input: global_state (includes all robot positions and environment map)
    Output: float (reward value)
    """
    # Your code here
\`\`\`

Explain your reasoning (Chain-of-Thought) before showing the final Python code.
---`;

// === 3️⃣ Combined (Prior + Reward, single call) ===
export const COMBINED_PROMPT = `
You are an expert system that generates both the **prior policy** and **reward function**
for cooperative multi-robot reinforcement learning tasks.

---
### Task Description
{task_description}  // e.g., "Assemble the letter 'L' using 40 robots."

### Environment Parameters
- Robots: {n_robot}
- Sensing radius: {r_sense} m
- Collision avoidance radius: {r_avoid} m
- Environment cells: {n_cell}
- Max episodes: {episodes}

### Basic APIs
{api_doc}

### Requirements
1. Generate two Python functions:
   - def prior_policy(state): returns np.ndarray(2,)
   - def reward_function(global_state): returns float
2. Use only provided APIs (e.g., get_neighbors, compute_coverage, compute_uniformity).
3. Explain your reasoning (CoT) before generating code.
4. Provide both functions in one code block, separated by comments.

### Output Format
\`\`\`python
# === Prior Policy ===
def prior_policy(state):
    ...

# === Reward Function ===
def reward_function(global_state):
    ...
\`\`\`
---

Follow this step-by-step reasoning process before giving the code:
1. Identify the target pattern and main forces.
2. Plan the policy structure (attraction, repulsion, synchronization).
3. Define reward metrics (coverage, uniformity, collision penalty).
4. Output the final code implementing both functions.
---`;
