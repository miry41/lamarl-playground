import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import { Button, Badge } from '@/components/ui'

interface TrainingControlsProps {
  isTraining: boolean
  episode: number
  maxEpisodes?: number
  step?: number
  maxSteps?: number
  converged?: boolean
  onToggleTraining: () => void
  onReset: () => void
  onStepForward: () => void
}

export default function TrainingControls({
  isTraining,
  episode,
  maxEpisodes = 3000,
  step = 0,
  maxSteps = 200,
  converged = false,
  onToggleTraining,
  onReset,
  onStepForward,
}: TrainingControlsProps) {
  const episodeProgress = (episode / maxEpisodes) * 100
  const stepProgress = (step / maxSteps) * 100

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Training Controls</h3>
        {converged && (
          <Badge variant="success" className="text-xs">
            ✓ Converged
          </Badge>
        )}
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          onClick={onToggleTraining}
          shape="circle"
          size="icon"
        >
          {isTraining ? <Pause size={20} /> : <Play size={20} />}
        </Button>

        <Button onClick={onReset} variant="outline" shape="circle" size="icon">
          <RotateCcw size={18} />
        </Button>

        <Button onClick={onStepForward} variant="outline" shape="circle" size="icon">
          <SkipForward size={18} />
        </Button>
      </div>

      {/* Episode Counter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Episode</span>
          <span className="text-xl font-mono font-bold">
            {episode} / {maxEpisodes}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${episodeProgress}%` }}
          />
        </div>
      </div>

      {/* Step Counter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Step</span>
          <span className="text-lg font-mono font-bold">
            {step} / {maxSteps}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${stepProgress}%` }}
          />
        </div>
      </div>

      {/* Estimated Time (if training) */}
      {isTraining && (
        <div className="text-xs text-muted-foreground">
          Estimated: 2h 15m remaining
        </div>
      )}
    </section>
  )
}

