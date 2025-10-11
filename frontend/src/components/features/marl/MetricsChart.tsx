import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui'

interface MetricsChartProps {
  title: string
  data: number[]
  color?: string
  targetValue?: number
  targetLabel?: string
  yMin?: number
  yMax?: number
  unit?: string
  goodDirection?: 'up' | 'down'
}

export default function MetricsChart({
  title,
  data,
  color = '#3b82f6',
  targetValue,
  targetLabel,
  yMin = 0,
  yMax = 1,
  unit = '',
  goodDirection = 'up',
}: MetricsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const latestValue = data[data.length - 1] || 0
  const isGood =
    targetValue !== undefined
      ? goodDirection === 'up'
        ? latestValue >= targetValue
        : latestValue <= targetValue
      : false

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 40

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height - 2 * padding) * (i / 5)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()

      // Y-axis labels
      const value = yMax - (yMax - yMin) * (i / 5)
      ctx.fillStyle = '#6b7280'
      ctx.font = '10px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(value.toFixed(2), padding - 5, y + 3)
    }

    // Draw target line if provided
    if (targetValue !== undefined) {
      const targetY =
        padding +
        (height - 2 * padding) * (1 - (targetValue - yMin) / (yMax - yMin))
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(padding, targetY)
      ctx.lineTo(width - padding, targetY)
      ctx.stroke()
      ctx.setLineDash([])

      // Target label
      ctx.fillStyle = '#10b981'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(
        targetLabel || `Target: ${targetValue}`,
        width - padding + 5,
        targetY + 3
      )
    }

    // Draw line chart
    if (data.length > 0) {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()

      data.forEach((value, index) => {
        const x = padding + ((width - 2 * padding) * index) / (data.length - 1)
        const y =
          padding +
          (height - 2 * padding) * (1 - (value - yMin) / (yMax - yMin))

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw points
      ctx.fillStyle = color
      data.forEach((value, index) => {
        const x = padding + ((width - 2 * padding) * index) / (data.length - 1)
        const y =
          padding +
          (height - 2 * padding) * (1 - (value - yMin) / (yMax - yMin))

        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // X-axis label
    ctx.fillStyle = '#6b7280'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Episodes', width / 2, height - 10)
  }, [data, color, targetValue, targetLabel, yMin, yMax])

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono font-bold">
              {latestValue.toFixed(3)}
              {unit}
            </span>
            {targetValue !== undefined && isGood && (
              <span className="text-xs text-green-600 font-semibold">✓</span>
            )}
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="w-full"
        />
      </CardContent>
    </Card>
  )
}

