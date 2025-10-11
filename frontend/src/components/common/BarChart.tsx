import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

interface BarChartProps {
  title: string
  data: number[]
  color?: string
  icon?: React.ReactNode
}

export default function BarChart({
  title,
  data,
  color = 'bg-primary/30',
  icon,
}: BarChartProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48 flex items-end justify-between gap-1">
          {data.map((value, i) => (
            <div
              key={i}
              className={`flex-1 ${color} rounded-t transition-all duration-300`}
              style={{ height: `${value}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

