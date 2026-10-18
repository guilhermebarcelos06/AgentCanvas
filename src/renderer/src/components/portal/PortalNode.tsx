import React, { useState } from 'react'
import { RotateCw, ExternalLink, Globe } from 'lucide-react'

interface PortalNodeProps {
  id: string
  initialUrl?: string
}

export const PortalNode: React.FC<PortalNodeProps> = ({ initialUrl = 'http://localhost:5173' }) => {
  const [url, setUrl] = useState(initialUrl)
  const [currentSrc, setCurrentSrc] = useState(initialUrl)
  const [key, setKey] = useState(0)

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault()
    let target = url.trim()
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `http://${target}`
    }
    setCurrentSrc(target)
    setUrl(target)
  }

  const handleRefresh = () => {
    setKey((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col w-full h-full bg-[#0D0B17] text-xs">
      {/* Portal Address Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#151224] border-b border-[#241D3B]">
        <button
          type="button"
          onClick={handleRefresh}
          className="p-1 rounded hover:bg-[#251E3D] text-gray-400 hover:text-white transition-colors"
          title="Recarregar página"
        >
          <RotateCw size={13} />
        </button>

        <form onSubmit={handleNavigate} className="flex-1 flex gap-1">
          <div className="relative flex-1 flex items-center">
            <Globe size={12} className="absolute left-2.5 text-gray-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:5173"
              className="w-full pl-7 pr-3 py-1 bg-[#1A162B] border border-[#2D234A] rounded-md text-xs text-purple-200 placeholder-gray-500 font-mono focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>
        </form>

        <a
          href={currentSrc}
          target="_blank"
          rel="noreferrer"
          className="p-1 rounded hover:bg-[#251E3D] text-gray-400 hover:text-purple-300 transition-colors"
          title="Abrir no navegador do sistema"
        >
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Portal Iframe Viewport */}
      <div className="flex-1 w-full h-full relative bg-white/5">
        <iframe
          key={key}
          src={currentSrc}
          title="Browser Portal"
          className="w-full h-full border-none bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  )
}
