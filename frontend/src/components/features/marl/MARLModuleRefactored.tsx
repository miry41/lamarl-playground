import { useState, useEffect } from 'react'
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
import { useMARLStore } from '@/store/useMARLStore'

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
  } = useMARLStore()

  // Local UI state
  const [usePriorPolicy, setUsePriorPolicy] = useState(true)
  const [useLLMReward, setUseLLMReward] = useState(true)
  const [beta, setBeta] = useState(0.3)

  // エピソード作成（初回マウント時のみ）
  useEffect(() => {
    if (!episodeId) {
      console.log('🔄 Creating new episode...')
      createNewEpisode()
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
      // エピソードがまだ作成されていない場合は作成
      if (!episodeId) {
        console.log('⚠️ No episode ID, creating one first...')
        await createNewEpisode()
        // 少し待ってからエピソードIDを再取得
        const newEpisodeId = useMARLStore.getState().episodeId
        if (!newEpisodeId) {
          console.error('❌ Failed to create episode')
          return
        }
      }
      await startTraining(100, 200)  // 100エピソード、各200ステップ（3000は長すぎる）
    }
  }

  const handleReset = async () => {
    await resetTraining()
  }

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

          {/* Accordion for other settings */}
          <Accordion type="multiple" defaultValue={['lamarl']}>
            <AccordionItem value="lamarl">
              <AccordionTrigger>⭐ LAMARL Features</AccordionTrigger>
              <AccordionContent>
                <LAMARLFeatures
                  usePriorPolicy={usePriorPolicy}
                  useLLMReward={useLLMReward}
                  onPriorPolicyChange={setUsePriorPolicy}
                  onLLMRewardChange={setUseLLMReward}
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

