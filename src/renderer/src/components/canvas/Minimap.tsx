import React, { useRef, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { nodesAtom, panAtom, zoomAtom, minimapOpenAtom, selectedNodeIdAtom } from '../../state/canvas'
import { Map, X } from 'lucide-react'

export const Minimap: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(minimapOpenAtom)
  const nodes = useAtomValue(nodesAtom)
  const [pan, setPan] = useAtom(panAtom)
  const zoom = useAtomValue(zoomAtom)
  const selectedNodeId = useAtomValue(selectedNodeIdAtom)

  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  if (!isOpen) return null

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1440
  const viewportH = typeof window !== 'undefined' ? Math.max(400, window.innerHeight - 48) : 852

  // Coordenadas do viewport atual no espaço do mundo
  const worldViewX = -pan.x / zoom
  const worldViewY = -pan.y / zoom
  const worldViewW = viewportW / zoom
  const worldViewH = viewportH / zoom

  // Calcular limites do mundo (união dos nós + viewport atual para que a câmera nunca suma do radar)
  const nodeMinX = nodes.length > 0 ? Math.min(...nodes.map((n) => n.x)) : 0
  const nodeMinY = nodes.length > 0 ? Math.min(...nodes.map((n) => n.y)) : 0
  const nodeMaxX = nodes.length > 0 ? Math.max(...nodes.map((n) => n.x + n.width)) : 1200
  const nodeMaxY = nodes.length > 0 ? Math.max(...nodes.map((n) => n.y + n.height)) : 800

  const pad = 250
  const minX = Math.min(nodeMinX, worldViewX) - pad
  const minY = Math.min(nodeMinY, worldViewY) - pad
  const maxX = Math.max(nodeMaxX, worldViewX + worldViewW) + pad
  const maxY = Math.max(nodeMaxY, worldViewY + worldViewH) + pad

  const worldWidth = Math.max(1, maxX - minX)
  const worldHeight = Math.max(1, maxY - minY)

  const mapWidth = 200
  const mapHeight = 132
  const scaleX = mapWidth / worldWidth
  const scaleY = mapHeight / worldHeight
  const scale = Math.min(scaleX, scaleY)

  // Centralizar o mundo dentro da superfície do minimapa
  const offsetX = (mapWidth - worldWidth * scale) / 2
  const offsetY = (mapHeight - worldHeight * scale) / 2

  // Retângulo da câmera no minimapa
  const viewX = offsetX + (worldViewX - minX) * scale
  const viewY = offsetY + (worldViewY - minY) * scale
  const viewW = Math.max(14, worldViewW * scale)
  const viewH = Math.max(10, worldViewH * scale)

  const jumpToClient = (clientX: number, clientY: number) => {
    const surface = surfaceRef.current
    if (!surface) return
    const rect = surface.getBoundingClientRect()
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left))
    const relY = Math.max(0, Math.min(rect.height, clientY - rect.top))

    const worldTargetX = (relX - offsetX) / scale + minX
    const worldTargetY = (relY - offsetY) / scale + minY

    setPan({
      x: Math.round(viewportW / 2 - worldTargetX * zoom),
      y: Math.round(viewportH / 2 - worldTargetY * zoom)
    })
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    setIsDragging(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    jumpToClient(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    e.preventDefault()
    jumpToClient(e.clientX, e.clientY)
  }

  const stopDragging = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {}
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 200 : 80
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setPan((p) => ({ x: p.x + step, y: p.y }))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setPan((p) => ({ x: p.x - step, y: p.y }))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setPan((p) => ({ x: p.x, y: p.y + step }))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setPan((p) => ({ x: p.x, y: p.y - step }))
    }
  }

  return (
    <div className="absolute bottom-6 right-6 z-30 select-none">
      <div className="bg-[#120F1D]/95 border border-[#372A59] rounded-xl shadow-2xl p-2 w-[216px]">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#251F3D]">
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Map size={11} className="text-purple-400" />
            Minimapa
            <span className="text-[9px] font-mono text-purple-400/80 ml-1">
              {Math.round(zoom * 100)}%
            </span>
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-200 p-0.5 rounded hover:bg-white/5 transition-colors"
            title="Ocultar Minimapa (Ctrl+Shift+M)"
          >
            <X size={12} />
          </button>
        </div>

        <div
          ref={surfaceRef}
          tabIndex={0}
          role="slider"
          aria-label="Navegação do Minimapa"
          aria-valuetext={`Zoom ${Math.round(zoom * 100)}%`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onLostPointerCapture={() => {
            isDraggingRef.current = false
            setIsDragging(false)
          }}
          onKeyDown={handleKeyDown}
          style={{ touchAction: 'none' }}
          className={`relative w-[200px] h-[132px] bg-[#0A0812] border border-[#231A3B] rounded-lg overflow-hidden focus:outline-none focus:ring-1 focus:ring-purple-500/60 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Nós representados no radar */}
          {nodes.map((n) => {
            const nx = offsetX + (n.x - minX) * scale
            const ny = offsetY + (n.y - minY) * scale
            const nw = Math.max(4, n.width * scale)
            const nh = Math.max(4, n.height * scale)

            let color = n.color || '#8B5CF6'
            if (n.type === 'note') color = '#EC4899'
            if (n.type === 'portal') color = '#06B6D4'

            const isSelected = n.id === selectedNodeId

            return (
              <div
                key={n.id}
                style={{
                  transform: `translate3d(${nx}px, ${ny}px, 0)`,
                  width: `${nw}px`,
                  height: `${nh}px`,
                  backgroundColor: color
                }}
                className={`absolute top-0 left-0 rounded-[2px] pointer-events-none ${
                  isSelected ? 'opacity-100 ring-1 ring-white z-10' : 'opacity-75'
                }`}
              />
            )
          })}

          {/* Retângulo do Viewport visível (Arrastável junto com toda a superfície) */}
          <div
            style={{
              transform: `translate3d(${viewX}px, ${viewY}px, 0)`,
              width: `${viewW}px`,
              height: `${viewH}px`
            }}
            className={`absolute top-0 left-0 rounded-[3px] pointer-events-none transition-colors duration-75 ${
              isDragging
                ? 'border-2 border-purple-300 bg-purple-500/25 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'border border-purple-400/90 bg-purple-500/12'
            }`}
          />
        </div>
      </div>
    </div>
  )
}
