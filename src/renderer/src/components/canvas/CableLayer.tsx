import React from 'react'
import type { CanvasNode, CableConnection } from '../../state/canvas'

interface CableLayerProps {
  nodes: CanvasNode[]
  connections: CableConnection[]
}

export const CableLayer: React.FC<CableLayerProps> = ({ nodes, connections }) => {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-10">
      <defs>
        <filter id="neonCableGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#8B5CF6" />
          <stop offset="50%" stop-color="#C084FC" />
          <stop offset="100%" stop-color="#A855F7" />
        </linearGradient>
      </defs>

      {connections.map((conn) => {
        const from = nodeMap.get(conn.fromNodeId)
        const to = nodeMap.get(conn.toNodeId)
        if (!from || !to) return null

        // Calculate connection port coordinates (bottom-center of from, top-center of to, or lateral)
        const startX = from.x + from.width / 2
        const startY = from.y + from.height
        const endX = to.x + to.width / 2
        const endY = to.y

        // Curvature calculation
        const dx = Math.abs(endX - startX) * 0.5
        const dy = Math.max(Math.abs(endY - startY) * 0.5, 60)

        const c1x = startX
        const c1y = startY + dy
        const c2x = endX
        const c2y = endY - dy

        const pathData = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`

        return (
          <g key={conn.id} className="transition-all duration-200">
            {/* Outer Soft Glow */}
            <path
              d={pathData}
              fill="none"
              stroke={conn.color || '#A855F7'}
              strokeWidth="8"
              opacity="0.25"
              strokeLinecap="round"
              filter="url(#neonCableGlow)"
            />
            {/* Main Cable Line */}
            <path
              d={pathData}
              fill="none"
              stroke={conn.color || '#8B5CF6'}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Pulse Dash Animation */}
            <path
              d={pathData}
              fill="none"
              stroke="#E9D5FF"
              strokeWidth="2"
              strokeDasharray="8 24"
              strokeLinecap="round"
              className="animate-pulse opacity-60"
            />
            {/* Start & End Port Anchors */}
            <circle cx={startX} cy={startY} r="5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx={endX} cy={endY} r="5" fill="#A855F7" stroke="#FFFFFF" strokeWidth="1.5" />
          </g>
        )
      })}
    </svg>
  )
}
