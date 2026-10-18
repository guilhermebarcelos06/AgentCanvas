import React, { useEffect } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { CanvasToolbar } from './components/toolbar/CanvasToolbar'
import { InfiniteCanvas } from './components/canvas/InfiniteCanvas'
import { DockedSidebar } from './components/sidebar/DockedSidebar'
import { PrompterBar } from './components/prompter/PrompterBar'
import { Minimap } from './components/canvas/Minimap'
import { CommandPalette } from './components/palette/CommandPalette'
import { NewTerminalModal } from './components/terminal/NewTerminalModal'
import { NewWorkspaceModal } from './components/workspace/NewWorkspaceModal'
import { FloatingCanvasToolbars } from './components/toolbar/FloatingCanvasToolbars'
import { nodesAtom, connectionsAtom, activeWorkspaceAtom } from './state/canvas'

export const App: React.FC = () => {
  const [nodes, setNodes] = useAtom(nodesAtom)
  const connections = useAtomValue(connectionsAtom)
  const activeWorkspace = useAtomValue(activeWorkspaceAtom)

  // Persistir automaticamente o estado (nós e cabos) no workspace ativo
  useEffect(() => {
    if (!activeWorkspace?.id) return
    const timeout = setTimeout(() => {
      window.agentCanvasAPI?.saveWorkspaceState(activeWorkspace.id, {
        nodes,
        cables: connections
      })
    }, 600)
    return () => clearTimeout(timeout)
  }, [nodes, connections, activeWorkspace])

  // Sincronizar notas do canvas com o Socket Server do CLI (agentcanvas note read / write)
  useEffect(() => {
    const noteItems = nodes
      .filter((n) => n.type === 'note')
      .map((n) => ({
        id: n.id,
        name: n.title,
        content: String(n.data?.content || '')
      }))

    window.agentCanvasAPI?.syncNotes(noteItems)
  }, [nodes])

  // Ouvir atualizações remotas de notas vindas do CLI
  useEffect(() => {
    const cleanup = window.agentCanvasAPI?.onRemoteNoteUpdate(({ name, content }) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.type === 'note' && n.title.toLowerCase() === name.toLowerCase()
            ? { ...n, data: { ...n.data, content } }
            : n
        )
      )
    })
    return () => {
      cleanup?.()
    }
  }, [setNodes])

  return (
    <div className="w-screen h-screen flex flex-col bg-canvas-bg overflow-hidden relative">
      {/* Top Application Toolbar */}
      <CanvasToolbar />

      {/* Main Infinite Canvas Plane */}
      <main className="flex-1 w-full h-full relative overflow-hidden">
        <InfiniteCanvas />
        <FloatingCanvasToolbars />
        <DockedSidebar />
        <PrompterBar />
        <Minimap />
      </main>

      {/* Global Modals & Command Palette */}
      <CommandPalette />
      <NewTerminalModal />
      <NewWorkspaceModal />
    </div>
  )
}

export default App
