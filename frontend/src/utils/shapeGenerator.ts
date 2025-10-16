/**
 * Shape Generation Utility
 * バックエンドの形状生成ロジックに近似した実装
 */

export interface ShapeCell {
  x: number
  y: number
}

/**
 * 指定された形状のセルを生成
 * @param shape - 形状名 ('circle', 'l', 'a', 't', 'm', 'r', etc.)
 * @param gridSize - グリッドサイズ（デフォルト64）
 * @returns 形状を構成するセルの配列
 */
export function generateShapeCells(shape: string, gridSize: number = 64): ShapeCell[] {
  const cells: ShapeCell[] = []
  const centerX = gridSize / 2
  const centerY = gridSize / 2

  switch (shape.toLowerCase()) {
    case 'circle': {
      // 円形状（論文のデフォルト）
      const radius = gridSize / 4
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const dx = i - centerX
          const dy = j - centerY
          if (dx * dx + dy * dy <= radius * radius) {
            cells.push({ x: i, y: j })
          }
        }
      }
      break
    }

    case 'square': {
      // 正方形
      const halfSize = Math.floor(gridSize * 0.275) // r * 1.1 相当
      const startX = Math.floor(centerX - halfSize)
      const endX = Math.floor(centerX + halfSize)
      const startY = Math.floor(centerY - halfSize)
      const endY = Math.floor(centerY + halfSize)
      for (let i = startX; i < endX; i++) {
        for (let j = startY; j < endY; j++) {
          if (i >= 0 && i < gridSize && j >= 0 && j < gridSize) {
            cells.push({ x: i, y: j })
          }
        }
      }
      break
    }

    case 'triangle': {
      // 正三角形
      const r = gridSize / 4
      const h = Math.floor(r * 1.2) // 高さ
      const w = Math.floor(r * 1.0) // 底辺の半分
      const centerYStart = Math.floor(centerY - r)
      
      for (let i = 0; i < h; i++) {
        const lineWidth = Math.floor(w * (h - i) / h)
        if (lineWidth > 0) {
          const startX = Math.floor(centerX - lineWidth)
          const endX = Math.floor(centerX + lineWidth)
          const y = centerYStart + i
          if (y >= 0 && y < gridSize) {
            for (let x = startX; x <= endX; x++) {
              if (x >= 0 && x < gridSize) {
                cells.push({ x, y })
              }
            }
          }
        }
      }
      break
    }

    case 'l': {
      // L字形状
      for (let i = 0; i < gridSize; i++) {
        if (i < gridSize * 0.7) {
          cells.push({ x: 2, y: i })
        }
        if (i < gridSize * 0.4) {
          cells.push({ x: 2 + i, y: Math.floor(gridSize * 0.7) })
        }
      }
      break
    }

    case 'a': {
      // A字形状（簡略版）
      const midX = Math.floor(centerX)
      const height = Math.floor(gridSize * 0.7)
      for (let y = Math.floor(gridSize * 0.15); y < height; y++) {
        // 左の線
        cells.push({ x: midX - Math.floor((y - gridSize * 0.15) / 2), y })
        // 右の線
        cells.push({ x: midX + Math.floor((y - gridSize * 0.15) / 2), y })
        // 横棒
        if (y === Math.floor(height / 2)) {
          for (let x = midX - Math.floor((y - gridSize * 0.15) / 2); 
               x <= midX + Math.floor((y - gridSize * 0.15) / 2); 
               x++) {
            cells.push({ x, y })
          }
        }
      }
      break
    }

    case 't': {
      // T字形状
      const midX = Math.floor(centerX)
      const topY = Math.floor(gridSize * 0.15)
      // 横棒
      for (let x = Math.floor(gridSize * 0.2); x < Math.floor(gridSize * 0.8); x++) {
        cells.push({ x, y: topY })
      }
      // 縦棒
      for (let y = topY; y < Math.floor(gridSize * 0.8); y++) {
        cells.push({ x: midX, y })
      }
      break
    }

    case 'm': {
      // M字形状（簡略版）
      const height = Math.floor(gridSize * 0.7)
      const startY = Math.floor(gridSize * 0.15)
      for (let y = startY; y < height; y++) {
        // 左の線
        cells.push({ x: Math.floor(gridSize * 0.2), y })
        // 右の線
        cells.push({ x: Math.floor(gridSize * 0.8), y })
        // 中央の山
        if (y < startY + (height - startY) / 2) {
          cells.push({ x: Math.floor(centerX - (y - startY)), y })
          cells.push({ x: Math.floor(centerX + (y - startY)), y })
        }
      }
      break
    }

    case 'r': {
      // R字形状（簡略版）
      const midX = Math.floor(gridSize * 0.3)
      const height = Math.floor(gridSize * 0.7)
      const startY = Math.floor(gridSize * 0.15)
      // 縦線
      for (let y = startY; y < height; y++) {
        cells.push({ x: midX, y })
      }
      // 上部の丸み
      const radius = Math.floor(gridSize * 0.15)
      for (let angle = 0; angle <= Math.PI; angle += 0.1) {
        const x = Math.floor(midX + radius * Math.cos(angle))
        const y = Math.floor(startY + radius - radius * Math.sin(angle))
        cells.push({ x, y })
      }
      // 斜めの脚
      for (let i = 0; i < radius; i++) {
        cells.push({ 
          x: midX + i, 
          y: Math.floor(startY + radius + i) 
        })
      }
      break
    }

    default: {
      // デフォルトは円
      const radius = gridSize / 4
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const dx = i - centerX
          const dy = j - centerY
          if (dx * dx + dy * dy <= radius * radius) {
            cells.push({ x: i, y: j })
          }
        }
      }
    }
  }

  return cells
}

