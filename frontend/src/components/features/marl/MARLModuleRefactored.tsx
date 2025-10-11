import { useState, useEffect } from 'react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui'
import { MethodComparison } from '@/components/common'
import EnvironmentDisplay from './EnvironmentDisplay'
import TrainingControls from './TrainingControls'
import AlgorithmSettings from './AlgorithmSettings'
import TrainingParameters from './TrainingParameters'
import LAMARLFeatures from './LAMARLFeatures'
import PerformanceMetrics from './PerformanceMetrics'
import SampleEfficiency from './SampleEfficiency'
import RobotVisualization from './RobotVisualization'
import MetricsChart from './MetricsChart'
import LossChart from './LossChart'
import ActionBlending from './ActionBlending'
import ReplayBufferStatus from './ReplayBufferStatus'
import LLMGeneratedFunctions from './LLMGeneratedFunctions'

const methods = [
  { name: 'LAMARL (Ours)', value: 95, color: 'bg-blue-500' },
  { name: 'Mean-shift', value: 93, color: 'bg-green-500' },
  { name: 'MDR', value: 75, color: 'bg-orange-500' },
  { name: 'AIRL', value: 70, color: 'bg-red-500' },
]

export default function MARLModuleRefactored() {
  const [isTraining, setIsTraining] = useState(false)
  const [episode, setEpisode] = useState(0)
  const [step, setStep] = useState(0)
  const [usePriorPolicy, setUsePriorPolicy] = useState(true)
  const [useLLMReward, setUseLLMReward] = useState(true)
  const [beta, setBeta] = useState(0.3)
  
  // Generate sample data that evolves over time
  const generateCoverageData = (episodes: number) => {
    return Array.from({ length: episodes }, (_, i) => 
      Math.min(0.95, 0.2 + (i / episodes) * 0.7 + Math.random() * 0.05)
    )
  }
  
  const generateUniformityData = (episodes: number) => {
    return Array.from({ length: episodes }, (_, i) => 
      Math.max(0.05, 0.5 - (i / episodes) * 0.4 + Math.random() * 0.05)
    )
  }

  const coverageData = generateCoverageData(50)
  const uniformityData = generateUniformityData(50)
  
  // Actor loss components
  const actorQValues = Array.from({ length: 30 }, (_, i) => 80 - i * 1.5 + Math.random() * 5)
  const actorPriorLoss = Array.from({ length: 30 }, (_, i) => 30 - i * 0.8 + Math.random() * 3)
  
  // Critic loss
  const criticTdError = Array.from({ length: 30 }, (_, i) => 100 - i * 2.5 + Math.random() * 5)
  
  const currentCoverage = coverageData[coverageData.length - 1]
  const currentUniformity = uniformityData[uniformityData.length - 1]
  const converged = currentCoverage >= 0.8 && currentUniformity <= 0.2

  // Simulate training progress
  useEffect(() => {
    if (isTraining) {
      const interval = setInterval(() => {
        setStep((prev) => {
          if (prev >= 199) {
            setEpisode((e) => e + 1)
            return 0
          }
          return prev + 1
        })
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isTraining])

  const handleEditEnvironment = () => {
    // Navigate to LLM tab to edit environment
    console.log('Navigate to LLM tab')
  }

  return (
    <div className="flex h-full">
      {/* Left Panel - Training Controls */}
      <div className="w-[360px] border-r border-border overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Environment Display (read-only) */}
          <EnvironmentDisplay
            shape="circle"
            nRobots={30}
            rSense={0.4}
            rAvoid={0.1}
            nHn={6}
            nHc={80}
            onEdit={handleEditEnvironment}
          />

          {/* Training Controls (always visible) */}
          <TrainingControls
            isTraining={isTraining}
            episode={episode}
            maxEpisodes={3000}
            step={step}
            maxSteps={200}
            converged={converged}
            onToggleTraining={() => setIsTraining(!isTraining)}
            onReset={() => {
              setEpisode(0)
              setStep(0)
            }}
            onStepForward={() => setStep((prev) => Math.min(prev + 1, 200))}
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
          shape="circle"
          rSense={0.4}
          rAvoid={0.1}
        />

        {/* Performance Metrics with Convergence Status */}
        <PerformanceMetrics
          coverage={currentCoverage}
          uniformity={currentUniformity}
          coverageTarget={0.8}
          uniformityTarget={0.2}
        />

        {/* 2-Column Grid: M1 and M2 Time-series Charts */}
        <div className="grid grid-cols-2 gap-6">
          <MetricsChart
            title="Coverage Rate (M₁)"
            data={coverageData}
            color="#3b82f6"
            targetValue={0.8}
            targetLabel="Target ≥ 0.8"
            yMin={0}
            yMax={1}
            goodDirection="up"
          />
          <MetricsChart
            title="Uniformity (M₂)"
            data={uniformityData}
            color="#8b5cf6"
            targetValue={0.2}
            targetLabel="Target ≤ 0.2"
            yMin={0}
            yMax={1}
            goodDirection="down"
          />
        </div>

        {/* 2-Column Grid: Actor and Critic Losses */}
        <div className="grid grid-cols-2 gap-6">
          <LossChart
            title="Actor Loss Components"
            components={[
              { label: 'Q-value', data: actorQValues, color: '#3b82f6' },
              { label: 'Prior Reg.', data: actorPriorLoss, color: '#10b981' },
            ]}
          />
          <LossChart
            title="Critic TD Error"
            components={[
              { label: 'TD Error', data: criticTdError, color: '#ef4444' },
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

