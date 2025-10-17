import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type AccordionType = 'single' | 'multiple'

interface AccordionProps {
  children: React.ReactNode
  type?: AccordionType
  defaultValue?: string | string[]
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  className?: string
}

const AccordionContext = React.createContext<{
  type: AccordionType
  value: string[]
  toggleItem: (item: string) => void
}>({
  type: 'multiple',
  value: [],
  toggleItem: () => {},
})

const Accordion = ({ 
  children, 
  type = 'multiple',
  defaultValue = [],
  value: controlledValue,
  onValueChange,
  className
}: AccordionProps) => {
  const normalizedDefault = Array.isArray(defaultValue) ? defaultValue : [defaultValue]
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string[]>(normalizedDefault)
  
  const value = controlledValue !== undefined 
    ? (Array.isArray(controlledValue) ? controlledValue : [controlledValue])
    : uncontrolledValue

  const toggleItem = (item: string) => {
    let newValue: string[]
    
    if (type === 'single') {
      newValue = value.includes(item) ? [] : [item]
    } else {
      newValue = value.includes(item)
        ? value.filter(v => v !== item)
        : [...value, item]
    }

    if (controlledValue === undefined) {
      setUncontrolledValue(newValue)
    }
    onValueChange?.(type === 'single' ? newValue[0] || '' : newValue)
  }

  return (
    <AccordionContext.Provider value={{ type, value, toggleItem }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  children: React.ReactNode
  value: string
  className?: string
}

const AccordionItem = ({ children, value, className }: AccordionItemProps) => {
  const { value: openItems } = React.useContext(AccordionContext)
  const isOpen = openItems.includes(value)

  return (
    <div className={cn('border border-border rounded', className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          const childProps = child.props as Record<string, unknown>
          return React.cloneElement(child, { ...childProps, itemValue: value, isOpen } as React.Attributes)
        }
        return child
      })}
    </div>
  )
}

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  itemValue?: string
  isOpen?: boolean
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ children, className, itemValue = '', isOpen = false, ...props }, ref) => {
    const { toggleItem } = React.useContext(AccordionContext)

    return (
      <button
        ref={ref}
        onClick={() => toggleItem(itemValue)}
        className={cn(
          'flex items-center justify-between w-full p-3 text-sm font-semibold',
          'hover:bg-muted/50 transition-colors text-left',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown
          size={16}
          className={cn('transition-transform text-muted-foreground', isOpen && 'transform rotate-180')}
        />
      </button>
    )
  }
)

AccordionTrigger.displayName = 'AccordionTrigger'

interface AccordionContentProps {
  children: React.ReactNode
  className?: string
  itemValue?: string
  isOpen?: boolean
}

const AccordionContent = ({ children, className, isOpen = false }: AccordionContentProps) => {
  if (!isOpen) return null

  return (
    <div className={cn('p-3 pt-0 text-sm', className)}>
      {children}
    </div>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

