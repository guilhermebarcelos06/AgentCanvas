import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export interface WorkspaceItem {
  id: string
  name: string
  rootPath: string
  createdAt: number
  state?: {
    nodes?: any[]
    cables?: any[]
    pan?: { x: number; y: number }
    zoom?: number
  }
}

export class WorkspaceStore {
  private configPath: string
  private workspaces: WorkspaceItem[] = []
  private activeWorkspaceId = ''

  constructor() {
    const configDir = path.join(os.homedir(), '.config', 'agentcanvas')
    fs.mkdirSync(configDir, { recursive: true })
    this.configPath = path.join(configDir, 'workspaces.json')
    this.load()

    // Garantir pelo menos um workspace padrão (usando cwd ou home)
    if (this.workspaces.length === 0) {
      const defaultDir = process.cwd()
      const defaultName = path.basename(defaultDir) || 'Meu Projeto'
      const defaultWorkspace: WorkspaceItem = {
        id: 'ws-default',
        name: defaultName,
        rootPath: defaultDir,
        createdAt: Date.now()
      }
      this.workspaces.push(defaultWorkspace)
      this.activeWorkspaceId = defaultWorkspace.id
      this.save()
    } else if (!this.activeWorkspaceId || !this.workspaces.some((w) => w.id === this.activeWorkspaceId)) {
      this.activeWorkspaceId = this.workspaces[0].id
    }
  }

  private load(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8')
        const data = JSON.parse(raw)
        this.workspaces = data.workspaces || []
        this.activeWorkspaceId = data.activeWorkspaceId || (this.workspaces[0]?.id ?? '')
      }
    } catch (e) {
      console.error('[WorkspaceStore] Erro ao carregar workspaces:', e)
      this.workspaces = []
      this.activeWorkspaceId = ''
    }
  }

  private save(): void {
    try {
      const data = {
        activeWorkspaceId: this.activeWorkspaceId,
        workspaces: this.workspaces
      }
      fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (e) {
      console.error('[WorkspaceStore] Erro ao salvar workspaces:', e)
    }
  }

  public list(): WorkspaceItem[] {
    return this.workspaces
  }

  public getActive(): WorkspaceItem | undefined {
    return this.workspaces.find((w) => w.id === this.activeWorkspaceId) || this.workspaces[0]
  }

  public getActiveId(): string {
    return this.activeWorkspaceId
  }

  public create(name: string, rootPath: string): WorkspaceItem {
    const newWs: WorkspaceItem = {
      id: `ws-${Date.now().toString(36)}`,
      name: name.trim() || path.basename(rootPath),
      rootPath: path.resolve(rootPath),
      createdAt: Date.now()
    }
    this.workspaces.push(newWs)
    this.activeWorkspaceId = newWs.id
    this.save()
    return newWs
  }

  public switch(id: string): WorkspaceItem | undefined {
    const ws = this.workspaces.find((w) => w.id === id)
    if (ws) {
      this.activeWorkspaceId = id
      this.save()
    }
    return ws
  }

  public saveState(id: string, state: any): boolean {
    const ws = this.workspaces.find((w) => w.id === id)
    if (!ws) return false
    ws.state = state
    this.save()
    return true
  }

  public delete(id: string): boolean {
    if (this.workspaces.length <= 1) return false
    this.workspaces = this.workspaces.filter((w) => w.id !== id)
    if (this.activeWorkspaceId === id) {
      this.activeWorkspaceId = this.workspaces[0].id
    }
    this.save()
    return true
  }
}
