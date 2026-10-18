import React, { memo } from 'react'
import { useAtomValue } from 'jotai'
import type { CanvasNode, CableConnection } from '../../state/canvas'
import { connectingFromNodeIdAtom, connectingLineEndpointAtom } from '../../state/canvas'

interface CableLayerProps {
  nodes: CanvasNode[]
  connections: CableConnection[]
}

function computeAnchorPoints(from: CanvasNode, to: CanvasNode) {
  const fromCenterX = from.x + from.width / 2
  const fromCenterY = from.y + from.height / 2
  const toCenterX = to.x + to.width / 2
  const toCenterY = to.y + to.height / 2

  const dx = toCenterX - fromCenterX
  const dy = toCenterY - fromCenterY

  // Conexão predominantemente horizontal vs vertical
  if (Math.abs(dx) > Math.abs(dy) * 1.15) {
    const startX = dx >= 0 ? from.x + from.width : from.x
    const startY = fromCenterY
    const endX = dx >= 0 ? to.x : to.x + to.width
    const endY = toCenterY
    const offset = Math.max(Math.abs(endX - startX) * 0.45, 60)
    const dir = dx >= 0 ? 1 : -1
    const pathData = `M ${startX} ${startY} C ${startX + offset * dir} ${startY}, ${endX - offset * dir} ${endY}, ${endX} ${endY}`
    return { startX, startY, endX, endY, pathData }
  } else {
    const startX = fromCenterX
    const startY = dy >= 0 ? from.y + from.height : from.y
    const endX = toCenterX
    const endY = dy >= 0 ? to.y : to.y + to.height
    const offset = Math.max(Math.abs(endY - startY) * 0.45, 60)
    const dir = dy >= 0 ? 1 : -1
    const pathData = `M ${startX} ${startY} C ${startX} ${startY + offset * dir}, ${endX} ${endY - offset * dir}, ${endX} ${endY}`
    return { startX, startY, endX, endY, pathData }
  }
}

const CableLayerComponent: React.FC<CableLayerProps> = ({ nodes, connections }) => {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const connectingFromId = useAtomValue(connectingFromNodeIdAtom)
  const connectingEndpoint = useAtomValue(connectingLineEndpointAtom)

  const fromDraggingNode = connectingFromId ? nodeMap.get(connectingFromId) : null

  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-10">
      {/* Cabos estabelecidos */}
      {connections.map((conn) => {
        const from = nodeMap.get(conn.fromNodeId)
        const to = nodeMap.get(conn.toNodeId)
        if (!from || !to) return null

        const { startX, startY, endX, endY, pathData } = computeAnchorPoints(from, to)

        return (
          <g key={conn.id}>
            {/* Subtle Halo */}
            <path
              d={pathData}
              fill="none"
              stroke={conn.color || '#A855F7'}
              strokeWidth="7"
              opacity="0.18"
              strokeLinecap="round"
            />
            {/* Main Cable */}
            <path
              d={pathData}
              fill="none"
              stroke={conn.color || '#8B5CF6'}
              strokeWidth="2.75"
              strokeLinecap="round"
            />
            {/* Accent Core */}
            <path
              d={pathData}
              fill="none"
              stroke="#E9D5FF"
              strokeWidth="1.25"
              strokeDasharray="6 18"
              strokeLinecap="round"
              opacity="0.55"
            />
            {/* Port Anchors */}
            <circle cx={startX} cy={startY} r="4.5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx={endX} cy={endY} r="4.5" fill="#A855F7" stroke="#FFFFFF" strokeWidth="1.5" />
          </g>
        )
      })}

      {/* Cabo temporário durante o arrasto */}
      {fromDraggingNode && connectingEndpoint && (
        <g>
          {(() => {
            const startX = fromDraggingNode.x + fromDraggingNode.width / 2
            const startY = fromDraggingNode.y + fromDraggingNode.height / 2
            const endX = connectingEndpoint.x
            const endY = connectingEndpoint.y

            const dy = Math.max(Math.abs(endY - startY) * 0.4, 40)
            const pathData = `M ${startX} ${startY} C ${startX} ${startY + dy}, ${endX} ${endY - dy}, ${endX} ${endY}`

            return (
              <>
                <path
                  d={pathData}
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="6"
                  opacity="0.25"
                />
                <path
                  d={pathData}
                  fill="none"
                  stroke="#C084FC"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                />
                <circle cx={endX} cy={endY} r="5.5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />
              </>
            )
          })()}
        </g>
      )}
    </svg>
  )
}

export const CableLayer = memo(CableLayerComponent)
