import React, { useEffect } from 'react'
import { useAtom } from 'jotai'
import { CanvasToolbar } from './components/toolbar/CanvasToolbar'
import { InfiniteCanvas } from './components/canvas/InfiniteCanvas'
import { nodesAtom } from './state/canvas'

export const App: React.FC = () => {
  const [nodes, setNodes] = useAtom(nodesAtom)

  // Sync canvas notes with the Socket Server for the CLI
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

  // Listen to remote note changes from CLI (e.g. `agentcanvas note write`)
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
    return () => cleanup?.()
  }, [setNodes])

  return (
    <div className="w-screen h-screen flex flex-col bg-canvas-bg overflow-hidden">
      <CanvasToolbar />
      <main className="flex-1 w-full h-full relative overflow-hidden">
        <InfiniteCanvas />
      </main>
    </div>
  )
}

export default App
