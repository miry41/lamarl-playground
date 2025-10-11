import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  label: string
  status: 'completed' | 'active' | 'pending'
}

interface ProcessStepListProps {
  steps: Step[]
}

export default function ProcessStepList({ steps }: ProcessStepListProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div
            className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
              step.status === 'completed' && 'bg-green-500 text-white',
              step.status === 'active' && 'bg-primary text-primary-foreground',
              step.status === 'pending' && 'bg-muted text-muted-foreground'
            )}
          >
            {step.status === 'completed' ? (
              <Check size={12} />
            ) : step.status === 'active' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <span className="text-[10px]">{index + 1}</span>
            )}
          </div>
          <span
            className={cn(
              step.status === 'completed' && 'text-foreground',
              step.status === 'active' && 'text-foreground font-medium',
              step.status === 'pending' && 'text-muted-foreground'
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}

