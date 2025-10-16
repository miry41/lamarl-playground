import { Card, CardHeader, CardContent } from '@/components/ui'

interface CoTViewerProps {
  reasoning: string
}

export default function CoTViewer({ reasoning }: CoTViewerProps) {
  // CoT推論を段階的に分解して表示
  const steps = reasoning.split(/Step \d+:/g).filter(s => s.trim())
  
  return (
    <Card>
      <CardHeader className="p-4 bg-purple-50 dark:bg-purple-950/20 border-b">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="text-purple-600">🧠</span>
          Chain-of-Thought Reasoning
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          LLMの思考プロセス（制約分析→基本スキル→サブゴール→設計）
        </p>
      </CardHeader>
      <CardContent className="p-4">
        {steps.length > 1 ? (
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="border-l-2 border-purple-300 dark:border-purple-700 pl-4">
                <div className="text-xs font-semibold text-purple-600 mb-2">
                  Step {i + 1}
                </div>
                <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {step.trim()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground whitespace-pre-wrap">
            {reasoning}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

