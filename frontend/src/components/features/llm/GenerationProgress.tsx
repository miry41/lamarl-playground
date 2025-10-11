interface GenerationItem {
  label: string
  color: string
}

const items: GenerationItem[] = [
  { label: 'Basic skills: move, avoid, sync', color: 'bg-blue-500' },
  { label: 'Sub-goals: 1, 2, 4', color: 'bg-orange-500' },
  { label: 'Policy: 3 forces combined', color: 'bg-green-500' },
]

export default function GenerationProgress() {
  return (
    <div className="space-y-2 text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={`w-2 h-2 ${item.color} rounded-full`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

