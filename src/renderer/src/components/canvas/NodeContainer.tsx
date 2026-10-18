import React, { useState } from 'react'
import { Terminal, StickyNote, X, Move } from 'lucide-react'
import type { CanvasNode } from '../../state/canvas'

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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, nodeX: 0, nodeY: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from header
    if ((e.target as HTMLElement).closest('.node-action-btn')) return
    e.stopPropagation()
    onSelect()
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      nodeX: node.x,
      nodeY: node.y
    })

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - e.clientX
      const dy = moveEvent.clientY - e.clientY
      onUpdatePosition(node.id, Math.round(node.x + dx), Math.round(node.y + dy))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    const startW = node.width
    const startH = node.height
    const startX = e.clientX
    const startY = e.clientY

    const handleResizeMouseMove = (moveEvent: MouseEvent) => {
      const newW = Math.max(320, startW + (moveEvent.clientX - startX))
      const newH = Math.max(200, startH + (moveEvent.clientY - startY))
      onUpdateSize(node.id, newW, newH)
    }

    const handleResizeMouseUp = () => {
      window.removeEventListener('mousemove', handleResizeMouseMove)
      window.removeEventListener('mouseup', handleResizeMouseUp)
    }

    window.addEventListener('mousemove', handleResizeMouseMove)
    window.addEventListener('mouseup', handleResizeMouseUp)
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
        <div className="flex items-center gap-2 overflow-hidden">
          {node.type === 'terminal' ? (
            <Terminal className="w-4 h-4 text-purple-400 shrink-0" />
          ) : (
            <StickyNote className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="text-xs font-semibold text-purple-100 truncate tracking-wide">
            {node.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 node-action-btn">
          <button
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

      {/* Connection Port Anchors (Top, Bottom) */}
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#8B5CF6] border-2 border-[#120F1E] shadow-sm pointer-events-auto cursor-crosshair hover:scale-125 transition-transform" />
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#A855F7] border-2 border-[#120F1E] shadow-sm pointer-events-auto cursor-crosshair hover:scale-125 transition-transform" />

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
