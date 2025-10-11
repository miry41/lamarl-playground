interface LAMARLFeaturesProps {
  usePriorPolicy: boolean
  useLLMReward: boolean
  onPriorPolicyChange: (value: boolean) => void
  onLLMRewardChange: (value: boolean) => void
}

export default function LAMARLFeatures({
  usePriorPolicy,
  useLLMReward,
  onPriorPolicyChange,
  onLLMRewardChange,
}: LAMARLFeaturesProps) {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-3 text-foreground">LAMARL Features</h3>
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={usePriorPolicy}
            onChange={(e) => onPriorPolicyChange(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Use Prior Policy</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useLLMReward}
            onChange={(e) => onLLMRewardChange(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Use LLM Reward</span>
        </label>
      </div>

      {usePriorPolicy && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-xs">
          <div className="font-semibold text-green-800 mb-1">Actor Loss Modified:</div>
          <code className="text-green-700">maximize Q - α ‖a - a_prior‖²</code>
        </div>
      )}
    </section>
  )
}

