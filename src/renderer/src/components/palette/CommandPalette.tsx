import React, { useState, useEffect } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import {
  commandPaletteOpenAtom,
  newTerminalModalOpenAtom,
  sidebarOpenAtom,
  minimapOpenAtom,
  nodesAtom,
  panAtom,
  zoomAtom,
  tidyNodes,
  type CanvasNode
} from '../../state/canvas'
import {
  Terminal,
  StickyNote,
  Globe,
  Grid,
  Maximize2,
  FolderTree,
  Search,
  Map
} from 'lucide-react'

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(commandPaletteOpenAtom)
  const setNewTerminalModalOpen = useSetAtom(newTerminalModalOpenAtom)
  const setSidebarOpen = useSetAtom(sidebarOpenAtom)
  const setMinimapOpen = useSetAtom(minimapOpenAtom)
  const [nodes, setNodes] = useAtom(nodesAtom)
  const setPan = useSetAtom(panAtom)
  const setZoom = useSetAtom(zoomAtom)

  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Listener para Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setIsOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  if (!isOpen) return null

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
    setSearch('')
  }

  const commands = [
    {
      id: 'new-terminal',
      title: 'Novo Terminal (Claude, Codex, Antigravity, Shell...)',
      icon: Terminal,
      shortcut: 'T',
      action: () => setNewTerminalModalOpen(true)
    },
    {
      id: 'new-note',
      title: 'Nova Nota Markdown com Mermaid',
      icon: StickyNote,
      shortcut: 'N',
      action: () => {
        const id = `note-${Date.now().toString(36)}`
        const newNote: CanvasNode = {
          id,
          type: 'note',
          title: 'Nova Nota',
          x: 400,
          y: 300,
          width: 480,
          height: 320,
          color: '#EC4899',
          data: {
            content: '# Nova Nota\n\nComece a escrever...'
          }
        }
        setNodes((prev) => [...prev, newNote])
      }
    },
    {
      id: 'new-portal',
      title: 'Novo Browser Portal (Localhost / Web)',
      icon: Globe,
      shortcut: 'P',
      action: () => {
        const id = `portal-${Date.now().toString(36)}`
        const newPortal: CanvasNode = {
          id,
          type: 'portal',
          title: 'Browser Portal',
          x: 450,
          y: 250,
          width: 720,
          height: 500,
          color: '#06B6D4',
          data: {
            url: 'http://localhost:5173'
          }
        }
        setNodes((prev) => [...prev, newPortal])
      }
    },
    {
      id: 'tidy-nodes',
      title: 'Tidy Canvas: Auto-Organizar Nós em Grade Harmônica',
      icon: Grid,
      shortcut: 'Ctrl+Shift+T',
      action: () => setNodes((prev) => tidyNodes(prev))
    },
    {
      id: 'toggle-sidebar',
      title: 'Alternar Barra Lateral (Floors & Arquivos)',
      icon: FolderTree,
      shortcut: 'Ctrl+B',
      action: () => setSidebarOpen((prev) => !prev)
    },
    {
      id: 'toggle-minimap',
      title: 'Alternar Radar Minimapa',
      icon: Map,
      shortcut: 'M',
      action: () => setMinimapOpen((prev) => !prev)
    },
    {
      id: 'reset-zoom',
      title: 'Resetar Zoom do Canvas para 100%',
      icon: Maximize2,
      shortcut: '0',
      action: () => {
        setZoom(1)
        setPan({ x: 150, y: 100 })
      }
    }
  ]

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        handleAction(filtered[selectedIndex].action)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl bg-[#120F1D] border border-[#3B2F63] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-sm text-gray-200">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#241D3B]">
          <Search size={18} className="text-purple-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Digite um comando ou ação... (ex.: terminal, tidy, nota)"
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] bg-[#1E1733] border border-[#362757] rounded text-gray-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-gray-500 text-xs">
              Nenhum comando encontrado para &quot;{search}&quot;
            </div>
          ) : (
            filtered.map((cmd, index) => {
              const IconComp = cmd.icon
              const isHighlighted = index === selectedIndex
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => handleAction(cmd.action)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors group ${
                    isHighlighted
                      ? 'bg-[#291F47] text-purple-100 border border-purple-500/50'
                      : 'hover:bg-[#1E1733] hover:text-purple-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate mr-2">
                    <div className="p-1.5 rounded-lg bg-[#181329] border border-[#2F234F] text-purple-400 group-hover:border-[#8B5CF6]">
                      <IconComp size={15} />
                    </div>
                    <span className="font-medium text-xs truncate text-gray-200 group-hover:text-white">
                      {cmd.title}
                    </span>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="px-2 py-0.5 text-[10px] bg-[#161226] border border-[#2D214D] rounded text-gray-400 font-mono shrink-0">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
