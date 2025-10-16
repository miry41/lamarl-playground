interface LAMARLFeaturesProps {
  useLLM: boolean
  setUseLLM: (value: boolean) => void
  taskDescription: string
  setTaskDescription: (value: string) => void
  llmModel: string
  setLLMModel: (value: string) => void
}

export default function LAMARLFeatures({
  useLLM,
  setUseLLM,
  taskDescription,
  setTaskDescription,
  llmModel,
  setLLMModel,
}: LAMARLFeaturesProps) {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-3 text-foreground">LAMARL Features</h3>
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useLLM}
            onChange={(e) => setUseLLM(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Use LLM-Generated Functions</span>
        </label>

        {useLLM && (
          <div className="space-y-3 pl-6 border-l-2 border-blue-200">
            <div>
              <label className="block text-xs font-medium mb-1">Task Description</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="例: 30台のロボットで円形を形成する"
                className="w-full px-2 py-1 text-xs border rounded resize-none"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1">LLM Model</label>
              <select
                value={llmModel}
                onChange={(e) => setLLMModel(e.target.value)}
                className="w-full px-2 py-1 text-xs border rounded"
              >
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="mock">Mock (for testing)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {useLLM && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-semibold text-blue-800 mb-1">🤖 LLM Integration Active:</div>
          <ul className="text-blue-700 space-y-1 text-[10px]">
            <li>• Prior Policy: a = (1-β)πθ + β·πprior</li>
            <li>• Actor Loss: -Q + α‖πθ - πprior‖²</li>
            <li>• Reward: LLM-generated formula</li>
          </ul>
        </div>
      )}
    </section>
  )
}

