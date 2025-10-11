import { Label, Checkbox, Select } from '@/components/ui'

const models = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3', label: 'Claude 3' },
]

export default function LLMSettings() {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">⚙️ LLM Configuration</Label>
      <div className="flex items-center gap-4 flex-wrap">
        <Checkbox label="Chain-of-Thought" defaultChecked={true} />
        <Checkbox label="Basic APIs" defaultChecked={true} />
      </div>
      <div className="w-48">
        <Label className="text-xs mb-1">Model</Label>
        <Select options={models} defaultValue="gpt-4" className="text-xs" />
      </div>
    </div>
  )
}

