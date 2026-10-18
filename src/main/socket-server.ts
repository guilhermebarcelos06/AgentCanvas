import net from 'node:net'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { EventEmitter } from 'node:events'
import type { PtyManager } from './pty-manager'

export interface NoteItem {
  id: string
  name: string
  content: string
}

export class SocketServer extends EventEmitter {
  private server: net.Server | null = null
  public socketPath: string
  private ptyManager: PtyManager
  private notes = new Map<string, NoteItem>()

  constructor(ptyManager: PtyManager, sessionId: string) {
    super()
    this.ptyManager = ptyManager

    if (process.platform === 'win32') {
      this.socketPath = `\\\\.\\pipe\\agentcanvas-${sessionId}`
    } else {
      const socketDir = path.join(os.tmpdir(), `agentcanvas-${process.getuid?.() || 1000}`)
      if (!fs.existsSync(socketDir)) {
        fs.mkdirSync(socketDir, { recursive: true, mode: 0o700 })
      }
      this.socketPath = path.join(socketDir, 'agentcanvas.sock')
    }
  }

  public setNotes(notes: NoteItem[]): void {
    this.notes.clear()
    for (const note of notes) {
      this.notes.set(note.id, note)
      this.notes.set(note.name.toLowerCase(), note)
    }
  }

  public start(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Clean up previous dead socket file on Unix
      if (process.platform !== 'win32' && fs.existsSync(this.socketPath)) {
        try {
          fs.unlinkSync(this.socketPath)
        } catch (e) {
          console.warn('Failed to clean previous socket file:', e)
        }
      }

      this.server = net.createServer((socket) => {
        let buffer = ''

        socket.on('data', (chunk) => {
          buffer += chunk.toString('utf8')
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const request = JSON.parse(line)
              this.handleRequest(socket, request)
            } catch (err: unknown) {
              socket.write(JSON.stringify({ error: 'Malformed JSON payload', details: String(err) }) + '\n')
            }
          }
        })

        socket.on('error', (err) => {
          console.warn('Socket client error:', err)
        })
      })

      this.server.on('error', (err) => {
        reject(err)
      })

      this.server.listen(this.socketPath, () => {
        // Ensure restrictive permissions on Unix
        if (process.platform !== 'win32') {
          try {
            fs.chmodSync(this.socketPath, 0o600)
          } catch {}
        }
        console.log(`AgentCanvas Socket Server running at: ${this.socketPath}`)
        resolve(this.socketPath)
      })
    })
  }

  private handleRequest(socket: net.Socket, req: { id?: string; action: string; payload?: Record<string, unknown> }): void {
    const { action, payload = {} } = req
    const reply = (res: Record<string, unknown>): void => {
      socket.write(JSON.stringify({ reqId: req.id, ...res }) + '\n')
    }

    switch (action) {
      case 'list': {
        const terminals = this.ptyManager.list()
        const uniqueNotes = Array.from(new Set(this.notes.values()))
        reply({
          ok: true,
          terminals,
          notes: uniqueNotes.map((n) => ({ id: n.id, name: n.name }))
        })
        break
      }

      case 'ask': {
        const targetName = String(payload.target || '')
        const prompt = String(payload.prompt || '')
        const isRaw = Boolean(payload.raw)

        const session = this.ptyManager.findSessionByName(targetName)
        if (!session) {
          reply({ ok: false, error: `Agent or terminal '${targetName}' not found` })
          return
        }

        // Deliver text into the agent's terminal
        const textToSend = isRaw ? prompt : prompt + '\n'
        this.ptyManager.write(session.id, textToSend)

        this.emit('agent:asked', { fromSocket: true, target: session.id, prompt })
        reply({ ok: true, deliveredTo: session.name, terminalId: session.id })
        break
      }

      case 'check': {
        const targetName = String(payload.target || '')
        const lines = Number(payload.lines || 30)

        const session = this.ptyManager.findSessionByName(targetName)
        if (!session) {
          reply({ ok: false, error: `Terminal '${targetName}' not found` })
          return
        }

        const buffer = this.ptyManager.getBuffer(session.id, lines)
        reply({ ok: true, terminal: session.name, buffer })
        break
      }

      case 'note:read': {
        const noteName = String(payload.name || '').toLowerCase()
        const note = this.notes.get(noteName)
        if (!note) {
          reply({ ok: false, error: `Note '${payload.name}' not found` })
          return
        }
        reply({ ok: true, note })
        break
      }

      case 'note:write': {
        const noteName = String(payload.name || '')
        const content = String(payload.content || '')
        this.emit('note:write', { name: noteName, content })
        reply({ ok: true, note: noteName })
        break
      }

      default:
        reply({ ok: false, error: `Unknown action '${action}'` })
    }
  }

  public stop(): void {
    if (this.server) {
      this.server.close()
      this.server = null
    }
    if (process.platform !== 'win32' && fs.existsSync(this.socketPath)) {
      try {
        fs.unlinkSync(this.socketPath)
      } catch {}
    }
  }
}
