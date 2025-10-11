import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleProps {
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const CollapsibleContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

const Collapsible = ({ children, defaultOpen = false, open: controlledOpen, onOpenChange }: CollapsibleProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  return (
    <CollapsibleContext.Provider value={{ open, setOpen }}>
      <div className="space-y-2">{children}</div>
    </CollapsibleContext.Provider>
  )
}

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ children, className, ...props }, ref) => {
    const { open, setOpen } = React.useContext(CollapsibleContext)

    return (
      <button
        ref={ref}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-between w-full p-3 text-sm font-semibold',
          'bg-muted/50 hover:bg-muted rounded transition-colors',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown
          size={16}
          className={cn('transition-transform', open && 'transform rotate-180')}
        />
      </button>
    )
  }
)

CollapsibleTrigger.displayName = 'CollapsibleTrigger'

interface CollapsibleContentProps {
  children: React.ReactNode
  className?: string
}

const CollapsibleContent = ({ children, className }: CollapsibleContentProps) => {
  const { open } = React.useContext(CollapsibleContext)

  if (!open) return null

  return (
    <div className={cn('p-3 bg-background rounded border border-border', className)}>
      {children}
    </div>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

