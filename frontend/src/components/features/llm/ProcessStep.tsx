interface ProcessStepProps {
  number: number
  title: string
  isActive: boolean
  isCompleted: boolean
  children?: React.ReactNode
}

export default function ProcessStep({
  number,
  title,
  isActive,
  isCompleted,
  children,
}: ProcessStepProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isActive
              ? 'bg-primary text-primary-foreground'
              : isCompleted
              ? 'bg-green-500 text-white'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {number}
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children && <div className="space-y-2">{children}</div>}
    </section>
  )
}

