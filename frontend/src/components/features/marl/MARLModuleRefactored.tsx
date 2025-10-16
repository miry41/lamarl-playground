import { useState, useEffect, useRef } from 'react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui'
import { MethodComparison } from '@/components/common'
import TrainingControls from './TrainingControls'
import AlgorithmSettings from './AlgorithmSettings'
import TrainingParameters from './TrainingParameters'
import LAMARLFeatures from './LAMARLFeatures'
import PerformanceMetrics from './PerformanceMetrics'
import SampleEfficiency from './SampleEfficiency'
import RobotVisualization from './RobotVisualization'
import MetricsChart from './MetricsChart'
import EpisodeMetricsChart from './EpisodeMetricsChart'
import EpisodeComparison from './EpisodeComparison'
import LossChart from './LossChart'
import ActionBlending from './ActionBlending'
import ReplayBufferStatus from './ReplayBufferStatus'
import LLMGeneratedFunctions from './LLMGeneratedFunctions'
import EnvironmentDisplay from './EnvironmentDisplay'
import { useMARLStore } from '@/store/useMARLStore'
import { useLLMStore } from '@/store/useLLMStore'

const methods = [
  { name: 'LAMARL (Ours)', value: 95, color: 'bg-blue-500' },
  { name: 'Mean-shift', value: 93, color: 'bg-green-500' },
  { name: 'MDR', value: 75, color: 'bg-orange-500' },
  { name: 'AIRL', value: 70, color: 'bg-red-500' },
]

export default function MARLModuleRefactored() {
  // Zustand store
  const {
    episodeId,
    episodeConfig,
    isTraining,
    currentEpisode,
    currentStep,
    totalEpisodes,
    totalSteps,
    robots,
    trajectories,
    coverage,
    uniformity,
    coverageHistory,
    uniformityHistory,
    episodeHistory,
    lossActorHistory,
    lossCriticHistory,
    converged,
    error,
    createNewEpisode,
    startTraining,
    stopTraining,
    resetTraining,
    setEpisodeConfig,
  } = useMARLStore()

  // Local UI state
  const [useLLM, setUseLLM] = useState(true)
  const [taskDescription, setTaskDescription] = useState('')
  const [llmModel, setLLMModel] = useState('gemini-2.0-flash-exp')
  const [beta, setBeta] = useState(0.3)  // Prior融合係数
  
  // 初期化フラグ（React Strict Modeでの重複実行を防ぐ）
  const isInitialized = useRef(false)

  // LLMタブの設定を常に監視して、MARLタブの形状を同期
  useEffect(() => {
    // 初期設定を即座に反映（値をクランプして安全に使用）
    const llmConfig = useLLMStore.getState().request
    // console.log('🔄 Initial LLM config:', llmConfig.shape)
    
    // 値をクランプ（バックエンドのスキーマに合わせる）
    const safeConfig = {
      shape: llmConfig.shape,
      n_robot: Math.max(1, Math.min(100, llmConfig.n_robot)),
      r_sense: Math.max(0.1, Math.min(1.0, llmConfig.r_sense)),
      r_avoid: Math.max(0.01, Math.min(0.5, llmConfig.r_avoid)),
      nhn: Math.max(1, Math.min(20, llmConfig.n_hn)),
      nhc: Math.max(10, Math.min(200, llmConfig.n_hc)),
    }
    
    setEpisodeConfig(safeConfig)
    
    // エピソードがない場合は作成（重複防止）
    if (!episodeId && !isInitialized.current) {
      isInitialized.current = true
      // console.log('🆕 Creating initial episode with config:', safeConfig)
      createNewEpisode(safeConfig)
    }
    
    // LLMタブの設定変更を監視（リアルタイム同期）
    const unsubscribe = useLLMStore.subscribe((state) => {
      const newConfig = state.request
      
      // 値をクランプ（バックエンドのスキーマに合わせる）
      const safeConfig = {
        shape: newConfig.shape,
        n_robot: Math.max(1, Math.min(100, newConfig.n_robot)),
        r_sense: Math.max(0.1, Math.min(1.0, newConfig.r_sense)),
        r_avoid: Math.max(0.01, Math.min(0.5, newConfig.r_avoid)),
        nhn: Math.max(1, Math.min(20, newConfig.n_hn)),
        nhc: Math.max(10, Math.min(200, newConfig.n_hc)),
      }
      
      console.log('🎨 LLM config changed → updating MARL tab:', safeConfig)
      setEpisodeConfig(safeConfig)
    })
    
    // クリーンアップ
    return () => {
      // console.log('🧹 Unsubscribing from LLM store')
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEditEnvironment = () => {
    // Navigate to LLM tab to edit environment
    console.log('Navigate to LLM tab')
  }

  const handleToggleTraining = async () => {
    if (isTraining) {
      await stopTraining()
    } else {
      // エピソードがまだ作成されていない場合はエラー
      if (!episodeId) {
        console.error('❌ No episode ID')
        return
      }
      
      // LLMを使用する場合はタスク記述を自動生成
      const autoTaskDescription = taskDescription || 
        `${episodeConfig.n_robot}台のロボットで${episodeConfig.shape}形状を形成する`
      
      console.log('▶️ Starting training with shape:', episodeConfig.shape)
      await startTraining(100, 200, useLLM, autoTaskDescription, llmModel)
    }
  }

  const handleReset = async () => {
    await resetTraining()
  }

  // デバッグログ: episodeConfigの変更を監視
  // useEffect(() => {
  //   console.log('🎨 UI updated: shape =', episodeConfig.shape)
  // }, [episodeConfig])

  return (
    <div className="flex h-full">
      {/* Left Panel - Training Controls */}
      <div className="w-[360px] border-r border-border overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Status Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              ❌ {error}
            </div>
          )}
          {!episodeId && !error && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              🔄 Creating episode...
            </div>
          )}
          {episodeId && !isTraining && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              ✅ Ready to train (ID: {episodeId.slice(-8)})
            </div>
          )}
          {isTraining && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              🔄 Training in progress
              <div className="text-xs mt-1">
                Episodes completed: {episodeHistory.length} / {totalEpisodes}
              </div>
            </div>
          )}


          {/* Training Controls (always visible) */}
          <TrainingControls
            isTraining={isTraining}
            episode={currentEpisode}
            maxEpisodes={totalEpisodes}
            step={currentStep}
            maxSteps={totalSteps}
            converged={converged}
            disabled={!episodeId}
            onToggleTraining={handleToggleTraining}
            onReset={handleReset}
            onStepForward={() => {}}  // TODO: step forward implementation
          />

          {/* Environment Display (リアルタイム同期) */}
          <EnvironmentDisplay
            shape={episodeConfig.shape}
            nRobots={episodeConfig.n_robot}
            rSense={episodeConfig.r_sense}
            rAvoid={episodeConfig.r_avoid}
            nHn={episodeConfig.nhn}
            nHc={episodeConfig.nhc}
            onEdit={handleEditEnvironment}
          />

          {/* Accordion for other settings */}
          <Accordion type="multiple" defaultValue={['lamarl']}>
            <AccordionItem value="lamarl">
              <AccordionTrigger>⭐ LAMARL Features</AccordionTrigger>
              <AccordionContent>
                <LAMARLFeatures
                  useLLM={useLLM}
                  setUseLLM={setUseLLM}
                  taskDescription={taskDescription}
                  setTaskDescription={setTaskDescription}
                  llmModel={llmModel}
                  setLLMModel={setLLMModel}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="algorithm">
              <AccordionTrigger>🤖 Algorithm Settings</AccordionTrigger>
              <AccordionContent>
                <AlgorithmSettings />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="parameters">
              <AccordionTrigger>📊 Training Parameters</AccordionTrigger>
              <AccordionContent>
                <TrainingParameters />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="llm-functions">
              <AccordionTrigger>📝 LLM Functions</AccordionTrigger>
              <AccordionContent>
                <LLMGeneratedFunctions />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Right Panel - Training Progress & Metrics */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Robot Visualization (Full Width) */}
        <RobotVisualization
          shape={episodeConfig.shape || 'circle'}
          robots={robots}
          trajectories={trajectories}
          rSense={episodeConfig.r_sense || 0.4}
          rAvoid={episodeConfig.r_avoid || 0.1}
          nRobot={episodeConfig.n_robot || 30}
          gridSize={episodeConfig.grid_size || 64}
          showTrajectories={true}
        />

        {/* Performance Metrics with Convergence Status */}
        <PerformanceMetrics
          coverage={coverage}
          uniformity={uniformity}
          coverageTarget={0.8}
          uniformityTarget={0.2}
        />

        {/* 2-Column Grid: M1 and M2 Time-series Charts (Step-wise) */}
        <div className="grid grid-cols-2 gap-6">
          <MetricsChart
            title="Coverage Rate (M₁) - Real-time"
            data={coverageHistory.length > 0 ? coverageHistory : [0]}
            color="#3b82f6"
            targetValue={0.8}
            targetLabel="Target ≥ 0.8"
            yMin={0}
            yMax={1}
            goodDirection="up"
          />
          <MetricsChart
            title="Uniformity (M₂) - Real-time"
            data={uniformityHistory.length > 0 ? uniformityHistory : [0]}
            color="#8b5cf6"
            targetValue={0.2}
            targetLabel="Target ≤ 0.2"
            yMin={0}
            yMax={1}
            goodDirection="down"
          />
        </div>

        {/* Episode-wise Metrics (論文に基づく) */}
        {episodeHistory.length > 0 && (
          <div className="grid grid-cols-2 gap-6">
            <EpisodeMetricsChart
              title="Coverage Rate (M₁) - Per Episode"
              episodes={episodeHistory}
              metric="M1"
              targetValue={0.8}
              targetLabel="Target ≥ 0.8"
              yMin={0}
              yMax={1}
              goodDirection="up"
            />
            <EpisodeMetricsChart
              title="Uniformity (M₂) - Per Episode"
              episodes={episodeHistory}
              metric="M2"
              targetValue={0.2}
              targetLabel="Target ≤ 0.2"
              yMin={0}
              yMax={1}
              goodDirection="down"
            />
          </div>
        )}

        {/* Episode Comparison (最低5エピソード以降に表示 & パフォーマンス向上) */}
        {episodeHistory.length >= 5 && (
          <EpisodeComparison
            episodes={episodeHistory}
            shape={episodeConfig.shape || 'circle'}
            gridSize={episodeConfig.grid_size || 64}
            maxDisplay={4}
          />
        )}

        {/* 2-Column Grid: Actor and Critic Losses */}
        <div className="grid grid-cols-2 gap-6">
          <LossChart
            title="Actor Loss"
            components={[
              { label: 'Actor Loss', data: lossActorHistory.length > 0 ? lossActorHistory : [0], color: '#3b82f6' },
            ]}
          />
          <LossChart
            title="Critic Loss"
            components={[
              { label: 'Critic Loss', data: lossCriticHistory.length > 0 ? lossCriticHistory : [0], color: '#ef4444' },
            ]}
          />
        </div>

        {/* 2-Column Grid: Action Blending and Replay Buffer */}
        <div className="grid grid-cols-2 gap-6">
          <ActionBlending
            beta={beta}
            onBetaChange={setBeta}
          />
          <ReplayBufferStatus />
        </div>

        {/* 2-Column Grid: Sample Efficiency and Method Comparison */}
        <div className="grid grid-cols-2 gap-6">
          <SampleEfficiency />
          <MethodComparison methods={methods} />
        </div>
      </div>
    </div>
  )
}

