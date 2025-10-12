import { useEffect, useRef, memo } from 'react'
import { Card, CardContent } from '@/components/ui'
import { generateShapeCells } from '@/utils/shapeGenerator'

interface EpisodeSnapshot {
  episode: number
  finalPositions: [number, number][]
  finalVelocities: [number, number][]
  M1: number
  M2: number
  steps: number
  globalStep: number
  converged: boolean
  timestamp: number
}

interface EpisodeComparisonProps {
  episodes: EpisodeSnapshot[]
  shape?: string
  gridSize?: number
  maxDisplay?: number  // 最大表示数
}

export default function EpisodeComparison({
  episodes,
  shape = 'circle',
  gridSize = 64,
  maxDisplay = 4,
}: EpisodeComparisonProps) {
  // 表示するエピソードを選択（最初と最新、中間を均等に）
  const selectedEpisodes = (() => {
    if (episodes.length === 0) return []
    if (episodes.length <= maxDisplay) return episodes

    const result: EpisodeSnapshot[] = []
    const uniqueIndices = new Set<number>()
    
    // 最初のエピソードを追加
    uniqueIndices.add(0)
    
    // 中間のエピソードを均等に配置
    for (let i = 1; i < maxDisplay - 1; i++) {
      const idx = Math.floor((episodes.length - 1) * (i / (maxDisplay - 1)))
      uniqueIndices.add(idx)
    }
    
    // 最新のエピソードを追加
    uniqueIndices.add(episodes.length - 1)
    
    // インデックス順にソートして結果を構築
    Array.from(uniqueIndices)
      .sort((a, b) => a - b)
      .forEach(idx => {
        result.push(episodes[idx])
      })
    
    return result
  })()

  if (selectedEpisodes.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">📊 Episode Comparison</h3>
          <div className="text-sm text-muted-foreground text-center py-8">
            No completed episodes yet. Start training to see progress.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">📊 Episode Comparison</h3>
        <div className="text-xs text-muted-foreground mb-4">
          Showing {selectedEpisodes.length} of {episodes.length} completed episodes
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {selectedEpisodes.map((ep) => (
            <EpisodeSnapshot
              key={ep.episode}
              episode={ep}
              shape={shape}
              gridSize={gridSize}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 個別のエピソードスナップショット表示（メモ化でパフォーマンス向上）
const EpisodeSnapshot = memo(function EpisodeSnapshot({
  episode,
  shape,
  gridSize,
}: {
  episode: EpisodeSnapshot
  shape: string
  gridSize: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 250
    const height = 250
    const cellSize = Math.min(width, height) / gridSize
    const offsetX = (width - gridSize * cellSize) / 2
    const offsetY = (height - gridSize * cellSize) / 2

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Draw target shape cells
    const targetCells = generateShapeCells(shape, gridSize)
    ctx.fillStyle = '#e5e7eb'
    targetCells.forEach((cell) => {
      ctx.fillRect(
        offsetX + cell.x * cellSize,
        offsetY + cell.y * cellSize,
        cellSize,
        cellSize
      )
    })

    // Draw robots
    const robotColor = episode.converged ? '#10b981' : '#3b82f6'
    episode.finalPositions.forEach((pos) => {
      const x = offsetX + pos[0] * cellSize
      const y = offsetY + pos[1] * cellSize

      ctx.fillStyle = robotColor
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [episode, shape, gridSize])

  return (
    <div className="border border-border rounded p-2">
      <div className="text-xs font-semibold mb-1 flex items-center justify-between">
        <span>Episode {episode.episode}</span>
        {episode.converged && (
          <span className="text-green-600 text-[10px]">✓ Converged</span>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={250}
        height={250}
        className="w-full border border-border rounded mb-2"
      />
      <div className="text-[10px] text-muted-foreground space-y-0.5">
        <div className="flex justify-between">
          <span>Coverage (M₁):</span>
          <span className="font-mono">{episode.M1.toFixed(3)}</span>
        </div>
        <div className="flex justify-between">
          <span>Uniformity (M₂):</span>
          <span className="font-mono">{episode.M2.toFixed(3)}</span>
        </div>
        <div className="flex justify-between">
          <span>Steps:</span>
          <span className="font-mono">{episode.steps}</span>
        </div>
      </div>
    </div>
  )
})

