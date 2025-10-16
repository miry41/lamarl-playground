import React, { useEffect } from 'react'
import { Send, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Card, CardHeader, CardContent, Label } from '@/components/ui'
import PhaseButton from './PhaseButton'
import EnvironmentSetup from './EnvironmentSetup'
import LLMSettings from './LLMSettings'
import ProcessStepList from './ProcessStepList'
import TaskInput from './TaskInput'
import BasicAPIList from './BasicAPIList'
import DSLViewer from './DSLViewer'
import CoTViewer from './CoTViewer'
import { useLLMStore } from '@/store/useLLMStore'
import { useTabNavigation } from '@/components/TabInterface'

type Phase = 'environment' | 'task' | 'apis' | 'config' | 'process' | 'result'

const PHASE_ORDER: Phase[] = ['environment', 'task', 'apis', 'config', 'process', 'result']

const PROGRESS_TO_STEP = {
  'input': 0,
  'analysis': 1,
  'generation': 2,
  'review': 3,
  'completed': 4,
  'idle': 0
} as const

export default function LLMModuleRefactored() {
  const {
    isGenerating,
    generationProgress,
    request,
    result,
    error,
    setRequest,
    generate,
    clearError
  } = useLLMStore()
  
  const { setActiveTab } = useTabNavigation()

  // エラーが発生したら自動的にクリア（5秒後）
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const phases: Array<{
    id: Phase
    icon: string
    title: string
    description: string
    isCompleted: boolean
  }> = [
    {
      id: 'environment',
      icon: '🌍',
      title: 'Environment Setup',
      description: 'Configure shape, robots, and spatial parameters',
      isCompleted: false,
    },
    {
      id: 'task',
      icon: '📝',
      title: 'Task Description',
      description: 'Describe the multi-robot coordination task',
      isCompleted: false,
    },
    {
      id: 'apis',
      icon: '📦',
      title: 'Basic APIs',
      description: 'Available operations and metrics for LLM',
      isCompleted: false,
    },
    {
      id: 'config',
      icon: '⚙️',
      title: 'LLM Configuration',
      description: 'Set Chain-of-Thought and model options',
      isCompleted: false,
    },
    {
      id: 'process',
      icon: '🔄',
      title: 'Generation Process',
      description: 'Monitor constraint analysis and function generation',
      isCompleted: generationProgress === 'completed',
    },
    {
      id: 'result',
      icon: '✨',
      title: 'Generated Result',
      description: 'Review Prior Policy and Reward Function',
      isCompleted: result !== null,
    },
  ]

  const [activePhase, setActivePhase] = React.useState<Phase>('environment')
  const [maxReachedPhase, setMaxReachedPhase] = React.useState<Phase>('environment')

  // 各フェーズの完了条件を判定
  const isPhaseCompleted = (phase: Phase): boolean => {
    switch (phase) {
      case 'environment':
        return true // デフォルト値があるため常に完了
      case 'task':
        return request.task_description.trim().length > 0
      case 'apis':
        return true // 閲覧のみなので常に完了
      case 'config':
        return true // デフォルト値があるため常に完了
      case 'process':
        return generationProgress === 'completed'
      case 'result':
        return result !== null
      default:
        return false
    }
  }

  // 生成プロセスに応じてフェーズを自動切り替え
  useEffect(() => {
    if (isGenerating) {
      const processIndex = PHASE_ORDER.indexOf('process')
      const currentIndex = PHASE_ORDER.indexOf(activePhase)
      if (currentIndex < processIndex) {
        setActivePhase('process')
        setMaxReachedPhase('process')
      }
    }
    // 自動でresultフェーズに移動しないように削除
  }, [isGenerating, activePhase])

  // ナビゲーション関数
  const handleNext = async () => {
    const currentIndex = PHASE_ORDER.indexOf(activePhase)
    
    // resultフェーズの場合は、MARLモジュールに移動
    if (activePhase === 'result') {
      setActiveTab('marl')
      return
    }
    
    if (currentIndex < PHASE_ORDER.length - 1 && isPhaseCompleted(activePhase)) {
      const nextPhase = PHASE_ORDER[currentIndex + 1]
      setActivePhase(nextPhase)
      // maxReachedPhaseを更新
      const nextIndex = PHASE_ORDER.indexOf(nextPhase)
      const maxIndex = PHASE_ORDER.indexOf(maxReachedPhase)
      if (nextIndex > maxIndex) {
        setMaxReachedPhase(nextPhase)
      }
    }
  }

  const handleBack = () => {
    const currentIndex = PHASE_ORDER.indexOf(activePhase)
    if (currentIndex > 0) {
      setActivePhase(PHASE_ORDER[currentIndex - 1])
    }
  }

  // フェーズをクリックできるかどうか判定（常にfalse - クリック禁止）
  const canNavigateToPhase = (phase: Phase): boolean => {
    return false // 全てのフェーズボタンをクリック禁止
  }

  const steps = [
    { label: 'User Instruction Input', status: (PROGRESS_TO_STEP[generationProgress] >= 0 ? (PROGRESS_TO_STEP[generationProgress] === 0 ? 'active' : 'completed') : 'pending') as 'completed' | 'active' | 'pending' },
    { label: 'Constraint Analysis (CoT)', status: (PROGRESS_TO_STEP[generationProgress] >= 1 ? (PROGRESS_TO_STEP[generationProgress] === 1 ? 'active' : 'completed') : 'pending') as 'completed' | 'active' | 'pending' },
    { label: 'Function Generation (DSL)', status: (PROGRESS_TO_STEP[generationProgress] >= 2 ? (PROGRESS_TO_STEP[generationProgress] === 2 ? 'active' : 'completed') : 'pending') as 'completed' | 'active' | 'pending' },
    { label: 'Function Review', status: (PROGRESS_TO_STEP[generationProgress] >= 3 ? 'completed' : 'pending') as 'completed' | 'active' | 'pending' },
  ]

  const renderPhaseContent = () => {
    switch (activePhase) {
      case 'environment':
        return (
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              🌍 Environment Setup
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Configure the multi-robot environment parameters. These values will be sent to the LLM to provide context for generating appropriate policies and rewards.
            </p>
            <EnvironmentSetup defaultOpen={true} />
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
              <h3 className="text-sm font-semibold mb-2">💡 How this helps LLM</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Shape determines the target formation pattern</li>
                <li>• Robot count affects coordination complexity</li>
                <li>• Sensing/avoidance radii define interaction ranges</li>
                <li>• These constraints guide the policy design</li>
              </ul>
            </div>
          </div>
        )

      case 'task':
        return (
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              📝 Task Description
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Describe the cooperative task in natural language. The LLM will analyze this to derive constraints and generate appropriate functions using Chain-of-Thought reasoning.
            </p>
            <Label className="text-sm font-semibold mb-2 block">Task Instruction</Label>
            <TaskInput 
              value={request.task_description} 
              onChange={(val) => setRequest({ task_description: val })} 
            />
            
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold">📚 Example Tasks</h3>
              <div className="grid gap-2">
                {[
                  'Form a circle with 30 robots, maintaining uniform spacing and avoiding collisions',
                  'Assemble robots into an "L" shape with even distribution across the target region',
                  'Create a square formation while minimizing travel distance and collision risk'
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setRequest({ task_description: example })}
                    className="text-left p-3 text-xs border border-border rounded hover:bg-muted/50 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'apis':
        return (
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              📦 Basic APIs
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              These are the available operations and metrics that the LLM can use. Providing this "Basic API" specification improves success rate by 28.5-67.5% (論文より).
            </p>
            <BasicAPIList />
          </div>
        )

      case 'config':
        return (
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              ⚙️ LLM Configuration
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Configure how the LLM generates functions. Chain-of-Thought enables step-by-step reasoning for better quality, and Basic APIs provide deterministic knowledge.
            </p>
            <LLMSettings />
            
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/20 rounded border border-purple-200 dark:border-purple-900">
              <h3 className="text-sm font-semibold mb-2">📊 Success Rate Impact</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>• Chain-of-Thought (CoT):</span>
                  <span className="font-semibold text-green-600">+28.5-67.5%</span>
                </div>
                <div className="flex justify-between">
                  <span>• Basic APIs:</span>
                  <span className="font-semibold text-green-600">+28.5-67.5%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
              <p className="text-xs text-muted-foreground">
                💡 Click "Next" button at the bottom to proceed to Generation Process
              </p>
            </div>
          </div>
        )

      case 'process':
        return (
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              🔄 Generation Process
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isGenerating 
                ? "The LLM is analyzing constraints, deriving sub-goals, and generating JSON-DSL for prior policy and reward function."
                : "Click the 'Generate Functions' button below to start the LLM generation process."
              }
            </p>
            
            {!isGenerating && !result && (
              <div className="mb-6 p-6 border-2 border-dashed border-border rounded-lg text-center">
                <Send size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Ready to Generate</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  All configuration is complete. Click the button below to start generating Prior Policy and Reward Function.
                </p>
                <Button
                  onClick={generate}
                  disabled={isGenerating}
                  size="lg"
                  className="w-full max-w-sm"
                >
                  <Send size={16} />
                  Generate Functions
                </Button>
              </div>
            )}
            
            {isGenerating && (
              <div className="space-y-4">
                <ProcessStepList steps={steps} />
                
                {generationProgress === 'analysis' && (
                  <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                    <h3 className="text-sm font-semibold mb-2">🧠 Constraint Analysis (CoT)</h3>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Identifying: Enter region, Avoid collision, Synchronize neighbors, Explore cells</li>
                      <li>• Deriving basic skills: move_to_center, avoid, sync, explore</li>
                      <li>• Determining sub-goals: coverage, uniformity, safety</li>
                    </ul>
                  </Card>
                )}
                
                {generationProgress === 'generation' && (
                  <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                    <h3 className="text-sm font-semibold mb-2">⚙️ Function Generation (JSON-DSL)</h3>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Constructing prior_policy as weighted sum of operations</li>
                      <li>• Combining forces: attraction, repulsion, synchronization</li>
                      <li>• Building reward formula with coverage, uniformity, collisions</li>
                    </ul>
                  </Card>
                )}
                
                {generationProgress === 'review' && (
                  <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                    <h3 className="text-sm font-semibold mb-2">✅ Function Review</h3>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Validating JSON-DSL structure</li>
                      <li>• Checking operation names and parameters</li>
                      <li>• Verifying reward formula safety</li>
                    </ul>
                  </Card>
                )}
              </div>
            )}
            
            {generationProgress === 'completed' && result && (
              <div className="p-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg text-center">
                <h3 className="text-lg font-semibold mb-2 text-green-800 dark:text-green-200">✅ Generation Complete!</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                  LLM has successfully generated Prior Policy and Reward Function. Click "Next" to view the results.
                </p>
              </div>
            )}
          </div>
        )

      case 'result':
        if (!result) {
          return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
              <div className="text-center text-muted-foreground">
                <Send size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">No result yet</p>
                <p className="text-xs mt-1">Click "Generate Functions" to start</p>
              </div>
            </div>
          )
        }

        return (
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              ✨ Generated Result
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              LLM successfully generated JSON-DSL for Prior Policy and Reward Function. これらは安全に実行可能な形式です。
            </p>
            
            <div className="space-y-6">
              {/* CoT Reasoning */}
              {result.cot_reasoning && (
                <CoTViewer reasoning={result.cot_reasoning} />
              )}
              
              {/* DSL Viewer */}
              <DSLViewer prior={result.prior} reward={result.reward} />
              
              {/* Metadata */}
              {result.metadata && (
                <Card>
                  <CardHeader className="p-4">
                    <h3 className="text-xs font-semibold text-muted-foreground">Generation Metadata</h3>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-xs space-y-1">
                      {result.metadata.model && (
                        <div>Model: <span className="font-mono">{result.metadata.model as string}</span></div>
                      )}
                      {result.metadata.temperature && (
                        <div>Temperature: <span className="font-mono">{result.metadata.temperature as number}</span></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex h-full">
      {/* Left Panel - Phase Navigation */}
      <div className="w-[280px] border-r border-border overflow-y-auto bg-muted/30">
        <div className="p-4 space-y-3">
          <div className="mb-4">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-2">
              LLM Generation Phases
            </h2>
          </div>
          {phases.map((phase) => (
            <PhaseButton
              key={phase.id}
              icon={phase.icon}
              title={phase.title}
              description={phase.description}
              isActive={activePhase === phase.id}
              isCompleted={phase.isCompleted}
              onClick={() => {
                if (canNavigateToPhase(phase.id)) {
                  setActivePhase(phase.id)
                }
              }}
              disabled={!canNavigateToPhase(phase.id)}
            />
          ))}
        </div>
      </div>

      {/* Right Panel - Phase Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
            <AlertCircle size={16} className="text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {renderPhaseContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="border-t border-border p-4 bg-background">
          <div className="flex justify-between items-center gap-4">
            <Button
              onClick={handleBack}
              disabled={PHASE_ORDER.indexOf(activePhase) === 0}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <ChevronLeft size={16} />
              Back
            </Button>

            <div className="text-xs text-muted-foreground">
              Step {PHASE_ORDER.indexOf(activePhase) + 1} of {PHASE_ORDER.length}
            </div>

            <Button
              onClick={handleNext}
              disabled={
                (activePhase !== 'result' && PHASE_ORDER.indexOf(activePhase) === PHASE_ORDER.length - 1) ||
                !isPhaseCompleted(activePhase)
              }
              size="lg"
              className="flex-1"
            >
              {activePhase === 'result' ? (
                <>
                  Go to MARL Module
                  <ChevronRight size={16} />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight size={16} />
                </>
              )}
            </Button>
          </div>
          
          {/* Completion Status Message */}
          {!isPhaseCompleted(activePhase) && activePhase === 'task' && (
            <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 text-center">
              ⚠ Please enter a task description to proceed
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
