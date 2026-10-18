import React, { useState } from 'react'
import { useAtom, useSetAtom, useStore } from 'jotai'
import {
  Terminal,
  StickyNote,
  Paperclip,
  Folder,
  Globe,
  Pencil,
  Edit3,
  MessageSquare,
  Maximize2,
  Minimize2,
  RotateCw,
  Trash2,
  Check,
  X
} from 'lucide-react'
import {
  nodesAtom,
  connectionsAtom,
  panAtom,
  zoomAtom,
  selectedNodeIdAtom,
  expandedNodeIdAtom,
  canvasModeAtom,
  sidebarOpenAtom,
  activeSidebarTabAtom,
  newTerminalModalOpenAtom,
  type CanvasNode
} from '../../state/canvas'
import { ConnectionsBadge } from '../canvas/ConnectionsBadge'

export const FloatingCanvasToolbars: React.FC = () => {
  const store = useStore()
  const [nodes, setNodes] = useAtom(nodesAtom)
  const setConnections = useSetAtom(connectionsAtom)
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom)
  const [expandedNodeId, setExpandedNodeId] = useAtom(expandedNodeIdAtom)
  const [canvasMode, setCanvasMode] = useAtom(canvasModeAtom)
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom)
  const setActiveSidebarTab = useSetAtom(activeSidebarTabAtom)
  const setNewTerminalModalOpen = useSetAtom(newTerminalModalOpenAtom)

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const isSelectedNodeExpanded = selectedNode ? expandedNodeId === selectedNode.id : false

  const getViewportCenter = (width: number, height: number) => {
    const pan = store.get(panAtom)
    const zoom = store.get(zoomAtom)
    const count = store.get(nodesAtom).length
    const cascadeOffset = (count % 5) * 24
    return {
      x: Math.round((-pan.x + window.innerWidth / 2 - width / 2) / zoom) + cascadeOffset,
      y: Math.round((-pan.y + (window.innerHeight - 48) / 2 - height / 2) / zoom) + cascadeOffset
    }
  }

  // Criar nova nota rápida centralizada no viewport
  const handleAddNote = () => {
    const id = `note-${Date.now().toString(36)}`
    const pos = getViewportCenter(460, 320)
    const newNode: CanvasNode = {
      id,
      type: 'note',
      title: `Nota ${nodes.filter((n) => n.type === 'note').length + 1}`,
      x: pos.x,
      y: pos.y,
      width: 460,
      height: 320,
      color: '#EC4899',
      data: {
        content: '# Nova Nota\n\nAdicione anotações, especificações ou comandos aqui.'
      }
    }
    setNodes((prev) => [...prev, newNode])
    setSelectedNodeId(id)
  }

  // Criar novo portal web navegador centralizado no viewport
  const handleAddPortal = () => {
    const id = `portal-${Date.now().toString(36)}`
    const pos = getViewportCenter(760, 520)
    const newNode: CanvasNode = {
      id,
      type: 'portal',
      title: 'Localhost',
      x: pos.x,
      y: pos.y,
      width: 760,
      height: 520,
      color: '#06B6D4',
      data: {
        url: 'http://localhost:5173'
      }
    }
    setNodes((prev) => [...prev, newNode])
    setSelectedNodeId(id)
  }

  // Criar bloco de texto / título centralizado no viewport
  const handleAddText = () => {
    const id = `note-text-${Date.now().toString(36)}`
    const pos = getViewportCenter(360, 200)
    const newNode: CanvasNode = {
      id,
      type: 'note',
      title: 'Texto',
      x: pos.x,
      y: pos.y,
      width: 360,
      height: 200,
      color: '#A855F7',
      data: {
        content: '### Título da Seção\n\nDigite uma breve anotação ou instrução.'
      }
    }
    setNodes((prev) => [...prev, newNode])
    setSelectedNodeId(id)
  }

  // Abrir arquivos na sidebar
  const handleToggleFiles = () => {
    setActiveSidebarTab('files')
    setSidebarOpen(!sidebarOpen)
  }

  // Focar e preencher o chat / prompter para o elemento selecionado
  const handleChatWithNode = () => {
    if (!selectedNode) return
    const prompter = document.getElementById('prompter-input') as HTMLInputElement | null
    if (prompter) {
      prompter.focus()
    }
  }

  // Confirmar renomeação do nó selecionado
  const handleSaveRename = () => {
    if (!selectedNode || !renameValue.trim()) {
      setIsRenaming(false)
      return
    }
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNode.id ? { ...n, title: renameValue.trim() } : n))
    )
    setIsRenaming(false)
  }

  // Recarregar / Reiniciar nó selecionado
  const handleReloadNode = () => {
    if (!selectedNode) return
    if (selectedNode.type === 'terminal') {
      window.agentCanvasAPI?.killTerminal(selectedNode.id)
    }
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, _reloadKey: Date.now() } }
          : n
      )
    )
  }

  // Excluir nó selecionado e seus cabos conectados
  const handleDeleteNode = () => {
    if (!selectedNode) return
    if (selectedNode.type === 'terminal') {
      window.agentCanvasAPI?.killTerminal(selectedNode.id)
    }
    const targetId = selectedNode.id
    setNodes((prev) => prev.filter((n) => n.id !== targetId))
    setConnections((prev) => prev.filter((c) => c.fromNodeId !== targetId && c.toNodeId !== targetId))
    if (expandedNodeId === targetId) {
      setExpandedNodeId(null)
    }
    setSelectedNodeId(null)
  }

  return (
    <>
      {/* 1. TOP FLOATING PILL TOOLBAR (Main Creation & Mode Tools) */}
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 pointer-events-auto select-none">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1B20]/95 border border-[#333238] shadow-2xl shadow-black/60">
          {/* Select / Pointer tool */}
          <button
            type="button"
            onClick={() => setCanvasMode('select')}
            className={`p-2 rounded-full transition-all ${
              canvasMode === 'select'
                ? 'text-[#3B82F6] bg-blue-500/10'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
            }`}
            title="Ferramenta Seleção / Mover (Cursor)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="3 3 10 21 14 13 21 10 3 3" />
            </svg>
          </button>

          {/* Terminal node creator */}
          <button
            type="button"
            onClick={() => setNewTerminalModalOpen(true)}
            className="p-2 rounded-full text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all"
            title="Criar Terminal / Agente"
          >
            <Terminal size={16} />
          </button>

          {/* Note / Scroll creator */}
          <button
            type="button"
            onClick={handleAddNote}
            className="p-2 rounded-full text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all"
            title="Criar Nota Adesiva"
          >
            <StickyNote size={16} />
          </button>

          {/* Attachment / Paperclip */}
          <button
            type="button"
            onClick={handleToggleFiles}
            className="p-2 rounded-full text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all"
            title="Anexar Arquivo / Explorador"
          >
            <Paperclip size={16} />
          </button>

          {/* Folder */}
          <button
            type="button"
            onClick={handleToggleFiles}
            className={`p-2 rounded-full transition-all ${
              sidebarOpen
                ? 'text-purple-400 bg-purple-500/10'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
            }`}
            title="Alternar Pastas e Arquivos"
          >
            <Folder size={16} />
          </button>

          {/* Browser Portal (Globe) */}
          <button
            type="button"
            onClick={handleAddPortal}
            className="p-2 rounded-full text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all"
            title="Abrir Navegador Web Portal (Localhost)"
          >
            <Globe size={16} />
          </button>

          {/* Text block (Aa) */}
          <button
            type="button"
            onClick={handleAddText}
            className="p-2 rounded-full text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all font-semibold text-xs tracking-tight flex items-center justify-center min-w-[32px] h-[32px]"
            title="Adicionar Bloco de Texto (Aa)"
          >
            Aa
          </button>

          {/* Pencil / Draw mode */}
          <button
            type="button"
            onClick={() => setCanvasMode(canvasMode === 'draw' ? 'select' : 'draw')}
            className={`p-2 rounded-full transition-all ${
              canvasMode === 'draw'
                ? 'text-[#8B5CF6] bg-purple-500/15'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
            }`}
            title="Modo Desenho / Anotação Rápida"
          >
            <Pencil size={16} />
          </button>
        </div>
      </div>

      {/* 2. BOTTOM FLOATING CONTEXTUAL TOOLBAR (Aparece SOMENTE quando um nó estiver selecionado) */}
      {selectedNode && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto select-none">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1B20]/95 border border-[#333238] shadow-2xl shadow-black/80">
            {/* Renomear / Editar Título */}
            {isRenaming ? (
              <div className="flex items-center gap-1 px-1">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename()
                    if (e.key === 'Escape') setIsRenaming(false)
                  }}
                  autoFocus
                  className="bg-[#121115] border border-purple-500/50 rounded-md px-2 py-0.5 text-xs text-purple-100 font-medium focus:outline-none focus:ring-1 focus:ring-purple-400 w-36"
                />
                <button
                  type="button"
                  onClick={handleSaveRename}
                  className="p-1 rounded text-emerald-400 hover:bg-emerald-500/20"
                  title="Salvar Nome"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="p-1 rounded text-gray-400 hover:bg-white/10"
                  title="Cancelar"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRenameValue(selectedNode.title)
                  setIsRenaming(true)
                }}
                className="p-2 rounded-full text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all"
                title="Editar Título / Renomear"
              >
                <Edit3 size={16} />
              </button>
            )}

            <div className="w-[1px] h-4 bg-[#38373E] mx-0.5" />

            {/* Chat / Prompter com o agente */}
            <button
              type="button"
              onClick={handleChatWithNode}
              className="p-2 rounded-full text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all"
              title="Conversar / Prompt com este elemento (Ctrl+L)"
            >
              <MessageSquare size={16} />
            </button>

            {/* Expandir / Tela Cheia (Duplo clique ou botão) */}
            <button
              type="button"
              onClick={() =>
                setExpandedNodeId(isSelectedNodeExpanded ? null : selectedNode.id)
              }
              className={`p-2 rounded-full transition-all ${
                isSelectedNodeExpanded
                  ? 'text-[#3B82F6] bg-blue-500/15'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
              }`}
              title={
                isSelectedNodeExpanded
                  ? 'Restaurar Tamanho (Esc ou Duplo Clique)'
                  : 'Expandir em Tela Cheia (Duplo Clique)'
              }
            >
              {isSelectedNodeExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <div className="w-[1px] h-4 bg-[#38373E] mx-0.5" />

            {/* Badge de conexões com contador azul idêntico ao Maestri */}
            <ConnectionsBadge nodeId={selectedNode.id} alwaysShow />

            <div className="w-[1px] h-4 bg-[#38373E] mx-0.5" />

            {/* Recarregar / Reiniciar */}
            <button
              type="button"
              onClick={handleReloadNode}
              className="p-2 rounded-full text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all"
              title="Reiniciar Terminal ou Recarregar Navegador"
            >
              <RotateCw size={16} />
            </button>

            <div className="w-[1px] h-4 bg-[#38373E] mx-0.5" />

            {/* Excluir (Vermelho vibrante idêntico ao Maestri) */}
            <button
              type="button"
              onClick={handleDeleteNode}
              className="p-2 rounded-full text-[#EF4444] hover:text-red-300 hover:bg-red-500/15 transition-all"
              title="Excluir Elemento (Delete)"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
export default FloatingCanvasToolbars
