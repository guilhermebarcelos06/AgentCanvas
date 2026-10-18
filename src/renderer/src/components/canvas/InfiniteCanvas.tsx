import React, { useRef, useState, useCallback, useMemo } from 'react'
import { useAtom, useStore } from 'jotai'
import {
  panAtom,
  zoomAtom,
  nodesAtom,
  connectionsAtom,
  selectedNodeIdAtom,
  expandedNodeIdAtom
} from '../../state/canvas'
import { CableLayer } from './CableLayer'
import { NodeContainer } from './NodeContainer'
import { TerminalNode } from '../terminal/TerminalNode'
import { NoteNode } from '../note/NoteNode'
import { PortalNode } from '../portal/PortalNode'

export const InfiniteCanvas: React.FC = () => {
  const store = useStore()
  const [pan, setPan] = useAtom(panAtom)
  const [zoom, setZoom] = useAtom(zoomAtom)
  const [nodes, setNodes] = useAtom(nodesAtom)
  const [connections, setConnections] = useAtom(connectionsAtom)
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom)
  const [expandedNodeId, setExpandedNodeId] = useAtom(expandedNodeIdAtom)

  const [isPanning, setIsPanning] = useState(false)
  const startPanRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (expandedNodeId) return
    const target = e.target as HTMLElement
    // Start panning on middle mouse click OR left-click on canvas background
    if (e.button === 1 || (e.button === 0 && target.classList.contains('canvas-viewport'))) {
      setIsPanning(true)
      setSelectedNodeId(null)
      startPanRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y
      }

      let rafId: number | null = null
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startPanRef.current.x
        const dy = moveEvent.clientY - startPanRef.current.y
        if (rafId !== null) cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          setPan({
            x: Math.round(startPanRef.current.panX + dx),
            y: Math.round(startPanRef.current.panY + dy)
          })
        })
      }

      const handleMouseUp = () => {
        if (rafId !== null) cancelAnimationFrame(rafId)
        setIsPanning(false)
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (expandedNodeId) return
    const target = e.target as HTMLElement

    // Zoom in/out ONLY when Ctrl or Meta is pressed (or pinch gesture on trackpad)
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
      const newZoom = Math.min(Math.max(0.2, zoom * zoomFactor), 2.2)

      const rect = e.currentTarget.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom)
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom)

      setZoom(newZoom)
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) })
      return
    }

    // Se o scroll ocorrer dentro de um elemento rolável (terminal, nota, textarea), permitir rolagem nativa
    if (target.closest('.xterm-viewport, textarea, .overflow-y-auto, iframe')) {
      return
    }

    // Caso contrário, rolagem no fundo do canvas faz pan suave 2D
    e.preventDefault()
    setPan((prev) => ({
      x: Math.round(prev.x - e.deltaX),
      y: Math.round(prev.y - e.deltaY)
    }))
  }

  const handleSelectNode = useCallback(
    (id: string) => {
      setSelectedNodeId(id)
    },
    [setSelectedNodeId]
  )

  const updateNodePosition = useCallback(
    (id: string, x: number, y: number) => {
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)))
    },
    [setNodes]
  )

  const updateNodeSize = useCallback(
    (id: string, width: number, height: number) => {
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, width, height } : n)))
    },
    [setNodes]
  )

  const deleteNode = useCallback(
    (id: string) => {
      const currentNodes = store.get(nodesAtom)
      const node = currentNodes.find((n) => n.id === id)
      if (node?.type === 'terminal') {
        window.agentCanvasAPI?.killTerminal(id)
      }
      setNodes((prev) => prev.filter((n) => n.id !== id))
      setConnections((prev) => prev.filter((c) => c.fromNodeId !== id && c.toNodeId !== id))
      setSelectedNodeId((prev) => (prev === id ? null : prev))
      setExpandedNodeId((prev) => (prev === id ? null : prev))
    },
    [store, setNodes, setConnections, setSelectedNodeId, setExpandedNodeId]
  )

  const updateNoteContent = useCallback(
    (id: string, content: string) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, content } } : n))
      )
    },
    [setNodes]
  )

  const expandedBounds = useMemo(() => {
    if (!expandedNodeId) return undefined
    const w = typeof window !== 'undefined' ? window.innerWidth : 1440
    const h = typeof window !== 'undefined' ? window.innerHeight - 48 : 852
    return {
      x: (-pan.x + 16) / zoom,
      y: (-pan.y + 16) / zoom,
      w: Math.max(360, (w - 32) / zoom),
      h: Math.max(240, (h - 32) / zoom)
    }
  }, [expandedNodeId, pan.x, pan.y, zoom])

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
          transformOrigin: '0 0',
          willChange: isPanning ? 'transform' : 'auto'
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* SVG Cable Connection Layer */}
        <CableLayer nodes={nodes} connections={connections} />

        {/* Nodes Layer */}
        <div className="pointer-events-auto">
          {nodes.map((node) => {
            const isExpanded = expandedNodeId === node.id
            return (
              <NodeContainer
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                isExpanded={isExpanded}
                expandedBounds={isExpanded ? expandedBounds : undefined}
                onSelect={handleSelectNode}
                onUpdatePosition={updateNodePosition}
                onUpdateSize={updateNodeSize}
                onDelete={deleteNode}
              >
                {node.type === 'terminal' ? (
                  <TerminalNode
                    id={node.id}
                    title={node.title}
                    width={isExpanded && expandedBounds ? expandedBounds.w : node.width}
                    height={isExpanded && expandedBounds ? expandedBounds.h : node.height}
                    cwd={node.cwd}
                    command={node.command}
                    isMaestro={node.isMaestro}
                    reloadKey={Number(node.data?._reloadKey || 0)}
                  />
                ) : node.type === 'portal' ? (
                  <PortalNode
                    id={node.id}
                    initialUrl={node.data.url as string | undefined}
                    reloadKey={Number(node.data?._reloadKey || 0)}
                  />
                ) : (
                  <NoteNode
                    id={node.id}
                    title={node.title}
                    content={String(node.data?.content || '')}
                    onContentChange={(content) => updateNoteContent(node.id, content)}
                  />
                )}
              </NodeContainer>
            )
          })}
        </div>
      </div>
    </div>
  )
}
