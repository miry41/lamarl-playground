import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui'

interface Robot {
  x: number
  y: number
  id: number
}

interface RobotVisualizationProps {
  shape?: string
  robots?: Robot[]
  rSense?: number
  rAvoid?: number
  width?: number
  height?: number
}

export default function RobotVisualization({
  shape = 'circle',
  robots = [],
  rSense = 0.4,
  rAvoid = 0.1,
  width = 600,
  height = 400,
}: RobotVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate target shape cells
  const generateShapeCells = (shape: string, gridSize: number = 10) => {
    const cells: Array<{ x: number; y: number }> = []
    const centerX = gridSize / 2
    const centerY = gridSize / 2

    switch (shape.toLowerCase()) {
      case 'circle':
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const dx = i - centerX
            const dy = j - centerY
            if (dx * dx + dy * dy <= (gridSize / 3) ** 2) {
              cells.push({ x: i, y: j })
            }
          }
        }
        break
      case 'l':
        for (let i = 0; i < gridSize; i++) {
          if (i < gridSize * 0.7) cells.push({ x: 2, y: i })
          if (i < gridSize * 0.4) cells.push({ x: 2 + i, y: Math.floor(gridSize * 0.7) })
        }
        break
      case 'a':
      case 't':
      case 'm':
      case 'r':
        // Simplified shapes for other letters
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            if (Math.random() > 0.6) cells.push({ x: i, y: j })
          }
        }
        break
      default:
        // Default to circle
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const dx = i - centerX
            const dy = j - centerY
            if (dx * dx + dy * dy <= (gridSize / 3) ** 2) {
              cells.push({ x: i, y: j })
            }
          }
        }
    }

    return cells
  }

  // Generate sample robots if none provided
  const sampleRobots: Robot[] =
    robots.length > 0
      ? robots
      : Array.from({ length: 30 }, (_, i) => ({
          id: i,
          x: Math.random() * 10,
          y: Math.random() * 10,
        }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    const gridSize = 10
    const cellSize = Math.min(width, height) / gridSize
    const offsetX = (width - gridSize * cellSize) / 2
    const offsetY = (height - gridSize * cellSize) / 2

    // Draw target shape cells (gray)
    const targetCells = generateShapeCells(shape, gridSize)
    ctx.fillStyle = '#d1d5db'
    targetCells.forEach((cell) => {
      ctx.fillRect(
        offsetX + cell.x * cellSize,
        offsetY + cell.y * cellSize,
        cellSize,
        cellSize
      )
    })

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath()
      ctx.moveTo(offsetX + i * cellSize, offsetY)
      ctx.lineTo(offsetX + i * cellSize, offsetY + gridSize * cellSize)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(offsetX, offsetY + i * cellSize)
      ctx.lineTo(offsetX + gridSize * cellSize, offsetY + i * cellSize)
      ctx.stroke()
    }

    // Check collisions
    const collisions: Array<[Robot, Robot]> = []
    for (let i = 0; i < sampleRobots.length; i++) {
      for (let j = i + 1; j < sampleRobots.length; j++) {
        const dx = sampleRobots[i].x - sampleRobots[j].x
        const dy = sampleRobots[i].y - sampleRobots[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < rAvoid * gridSize) {
          collisions.push([sampleRobots[i], sampleRobots[j]])
        }
      }
    }

    // Draw collision lines (red)
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    collisions.forEach(([robot1, robot2]) => {
      ctx.beginPath()
      ctx.moveTo(
        offsetX + robot1.x * cellSize,
        offsetY + robot1.y * cellSize
      )
      ctx.lineTo(
        offsetX + robot2.x * cellSize,
        offsetY + robot2.y * cellSize
      )
      ctx.stroke()
    })

    // Draw robots
    sampleRobots.forEach((robot) => {
      const x = offsetX + robot.x * cellSize
      const y = offsetY + robot.y * cellSize

      // Draw sensing radius (light circle)
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y, rSense * cellSize * gridSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Draw robot (blue dot)
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [shape, robots, rSense, rAvoid, width, height, sampleRobots])

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">🤖 Robot Formation</h3>
          <div className="text-xs text-muted-foreground">
            Shape: <span className="font-mono font-semibold">{shape.toUpperCase()}</span>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full border border-border rounded"
        />
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Robots ({sampleRobots.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>Target Shape</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span>Collisions</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

