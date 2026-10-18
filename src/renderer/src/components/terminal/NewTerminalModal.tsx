import React, { useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import {
  newTerminalModalOpenAtom,
  nodesAtom,
  panAtom,
  zoomAtom,
  activeWorkspaceAtom,
  type CanvasNode
} from '../../state/canvas'
import {
  Sparkles,
  Terminal,
  Brain,
  Smartphone,
  FolderOpen,
  CheckCircle2
} from 'lucide-react'

// Presets idênticos aos identificados no Maestri
const QUICK_PRESETS = [
  {
    id: 'claude',
    name: 'Claude Code',
    command: 'claude',
    icon: CheckCircle2,
    color: '#8B5CF6'
  },
  {
    id: 'codex',
    name: 'Codex',
    command: 'codex --no-daemon',
    icon: Brain,
    color: '#3B82F6'
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    command: 'agy',
    icon: Sparkles,
    color: '#A855F7'
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    command: 'opencode',
    icon: Smartphone,
    color: '#EC4899'
  },
  {
    id: 'shell',
    name: 'Shell',
    command: '',
    icon: Terminal,
    color: '#10B981'
  }
]

export const NewTerminalModal: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(newTerminalModalOpenAtom)
  const setNodes = useSetAtom(nodesAtom)
  const [pan] = useAtom(panAtom)
  const [zoom] = useAtom(zoomAtom)
  const [activeWorkspace] = useAtom(activeWorkspaceAtom)

  const defaultDir = activeWorkspace?.rootPath || ''

  const [activeTab, setActiveTab] = useState<'details' | 'appearance' | 'agent'>('details')
  const [selectedPreset, setSelectedPreset] = useState<string>('claude')
  const [name, setName] = useState('Claude Code')
  const [command, setCommand] = useState('claude')
  const [execEnvironment, setExecEnvironment] = useState('workspace-default')
  const [workingDir, setWorkingDir] = useState(defaultDir)
  const [monitorActivity, setMonitorActivity] = useState(true)
  const [isMaestro, setIsMaestro] = useState(false)
  const [accentColor, setAccentColor] = useState('#8B5CF6')

  if (!isOpen) return null

  const handleSelectPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    setSelectedPreset(preset.id)
    setName(preset.name)
    setCommand(preset.command)
    setAccentColor(preset.color)
  }

  const handlePickDirectory = async () => {
    try {
      const picked = await window.agentCanvasAPI.pickDirectory()
      if (picked) {
        setWorkingDir(picked)
        setExecEnvironment('custom')
      }
    } catch (e) {
      console.error('Falha ao selecionar pasta:', e)
    }
  }

  const handleCreate = async () => {
    const termId = `term-${Date.now().toString(36)}`
    const targetCwd = workingDir.trim() || defaultDir || process.cwd()

    // Spawn do processo PTY no backend Electron (com auto-run do comando informado)
    try {
      await window.agentCanvasAPI.spawnTerminal({
        id: termId,
        name: name.trim() || 'Terminal',
        cwd: targetCwd,
        command: command.trim() || undefined,
        isMaestro
      })
    } catch (err) {
      console.error('Erro ao spawnar terminal:', err)
    }

    // Posicionar no centro do viewport visível
    const spawnX = Math.round((-pan.x + window.innerWidth / 2 - 310) / zoom)
    const spawnY = Math.round((-pan.y + window.innerHeight / 2 - 210) / zoom)

    const newNode: CanvasNode = {
      id: termId,
      type: 'terminal',
      title: name.trim() || 'Terminal',
      x: spawnX,
      y: spawnY,
      width: 640,
      height: 440,
      color: accentColor,
      isMaestro,
      command: command.trim() || undefined,
      cwd: targetCwd,
      data: {
        terminalId: termId,
        shell: 'bash'
      }
    }

    setNodes((prev) => [...prev, newNode])
    setIsOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-[#120F1D] border border-[#2D2447] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-sm text-gray-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#221C38]">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            Cancelar
          </button>
          <h2 className="text-base font-bold text-white tracking-wide">Novo terminal</h2>
          <button
            type="button"
            onClick={handleCreate}
            className="px-4 py-1.5 text-sm font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] active:bg-[#6D28D9] rounded-lg transition-all shadow-md shadow-purple-900/30"
          >
            Criar
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Início Rápido Section */}
          <div>
            <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">
              Início Rápido
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {QUICK_PRESETS.map((p) => {
                const IconComponent = p.icon
                const isSelected = selectedPreset === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#221A3B] border-[#8B5CF6] text-white shadow-lg shadow-purple-900/40 ring-1 ring-[#8B5CF6]'
                        : 'bg-[#181427] border-[#292042] text-gray-400 hover:bg-[#1E1733] hover:text-gray-200'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mb-1.5" style={{ color: p.color }} />
                    <span className="text-[11px] font-medium truncate w-full text-center">
                      {p.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sub Tabs */}
          <div className="flex rounded-lg bg-[#181427] p-1 border border-[#261E3D]">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'details'
                  ? 'bg-[#261E40] text-purple-200 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Detalhes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('appearance')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'appearance'
                  ? 'bg-[#261E40] text-purple-200 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Aparência
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('agent')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'agent'
                  ? 'bg-[#261E40] text-purple-200 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Agente
            </button>
          </div>

          {/* Tab 1: Detalhes */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Nome do terminal
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do terminal"
                  className="w-full px-3.5 py-2.5 bg-[#181427] border border-[#2D234A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Comando (auto-run ao abrir)
                </label>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="ex.: claude, codex, npm run dev, ou deixe vazio para shell"
                  className="w-full px-3.5 py-2.5 bg-[#181427] border border-[#2D234A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] font-mono text-xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Executa em
                </label>
                <select
                  value={execEnvironment}
                  onChange={(e) => setExecEnvironment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#181427] border border-[#2D234A] rounded-xl text-white focus:outline-none focus:border-[#8B5CF6] transition-all"
                >
                  <option value="workspace-default">Padrão do espaço de trabalho</option>
                  <option value="custom">Local personalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Diretório de trabalho
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={workingDir}
                    onChange={(e) => setWorkingDir(e.target.value)}
                    placeholder="/caminho/do/diretorio"
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

              {/* Toggles */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#181427] border border-[#251E3D]">
                  <div className="pr-4">
                    <div className="text-xs font-medium text-gray-200">Monitorar atividade</div>
                    <div className="text-[11px] text-gray-400">
                      Detecta a saída do terminal e avisa quando o trabalho termina.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMonitorActivity(!monitorActivity)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 relative shrink-0 ${
                      monitorActivity ? 'bg-[#3B82F6]' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        monitorActivity ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#181427] border border-[#251E3D]">
                  <div className="pr-4">
                    <div className="text-xs font-medium text-gray-200 flex items-center gap-1.5">
                      Maestro <Sparkles size={12} className="text-purple-400" />
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Promove este terminal a maestro, capaz de reger o restante do canvas.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMaestro(!isMaestro)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 relative shrink-0 ${
                      isMaestro ? 'bg-[#8B5CF6]' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        isMaestro ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Aparência */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Cor de Destaque do Nó
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { color: '#8B5CF6', label: 'Roxo Neon' },
                    { color: '#3B82F6', label: 'Azul Elétrico' },
                    { color: '#10B981', label: 'Esmeralda' },
                    { color: '#F59E0B', label: 'Âmbar' },
                    { color: '#EC4899', label: 'Rosa Neon' },
                    { color: '#06B6D4', label: 'Ciano' }
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setAccentColor(c.color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        accentColor === c.color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Agente */}
          {activeTab === 'agent' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#181427] border border-[#251E3D] text-xs text-gray-300 leading-relaxed">
                <span className="font-semibold text-purple-300 block mb-1">
                  Variáveis de Ambiente Injetadas:
                </span>
                <code className="text-[11px] font-mono text-purple-200 block space-y-0.5">
                  <div>AGENTCANVAS_SOCKET: socket local para IPC</div>
                  <div>AGENTCANVAS_TERMINAL_ID: id único do processo</div>
                  <div>AGENTCANVAS_MAESTRO: {isMaestro ? '1' : '0'}</div>
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
