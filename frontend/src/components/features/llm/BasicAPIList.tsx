import { Card, CardHeader, CardContent } from '@/components/ui'
import { useEffect, useState } from 'react'
import { getOperations, type OperationsResponse } from '@/api/client'

export default function BasicAPIList() {
  const [data, setData] = useState<OperationsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOperations()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading API specifications...</div>
  }

  if (!data) {
    return <div className="text-sm text-destructive">Failed to load API specifications</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4">
          <h3 className="text-sm font-semibold">📦 Available Prior Policy Operations</h3>
          <p className="text-xs text-muted-foreground mt-1">
            LLM can combine these operations with weights to create cooperative behaviors
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            {data.operations.map((op) => (
              <div key={op.name} className="border border-border rounded p-3 bg-muted/30">
                <div className="font-mono text-xs font-semibold text-primary mb-1">
                  {op.name}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {op.description}
                </div>
                <div className="text-xs">
                  <span className="font-semibold">Params:</span>{' '}
                  {op.parameters.join(', ')}
                  {op.optional_parameters.length > 0 && (
                    <>
                      {' '}<span className="text-muted-foreground">
                        (optional: {op.optional_parameters.join(', ')})
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <h3 className="text-sm font-semibold">📊 Available Reward Metrics</h3>
          <p className="text-xs text-muted-foreground mt-1">
            LLM can use these metrics in reward formula (supports +, -, *, /, abs, min, max)
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            {data.metrics.map((metric) => (
              <div key={metric.name} className="border border-border rounded p-3 bg-muted/30">
                <div className="font-mono text-xs font-semibold text-primary mb-1">
                  {metric.name}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {metric.description}
                </div>
                <div className="text-xs">
                  <span className="font-semibold">Range:</span>{' '}
                  [{metric.range[0]}, {metric.range[1] === Infinity ? '∞' : metric.range[1]}]
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

