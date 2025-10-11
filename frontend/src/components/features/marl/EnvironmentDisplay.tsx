import { Card, CardContent, Button } from '@/components/ui'
import { Settings } from 'lucide-react'

interface EnvironmentDisplayProps {
  shape?: string
  nRobots?: number
  rSense?: number
  rAvoid?: number
  nHn?: number
  nHc?: number
  onEdit?: () => void
}

export default function EnvironmentDisplay({
  shape = 'circle',
  nRobots = 30,
  rSense = 0.4,
  rAvoid = 0.1,
  nHn = 6,
  nHc = 80,
  onEdit,
}: EnvironmentDisplayProps) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-foreground">🌍 Environment</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onEdit}
            className="h-6 px-2 text-xs"
          >
            <Settings size={12} className="mr-1" />
            Edit in LLM
          </Button>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div><span className="font-medium">Shape:</span> {shape}</div>
            <div><span className="font-medium">Robots:</span> {nRobots}</div>
            <div><span className="font-medium">Sensing:</span> {rSense}m</div>
            <div><span className="font-medium">Avoidance:</span> {rAvoid}m</div>
            <div><span className="font-medium">Max Neighbors:</span> {nHn}</div>
            <div><span className="font-medium">Max Cells:</span> {nHc}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

