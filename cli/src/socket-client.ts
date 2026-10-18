import net from 'node:net'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

export class SocketClient {
  private socketPath: string

  constructor(customPath?: string) {
    if (customPath) {
      this.socketPath = customPath
    } else if (process.env.AGENTCANVAS_SOCKET || process.env.AGENTCANVAS_PIPE) {
      this.socketPath = process.env.AGENTCANVAS_SOCKET || process.env.AGENTCANVAS_PIPE || ''
    } else if (process.platform === 'win32') {
      this.socketPath = '\\\\.\\pipe\\agentcanvas-default'
    } else {
      const socketDir = path.join(os.tmpdir(), `agentcanvas-${process.getuid?.() || 1000}`)
      this.socketPath = path.join(socketDir, 'agentcanvas.sock')
    }
  }

  public sendRequest<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (process.platform !== 'win32' && !fs.existsSync(this.socketPath)) {
        return reject(
          new Error(
            `AgentCanvas Socket not found at '${this.socketPath}'. Certifique-se de que o aplicativo AgentCanvas está aberto e em execução.`
          )
        )
      }

      const client = net.createConnection({ path: this.socketPath }, () => {
        const req = JSON.stringify({
          id: Math.random().toString(36).substring(2, 9),
          action,
          payload
        })
        client.write(req + '\n')
      })

      let buffer = ''

      client.on('data', (chunk) => {
        buffer += chunk.toString('utf8')
        if (buffer.includes('\n')) {
          const line = buffer.split('\n')[0]
          try {
            const response = JSON.parse(line)
            client.end()
            if (response.error) {
              reject(new Error(response.error))
            } else {
              resolve(response as T)
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${String(e)}`))
          }
        }
      })

      client.on('error', (err) => {
        reject(
          new Error(
            `Erro de conexão com o AgentCanvas em '${this.socketPath}': ${err.message}`
          )
        )
      })
    })
  }
}
