import { Card, CardHeader, CardContent } from '@/components/ui'
import type { PriorDSL, RewardDSL } from '@/api/client'

interface DSLViewerProps {
  prior: PriorDSL
  reward: RewardDSL
}

export default function DSLViewer({ prior, reward }: DSLViewerProps) {
  return (
    <div className="space-y-4">
      {/* Prior Policy DSL */}
      <Card>
        <CardHeader className="p-4 bg-blue-50 dark:bg-blue-950/20 border-b">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="text-blue-600">🎯</span>
            Prior Policy (事前ポリシー)
          </h3>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-muted-foreground">Type:</span>
              <span className="ml-2 text-xs font-mono">{prior.type}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">Combination:</span>
              <span className="ml-2 text-xs font-mono">{prior.combination}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">Operations:</span>
              <div className="mt-2 space-y-2">
                {prior.terms.map((term, i) => (
                  <div key={i} className="pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                    <div className="text-xs font-mono text-primary font-semibold">
                      {term.op}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      weight: <span className="font-mono">{term.weight.toFixed(2)}</span>
                      {term.radius && (
                        <span className="ml-3">
                          radius: <span className="font-mono">{term.radius.toFixed(2)}</span>
                        </span>
                      )}
                      {term.cell_size && (
                        <span className="ml-3">
                          cell_size: <span className="font-mono">{term.cell_size.toFixed(2)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">Constraints:</span>
              <div className="mt-1 text-xs font-mono">
                max_speed: {prior.clamp.max_speed.toFixed(2)} m/s
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reward Function DSL */}
      <Card>
        <CardHeader className="p-4 bg-green-50 dark:bg-green-950/20 border-b">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="text-green-600">🎁</span>
            Reward Function (報酬関数)
          </h3>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-muted-foreground">Type:</span>
              <span className="ml-2 text-xs font-mono">{reward.type}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">Formula:</span>
              <div className="mt-2 p-3 bg-muted/50 rounded font-mono text-xs break-all">
                {reward.formula}
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">Constraints:</span>
              <div className="mt-1 text-xs font-mono">
                range: [{reward.clamp.min.toFixed(1)}, {reward.clamp.max.toFixed(1)}]
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* JSON View */}
      <Card>
        <CardHeader className="p-4">
          <h3 className="text-xs font-semibold text-muted-foreground">JSON-DSL (Raw)</h3>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <pre className="text-xs font-mono overflow-x-auto p-3 bg-muted/50 rounded">
            {JSON.stringify({ prior, reward }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

