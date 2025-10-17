/**
 * LLM Generation State Store (Zustand)
 * LLMによる Prior Policy / Reward Function 生成の状態管理
 */

import { create } from 'zustand'

// ==================== Types ====================

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

export interface GenerationResult {
  prior: PriorDSL
  reward: RewardDSL
  cot_reasoning?: string
  metadata?: {
    model?: string
    temperature?: number
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
    }
  }
}

export interface GenerationRequest {
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

export interface LLMState {
  // 生成状態
  isGenerating: boolean
  generationProgress: 'idle' | 'input' | 'analysis' | 'generation' | 'review' | 'completed'
  
  // リクエストパラメータ
  request: GenerationRequest
  
  // 生成結果
  result: GenerationResult | null
  
  // 生成履歴（最新5件）
  history: GenerationResult[]
  
  // エラー
  error: string | null
}

interface LLMStore extends LLMState {
  // Actions
  setRequest: (req: Partial<GenerationRequest>) => void
  generate: () => Promise<void>
  clearResult: () => void
  clearError: () => void
  
  // Internal
  _setProgress: (progress: LLMState['generationProgress']) => void
}

// ==================== Store ====================

const defaultRequest: GenerationRequest = {
  task_description: 'Assemble robots into the selected shape with uniform distribution and no collisions',
  shape: 'circle',  // デフォルトはcircle
  n_robot: 30,
  r_sense: 0.4,  // max: 1.0
  r_avoid: 0.1,  // max: 0.5
  n_hn: 6,       // max: 20
  n_hc: 80,      // max: 200
  use_cot: true,
  use_basic_apis: true,
  model: 'gemini-2.5-flash',  // Gemini-2.5-flashに固定
  temperature: 0.7,
}

// 値をバリデーション（クランプ）するヘルパー関数
const clampRequest = (req: GenerationRequest): GenerationRequest => {
  const clamped = {
    ...req,
    r_sense: Math.max(0.1, Math.min(1.0, req.r_sense)),
    r_avoid: Math.max(0.01, Math.min(0.5, req.r_avoid)),
    n_robot: Math.max(1, Math.min(100, req.n_robot)),
    n_hn: Math.max(1, Math.min(20, req.n_hn)),
    n_hc: Math.max(10, Math.min(200, req.n_hc)),
    temperature: Math.max(0, Math.min(2, req.temperature)),
  }
  
  // 値が変更された場合はログ出力（デバッグ時のみ）
  // if (req.r_sense !== clamped.r_sense || req.r_avoid !== clamped.r_avoid ||
  //     req.n_robot !== clamped.n_robot || req.n_hn !== clamped.n_hn ||
  //     req.n_hc !== clamped.n_hc || req.temperature !== clamped.temperature) {
  //   console.warn('🔧 LLM request values clamped:', {
  //     r_sense: `${req.r_sense} → ${clamped.r_sense}`,
  //     r_avoid: `${req.r_avoid} → ${clamped.r_avoid}`,
  //     n_robot: `${req.n_robot} → ${clamped.n_robot}`,
  //     n_hn: `${req.n_hn} → ${clamped.n_hn}`,
  //     n_hc: `${req.n_hc} → ${clamped.n_hc}`,
  //     temperature: `${req.temperature} → ${clamped.temperature}`,
  //   })
  // }
  
  return clamped
}

// console.log('🏪 Initializing LLM Store with:', clampRequest(defaultRequest))

export const useLLMStore = create<LLMStore>((set, get) => ({
  // Initial state
  isGenerating: false,
  generationProgress: 'idle',
  request: clampRequest(defaultRequest),  // 初期値もクランプ
  result: null,
  history: [],
  error: null,

  // リクエストパラメータを更新
  setRequest: (req) => {
    const updatedReq = clampRequest({ ...get().request, ...req })
    set({ request: updatedReq })
    // Note: MARLタブの環境設定はバックエンドのSSE (env_config) から取得されます
  },

  // LLM生成を開始
  generate: async () => {
    const { request } = get()
    
    try {
      set({ 
        isGenerating: true, 
        generationProgress: 'input',
        error: null 
      })

      // ステップ1: 入力受付
      await new Promise(resolve => setTimeout(resolve, 500))
      set({ generationProgress: 'analysis' })

      // ステップ2: 制約分析
      await new Promise(resolve => setTimeout(resolve, 1000))
      set({ generationProgress: 'generation' })

      // ステップ3: 関数生成（バックエンド呼び出し）
      // console.log('🚀 Sending LLM generation request:', request)
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE}/llm/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ LLM API Error:', error)
        const errorMsg = typeof error.detail === 'string' 
          ? error.detail 
          : JSON.stringify(error.detail || error)
        throw new Error(errorMsg)
      }

      const result: GenerationResult = await response.json()

      // ステップ4: レビュー
      set({ generationProgress: 'review' })
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 完了
      set({ 
        result,
        history: [result, ...get().history].slice(0, 5), // 最新5件を保持
        generationProgress: 'completed',
        isGenerating: false 
      })

      // console.log('✅ LLM generation completed:', result)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      set({ 
        error: message,
        isGenerating: false,
        generationProgress: 'idle'
      })
      console.error('❌ LLM generation failed:', err)
    }
  },

  // 結果をクリア
  clearResult: () => {
    set({ 
      result: null, 
      generationProgress: 'idle' 
    })
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null })
  },

  // 内部: プログレス更新
  _setProgress: (progress) => {
    set({ generationProgress: progress })
  },
}))

