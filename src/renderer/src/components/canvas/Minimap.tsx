import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { nodesAtom, panAtom, zoomAtom, minimapOpenAtom } from '../../state/canvas'
import { Map, X } from 'lucide-react'

export const Minimap: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(minimapOpenAtom)
  const nodes = useAtomValue(nodesAtom)
  const [pan, setPan] = useAtom(panAtom)
  const zoom = useAtomValue(zoomAtom)

  if (!isOpen) return null

  // Calcular limites do mundo do canvas
  const allX = nodes.map((n) => n.x)
  const allY = nodes.map((n) => n.y)
  const minX = Math.min(...allX, 0) - 200
  const minY = Math.min(...allY, 0) - 200
  const maxX = Math.max(...nodes.map((n) => n.x + n.width), 1200) + 200
  const maxY = Math.max(...nodes.map((n) => n.y + n.height), 800) + 200

  const worldWidth = maxX - minX
  const worldHeight = maxY - minY

  const mapWidth = 180
  const mapHeight = 120
  const scaleX = mapWidth / worldWidth
  const scaleY = mapHeight / worldHeight
  const scale = Math.min(scaleX, scaleY)

  // Viewport da câmera
  const viewX = (-pan.x / zoom - minX) * scale
  const viewY = (-pan.y / zoom - minY) * scale
  const viewW = (window.innerWidth / zoom) * scale
  const viewH = (window.innerHeight / zoom) * scale

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const worldTargetX = clickX / scale + minX
    const worldTargetY = clickY / scale + minY

    setPan({
      x: window.innerWidth / 2 - worldTargetX * zoom,
      y: window.innerHeight / 2 - worldTargetY * zoom
    })
  }

  return (
    <div className="absolute bottom-6 right-6 z-30 select-none">
      <div className="bg-[#120F1D]/90 backdrop-blur-md border border-[#372A59] rounded-xl shadow-2xl p-2 w-[196px]">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#251F3D]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Map size={11} className="text-purple-400" />
            Minimapa
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-300"
          >
            <X size={12} />
          </button>
        </div>

        <div
          onClick={handleMapClick}
          className="relative w-[180px] h-[120px] bg-[#0A0812] border border-[#231A3B] rounded-lg overflow-hidden cursor-pointer"
        >
          {/* Nós representados no radar */}
          {nodes.map((n) => {
            const nx = (n.x - minX) * scale
            const ny = (n.y - minY) * scale
            const nw = Math.max(3, n.width * scale)
            const nh = Math.max(3, n.height * scale)

            let color = '#8B5CF6'
            if (n.type === 'note') color = '#EC4899'
            if (n.type === 'portal') color = '#06B6D4'

            return (
              <div
                key={n.id}
                style={{
                  left: `${nx}px`,
                  top: `${ny}px`,
                  width: `${nw}px`,
                  height: `${nh}px`,
                  backgroundColor: color
                }}
                className="absolute rounded-[2px] opacity-80"
              />
            )
          })}

          {/* Retângulo do Viewport visível */}
          <div
            style={{
              left: `${viewX}px`,
              top: `${viewY}px`,
              width: `${viewW}px`,
              height: `${viewH}px`
            }}
            className="absolute border border-purple-400 bg-purple-500/10 rounded-[2px] pointer-events-none"
          />
        </div>
      </div>
    </div>
  )
}
