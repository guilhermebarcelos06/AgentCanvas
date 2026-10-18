import React, { useState } from 'react'
import { useAtomValue } from 'jotai'
import { nodesAtom } from '../../state/canvas'
import { Send, Terminal, Sparkles } from 'lucide-react'

export const PrompterBar: React.FC = () => {
  const nodes = useAtomValue(nodesAtom)
  const terminalNodes = nodes.filter((n) => n.type === 'terminal')

  const [targetId, setTargetId] = useState<string>(terminalNodes[0]?.id || '')
  const [prompt, setPrompt] = useState('')

  if (terminalNodes.length === 0) return null

  // Manter targetId válido se os nós mudarem
  const currentTarget = terminalNodes.find((n) => n.id === targetId) || terminalNodes[0]

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !currentTarget) return

    try {
      await window.agentCanvasAPI.writeTerminal(currentTarget.id, `${prompt.trim()}\r\n`)
      setPrompt('')
    } catch (err) {
      console.error('Erro ao enviar prompt:', err)
    }
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 select-none">
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 p-1.5 pl-3 bg-[#120F1D]/90 backdrop-blur-md border border-[#372A59] hover:border-[#8B5CF6] rounded-2xl shadow-2xl transition-all w-[560px]"
      >
        {/* Seletor de Agente Alvo */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1C1630] border border-[#2D234A] rounded-xl shrink-0">
          {currentTarget?.isMaestro ? (
            <Sparkles size={13} className="text-purple-300" />
          ) : (
            <Terminal size={13} className="text-purple-400" />
          )}
          <select
            value={currentTarget?.id}
            onChange={(e) => setTargetId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-purple-200 focus:outline-none cursor-pointer max-w-[130px] truncate"
          >
            {terminalNodes.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#120F1D] text-gray-200">
                @{t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Campo de Prompt */}
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Perguntar ou comandar @${currentTarget?.title}...`}
          className="flex-1 bg-transparent px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none"
        />

        {/* Botão Enviar */}
        <button
          type="submit"
          disabled={!prompt.trim()}
          className="p-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-30 disabled:pointer-events-none text-white transition-all shadow-md shadow-purple-900/30"
          title="Enviar Prompt (Enter)"
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  )
}
