import React, { useState, useEffect, memo } from 'react'
import {
  RotateCw,
  ExternalLink,
  Globe,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  ShieldCheck,
  Home
} from 'lucide-react'

interface PortalNodeProps {
  id: string
  initialUrl?: string
  reloadKey?: number
}

const PortalNodeComponent: React.FC<PortalNodeProps> = ({
  initialUrl = 'http://localhost:5173',
  reloadKey = 0
}) => {
  const [history, setHistory] = useState<string[]>([initialUrl])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [url, setUrl] = useState(initialUrl)
  const [key, setKey] = useState(0)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')

  const currentSrc = history[historyIndex] || initialUrl

  useEffect(() => {
    if (reloadKey > 0) {
      setKey((prev) => prev + 1)
    }
  }, [reloadKey])

  const navigateTo = (targetUrl: string) => {
    let clean = targetUrl.trim()
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`
    }
    const newHistory = [...history.slice(0, historyIndex + 1), clean]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setUrl(clean)
  }

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    navigateTo(url)
  }

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1
      setHistoryIndex(newIdx)
      setUrl(history[newIdx])
    }
  }

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1
      setHistoryIndex(newIdx)
      setUrl(history[newIdx])
    }
  }

  const handleRefresh = () => {
    setKey((prev) => prev + 1)
  }

  const handleHome = () => {
    navigateTo(initialUrl)
  }

  return (
    <div className="flex flex-col w-full h-full bg-[#0D0B17] text-xs select-none">
      {/* Portal Browser Navigation Header Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#151224] border-b border-[#241D3B]">
        {/* Navigation History Controls */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleBack}
            disabled={historyIndex <= 0}
            className={`p-1 rounded transition-colors ${
              historyIndex > 0
                ? 'text-purple-300 hover:text-white hover:bg-[#251E3D]'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Voltar"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            className={`p-1 rounded transition-colors ${
              historyIndex < history.length - 1
                ? 'text-purple-300 hover:text-white hover:bg-[#251E3D]'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Avançar"
          >
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1 rounded text-purple-300 hover:text-white hover:bg-[#251E3D] transition-colors"
            title="Recarregar página"
          >
            <RotateCw size={13} />
          </button>
          <button
            type="button"
            onClick={handleHome}
            className="p-1 rounded text-purple-300 hover:text-white hover:bg-[#251E3D] transition-colors"
            title="Página Inicial"
          >
            <Home size={13} />
          </button>
        </div>

        {/* URL Address Input Bar */}
        <form onSubmit={handleNavigate} className="flex-1 flex gap-1 mx-1">
          <div className="relative flex-1 flex items-center">
            {currentSrc.startsWith('https://') ? (
              <ShieldCheck size={12} className="absolute left-2.5 text-emerald-400" />
            ) : (
              <Globe size={12} className="absolute left-2.5 text-gray-500" />
            )}
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:5173"
              className="w-full pl-7 pr-3 py-1 bg-[#1A162B] border border-[#2D234A] rounded-md text-xs text-purple-200 placeholder-gray-500 font-mono focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>
        </form>

        {/* Quick View Mode Switcher (Desktop vs Mobile 390px) */}
        <div className="flex items-center gap-0.5 bg-[#1A162B] border border-[#2D234A] rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className={`p-1 rounded transition-colors ${
              viewMode === 'desktop'
                ? 'bg-purple-600/30 text-purple-200'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            title="Visualização Desktop"
          >
            <Monitor size={12} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className={`p-1 rounded transition-colors ${
              viewMode === 'mobile'
                ? 'bg-purple-600/30 text-purple-200'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            title="Visualização Mobile (390px)"
          >
            <Smartphone size={12} />
          </button>
        </div>

        {/* External Link */}
        <a
          href={currentSrc}
          target="_blank"
          rel="noreferrer"
          className="p-1 rounded hover:bg-[#251E3D] text-gray-400 hover:text-purple-300 transition-colors"
          title="Abrir no navegador padrão do sistema"
        >
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Browser Viewport Area */}
      <div className="flex-1 w-full h-full relative bg-[#0D0B17] overflow-hidden flex items-center justify-center">
        {viewMode === 'desktop' ? (
          <iframe
            key={key}
            src={currentSrc}
            title="Browser Portal"
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="w-[390px] h-[94%] bg-black rounded-3xl p-2.5 border-4 border-[#2A2344] shadow-2xl flex flex-col overflow-hidden">
            <div className="w-20 h-4 bg-[#2A2344] rounded-full mx-auto mb-2 shrink-0" />
            <iframe
              key={key}
              src={currentSrc}
              title="Browser Portal Mobile"
              className="w-full flex-1 border-none bg-white rounded-2xl"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export const PortalNode = memo(PortalNodeComponent)
export default PortalNode
