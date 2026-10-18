import React, { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Plus, Terminal, StickyNote, GitBranch, Minus, Square, X, RotateCcw } from 'lucide-react'
import { nodesAtom, panAtom, zoomAtom } from '../../state/canvas'

export const CanvasToolbar: React.FC = () => {
  const [, setNodes] = useAtom(nodesAtom)
  const [, setPan] = useAtom(panAtom)
  const [, setZoom] = useAtom(zoomAtom)
  const [floors, setFloors] = useState<Array<{ name: string; isMain: boolean }>>([])
  const [activeFloor, setActiveFloor] = useState('Main Floor')

  useEffect(() => {
    window.agentCanvasAPI?.listFloors().then((f) => {
      setFloors(f)
      const current = f.find((item) => item.isMain)
      if (current) setActiveFloor(current.name)
    })
  }, [])

  const handleAddTerminal = () => {
    const id = `term-${Date.now()}`
    setNodes((prev) => [
      ...prev,
      {
        id,
        type: 'terminal',
        title: `Terminal Agent (${prev.filter((n) => n.type === 'terminal').length + 1})`,
        x: 200 + Math.random() * 80,
        y: 180 + Math.random() * 80,
        width: 600,
        height: 380,
        data: { terminalId: id, shell: 'bash' }
      }
    ])
  }

  const handleAddNote = () => {
    const id = `note-${Date.now()}`
    setNodes((prev) => [
      ...prev,
      {
        id,
        type: 'note',
        title: `Nota (${prev.filter((n) => n.type === 'note').length + 1})`,
        x: 350 + Math.random() * 80,
        y: 240 + Math.random() * 80,
        width: 480,
        height: 320,
        data: { content: '# Nova Nota\n\nDescreva sua tarefa ou arquitetura aqui...' }
      }
    ])
  }

  const handleResetView = () => {
    setPan({ x: 200, y: 150 })
    setZoom(1)
  }

  return (
    <header className="h-12 w-full bg-[#0B0914]/90 backdrop-blur-md border-b border-[#241D3B] flex items-center justify-between px-3 select-none z-50 drag-region">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-2.5 no-drag">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-800 p-1 flex items-center justify-center shadow-neon-purple">
          <svg viewBox="0 0 512 512" className="w-full h-full text-white">
            <rect x="64" y="64" width="384" height="384" rx="96" fill="#161228" stroke="#A855F7" strokeWidth="24" />
            <circle cx="200" cy="230" r="32" fill="#C084FC" />
            <circle cx="312" cy="230" r="32" fill="#C084FC" />
            <path d="M 220 290 Q 256 320, 292 290" fill="none" stroke="#E9D5FF" strokeWidth="16" strokeLinecap="round" />
            <path d="M 120 256 C 180 200, 220 320, 256 256 C 292 192, 332 312, 392 256" fill="none" stroke="#8B5CF6" strokeWidth="16" opacity="0.8" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-wider text-purple-100 flex items-center gap-1.5">
            AgentCanvas
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-400 border border-purple-800/60">
              v1.0
            </span>
          </span>
        </div>
      </div>

      {/* Center: Action Buttons */}
      <div className="flex items-center gap-1.5 no-drag bg-[#130F22] p-1 rounded-xl border border-[#241D3B]">
        <button
          onClick={handleAddTerminal}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-purple-200 bg-[#1D1733] hover:bg-[#2B224C] hover:text-white transition-all shadow-sm"
        >
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span>+ Terminal</span>
        </button>

        <button
          onClick={handleAddNote}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-purple-200 bg-[#1D1733] hover:bg-[#2B224C] hover:text-white transition-all shadow-sm"
        >
          <StickyNote className="w-3.5 h-3.5 text-amber-400" />
          <span>+ Nota</span>
        </button>

        <div className="w-[1px] h-4 bg-[#2A2344] mx-1" />

        <button
          onClick={handleResetView}
          className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-[#241D3B] transition-colors"
          title="Centralizar Visualização"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-purple-300 bg-[#18132B]">
          <GitBranch className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-mono text-[11px]">{activeFloor}</span>
        </div>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={() => window.agentCanvasAPI?.minimize()}
          className="p-1.5 rounded-md text-purple-300 hover:text-white hover:bg-[#241D3B] transition-colors"
          title="Minimizar"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => window.agentCanvasAPI?.toggleMaximize()}
          className="p-1.5 rounded-md text-purple-300 hover:text-white hover:bg-[#241D3B] transition-colors"
          title="Maximizar"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
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
