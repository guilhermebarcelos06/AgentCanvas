import React, { useState, useEffect, useRef, memo } from 'react'
import mermaid from 'mermaid'
import { Eye, Edit3 } from 'lucide-react'

let mermaidInitialized = false

interface NoteNodeProps {
  id: string
  title: string
  content: string
  onContentChange: (newContent: string) => void
}

const NoteNodeComponent: React.FC<NoteNodeProps> = ({ content, onContentChange }) => {
  const [isEditing, setIsEditing] = useState(false)
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mermaidInitialized && content.includes('```mermaid')) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          darkMode: true,
          background: '#090712',
          primaryColor: '#7C3AED',
          primaryTextColor: '#F3F0FF',
          primaryBorderColor: '#8B5CF6',
          lineColor: '#C084FC',
          secondaryColor: '#161324',
          tertiaryColor: '#1F1B33'
        }
      })
      mermaidInitialized = true
    }
  }, [content])

  useEffect(() => {
    if (!isEditing && mermaidRef.current && content.includes('```mermaid')) {
      try {
        mermaid.contentLoaded()
      } catch (e) {
        console.warn('Mermaid rendering error:', e)
      }
    }
  }, [content, isEditing])

  return (
    <div className="w-full h-full flex flex-col bg-[#0F0D1B] rounded-b-xl overflow-hidden border-t border-[#2A2344]">
      {/* Sub-header / Mode switch */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141124] border-b border-[#241D3B] text-xs text-purple-300">
        <span className="font-mono text-[11px] opacity-75">Markdown & Mermaid</span>
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#201B38] hover:bg-[#2D264E] text-purple-200 transition-colors"
        >
          {isEditing ? (
            <>
              <Eye className="w-3 h-3 text-purple-400" />
              <span>Visualizar</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3 h-3 text-purple-400" />
              <span>Editar</span>
            </>
          )}
        </button>
      </div>

      {/* Editor or Preview View */}
      <div className="flex-1 p-3 overflow-y-auto text-sm text-purple-100 font-sans">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full h-full bg-transparent font-mono text-xs text-purple-200 outline-none resize-none selection:bg-purple-900"
            placeholder="Digite suas anotações ou diagramas em Markdown..."
          />
        ) : (
          <div ref={mermaidRef} className="prose prose-invert prose-purple max-w-none text-xs leading-relaxed">
            {content.split('```mermaid').map((part, index) => {
              if (index === 0) {
                return (
                  <div key={index} className="whitespace-pre-wrap mb-2">
                    {part}
                  </div>
                )
              }
              const [diagram, ...rest] = part.split('```')
              return (
                <div key={index} className="my-2">
                  <div className="mermaid bg-[#0A0814] p-3 rounded-lg border border-[#2A2344] overflow-x-auto flex justify-center">
                    {diagram.trim()}
                  </div>
                  {rest.length > 0 && <div className="whitespace-pre-wrap mt-2">{rest.join('```')}</div>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export const NoteNode = memo(NoteNodeComponent)
