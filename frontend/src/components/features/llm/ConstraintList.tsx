interface Constraint {
  label: string
  color: string
}

const constraints: Constraint[] = [
  { label: 'Enter region', color: 'bg-blue-500' },
  { label: 'Avoid collision', color: 'bg-orange-500' },
  { label: 'Synchronize neighbors', color: 'bg-green-500' },
  { label: 'Explore cells', color: 'bg-purple-500' },
]

export default function ConstraintList() {
  return (
    <div className="space-y-2 text-xs">
      {constraints.map((constraint) => (
        <div key={constraint.label} className="flex items-center gap-2">
          <div className={`w-2 h-2 ${constraint.color} rounded-full`} />
          <span>{constraint.label}</span>
        </div>
      ))}
    </div>
  )
}

