import React, { useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { Terminal, StickyNote, Globe, X, Sparkles } from 'lucide-react'
import type { CanvasNode, CableConnection } from '../../state/canvas'
import {
  connectingFromNodeIdAtom,
  connectingLineEndpointAtom,
  connectionsAtom,
  nodesAtom,
  panAtom,
  zoomAtom
} from '../../state/canvas'
import { ConnectionsBadge } from './ConnectionsBadge'

interface NodeContainerProps {
  node: CanvasNode
  isSelected: boolean
  onSelect: () => void
  onUpdatePosition: (id: string, x: number, y: number) => void
  onUpdateSize: (id: string, width: number, height: number) => void
  onDelete: (id: string) => void
  children: React.ReactNode
}

export const NodeContainer: React.FC<NodeContainerProps> = ({
  node,
  isSelected,
  onSelect,
  onUpdatePosition,
  onUpdateSize,
  onDelete,
  children
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const setConnectingFromId = useSetAtom(connectingFromNodeIdAtom)
  const setConnectingEndpoint = useSetAtom(connectingLineEndpointAtom)
  const [connections, setConnections] = useAtom(connectionsAtom)
  const [nodes] = useAtom(nodesAtom)
  const [pan] = useAtom(panAtom)
  const [zoom] = useAtom(zoomAtom)

  // Arrastar nó pelo cabeçalho
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node-action-btn')) return
    e.stopPropagation()
    onSelect()
    setIsDragging(true)

    const startClientX = e.clientX
    const startClientY = e.clientY
    const startNodeX = node.x
    const startNodeY = node.y

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startClientX) / zoom
      const dy = (moveEvent.clientY - startClientY) / zoom
      onUpdatePosition(node.id, Math.round(startNodeX + dx), Math.round(startNodeY + dy))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Redimensionar nó
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    const startW = node.width
    const startH = node.height
    const startX = e.clientX
    const startY = e.clientY

    const handleResizeMouseMove = (moveEvent: MouseEvent) => {
      const newW = Math.max(320, startW + (moveEvent.clientX - startX) / zoom)
      const newH = Math.max(200, startH + (moveEvent.clientY - startY) / zoom)
      onUpdateSize(node.id, Math.round(newW), Math.round(newH))
    }

    const handleResizeMouseUp = () => {
      window.removeEventListener('mousemove', handleResizeMouseMove)
      window.removeEventListener('mouseup', handleResizeMouseUp)
    }

    window.addEventListener('mousemove', handleResizeMouseMove)
    window.addEventListener('mouseup', handleResizeMouseUp)
  }

  // Iniciar arrasto de cabo a partir de uma porta
  const handlePortMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    setConnectingFromId(node.id)

    // Converter coordenada da tela para espaço do canvas
    const canvasX = (e.clientX - pan.x) / zoom
    const canvasY = (e.clientY - pan.y) / zoom
    setConnectingEndpoint({ x: canvasX, y: canvasY })

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const curX = (moveEvent.clientX - pan.x) / zoom
      const curY = (moveEvent.clientY - pan.y) / zoom
      setConnectingEndpoint({ x: curX, y: curY })
    }

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      setConnectingFromId(null)
      setConnectingEndpoint(null)

      // Identificar se o mouse foi solto sobre outro nó
      const dropCanvasX = (upEvent.clientX - pan.x) / zoom
      const dropCanvasY = (upEvent.clientY - pan.y) / zoom

      const target = nodes.find(
        (n) =>
          n.id !== node.id &&
          dropCanvasX >= n.x &&
          dropCanvasX <= n.x + n.width &&
          dropCanvasY >= n.y &&
          dropCanvasY <= n.y + n.height
      )

      if (target) {
        // Verificar se conexão já existe
        const alreadyExists = connections.some(
          (c) =>
            (c.fromNodeId === node.id && c.toNodeId === target.id) ||
            (c.fromNodeId === target.id && c.toNodeId === node.id)
        )
        if (!alreadyExists) {
          const newConnection: CableConnection = {
            id: `conn-${Date.now().toString(36)}`,
            fromNodeId: node.id,
            toNodeId: target.id,
            color: '#8B5CF6'
          }
          setConnections((prev) => [...prev, newConnection])
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const renderIcon = () => {
    if (node.type === 'terminal') {
      return node.isMaestro ? (
        <Sparkles className="w-4 h-4 text-purple-300 animate-pulse shrink-0" />
      ) : (
        <Terminal className="w-4 h-4 text-purple-400 shrink-0" />
      )
    }
    if (node.type === 'portal') {
      return <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
    }
    return <StickyNote className="w-4 h-4 text-amber-400 shrink-0" />
  }

  return (
    <div
      onClick={onSelect}
      style={{
        transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
        width: node.width,
        height: node.height
      }}
      className={`absolute select-none flex flex-col rounded-xl backdrop-blur-md transition-shadow duration-150 ${
        isSelected
          ? 'ring-2 ring-purple-500 shadow-neon-purple z-30'
          : 'ring-1 ring-[#2A2344] hover:ring-[#44386D] shadow-2xl z-20'
      } bg-[#120F1E]`}
    >
      {/* Node Header */}
      <div
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between px-3.5 py-2.5 rounded-t-xl cursor-grab active:cursor-grabbing border-b border-[#241D3B] ${
          isSelected ? 'bg-[#1C1630]' : 'bg-[#151224]'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          {renderIcon()}
          <span className="text-xs font-semibold text-purple-100 truncate tracking-wide">
            {node.title}
          </span>
          {node.isMaestro && (
            <span className="text-[10px] bg-purple-600/30 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-mono">
              MAESTRO
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 node-action-btn">
          {/* Badge de conexões idêntico ao Maestri */}
          <ConnectionsBadge nodeId={node.id} />

          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="p-1 rounded-md text-purple-400 hover:text-white hover:bg-rose-500/20 transition-colors"
            title="Fechar Nó"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Node Content Body */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        {children}
      </div>

      {/* Connection Port Anchors (Top, Bottom, Left, Right) */}
      <div
        onMouseDown={handlePortMouseDown}
        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#8B5CF6] border-2 border-[#120F1E] shadow-sm pointer-events-auto cursor-crosshair hover:scale-150 hover:bg-purple-300 transition-all z-40"
        title="Arrastar cabo de conexão"
      />
      <div
        onMouseDown={handlePortMouseDown}
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#A855F7] border-2 border-[#120F1E] shadow-sm pointer-events-auto cursor-crosshair hover:scale-150 hover:bg-purple-300 transition-all z-40"
        title="Arrastar cabo de conexão"
      />
      <div
        onMouseDown={handlePortMouseDown}
        className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#8B5CF6] border-2 border-[#120F1E] shadow-sm pointer-events-auto cursor-crosshair hover:scale-150 hover:bg-purple-300 transition-all z-40"
        title="Arrastar cabo de conexão"
      />
      <div
        onMouseDown={handlePortMouseDown}
        className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#A855F7] border-2 border-[#120F1E] shadow-sm pointer-events-auto cursor-crosshair hover:scale-150 hover:bg-purple-300 transition-all z-40"
        title="Arrastar cabo de conexão"
      />

      {/* Resize Handle at Bottom-Right */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute bottom-1 right-1 w-3.5 h-3.5 cursor-nwse-resize text-purple-500/40 hover:text-purple-400 flex items-center justify-center pointer-events-auto"
      >
        <div className="w-2 h-2 border-r-2 border-b-2 border-current" />
      </div>
    </div>
  )
}
