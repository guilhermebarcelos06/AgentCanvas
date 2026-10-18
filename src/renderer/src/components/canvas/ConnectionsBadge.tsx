import React, { useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { connectionsAtom, nodesAtom, panAtom, zoomAtom } from '../../state/canvas'
import { GitBranch, X, ExternalLink, Unlink } from 'lucide-react'

interface ConnectionsBadgeProps {
  nodeId: string
  alwaysShow?: boolean
}

export const ConnectionsBadge: React.FC<ConnectionsBadgeProps> = ({ nodeId, alwaysShow = false }) => {
  const [connections, setConnections] = useAtom(connectionsAtom)
  const [nodes] = useAtom(nodesAtom)
  const setPan = useSetAtom(panAtom)
  const setZoom = useSetAtom(zoomAtom)
  const [isOpen, setIsOpen] = useState(false)

  // Encontrar todas as conexões vinculadas a este nó (de saída ou de entrada)
  const activeConnections = connections.filter(
    (c) => c.fromNodeId === nodeId || c.toNodeId === nodeId
  )

  const count = activeConnections.length
  if (count === 0 && !alwaysShow) return null

  // Focar a câmera do canvas no nó alvo
  const handleFocusNode = (targetId: string) => {
    const target = nodes.find((n) => n.id === targetId)
    if (!target) return
    setPan({
      x: window.innerWidth / 2 - target.x - target.width / 2,
      y: window.innerHeight / 2 - target.y - target.height / 2
    })
    setZoom(1)
    setIsOpen(false)
  }

  // Desconectar um link específico
  const handleDisconnectOne = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConnections((prev) => prev.filter((c) => c.id !== connectionId))
  }

  // Desconectar todos os links deste nó
  const handleDisconnectAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConnections((prev) => prev.filter((c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId))
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-xs select-none">
      {/* Botão com o ícone de ramificação e badge numérico (idêntico ao Maestri) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1A162B] hover:bg-[#251F3D] border border-[#3B2F63] hover:border-[#8B5CF6] transition-all shadow-sm group"
        title={`${count} conexões ativas`}
      >
        {/* SVG do ícone de ramificação com os dois nós conectados */}
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-purple-300 group-hover:text-purple-200"
        >
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="4" r="2" />
          <path d="M5 10V3" />
          <path d="M5 10C5 7 12 7 12 4" />
        </svg>

        {/* Badge circular com o contador azul/roxo vibrante */}
        <span className="flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#3B82F6] group-hover:bg-[#2563EB] rounded-full shadow-inner">
          {count}
        </span>
      </button>

      {/* Popover flutuante com a lista de conexões ativas */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-64 bg-[#120F1D] border border-[#3B2F63] rounded-xl shadow-2xl p-2.5 z-50 backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#251F3D] px-1">
              <span className="font-semibold text-purple-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch size={13} className="text-purple-400" />
                Conexões Ativas ({count})
              </span>
              <button
                type="button"
                onClick={handleDisconnectAll}
                className="text-[10px] text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
                title="Remover todas as conexões deste nó"
              >
                <Unlink size={10} />
                Desconectar
              </button>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {activeConnections.map((conn) => {
                const targetId = conn.fromNodeId === nodeId ? conn.toNodeId : conn.fromNodeId
                const targetNode = nodes.find((n) => n.id === targetId)
                const title = targetNode?.title || targetId

                return (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-[#181427] hover:bg-[#221C38] border border-transparent hover:border-[#8B5CF6]/40 transition-colors group/item"
                  >
                    <button
                      type="button"
                      onClick={() => handleFocusNode(targetId)}
                      className="flex items-center gap-2 truncate text-left text-gray-200 hover:text-purple-300 flex-1 mr-2"
                      title={`Focar em ${title}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span className="truncate text-xs">{title}</span>
                      <ExternalLink size={11} className="opacity-0 group-hover/item:opacity-100 text-purple-400 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDisconnectOne(conn.id, e)}
                      className="text-gray-500 hover:text-red-400 p-0.5 rounded transition-colors"
                      title="Desconectar link"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
