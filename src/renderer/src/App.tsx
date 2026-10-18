import React, { useEffect, useMemo } from 'react'
import { useAtom, useAtomValue, useStore } from 'jotai'
import { CanvasToolbar } from './components/toolbar/CanvasToolbar'
import { InfiniteCanvas } from './components/canvas/InfiniteCanvas'
import { DockedSidebar } from './components/sidebar/DockedSidebar'
import { PrompterBar } from './components/prompter/PrompterBar'
import { Minimap } from './components/canvas/Minimap'
import { CommandPalette } from './components/palette/CommandPalette'
import { NewTerminalModal } from './components/terminal/NewTerminalModal'
import { NewWorkspaceModal } from './components/workspace/NewWorkspaceModal'
import { FloatingCanvasToolbars } from './components/toolbar/FloatingCanvasToolbars'
import {
  nodesAtom,
  connectionsAtom,
  activeWorkspaceAtom,
  selectedNodeIdAtom,
  expandedNodeIdAtom,
  minimapOpenAtom
} from './state/canvas'

export const App: React.FC = () => {
  const store = useStore()
  const [nodes, setNodes] = useAtom(nodesAtom)
  const [connections, setConnections] = useAtom(connectionsAtom)
  const activeWorkspace = useAtomValue(activeWorkspaceAtom)

  // Persistir automaticamente o estado (nós e cabos) no workspace ativo (com debounce)
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

  // Extrair apenas id/title/content das notas para não disparar IPC ao arrastar/mover nós
  const notePayloadKey = useMemo(() => {
    return JSON.stringify(
      nodes
        .filter((n) => n.type === 'note')
        .map((n) => ({
          id: n.id,
          name: n.title,
          content: String(n.data?.content || '')
        }))
    )
  }, [nodes])

  // Sincronizar notas do canvas com o Socket Server do CLI somente quando o conteúdo/título mudar
  useEffect(() => {
    try {
      const noteItems = JSON.parse(notePayloadKey)
      window.agentCanvasAPI?.syncNotes(noteItems)
    } catch {}
  }, [notePayloadKey])

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

  // Atalhos globais de teclado (Ctrl+Shift+M, Ctrl+L, Delete, Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+M -> Alternar Minimapa
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        store.set(minimapOpenAtom, (prev) => !prev)
        return
      }

      // Ctrl+L -> Focar na barra de prompt / chat rápido
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        const prompter = document.getElementById('prompter-input') as HTMLInputElement | null
        prompter?.focus()
        return
      }

      // Ignorar Delete/Escape se o foco estiver dentro de um input, textarea ou terminal interativo
      const activeEl = document.activeElement as HTMLElement | null
      const isTyping =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable ||
          activeEl.closest('.xterm'))

      if (e.key === 'Escape') {
        const expandedId = store.get(expandedNodeIdAtom)
        if (expandedId) {
          e.preventDefault()
          store.set(expandedNodeIdAtom, null)
          return
        }
        if (!isTyping) {
          store.set(selectedNodeIdAtom, null)
        }
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping) {
        const selectedId = store.get(selectedNodeIdAtom)
        if (!selectedId) return
        e.preventDefault()
        const currentNodes = store.get(nodesAtom)
        const target = currentNodes.find((n) => n.id === selectedId)
        if (target?.type === 'terminal') {
          window.agentCanvasAPI?.killTerminal(selectedId)
        }
        setNodes((prev) => prev.filter((n) => n.id !== selectedId))
        setConnections((prev) =>
          prev.filter((c) => c.fromNodeId !== selectedId && c.toNodeId !== selectedId)
        )
        store.set(selectedNodeIdAtom, null)
        if (store.get(expandedNodeIdAtom) === selectedId) {
          store.set(expandedNodeIdAtom, null)
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [store, setNodes, setConnections])

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
