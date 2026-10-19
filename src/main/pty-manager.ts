import * as pty from 'node-pty'
import os from 'node:os'
import { EventEmitter } from 'node:events'

export interface TerminalSession {
  id: string
  name: string
  ptyProcess: pty.IPty
  buffer: string[]
  maxBufferSize: number
  cwd: string
  shell: string
  command?: string
  isMaestro?: boolean
}

export class PtyManager extends EventEmitter {
  private terminals = new Map<string, TerminalSession>()
  private socketPath: string

  constructor(socketPath: string) {
    super()
    this.socketPath = socketPath
  }

  public setSocketPath(socketPath: string): void {
    this.socketPath = socketPath
  }

  public getAvailableShell(): string {
    if (process.platform === 'win32') {
      return process.env.COMSPEC || 'powershell.exe'
    }
    return process.env.SHELL || '/bin/bash'
  }

  public spawn(
    id: string,
    name: string,
    cwd?: string,
    initialCols = 80,
    initialRows = 24,
    command?: string,
    isMaestro = false
  ): TerminalSession {
    // Se já existir sessão ativa com este ID (ex: remontagem de componente ou troca de tela), reaproveitar (Attach)
    const existing = this.terminals.get(id)
    if (existing) {
      try {
        existing.ptyProcess.resize(initialCols, initialRows)
        return existing
      } catch {
        // Se o processo estiver inacessível, descarta e recria
        this.terminals.delete(id)
      }
    }

    const shell = this.getAvailableShell()
    const targetCwd = cwd || os.homedir()

    // Environment variables injected into the subshell
    const env: { [key: string]: string } = {
      ...(process.env as { [key: string]: string }),
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      AGENTCANVAS_SOCKET: this.socketPath,
      AGENTCANVAS_PIPE: this.socketPath,
      AGENTCANVAS_TERMINAL_ID: id,
      AGENTCANVAS_TERMINAL_NAME: name,
      AGENTCANVAS_MAESTRO: isMaestro ? '1' : '0'
    }

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: initialCols,
      rows: initialRows,
      cwd: targetCwd,
      env
    })

    const session: TerminalSession = {
      id,
      name,
      ptyProcess,
      buffer: [],
      maxBufferSize: 1000,
      cwd: targetCwd,
      shell,
      command,
      isMaestro
    }

    ptyProcess.onData((data: string) => {
      // Store in scrollback buffer
      session.buffer.push(data)
      if (session.buffer.length > session.maxBufferSize) {
        session.buffer.shift()
      }
      this.emit('data', { id, data })
    })

    ptyProcess.onExit(({ exitCode, signal }) => {
      const current = this.terminals.get(id)
      if (current?.ptyProcess === ptyProcess) {
        this.terminals.delete(id)
        this.emit('exit', { id, exitCode, signal })
      }
    })

    this.terminals.set(id, session)

    // Se houver um comando configurado para auto-run, executa após breve delay
    if (command && command.trim().length > 0) {
      setTimeout(() => {
        try {
          ptyProcess.write(`${command.trim()}\r\n`)
        } catch {
          // Processo pode ter finalizado prematuramente
        }
      }, 350)
    }

    return session
  }

  public write(id: string, data: string): boolean {
    const session = this.terminals.get(id)
    if (!session) return false
    session.ptyProcess.write(data)
    return true
  }

  public resize(id: string, cols: number, rows: number): boolean {
    const session = this.terminals.get(id)
    if (!session) return false
    try {
      session.ptyProcess.resize(Math.max(10, cols), Math.max(5, rows))
      return true
    } catch {
      return false
    }
  }

  public kill(id: string): boolean {
    const session = this.terminals.get(id)
    if (!session) return false
    try {
      session.ptyProcess.kill()
      this.terminals.delete(id)
      return true
    } catch {
      return false
    }
  }

  public killAll(): void {
    for (const [id, session] of this.terminals.entries()) {
      try {
        session.ptyProcess.kill()
      } catch {}
    }
    this.terminals.clear()
  }

  public getSession(id: string): TerminalSession | undefined {
    return this.terminals.get(id)
  }

  public findSessionByName(name: string): TerminalSession | undefined {
    const lowerName = name.toLowerCase().trim()
    for (const session of this.terminals.values()) {
      if (session.name.toLowerCase().trim() === lowerName) {
        return session
      }
    }
    return undefined
  }

  public list(): { id: string; name: string; shell: string; cwd: string }[] {
    return Array.from(this.terminals.values()).map((t) => ({
      id: t.id,
      name: t.name,
      shell: t.shell,
      cwd: t.cwd
    }))
  }

  public getBuffer(id: string, lines = 50): string {
    const session = this.terminals.get(id)
    if (!session) return ''
    return session.buffer.slice(-lines).join('')
  }

  public getScrollback(id: string): string {
    const session = this.terminals.get(id)
    if (!session) return ''
    return session.buffer.join('')
  }
}
