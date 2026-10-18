import React from 'react'
import { useAtom, useSetAtom } from 'jotai'
import {
  Terminal,
  StickyNote,
  Globe,
  Minus,
  Square,
  X,
  RotateCcw,
  Menu,
  LayoutGrid,
  Map,
  Search
} from 'lucide-react'
import {
  nodesAtom,
  panAtom,
  zoomAtom,
  sidebarOpenAtom,
  commandPaletteOpenAtom,
  minimapOpenAtom,
  newTerminalModalOpenAtom,
  tidyNodes,
  type CanvasNode
} from '../../state/canvas'
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher'

export const CanvasToolbar: React.FC = () => {
  const [, setNodes] = useAtom(nodesAtom)
  const [pan, setPan] = useAtom(panAtom)
  const [zoom, setZoom] = useAtom(zoomAtom)
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom)
  const [minimapOpen, setMinimapOpen] = useAtom(minimapOpenAtom)
  const setNewTerminalModalOpen = useSetAtom(newTerminalModalOpenAtom)
  const setCommandPaletteOpen = useSetAtom(commandPaletteOpenAtom)

  const handleAddNote = () => {
    const id = `note-${Date.now().toString(36)}`
    setNodes((prev) => {
      const offset = (prev.length % 5) * 24
      return [
        ...prev,
        {
          id,
          type: 'note',
          title: `Nota (${prev.filter((n) => n.type === 'note').length + 1})`,
          x: Math.round((-pan.x + window.innerWidth / 2 - 240) / zoom) + offset,
          y: Math.round((-pan.y + (window.innerHeight - 48) / 2 - 160) / zoom) + offset,
          width: 480,
          height: 320,
          color: '#EC4899',
          data: { content: '# Nova Nota\n\nDescreva sua tarefa ou arquitetura aqui...' }
        }
      ]
    })
  }

  const handleAddPortal = () => {
    const id = `portal-${Date.now().toString(36)}`
    setNodes((prev) => {
      const offset = (prev.length % 5) * 24
      return [
        ...prev,
        {
          id,
          type: 'portal',
          title: `Portal Web (${prev.filter((n) => n.type === 'portal').length + 1})`,
          x: Math.round((-pan.x + window.innerWidth / 2 - 340) / zoom) + offset,
          y: Math.round((-pan.y + (window.innerHeight - 48) / 2 - 240) / zoom) + offset,
          width: 680,
          height: 480,
          color: '#06B6D4',
          data: { url: 'http://localhost:5173' }
        }
      ]
    })
  }

  const handleTidyNodes = () => {
    setNodes((prev) => tidyNodes(prev))
  }

  const handleResetView = () => {
    setPan({ x: 200, y: 150 })
    setZoom(1)
  }

  return (
    <header className="h-12 w-full bg-[#0B0914]/95 backdrop-blur-md border-b border-[#241D3B] flex items-center justify-between px-3 select-none z-40 drag-region">
      {/* Left: Sidebar Toggle, Brand & Workspace Switcher */}
      <div className="flex items-center gap-3 no-drag">
        {/* Sidebar Toggle */}
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`p-1.5 rounded-lg border transition-all ${
            sidebarOpen
              ? 'bg-[#291F47] border-[#8B5CF6] text-purple-200'
              : 'bg-[#151126] border-[#292042] text-gray-400 hover:text-white hover:bg-[#1E1733]'
          }`}
          title="Alternar Barra Lateral (Floors & Arquivos)"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-800 p-1 flex items-center justify-center shadow-neon-purple shrink-0">
            <svg viewBox="0 0 512 512" className="w-full h-full text-white">
              <rect x="64" y="64" width="384" height="384" rx="96" fill="#161228" stroke="#A855F7" strokeWidth="24" />
              <circle cx="200" cy="230" r="32" fill="#C084FC" />
              <circle cx="312" cy="230" r="32" fill="#C084FC" />
              <path d="M 220 290 Q 256 320, 292 290" fill="none" stroke="#E9D5FF" strokeWidth="16" strokeLinecap="round" />
              <path d="M 120 256 C 180 200, 220 320, 256 256 C 292 192, 332 312, 392 256" fill="none" stroke="#8B5CF6" strokeWidth="16" opacity="0.8" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold tracking-wider text-purple-100 hidden sm:inline">
              AgentCanvas
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-400 border border-purple-800/60 hidden sm:inline">
              v1.0
            </span>
          </div>
        </div>

        <div className="w-[1px] h-4 bg-[#2A2344] mx-0.5" />

        {/* Multi-workspace Switcher Dropdown */}
        <WorkspaceSwitcher />
      </div>

      {/* Center: Action Buttons */}
      <div className="flex items-center gap-1.5 no-drag bg-[#130F22] p-1 rounded-xl border border-[#241D3B]">
        <button
          type="button"
          onClick={() => setNewTerminalModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-purple-200 bg-[#1D1733] hover:bg-[#2B224C] hover:text-white transition-all shadow-sm group"
        >
          <Terminal className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
          <span>+ Terminal</span>
        </button>

        <button
          type="button"
          onClick={handleAddNote}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-purple-200 bg-[#1D1733] hover:bg-[#2B224C] hover:text-white transition-all shadow-sm group"
        >
          <StickyNote className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>+ Nota</span>
        </button>

        <button
          type="button"
          onClick={handleAddPortal}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-purple-200 bg-[#1D1733] hover:bg-[#2B224C] hover:text-white transition-all shadow-sm group"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>+ Portal</span>
        </button>

        <div className="w-[1px] h-4 bg-[#2A2344] mx-1" />

        {/* Tidy Nodes */}
        <button
          type="button"
          onClick={handleTidyNodes}
          className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-[#241D3B] transition-colors"
          title="Tidy: Organizar Nós Automaticamente em Grade"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>

        {/* Reset / Center View */}
        <button
          type="button"
          onClick={handleResetView}
          className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-[#241D3B] transition-colors"
          title="Centralizar Visualização"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Minimap Toggle */}
        <button
          type="button"
          onClick={() => setMinimapOpen(!minimapOpen)}
          className={`p-1.5 rounded-lg transition-colors ${
            minimapOpen
              ? 'text-purple-300 bg-[#241D3B]'
              : 'text-gray-400 hover:text-white hover:bg-[#241D3B]'
          }`}
          title="Alternar Minimapa Radar"
        >
          <Map className="w-3.5 h-3.5" />
        </button>

        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-gray-400 hover:text-purple-200 hover:bg-[#241D3B] transition-colors"
          title="Paleta de Comandos (Ctrl+K)"
        >
          <Search className="w-3 h-3 text-purple-400" />
          <kbd className="font-mono text-[10px] text-gray-500">Ctrl+K</kbd>
        </button>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-1 no-drag">
        <button
          type="button"
          onClick={() => window.agentCanvasAPI?.minimize()}
          className="p-1.5 rounded-md text-purple-300 hover:text-white hover:bg-[#241D3B] transition-colors"
          title="Minimizar"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => window.agentCanvasAPI?.toggleMaximize()}
          className="p-1.5 rounded-md text-purple-300 hover:text-white hover:bg-[#241D3B] transition-colors"
          title="Maximizar"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => window.agentCanvasAPI?.close()}
          className="p-1.5 rounded-md text-purple-300 hover:text-white hover:bg-rose-600 transition-colors"
          title="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  )
}
