import React, { useState, useEffect } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import {
  workspacesAtom,
  activeWorkspaceAtom,
  newWorkspaceModalOpenAtom,
  nodesAtom,
  connectionsAtom,
  type WorkspaceItem
} from '../../state/canvas'
import { ChevronDown, Folder, Plus, Check } from 'lucide-react'

export const WorkspaceSwitcher: React.FC = () => {
  const [workspaces, setWorkspaces] = useAtom(workspacesAtom)
  const [activeWorkspace, setActiveWorkspace] = useAtom(activeWorkspaceAtom)
  const setNewWorkspaceModalOpen = useSetAtom(newWorkspaceModalOpenAtom)
  const setNodes = useSetAtom(nodesAtom)
  const setConnections = useSetAtom(connectionsAtom)
  const [isOpen, setIsOpen] = useState(false)

  // Carregar workspaces do backend Electron ao montar
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const list = await window.agentCanvasAPI.listWorkspaces()
        setWorkspaces(list)
        const active = await window.agentCanvasAPI.getActiveWorkspace()
        if (active) {
          setActiveWorkspace(active)
          if (active.state?.nodes) {
            setNodes(active.state.nodes)
          }
          if (active.state?.cables) {
            setConnections(active.state.cables)
          }
        }
      } catch (err) {
        console.error('Erro ao carregar workspaces:', err)
      }
    }
    loadWorkspaces()
  }, [setWorkspaces, setActiveWorkspace, setNodes, setConnections])

  const handleSwitch = async (ws: WorkspaceItem) => {
    try {
      const switched = await window.agentCanvasAPI.switchWorkspace(ws.id)
      if (switched) {
        setActiveWorkspace(switched)
        if (switched.state?.nodes) {
          setNodes(switched.state.nodes)
        }
        if (switched.state?.cables) {
          setConnections(switched.state.cables)
        }
      }
      setIsOpen(false)
    } catch (e) {
      console.error('Erro ao alternar workspace:', e)
    }
  }

  const currentName = activeWorkspace?.name || 'Espaço de Trabalho'

  return (
    <div className="relative inline-block text-xs select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181427] hover:bg-[#221C38] border border-[#2D234A] hover:border-[#8B5CF6] transition-all text-white font-medium shadow-sm group"
      >
        <Folder size={14} className="text-purple-400 group-hover:text-purple-300" />
        <span className="font-semibold tracking-wide text-purple-100">{currentName}</span>
        <ChevronDown size={14} className="text-gray-400 group-hover:text-purple-300" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-72 bg-[#120F1D] border border-[#3B2F63] rounded-xl shadow-2xl p-2 z-50 backdrop-blur-md">
            <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-[#251F3D]">
              Espaços de Trabalho
            </div>

            <div className="mt-1 space-y-1 max-h-56 overflow-y-auto">
              {workspaces.map((ws) => {
                const isActive = activeWorkspace?.id === ws.id
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => handleSwitch(ws)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-[#251F3D] text-purple-200 border border-[#8B5CF6]/50'
                        : 'text-gray-300 hover:bg-[#181427] hover:text-white'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold text-xs truncate">{ws.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono truncate">{ws.rootPath}</div>
                    </div>
                    {isActive && <Check size={14} className="text-purple-400 shrink-0" />}
                  </button>
                )
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-[#251F3D]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setNewWorkspaceModalOpen(true)
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/40 text-purple-300 text-xs font-semibold transition-colors"
              >
                <Plus size={14} />
                Novo Espaço de Trabalho
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
