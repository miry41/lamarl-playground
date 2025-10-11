import { Card, CardContent, Slider, Label } from '@/components/ui'

interface ActionBlendingProps {
  beta: number
  onBetaChange: (value: number) => void
  actorOutput?: number[]
  priorOutput?: number[]
}

export default function ActionBlending({
  beta,
  onBetaChange,
  actorOutput = [0.5, 0.3, -0.2],
  priorOutput = [0.6, 0.2, -0.1],
}: ActionBlendingProps) {
  // Calculate blended action: a = (1-β)·πθ(s) + β·πprior(s)
  const blendedAction = actorOutput.map(
    (actor, idx) => (1 - beta) * actor + beta * priorOutput[idx]
  )

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">🎯 Action Blending</h3>

        {/* Beta Slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs">β (Blending Coefficient)</Label>
            <span className="text-sm font-mono font-bold">{beta.toFixed(2)}</span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[beta]}
            onValueChange={(values) => onBetaChange(values[0])}
            className="mb-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Actor Only</span>
            <span>Prior Only</span>
          </div>
        </div>

        {/* Formula Display */}
        <div className="bg-muted/30 p-3 rounded text-xs font-mono mb-3">
          <div className="text-muted-foreground mb-1">Formula:</div>
          <div className="font-semibold">
            a = (1 - β)·π<sub>θ</sub>(s) + β·π<sub>prior</sub>(s)
          </div>
          <div className="mt-2 text-muted-foreground">
            a = ({(1 - beta).toFixed(2)})·Actor + ({beta.toFixed(2)})·Prior
          </div>
        </div>

        {/* Action Comparison */}
        <div className="space-y-2">
          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Actor:
            </span>
            <div className="flex gap-1">
              {actorOutput.map((val, idx) => (
                <div
                  key={idx}
                  className="flex-1 text-center text-xs font-mono bg-blue-50 border border-blue-200 rounded py-1"
                >
                  {val.toFixed(2)}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Prior:
            </span>
            <div className="flex gap-1">
              {priorOutput.map((val, idx) => (
                <div
                  key={idx}
                  className="flex-1 text-center text-xs font-mono bg-green-50 border border-green-200 rounded py-1"
                >
                  {val.toFixed(2)}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[80px_1fr] items-center gap-2 pt-1 border-t">
            <span className="text-xs font-semibold text-foreground">
              Blended:
            </span>
            <div className="flex gap-1">
              {blendedAction.map((val, idx) => (
                <div
                  key={idx}
                  className="flex-1 text-center text-xs font-mono bg-purple-50 border-2 border-purple-400 rounded py-1 font-bold"
                >
                  {val.toFixed(2)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

