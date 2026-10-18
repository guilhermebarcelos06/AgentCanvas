import React, { useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import {
  newWorkspaceModalOpenAtom,
  workspacesAtom,
  activeWorkspaceAtom,
  nodesAtom,
  connectionsAtom
} from '../../state/canvas'
import { FolderOpen } from 'lucide-react'

export const NewWorkspaceModal: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(newWorkspaceModalOpenAtom)
  const setWorkspaces = useSetAtom(workspacesAtom)
  const setActiveWorkspace = useSetAtom(activeWorkspaceAtom)
  const setNodes = useSetAtom(nodesAtom)
  const setConnections = useSetAtom(connectionsAtom)

  const [name, setName] = useState('')
  const [rootPath, setRootPath] = useState('')

  if (!isOpen) return null

  const handlePickDirectory = async () => {
    try {
      const picked = await window.agentCanvasAPI.pickDirectory()
      if (picked) {
        setRootPath(picked)
        if (!name) {
          const parts = picked.split(/[\\/]/)
          setName(parts[parts.length - 1] || 'Novo Workspace')
        }
      }
    } catch (e) {
      console.error('Erro ao selecionar pasta:', e)
    }
  }

  const handleCreate = async () => {
    if (!rootPath.trim()) return
    try {
      const newWs = await window.agentCanvasAPI.createWorkspace(
        name.trim() || 'Novo Workspace',
        rootPath.trim()
      )
      if (newWs) {
        setWorkspaces((prev) => [...prev, newWs])
        setActiveWorkspace(newWs)
        setNodes([])
        setConnections([])
      }
      setIsOpen(false)
      setName('')
      setRootPath('')
    } catch (e) {
      console.error('Erro ao criar workspace:', e)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-[#120F1D] border border-[#2D2447] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-sm text-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#221C38]">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            Cancelar
          </button>
          <h2 className="text-base font-bold text-white tracking-wide">Novo Espaço de Trabalho</h2>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!rootPath.trim()}
            className="px-4 py-1.5 text-sm font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-all shadow-md shadow-purple-900/30"
          >
            Criar
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Nome do Espaço de Trabalho
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex.: Procedi, Meu App, facu"
              className="w-full px-3.5 py-2.5 bg-[#181427] border border-[#2D234A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Diretório do Projeto (Pasta Raiz)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={rootPath}
                onChange={(e) => setRootPath(e.target.value)}
                placeholder="/home/usuario/meu-projeto"
                className="flex-1 px-3.5 py-2.5 bg-[#181427] border border-[#2D234A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] font-mono text-xs transition-all"
              />
              <button
                type="button"
                onClick={handlePickDirectory}
                className="px-3.5 py-2 bg-[#251E3D] hover:bg-[#322852] border border-[#3E2F66] rounded-xl text-xs font-medium text-purple-200 flex items-center gap-1.5 transition-colors shrink-0"
              >
                <FolderOpen size={14} className="text-purple-400" />
                Procurar...
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
