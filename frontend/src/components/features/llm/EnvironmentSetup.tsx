import { Collapsible, CollapsibleTrigger, CollapsibleContent, Select, Input, Label } from '@/components/ui'
import { useLLMStore } from '@/store/useLLMStore'

const shapes = [
  { value: 'circle', label: 'Circle' },
  { value: 'square', label: 'Square' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'L', label: 'L' },
  { value: 'A', label: 'A' },
  { value: 'M', label: 'M' },
  { value: 'R', label: 'R' },
]

interface EnvironmentSetupProps {
  defaultOpen?: boolean
}

export default function EnvironmentSetup({ defaultOpen = true }: EnvironmentSetupProps) {
  const { request, setRequest } = useLLMStore()
  
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger>🌍 Environment Setup</CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1">Shape</Label>
              <Select
                value={request.shape}
                onChange={(e) => setRequest({ shape: e.target.value })}
              >
                {shapes.map((shape) => (
                  <option key={shape.value} value={shape.value}>
                    {shape.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1">Robots</Label>
              <Input
                type="number"
                value={request.n_robot}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  if (!isNaN(val)) setRequest({ n_robot: val })
                }}
                min={1}
                max={100}
              />
            </div>
            <div>
              <Label className="text-xs mb-1">Sensing (m)</Label>
              <Input
                type="number"
                value={request.r_sense}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val)) setRequest({ r_sense: val })
                }}
                step={0.1}
                min={0.1}
                max={1.0}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1">Avoidance (m)</Label>
              <Input
                type="number"
                value={request.r_avoid}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val)) setRequest({ r_avoid: val })
                }}
                step={0.05}
                min={0.01}
                max={0.5}
              />
            </div>
            <div>
              <Label className="text-xs mb-1">Max Neighbors</Label>
              <Input
                type="number"
                value={request.n_hn}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  if (!isNaN(val)) setRequest({ n_hn: val })
                }}
                min={1}
                max={20}
              />
            </div>
            <div>
              <Label className="text-xs mb-1">Max Cells</Label>
              <Input
                type="number"
                value={request.n_hc}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  if (!isNaN(val)) setRequest({ n_hc: val })
                }}
                min={10}
                max={200}
              />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

