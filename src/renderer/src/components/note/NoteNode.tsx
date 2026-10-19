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

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-white">{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index} className="italic text-purple-300">{token.slice(1, -1)}</em>)
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-[#1C1630] border border-[#312554] font-mono text-[11px] text-purple-300">
          {token.slice(1, -1)}
        </code>
      )
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

function renderMarkdownText(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBuffer: string[] = []

  lines.forEach((line, lineIdx) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${lineIdx}`} className="bg-[#090714] border border-[#271F3F] rounded-lg p-2.5 my-2 font-mono text-[11px] text-purple-200 overflow-x-auto">
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        )
        codeBuffer = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
        codeBuffer = []
      }
      return
    }

    if (inCodeBlock) {
      codeBuffer.push(line)
      return
    }

    if (line.startsWith('# ')) {
      elements.push(<h1 key={lineIdx} className="text-base font-bold text-purple-100 mt-2 mb-1 border-b border-[#2D234A] pb-1">{renderInline(line.slice(2))}</h1>)
      return
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={lineIdx} className="text-sm font-semibold text-purple-200 mt-2 mb-1">{renderInline(line.slice(3))}</h2>)
      return
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={lineIdx} className="text-xs font-semibold text-purple-300 mt-1.5 mb-0.5">{renderInline(line.slice(4))}</h3>)
      return
    }

    if (/^[-*]\s+/.test(line)) {
      elements.push(
        <li key={lineIdx} className="ml-4 list-disc text-xs text-purple-200/90 my-0.5">
          {renderInline(line.replace(/^[-*]\s+/, ''))}
        </li>
      )
      return
    }

    if (!line.trim()) {
      elements.push(<div key={lineIdx} className="h-1.5" />)
      return
    }

    elements.push(
      <p key={lineIdx} className="text-xs text-purple-200/90 my-0.5 leading-relaxed">
        {renderInline(line)}
      </p>
    )
  })

  return elements
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
          <div ref={mermaidRef} className="prose prose-invert prose-purple max-w-none text-xs leading-relaxed space-y-1">
            {content.split('```mermaid').map((part, index) => {
              if (index === 0) {
                return (
                  <div key={index} className="mb-2">
                    {renderMarkdownText(part)}
                  </div>
                )
              }
              const [diagram, ...rest] = part.split('```')
              return (
                <div key={index} className="my-2">
                  <div className="mermaid bg-[#0A0814] p-3 rounded-lg border border-[#2A2344] overflow-x-auto flex justify-center">
                    {diagram.trim()}
                  </div>
                  {rest.length > 0 && <div className="mt-2">{renderMarkdownText(rest.join('```'))}</div>}
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
