import { cn } from '@/lib/utils'

interface PhaseButtonProps {
  icon: string
  title: string
  description: string
  isActive: boolean
  isCompleted?: boolean
  onClick: () => void
  disabled?: boolean
}

export default function PhaseButton({
  icon,
  title,
  description,
  isActive,
  isCompleted = false,
  onClick,
  disabled = false,
}: PhaseButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left p-4 rounded-lg border-2 transition-all',
        disabled && !isActive
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:border-primary/50',
        isActive
          ? 'border-primary bg-primary/0'
          : 'border-border bg-background'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'text-2xl flex-shrink-0',
            isActive && 'scale-110 transition-transform'
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'font-semibold text-sm mb-1',
              isActive ? 'text-primary' : 'text-foreground'
            )}
          >
            {title}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </div>
        </div>
      </div>
    </button>
  )
}

