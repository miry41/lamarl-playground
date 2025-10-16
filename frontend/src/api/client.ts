/**
 * LAMARL Backend API Client
 * FastAPI バックエンドとの通信を管理
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
console.log('🔧 API_BASE:', API_BASE)
console.log('🔧 VITE_API_URL:', import.meta.env.VITE_API_URL)

// ==================== Types ====================

export interface EpisodeConfig {
  shape: string
  seed: number
  n_robot: number
  r_sense: number
  r_avoid: number
  nhn: number
  nhc: number
  grid_size: number
  l_cell: number
}

export interface EpisodeCreateResponse {
  episode_id: string
}

export interface TrainStartRequest {
  episode_id: string
  episodes: number
  episode_len: number
  use_llm?: boolean
  task_description?: string
  llm_model?: string
}

export interface TrainStartResponse {
  started: boolean
  use_llm?: boolean
}

// SSE イベント型
export interface SSETickEvent {
  type: 'tick'
  episode: number
  step: number
  global_step: number
  positions: [number, number][]  // [[x, y], ...]
  velocities: [number, number][]
  collisions: [number, number][]  // [[i, j], ...]
}

export interface SSEMetricsEvent {
  type: 'metrics_update'
  episode: number
  step: number
  global_step: number
  M1: number  // Coverage
  M2: number  // Uniformity
  loss_actor?: number
  loss_critic?: number
}

export interface SSEEpisodeEndEvent {
  type: 'episode_end'
  episode_id: string
  episode: number
  step: number
  global_step: number
  M1: number
  M2: number
  final_positions: [number, number][]
  final_velocities: [number, number][]
}

export interface SSEEnvConfigEvent {
  type: 'env_config'
  shape: string
  n_robot: number
  r_sense: number
  r_avoid: number
  n_hn: number
  n_hc: number
  grid_size: number
  l_cell: number
  use_llm: boolean
}

export type SSEEvent = SSETickEvent | SSEMetricsEvent | SSEEpisodeEndEvent | SSEEnvConfigEvent

// ==================== LLM Types ====================

export interface GenerateRequest {
  task_description: string
  shape: string
  n_robot: number
  r_sense: number
  r_avoid: number
  n_hn: number
  n_hc: number
  use_cot: boolean
  use_basic_apis: boolean
  model: string
  temperature: number
}

export interface PriorTerm {
  op: string
  weight: number
  radius?: number
  cell_size?: number
}

export interface PriorDSL {
  type: 'prior_policy_v1'
  combination: 'weighted_sum'
  terms: PriorTerm[]
  clamp: { max_speed: number }
}

export interface RewardDSL {
  type: 'reward_v1'
  formula: string
  clamp: { min: number; max: number }
}

export interface GenerateResponse {
  prior: PriorDSL
  reward: RewardDSL
  cot_reasoning?: string
  metadata?: Record<string, unknown>
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface OperationInfo {
  name: string
  description: string
  parameters: string[]
  optional_parameters: string[]
}

export interface MetricInfo {
  name: string
  description: string
  range: [number, number]
}

export interface OperationsResponse {
  operations: OperationInfo[]
  metrics: MetricInfo[]
}

// ==================== API Functions ====================

/**
 * ヘルスチェック
 */
export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('Health check failed')
  return res.json()
}

/**
 * エピソード作成
 */
export async function createEpisode(
  config: Partial<EpisodeConfig> = {}
): Promise<EpisodeCreateResponse> {
  const defaultConfig: EpisodeConfig = {
    shape: 'circle',
    seed: 1234,
    n_robot: 30,
    r_sense: 0.4,
    r_avoid: 0.1,
    nhn: 6,
    nhc: 80,
    grid_size: 64,
    l_cell: 1.0,
  }

  const mergedConfig = { ...defaultConfig, ...config }
  const url = `${API_BASE}/episodes`
  
  // console.log('📡 Fetching:', url)
  // console.log('📡 Body:', mergedConfig)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mergedConfig),
  })

  // console.log('📡 Response status:', res.status, res.statusText)

  if (!res.ok) {
    const errorText = await res.text()
    console.error('📡 Error response:', errorText)
    let errorDetail = 'Failed to create episode'
    try {
      const errorJson = JSON.parse(errorText)
      errorDetail = errorJson.detail || errorDetail
    } catch {
      errorDetail = errorText || errorDetail
    }
    throw new Error(errorDetail)
  }

  const data = await res.json()
  // console.log('📡 Response data:', data)
  return data
}

/**
 * 学習開始
 */
export async function startTraining(
  episodeId: string,
  episodes: number = 1,
  episodeLen: number = 200,
  useLLM: boolean = false,
  taskDescription?: string,
  llmModel: string = 'gemini-2.0-flash-exp'
): Promise<TrainStartResponse> {
  const body: TrainStartRequest = {
    episode_id: episodeId,
    episodes,
    episode_len: episodeLen,
    use_llm: useLLM,
  }
  
  // LLMを使用する場合はパラメータを追加
  if (useLLM) {
    body.task_description = taskDescription
    body.llm_model = llmModel
  }
  
  console.log('🚀 Starting training with LLM:', useLLM, body)
  
  const res = await fetch(`${API_BASE}/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || 'Failed to start training')
  }

  return res.json()
}

/**
 * 学習停止
 */
export async function stopTraining(episodeId: string): Promise<{ stopped: boolean }> {
  const res = await fetch(`${API_BASE}/stop?episode_id=${episodeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || 'Failed to stop training')
  }

  return res.json()
}

/**
 * SSE ストリームに接続
 */
export function connectEventStream(
  episodeId: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (error: Error) => void
): () => void {
  const url = `${API_BASE}/stream?episode_id=${episodeId}`
  const eventSource = new EventSource(url)

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as SSEEvent
      onEvent(data)
    } catch (err) {
      console.error('Failed to parse SSE event:', err)
      onError?.(err as Error)
    }
  }

  eventSource.onerror = (err) => {
    console.error('SSE connection error:', err)
    onError?.(new Error('SSE connection error'))
    eventSource.close()
  }

  // クリーンアップ関数を返す
  return () => {
    eventSource.close()
  }
}

// ==================== LLM API Functions ====================

/**
 * LLMを使用してPrior PolicyとReward Functionを生成
 */
export async function generateFunctions(
  req: GenerateRequest
): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/llm/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || 'Failed to generate functions')
  }

  return res.json()
}

/**
 * Prior/Reward DSLのバリデーション
 */
export async function validateDSL(
  prior: PriorDSL,
  reward: RewardDSL
): Promise<ValidationResult> {
  const res = await fetch(`${API_BASE}/llm/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prior, reward }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || 'Failed to validate DSL')
  }

  return res.json()
}

/**
 * 利用可能な操作とメトリクスのリストを取得
 */
export async function getOperations(): Promise<OperationsResponse> {
  const res = await fetch(`${API_BASE}/llm/operations`)
  
  if (!res.ok) {
    throw new Error('Failed to get operations')
  }

  return res.json()
}

/**
 * LLMモジュールのヘルスチェック
 */
export async function llmHealthCheck(): Promise<{ status: string; module: string }> {
  const res = await fetch(`${API_BASE}/llm/health`)
  if (!res.ok) throw new Error('LLM health check failed')
  return res.json()
}

