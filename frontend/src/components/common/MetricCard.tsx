import { Card, CardContent } from '@/components/ui'

interface MetricCardProps {
  label: string
  value: string | number
  progressValue?: number
  progressColor?: string
}

export default function MetricCard({
  label,
  value,
  progressValue,
  progressColor = 'bg-primary',
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground mb-2">{label}</div>
        <div className="text-2xl font-mono font-bold mb-2">{value}</div>
        {progressValue !== undefined && (
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor} transition-all duration-300`}
              style={{ width: `${progressValue}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

