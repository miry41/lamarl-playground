/**
 * MARL Training State Store (Zustand)
 * 学習の状態、ロボット位置、メトリクスなどを管理
 */

import { create } from 'zustand'
import {
  createEpisode,
  startTraining,
  stopTraining as apiStopTraining,
  connectEventStream,
} from '@/api/client'
import type {
  SSEEvent,
  EpisodeConfig,
} from '@/api/client'

// ==================== Types ====================

export interface Robot {
  x: number
  y: number
  vx: number
  vy: number
}

export interface RobotTrajectory {
  positions: Array<{ x: number; y: number; step: number }>
  maxLength: number
}

export interface EpisodeSnapshot {
  episode: number
  finalPositions: [number, number][]
  finalVelocities: [number, number][]
  M1: number
  M2: number
  steps: number
  globalStep: number
  converged: boolean
  timestamp: number
}

export interface TrainingState {
  // エピソード情報
  episodeId: string | null
  episodeConfig: Partial<EpisodeConfig>

  // 学習状態
  isTraining: boolean
  isConnected: boolean
  currentEpisode: number
  currentStep: number
  totalEpisodes: number
  totalSteps: number

  // ロボット状態
  robots: Robot[]
  collisions: [number, number][]
  trajectories: RobotTrajectory[]

  // メトリクス
  coverage: number  // M1
  uniformity: number  // M2
  coverageHistory: number[]  // 5ステップごとの履歴（グラフ用）
  uniformityHistory: number[]  // 5ステップごとの履歴（グラフ用）

  // エピソード履歴
  episodeHistory: EpisodeSnapshot[]  // 各エピソードの最終状態

  // 損失
  lossActor: number | null
  lossCritic: number | null
  lossActorHistory: number[]
  lossCriticHistory: number[]

  // 収束判定
  converged: boolean

  // エラー
  error: string | null
}

interface MARLStore extends TrainingState {
  // Actions
  createNewEpisode: (config?: Partial<EpisodeConfig>) => Promise<void>
  startTraining: (episodes?: number, episodeLen?: number) => Promise<void>
  stopTraining: () => Promise<void>
  resetTraining: () => Promise<void>
  setEpisodeConfig: (config: Partial<EpisodeConfig>) => void

  // Internal
  _handleSSEEvent: (event: SSEEvent) => void
  _cleanup: (() => void) | null
}

// ==================== Store ====================

const initialState: TrainingState = {
  episodeId: null,
  episodeConfig: {
    shape: 'circle',
    n_robot: 30,
    r_sense: 0.4,
    r_avoid: 0.1,
    nhn: 6,
    nhc: 80,
    grid_size: 64,
    l_cell: 1.0,
    seed: 1234,
  },
  isTraining: false,
  isConnected: false,
  currentEpisode: 0,
  currentStep: 0,
  totalEpisodes: 100,  // デフォルトは100エピソード（3000は長すぎる）
  totalSteps: 200,
  robots: [],
  collisions: [],
  trajectories: [],
  coverage: 0,
  uniformity: 0,
  coverageHistory: [],
  uniformityHistory: [],
  episodeHistory: [],
  lossActor: null,
  lossCritic: null,
  lossActorHistory: [],
  lossCriticHistory: [],
  converged: false,
  error: null,
  _cleanup: null,
}

export const useMARLStore = create<MARLStore>((set, get) => ({
  ...initialState,

  // エピソード作成
  createNewEpisode: async (config = {}) => {
    try {
      console.log('🔄 Creating new episode with config:', config)
      set({ error: null })
      const mergedConfig = { ...get().episodeConfig, ...config }
      console.log('📤 Sending request to backend:', mergedConfig)
      
      const res = await createEpisode(mergedConfig)
      console.log('📥 Received response:', res)

      set({
        episodeId: res.episode_id,
        episodeConfig: mergedConfig,
        error: null,
      })

      console.log('✅ Episode created:', res.episode_id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      set({ error: message })
      console.error('❌ Failed to create episode:', err)
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : err,
        stack: err instanceof Error ? err.stack : undefined,
      })
    }
  },

  // 学習開始
  startTraining: async (episodes = 1, episodeLen = 200) => {
    const { episodeId } = get()
    if (!episodeId) {
      set({ error: 'No episode ID. Create an episode first.' })
      return
    }

    try {
      set({ error: null })

      // バックエンドに学習開始リクエスト
      await startTraining(episodeId, episodes, episodeLen)

      // SSE接続を開始
      const cleanup = connectEventStream(
        episodeId,
        (event) => get()._handleSSEEvent(event),
        (err) => set({ error: err.message, isConnected: false })
      )

      set({
        isTraining: true,
        isConnected: true,
        totalEpisodes: episodes,
        totalSteps: episodeLen,
        currentEpisode: 0,
        currentStep: 0,
        _cleanup: cleanup,
      })

      console.log('✅ Training started:', episodeId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      set({ error: message, isTraining: false })
      console.error('❌ Failed to start training:', err)
    }
  },

  // 学習停止
  stopTraining: async () => {
    const { episodeId, _cleanup } = get()
    
    // バックエンドに停止リクエストを送信
    if (episodeId) {
      try {
        await apiStopTraining(episodeId)
        console.log('⏹️ Stop request sent to backend')
      } catch (err) {
        console.error('❌ Failed to stop training on backend:', err)
      }
    }
    
    // SSE接続を切断
    if (_cleanup) {
      _cleanup()
      set({ _cleanup: null })
    }
    
    set({ isTraining: false, isConnected: false })
    console.log('⏸️ Training stopped')
  },

  // リセット
  resetTraining: async () => {
    console.log('🔄 Resetting training...')
    
    // 学習を停止（バックエンドにも通知）
    await get().stopTraining()
    
    // 状態をリセット（設定は保持）
    const config = get().episodeConfig
    set({
      ...initialState,
      episodeConfig: config,
    })
    
    // 新しいエピソードを作成
    try {
      console.log('🆕 Creating new episode after reset...')
      await get().createNewEpisode(config)
      console.log('✅ Training reset complete with new episode')
    } catch (err) {
      console.error('❌ Failed to create episode after reset:', err)
      set({ error: err instanceof Error ? err.message : 'Failed to create episode' })
    }
  },

  // 設定更新
  setEpisodeConfig: (config) => {
    set({
      episodeConfig: { ...get().episodeConfig, ...config },
    })
  },

  // ==================== SSE Event Handler ====================

  _handleSSEEvent: (event: SSEEvent) => {
    const state = get()

    switch (event.type) {
      case 'tick': {
        // ロボット位置更新
        const robots: Robot[] = event.positions.map((pos, i) => ({
          x: pos[0],
          y: pos[1],
          vx: event.velocities[i]?.[0] || 0,
          vy: event.velocities[i]?.[1] || 0,
        }))

        // 軌跡更新（最大50ポイントに削減 & パフォーマンス最適化）
        const maxTrajectoryLength = 50  // 100→50に削減
        const newTrajectories = event.positions.map((pos, i) => {
          const existingTrajectory = state.trajectories[i]
          if (!existingTrajectory) {
            return {
              positions: [{ x: pos[0], y: pos[1], step: event.step }],
              maxLength: maxTrajectoryLength
            }
          }
          
          // spread演算子を避けてpushを使う（パフォーマンス向上）
          const newPositions = existingTrajectory.positions
          newPositions.push({ x: pos[0], y: pos[1], step: event.step })
          
          // 最大長を超えたら古いものから削除
          if (newPositions.length > maxTrajectoryLength) {
            newPositions.shift()
          }
          
          return { positions: newPositions, maxLength: maxTrajectoryLength }
        })

        set({
          robots,
          collisions: event.collisions,
          trajectories: newTrajectories,
          currentStep: event.step,
          currentEpisode: event.episode,
        })
        break
      }

      case 'metrics_update': {
        // メトリクス更新
        const newCoverageHistory = [...state.coverageHistory, event.M1].slice(-200)
        const newUniformityHistory = [...state.uniformityHistory, event.M2].slice(-200)

        const updates: Partial<TrainingState> = {
          coverage: event.M1,
          uniformity: event.M2,
          coverageHistory: newCoverageHistory,
          uniformityHistory: newUniformityHistory,
          converged: event.M1 >= 0.8 && event.M2 <= 0.2,
        }

        // 損失情報があれば更新
        if (event.loss_actor !== undefined) {
          updates.lossActor = event.loss_actor
          updates.lossActorHistory = [...state.lossActorHistory, event.loss_actor].slice(-200)
        }
        if (event.loss_critic !== undefined) {
          updates.lossCritic = event.loss_critic
          updates.lossCriticHistory = [...state.lossCriticHistory, event.loss_critic].slice(-200)
        }

        set(updates)
        break
      }

      case 'episode_end': {
        const converged = event.M1 >= 0.8 && event.M2 <= 0.2
        // パフォーマンス向上のため、10エピソードごとにのみログ出力
        if (event.episode % 10 === 0 || converged) {
          console.log(`🎉 Episode ${event.episode} ended (${converged ? 'converged ✓' : 'training'}):`, {
            M1: event.M1.toFixed(3),
            M2: event.M2.toFixed(3),
          })
        }

        // エピソードスナップショットを保存
        // バックエンドから受け取った最終位置を使用（タイミング問題を回避）
        const snapshot: EpisodeSnapshot = {
          episode: event.episode,
          finalPositions: event.final_positions,
          finalVelocities: event.final_velocities,
          M1: event.M1,
          M2: event.M2,
          steps: event.step + 1,  // 0-indexed なので +1
          globalStep: event.global_step,
          converged,
          timestamp: Date.now(),
        }

        // メモリリーク防止: エピソード履歴を最新100件に制限
        const maxHistorySize = 100
        const newHistory = [...state.episodeHistory, snapshot].slice(-maxHistorySize)
        
        set({
          episodeHistory: newHistory,
          trajectories: [],  // 次のエピソードのために軌跡をクリア
        })
        break
      }
    }
  },
}))

