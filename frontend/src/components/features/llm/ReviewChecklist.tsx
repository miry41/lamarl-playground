import { CheckCircle } from 'lucide-react'

interface CheckItem {
  label: string
}

const checks: CheckItem[] = [
  { label: 'Logical completeness ✓' },
  { label: 'Syntax validation ✓' },
  { label: 'Ready for MARL ✓' },
]

export default function ReviewChecklist() {
  return (
    <div className="space-y-2">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-2 text-xs text-green-600">
          <CheckCircle size={12} />
          <span>{check.label}</span>
        </div>
      ))}
    </div>
  )
}

