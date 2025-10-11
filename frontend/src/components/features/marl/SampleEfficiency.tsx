import { Card, CardContent } from '@/components/ui'

export default function SampleEfficiency() {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-4 text-foreground">Sample Efficiency</h3>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Convergence Speed</span>
            <span className="text-lg font-mono font-bold text-green-600">+185.9%</span>
          </div>
          <div className="text-xs text-muted-foreground">
            vs. baseline without LLM prior policy
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

