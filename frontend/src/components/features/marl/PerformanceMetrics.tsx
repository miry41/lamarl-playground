import { BarChart3 } from 'lucide-react'
import { Card, CardContent, Badge } from '@/components/ui'

interface PerformanceMetricsProps {
  coverage?: number
  uniformity?: number
  coverageTarget?: number
  uniformityTarget?: number
}

export default function PerformanceMetrics({
  coverage = 0.873,
  uniformity = 0.12,
  coverageTarget = 0.8,
  uniformityTarget = 0.2,
}: PerformanceMetricsProps) {
  const coveragePercent = coverage * 100
  const coverageReached = coverage >= coverageTarget
  const uniformityReached = uniformity <= uniformityTarget
  const allConverged = coverageReached && uniformityReached

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Performance Metrics</h3>
        </div>
        {allConverged && (
          <Badge variant="success" className="text-xs">
            ✓ Target Reached
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Coverage Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">Coverage Rate (M₁)</div>
              {coverageReached && (
                <span className="text-green-600 text-xs font-semibold">✓</span>
              )}
            </div>
            <div className="text-2xl font-mono font-bold mb-1">
              {coveragePercent.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Target: ≥ {(coverageTarget * 100).toFixed(0)}%
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  coverageReached ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Uniformity */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">Uniformity (M₂)</div>
              {uniformityReached && (
                <span className="text-green-600 text-xs font-semibold">✓</span>
              )}
            </div>
            <div className="text-2xl font-mono font-bold mb-1">
              {uniformity.toFixed(3)}
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Target: ≤ {uniformityTarget.toFixed(1)}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  uniformityReached ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${(1 - uniformity) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

