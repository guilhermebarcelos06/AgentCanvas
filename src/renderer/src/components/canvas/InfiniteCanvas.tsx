import React, { useRef, useState } from 'react'
import { useAtom } from 'jotai'
import { panAtom, zoomAtom, nodesAtom, connectionsAtom, selectedNodeIdAtom } from '../../state/canvas'
import { CableLayer } from './CableLayer'
import { NodeContainer } from './NodeContainer'
import { TerminalNode } from '../terminal/TerminalNode'
import { NoteNode } from '../note/NoteNode'

export const InfiniteCanvas: React.FC = () => {
  const [pan, setPan] = useAtom(panAtom)
  const [zoom, setZoom] = useAtom(zoomAtom)
  const [nodes, setNodes] = useAtom(nodesAtom)
  const [connections] = useAtom(connectionsAtom)
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom)

  const [isPanning, setIsPanning] = useState(false)
  const startPanRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    // Start panning on middle mouse click OR left-click on background
    if (e.button === 1 || (e.button === 0 && (e.target as HTMLElement).classList.contains('canvas-viewport'))) {
      setIsPanning(true)
      setSelectedNodeId(null)
      startPanRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y
      }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startPanRef.current.x
        const dy = moveEvent.clientY - startPanRef.current.y
        setPan({
          x: Math.round(startPanRef.current.panX + dx),
          y: Math.round(startPanRef.current.panY + dy)
        })
      }

      const handleMouseUp = () => {
        setIsPanning(false)
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom in/out with mouse wheel
    if (e.ctrlKey || e.metaKey || true) {
      e.preventDefault()
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
      const newZoom = Math.min(Math.max(0.2, zoom * zoomFactor), 2.2)

      // Center zoom around cursor position
      const rect = e.currentTarget.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom)
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom)

      setZoom(newZoom)
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) })
    }
  }

  const updateNodePosition = (id: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)))
  }

  const updateNodeSize = (id: string, width: number, height: number) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, width, height } : n)))
  }

  const deleteNode = (id: string) => {
    const node = nodes.find((n) => n.id === id)
    if (node?.type === 'terminal') {
      window.agentCanvasAPI?.killTerminal(id)
    }
    setNodes((prev) => prev.filter((n) => n.id !== id))
    if (selectedNodeId === id) setSelectedNodeId(null)
  }

  const updateNoteContent = (id: string, content: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, content } } : n))
    )
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      className={`relative w-full h-full overflow-hidden canvas-grid canvas-viewport select-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Transformed Infinite Plane */}
      <div
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
        className="absolute inset-0 pointer-events-auto"
      >
        {/* SVG Cable Connection Layer */}
        <CableLayer nodes={nodes} connections={connections} />

        {/* Nodes Layer */}
        {nodes.map((node) => (
          <NodeContainer
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onSelect={() => setSelectedNodeId(node.id)}
            onUpdatePosition={updateNodePosition}
            onUpdateSize={updateNodeSize}
            onDelete={deleteNode}
          >
            {node.type === 'terminal' ? (
              <TerminalNode id={node.id} title={node.title} width={node.width} height={node.height} />
            ) : (
              <NoteNode
                id={node.id}
                title={node.title}
                content={String(node.data?.content || '')}
                onContentChange={(content) => updateNoteContent(node.id, content)}
              />
            )}
          </NodeContainer>
        ))}
      </div>
    </div>
  )
}
