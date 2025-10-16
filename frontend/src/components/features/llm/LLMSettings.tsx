import { Label, Checkbox } from '@/components/ui'
import { useLLMStore } from '@/store/useLLMStore'

export default function LLMSettings() {
  const { request, setRequest } = useLLMStore()
  
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-sm font-semibold">⚙️ Generation Options</Label>
        <div className="flex items-center gap-4 flex-wrap">
          <Checkbox 
            label="Chain-of-Thought" 
            defaultChecked={request.use_cot}
            onCheckedChange={(checked) => setRequest({ use_cot: checked })}
          />
          <Checkbox 
            label="Basic APIs" 
            defaultChecked={request.use_basic_apis}
            onCheckedChange={(checked) => setRequest({ use_basic_apis: checked })}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1">Model</Label>
          <div className="w-full px-2 py-1 text-xs border border-border rounded bg-muted text-muted-foreground flex items-center">
            Gemini-2.5-flash
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1">Temperature</Label>
          <input
            type="number"
            value={request.temperature}
            onChange={(e) => setRequest({ temperature: parseFloat(e.target.value) })}
            min={0}
            max={2}
            step={0.1}
            className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
          />
        </div>
      </div>
    </div>
  )
}

