import { Card, CardContent, CardTitle } from '@/components/ui'

interface Method {
  name: string
  value: number
  color: string
}

interface MethodComparisonProps {
  methods: Method[]
  title?: string
}

export default function MethodComparison({
  methods,
  title = 'Method Comparison',
}: MethodComparisonProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <CardTitle className="mb-4">{title}</CardTitle>
        <div className="space-y-3">
          {methods.map((method) => (
            <div key={method.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{method.name}</span>
                <span className="font-mono font-semibold">{method.value}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${method.color} transition-all duration-300`}
                  style={{ width: `${method.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

