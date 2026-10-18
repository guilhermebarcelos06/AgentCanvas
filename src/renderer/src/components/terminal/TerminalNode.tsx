import React, { useEffect, useRef, memo } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import '@xterm/xterm/css/xterm.css'

interface TerminalNodeProps {
  id: string
  title: string
  width: number
  height: number
  cwd?: string
  command?: string
  isMaestro?: boolean
  reloadKey?: number
  onTitleChange?: (newTitle: string) => void
}

const TerminalNodeComponent: React.FC<TerminalNodeProps> = ({
  id,
  title,
  width,
  height,
  cwd,
  command,
  isMaestro,
  reloadKey = 0
}) => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermInstance = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!terminalRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      scrollback: 3000,
      fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
      theme: {
        background: '#090712',
        foreground: '#E9D5FF',
        cursor: '#C084FC',
        cursorAccent: '#090712',
        selectionBackground: 'rgba(139, 92, 246, 0.35)',
        black: '#161324',
        red: '#F43F5E',
        green: '#10B981',
        yellow: '#F59E0B',
        blue: '#818CF8',
        magenta: '#C084FC',
        cyan: '#38BDF8',
        white: '#F3F0FF',
        brightBlack: '#4C4368',
        brightRed: '#FB7185',
        brightGreen: '#34D399',
        brightYellow: '#FBBF24',
        brightBlue: '#A5B4FC',
        brightMagenta: '#E879F9',
        brightCyan: '#67E8F9',
        brightWhite: '#FFFFFF'
      }
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    fitAddonRef.current = fitAddon

    term.open(terminalRef.current)

    // Try loading WebGL addon with canvas fallback
    try {
      const webglAddon = new WebglAddon()
      webglAddon.onContextLoss(() => {
        webglAddon.dispose()
      })
      term.loadAddon(webglAddon)
    } catch {
      // Standard canvas fallback is used automatically
    }

    xtermInstance.current = term
    fitAddon.fit()

    // Spawn native terminal process with exact dimensions and metadata
    window.agentCanvasAPI?.spawnTerminal({
      id,
      name: title,
      cwd,
      cols: term.cols || 80,
      rows: term.rows || 24,
      command,
      isMaestro
    })

    // Forward user keypresses to native PTY
    const onDataDisposable = term.onData((data) => {
      window.agentCanvasAPI?.writeTerminal(id, data)
    })

    // Batch PTY output per animation frame for 60fps smoothness under heavy stdout
    let pendingBuffer = ''
    let rafId: number | null = null

    const flushBuffer = () => {
      rafId = null
      if (pendingBuffer && xtermInstance.current) {
        const chunk = pendingBuffer
        pendingBuffer = ''
        xtermInstance.current.write(chunk)
      }
    }

    const cleanupListener = window.agentCanvasAPI?.onTerminalData(({ id: termId, data }) => {
      if (termId === id) {
        pendingBuffer += data
        if (rafId === null) {
          rafId = window.requestAnimationFrame(flushBuffer)
        }
      }
    })

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
      onDataDisposable.dispose()
      cleanupListener?.()
      term.dispose()
    }
  }, [id, reloadKey])

  // Handle resize when dimensions change
  useEffect(() => {
    if (fitAddonRef.current && xtermInstance.current) {
      const timer = setTimeout(() => {
        try {
          fitAddonRef.current?.fit()
          const term = xtermInstance.current
          if (term) {
            window.agentCanvasAPI?.resizeTerminal(id, term.cols, term.rows)
          }
        } catch {}
      }, 40)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [width, height, id])

  return (
    <div className="w-full h-full flex flex-col bg-[#090712] rounded-b-xl overflow-hidden border-t border-[#2A2344]">
      <div ref={terminalRef} className="flex-1 w-full h-full overflow-hidden p-1.5" />
    </div>
  )
}

export const TerminalNode = memo(TerminalNodeComponent)
