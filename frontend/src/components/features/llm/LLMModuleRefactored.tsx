import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button, Card, Label } from '@/components/ui'
import PhaseButton from './PhaseButton'
import EnvironmentSetup from './EnvironmentSetup'
import LLMSettings from './LLMSettings'
import ProcessStepList from './ProcessStepList'
import TaskInput from './TaskInput'
import CodeViewer from './CodeViewer'

type Phase = 'environment' | 'task' | 'config' | 'process' | 'code'
type Step = 'input' | 'analysis' | 'generation' | 'review'

export default function LLMModuleRefactored() {
  const [activePhase, setActivePhase] = useState<Phase>('environment')
  const [taskDescription, setTaskDescription] = useState(
    'Assemble robots into the selected shape with uniform distribution and no collisions'
  )
  const [generatedCode, setGeneratedCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [step, setStep] = useState<Step>('input')

  const phases = [
    {
      id: 'environment' as Phase,
      icon: '🌍',
      title: 'Environment Setup',
      description: 'Configure shape, robots, and spatial parameters',
      isCompleted: activePhase !== 'environment',
    },
    {
      id: 'task' as Phase,
      icon: '📝',
      title: 'Task Description',
      description: 'Describe the multi-robot coordination task',
      isCompleted: ['config', 'process', 'code'].includes(activePhase),
    },
    {
      id: 'config' as Phase,
      icon: '⚙️',
      title: 'LLM Configuration',
      description: 'Set Chain-of-Thought and API options',
      isCompleted: ['process', 'code'].includes(activePhase),
    },
    {
      id: 'process' as Phase,
      icon: '🔄',
      title: 'Generation Process',
      description: 'Monitor constraint analysis and function generation',
      isCompleted: activePhase === 'code' && generatedCode !== '',
    },
    {
      id: 'code' as Phase,
      icon: '📄',
      title: 'Generated Code',
      description: 'Review prior_policy and reward_function',
      isCompleted: generatedCode !== '',
    },
  ]

  const steps = [
    { label: 'User Instruction Input', status: (step === 'input' ? 'active' : 'completed') as 'completed' | 'active' | 'pending' },
    { label: 'Constraint Analysis', status: (step === 'analysis' ? 'active' : step === 'input' ? 'pending' : 'completed') as 'completed' | 'active' | 'pending' },
    { label: 'Function Generation', status: (step === 'generation' ? 'active' : ['input', 'analysis'].includes(step) ? 'pending' : 'completed') as 'completed' | 'active' | 'pending' },
    { label: 'Function Review', status: (step === 'review' ? 'active' : 'pending') as 'completed' | 'active' | 'pending' },
  ]

  const handleGenerate = () => {
    setIsGenerating(true)
    setActivePhase('process')
    setStep('analysis')

    // Simulate LLM processing steps
    setTimeout(() => setStep('generation'), 1000)
    setTimeout(() => {
      setStep('review')
      setActivePhase('code')
      setGeneratedCode(`def prior_policy(obs):
    # Move to target region
    f_attract = -k_attract * (obs['position'] - obs['target_position'])
    
    # Collision avoidance  
    f_repulse = k_repulse * sum(
        (obs['position'] - neighbor['position']) / 
        (np.linalg.norm(obs['position'] - neighbor['position']) + epsilon)**3
        for neighbor in obs['neighbors']
    )
    
    # Synchronization with neighbors
    f_sync = k_sync * sum(
        neighbor['velocity'] - obs['velocity'] 
        for neighbor in obs['neighbors']
    )
    
    return f_attract + f_repulse + f_sync

def reward_function(obs, action):
    # Coverage reward
    coverage = len(obs['occupied_cells']) / len(obs['target_cells'])
    
    # Uniformity reward
    uniformity = -np.var([len(neighbor['nearby_cells']) 
                         for neighbor in obs['neighbors']])
    
    # Collision penalty
    collision_penalty = -sum(1 for neighbor in obs['neighbors'] 
                           if np.linalg.norm(obs['position'] - neighbor['position']) < collision_radius)
    
    return coverage + 0.1 * uniformity + collision_penalty`)
      setIsGenerating(false)
    }, 3000)
  }

  const renderPhaseContent = () => {
    switch (activePhase) {
      case 'environment':
        return (
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              🌍 Environment Setup
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Configure the multi-robot environment parameters. These values will be used by the LLM to generate appropriate policies and reward functions.
            </p>
            <EnvironmentSetup defaultOpen={true} />
          </div>
        )

      case 'task':
        return (
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              📝 Task Description
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Describe the cooperative task that robots need to accomplish. The LLM will analyze this to derive constraints and generate appropriate functions.
            </p>
            <Label className="text-sm font-semibold mb-2 block">Task Instruction</Label>
            <TaskInput value={taskDescription} onChange={setTaskDescription} />
          </div>
        )

      case 'config':
        return (
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              ⚙️ LLM Configuration
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Configure how the LLM generates functions. Chain-of-Thought enables step-by-step reasoning, and Basic APIs provide deterministic knowledge.
            </p>
            <LLMSettings />
            
            <div className="mt-8 pt-6 border-t border-border">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !taskDescription.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Generate Functions
                  </>
                )}
              </Button>
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
              The LLM is analyzing constraints, deriving sub-goals, and generating Python functions for prior policy and reward.
            </p>
            <div className="space-y-4">
              <ProcessStepList steps={steps} />
              
              {step === 'analysis' && (
                <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                  <h3 className="text-sm font-semibold mb-2">Constraint Analysis</h3>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Identifying: Enter region, Avoid collision, Synchronize neighbors, Explore cells</li>
                    <li>• Deriving basic skills: move, avoid, sync</li>
                    <li>• Determining sub-goals: 1, 2, 4</li>
                  </ul>
                </Card>
              )}
              
              {step === 'generation' && (
                <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                  <h3 className="text-sm font-semibold mb-2">Function Generation</h3>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Constructing prior_policy as sum of skill actions</li>
                    <li>• Combining 3 forces: attraction, repulsion, synchronization</li>
                    <li>• Building reward function with logical conditions</li>
                  </ul>
                </Card>
              )}
            </div>
          </div>
        )

      case 'code':
        return (
          <Card className="flex-1 flex flex-col rounded-none border-0">
            <CodeViewer code={generatedCode} showSuccessRate={step === 'review'} />
          </Card>
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
              onClick={() => setActivePhase(phase.id)}
            />
          ))}
        </div>
      </div>

      {/* Right Panel - Phase Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderPhaseContent()}
      </div>
    </div>
  )
}

