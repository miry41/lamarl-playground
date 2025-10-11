import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui'
import { FormField } from '@/components/common'

const shapes = [
  { value: 'square', label: 'Square' },
  { value: 'circle', label: 'Circle' },
  { value: 'L', label: 'L' },
  { value: 'A', label: 'A' },
  { value: 'M', label: 'M' },
  { value: 'R', label: 'R' },
  { value: 'T', label: 'T' },
]

interface EnvironmentSetupProps {
  defaultOpen?: boolean
}

export default function EnvironmentSetup({ defaultOpen = true }: EnvironmentSetupProps) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger>🌍 Environment Setup</CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <FormField
              label="Shape"
              type="select"
              options={shapes}
              defaultValue="circle"
            />
            <FormField
              label="Robots"
              type="number"
              defaultValue={30}
              min={5}
              max={100}
            />
            <FormField
              label="Sensing (m)"
              type="number"
              defaultValue={0.4}
              step={0.1}
              min={0.1}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField
              label="Avoidance (m)"
              type="number"
              defaultValue={0.1}
              step={0.05}
              min={0.01}
            />
            <FormField
              label="Max Neighbors"
              type="number"
              defaultValue={6}
              min={1}
              max={20}
            />
            <FormField
              label="Max Cells"
              type="number"
              defaultValue={80}
              min={10}
              max={200}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

