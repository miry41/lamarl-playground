import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui'

interface LossComponent {
  label: string
  data: number[]
  color: string
}

interface LossChartProps {
  title: string
  components: LossComponent[]
}

export default function LossChart({ title, components }: LossChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

    // Find max value for scaling
    const allValues = components.flatMap((c) => c.data)
    const maxValue = Math.max(...allValues, 1)
    const minValue = Math.min(...allValues, 0)

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
      const value = maxValue - (maxValue - minValue) * (i / 5)
      ctx.fillStyle = '#6b7280'
      ctx.font = '10px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(value.toFixed(2), padding - 5, y + 3)
    }

    // Draw each component line
    components.forEach((component) => {
      if (component.data.length === 0) return

      ctx.strokeStyle = component.color
      ctx.lineWidth = 2
      ctx.beginPath()

      component.data.forEach((value, index) => {
        const x =
          padding +
          ((width - 2 * padding) * index) / (component.data.length - 1)
        const y =
          padding +
          (height - 2 * padding) *
            (1 - (value - minValue) / (maxValue - minValue))

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
    })

    // X-axis label
    ctx.fillStyle = '#6b7280'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Training Steps', width / 2, height - 10)
  }, [components])

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">{title}</h3>
        <canvas
          ref={canvasRef}
          width={400}
          height={180}
          className="w-full mb-3"
        />
        <div className="flex flex-wrap gap-3">
          {components.map((component) => (
            <div key={component.label} className="flex items-center gap-2">
              <div
                className="w-3 h-0.5"
                style={{ backgroundColor: component.color }}
              ></div>
              <span className="text-xs text-muted-foreground">
                {component.label}:{' '}
                <span className="font-mono font-semibold">
                  {component.data[component.data.length - 1]?.toFixed(3) || '0.000'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

