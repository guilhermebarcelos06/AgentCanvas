import React, { useState, useEffect } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { Terminal, StickyNote, Globe, X, Sparkles, Maximize2, Minimize2 } from 'lucide-react'
import type { CanvasNode, CableConnection } from '../../state/canvas'
import {
  connectingFromNodeIdAtom,
  connectingLineEndpointAtom,
  connectionsAtom,
  nodesAtom,
  panAtom,
  zoomAtom,
  expandedNodeIdAtom
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
  const [expandedNodeId, setExpandedNodeId] = useAtom(expandedNodeIdAtom)
  const isExpanded = expandedNodeId === node.id

  const [windowSize, setWindowSize] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1200,
    h: typeof window !== 'undefined' ? window.innerHeight : 800
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isExpanded) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedNodeId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, setExpandedNodeId])

  // Arrastar nó pelo cabeçalho
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded) return
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
    if (isExpanded) return
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
    if (isExpanded) return
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

  const renderX = isExpanded ? (-pan.x + 16) / zoom : node.x
  const renderY = isExpanded ? (-pan.y + 16) / zoom : node.y
  const renderW = isExpanded ? Math.max(360, (windowSize.w - 32) / zoom) : node.width
  const renderH = isExpanded ? Math.max(240, (windowSize.h - 32) / zoom) : node.height

  return (
    <div
      onClick={onSelect}
      style={{
        transform: `translate3d(${renderX}px, ${renderY}px, 0)`,
        width: renderW,
        height: renderH,
        zIndex: isExpanded ? 50 : isSelected ? 30 : 20
      }}
      className={`absolute select-none flex flex-col rounded-xl backdrop-blur-md transition-[shadow,border] duration-150 ${
        isExpanded
          ? 'ring-2 ring-[#8B5CF6] shadow-2xl shadow-purple-950/60'
          : isSelected
          ? 'ring-2 ring-purple-500 shadow-neon-purple'
          : 'ring-1 ring-[#2A2344] hover:ring-[#44386D] shadow-2xl'
      } bg-[#120F1E]`}
    >
      {/* Node Header */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest('.node-action-btn')) return
          e.stopPropagation()
          setExpandedNodeId(isExpanded ? null : node.id)
        }}
        className={`flex items-center justify-between px-3.5 py-2.5 rounded-t-xl ${
          isExpanded ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        } border-b border-[#241D3B] ${
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

          {/* Botão de Maximizar / Restaurar (duplo clique) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExpandedNodeId(isExpanded ? null : node.id)
            }}
            className={`p-1 rounded-md transition-colors ${
              isExpanded
                ? 'text-[#3B82F6] bg-blue-500/20'
                : 'text-purple-400 hover:text-white hover:bg-purple-500/20'
            }`}
            title={isExpanded ? 'Restaurar tamanho (Duplo clique ou Esc)' : 'Expandir em tela cheia (Duplo clique)'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

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

      {/* Connection Port Anchors (Top, Bottom, Left, Right) - Ocultar quando expandido em tela cheia */}
      {!isExpanded && (
        <>
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
        </>
      )}
    </div>
  )
}
