import React, { useState, useEffect } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import {
  sidebarOpenAtom,
  activeSidebarTabAtom,
  activeWorkspaceAtom,
  nodesAtom,
  panAtom,
  zoomAtom,
  type CanvasNode
} from '../../state/canvas'
import {
  GitBranch,
  FolderTree,
  X,
  Plus,
  GitCommit,
  CheckCircle,
  FileText,
  Folder,
  FolderOpen as FolderOpenIcon,
  ChevronRight,
  ChevronDown
} from 'lucide-react'

interface FileTreeItemProps {
  item: any
  onOpenFileAsNote: (file: any) => void
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ item, onOpenFileAsNote }) => {
  const [isOpen, setIsOpen] = useState(false)

  if (item.isDirectory) {
    return (
      <div>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-[#201A35] cursor-pointer text-gray-300 hover:text-white transition-colors"
        >
          {isOpen ? (
            <ChevronDown size={13} className="text-gray-500" />
          ) : (
            <ChevronRight size={13} className="text-gray-500" />
          )}
          {isOpen ? (
            <FolderOpenIcon size={14} className="text-purple-400" />
          ) : (
            <Folder size={14} className="text-purple-400" />
          )}
          <span className="truncate text-xs font-medium">{item.name}</span>
        </div>
        {isOpen && item.children && (
          <div className="pl-4 border-l border-[#2B2347] ml-2 mt-0.5 space-y-0.5">
            {item.children.map((child: any) => (
              <FileTreeItem key={child.path} item={child} onOpenFileAsNote={onOpenFileAsNote} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={() => onOpenFileAsNote(item)}
      className="flex items-center gap-1.5 py-1 px-2 pl-5 rounded-md hover:bg-[#201A35] hover:text-purple-300 cursor-pointer text-gray-400 transition-colors group"
      title="Clique duplo para abrir como Nota no Canvas"
    >
      <FileText size={13} className="text-gray-500 group-hover:text-purple-400 shrink-0" />
      <span className="truncate text-xs">{item.name}</span>
    </div>
  )
}

export const DockedSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(sidebarOpenAtom)
  const [activeTab, setActiveTab] = useAtom(activeSidebarTabAtom)
  const [activeWorkspace] = useAtom(activeWorkspaceAtom)
  const setNodes = useSetAtom(nodesAtom)
  const [pan] = useAtom(panAtom)
  const [zoom] = useAtom(zoomAtom)

  const [floors, setFloors] = useState<any[]>([])
  const [fileTree, setFileTree] = useState<any[]>([])
  const [newFloorName, setNewFloorName] = useState('')
  const [showNewFloorInput, setShowNewFloorInput] = useState(false)

  // Carregar floors e file tree
  useEffect(() => {
    if (!isOpen) return

    const loadData = async () => {
      try {
        const floorList = await window.agentCanvasAPI.listFloors()
        setFloors(floorList || [])

        const tree = await window.agentCanvasAPI.listFileTree(activeWorkspace?.rootPath)
        setFileTree(tree || [])
      } catch (err) {
        console.error('Erro ao carregar dados da sidebar:', err)
      }
    }
    loadData()
  }, [isOpen, activeWorkspace])

  if (!isOpen) return null

  const handleCreateFloor = async () => {
    if (!newFloorName.trim()) return
    try {
      await window.agentCanvasAPI.createFloor(newFloorName.trim())
      const updated = await window.agentCanvasAPI.listFloors()
      setFloors(updated || [])
      setNewFloorName('')
      setShowNewFloorInput(false)
    } catch (e) {
      console.error('Erro ao criar floor:', e)
    }
  }

  const handleLandFloor = async (floorPath: string) => {
    try {
      await window.agentCanvasAPI.landFloor(floorPath, 'main')
      const updated = await window.agentCanvasAPI.listFloors()
      setFloors(updated || [])
    } catch (e) {
      console.error('Erro ao dar land no floor:', e)
    }
  }

  const handleOpenFileAsNote = async (file: any) => {
    try {
      const content = await window.agentCanvasAPI.readFileContent(file.path)
      if (content === null) return

      const spawnX = Math.round((-pan.x + window.innerWidth / 2 - 250) / zoom)
      const spawnY = Math.round((-pan.y + window.innerHeight / 2 - 150) / zoom)

      const newNote: CanvasNode = {
        id: `note-${Date.now().toString(36)}`,
        type: 'note',
        title: file.name,
        x: spawnX,
        y: spawnY,
        width: 540,
        height: 380,
        color: '#EC4899',
        data: {
          content: `### 📄 ${file.name}\n\n\`\`\`${file.extension?.replace('.', '') || 'text'}\n${content}\n\`\`\``
        }
      }

      setNodes((prev) => [...prev, newNote])
    } catch (e) {
      console.error('Erro ao abrir arquivo como nota:', e)
    }
  }

  return (
    <div className="absolute top-12 left-0 bottom-0 w-80 bg-[#0F0C1B] border-r border-[#261E3D] z-30 flex flex-col shadow-2xl backdrop-blur-md select-none">
      {/* Sidebar Header & Tabs */}
      <div className="flex items-center justify-between p-3 border-b border-[#221B38]">
        <div className="flex gap-1 bg-[#181329] p-1 rounded-lg border border-[#2B2245]">
          <button
            type="button"
            onClick={() => setActiveTab('floors')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'floors'
                ? 'bg-[#291F47] text-purple-200 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <GitBranch size={13} />
            Floors
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'files'
                ? 'bg-[#291F47] text-purple-200 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FolderTree size={13} />
            Arquivos
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#201A35] transition-colors"
          title="Fechar Barra Lateral"
        >
          <X size={15} />
        </button>
      </div>

      {/* Tab: Floors (Git Worktrees) */}
      {activeTab === 'floors' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Worktrees Ativos ({floors.length})
            </span>
            <button
              type="button"
              onClick={() => setShowNewFloorInput(!showNewFloorInput)}
              className="p-1 rounded-md text-purple-400 hover:text-white hover:bg-[#251E3D] transition-colors"
              title="Adicionar Floor"
            >
              <Plus size={14} />
            </button>
          </div>

          {showNewFloorInput && (
            <div className="p-3 bg-[#181329] border border-[#352954] rounded-xl space-y-2">
              <input
                type="text"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                placeholder="nome-da-branch"
                className="w-full px-2.5 py-1.5 bg-[#100D1C] border border-[#2B2147] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFloorInput(false)}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateFloor}
                  className="px-3 py-1 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold rounded-md"
                >
                  Criar Floor
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {floors.map((floor) => (
              <div
                key={floor.path}
                className="p-3 rounded-xl bg-[#161226] border border-[#281F42] hover:border-[#8B5CF6]/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-purple-200">
                    <GitCommit size={13} className="text-purple-400" />
                    <span>{floor.branch}</span>
                  </div>
                  {floor.isMain && (
                    <span className="text-[10px] bg-purple-900/40 text-purple-300 border border-purple-600/30 px-1.5 py-0.5 rounded font-mono">
                      MAIN
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-gray-500 truncate mb-2">
                  {floor.path}
                </div>
                {!floor.isMain && (
                  <button
                    type="button"
                    onClick={() => handleLandFloor(floor.path)}
                    className="w-full py-1 text-[11px] font-medium bg-[#221A3B] hover:bg-[#2C214C] text-purple-300 rounded-lg border border-[#3E2F66] transition-colors"
                  >
                    Land Floor (Merge & Clean)
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Arquivos (File Tree) */}
      {activeTab === 'files' && (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Arquivos do Projeto
          </div>
          <div className="space-y-0.5">
            {fileTree.map((item) => (
              <FileTreeItem key={item.path} item={item} onOpenFileAsNote={handleOpenFileAsNote} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
