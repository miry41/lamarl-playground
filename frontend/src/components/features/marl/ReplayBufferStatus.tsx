import { Card, CardContent } from '@/components/ui'
import { Database } from 'lucide-react'

interface ReplayBufferStatusProps {
  currentSize?: number
  maxSize?: number
  llmSamples?: number
  realSamples?: number
}

export default function ReplayBufferStatus({
  currentSize = 8500,
  maxSize = 10000,
  llmSamples = 1200,
  realSamples = 7300,
}: ReplayBufferStatusProps) {
  const fillPercentage = (currentSize / maxSize) * 100
  const llmPercentage = (llmSamples / currentSize) * 100
  const realPercentage = (realSamples / currentSize) * 100

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database size={16} className="text-primary" />
          <h3 className="text-sm font-semibold">Replay Buffer</h3>
        </div>

        {/* Buffer Fill Status */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Buffer Size</span>
            <span className="text-sm font-mono font-bold">
              {currentSize.toLocaleString()} / {maxSize.toLocaleString()}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Sample Composition */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-xs text-muted-foreground">Real Samples</span>
            </div>
            <span className="text-xs font-mono font-semibold">
              {realSamples.toLocaleString()} ({realPercentage.toFixed(1)}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-xs text-muted-foreground">LLM Prior Samples</span>
            </div>
            <span className="text-xs font-mono font-semibold">
              {llmSamples.toLocaleString()} ({llmPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Composition Bar */}
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden flex">
          <div
            className="h-full bg-blue-500"
            style={{ width: `${realPercentage}%` }}
          />
          <div
            className="h-full bg-green-500"
            style={{ width: `${llmPercentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

