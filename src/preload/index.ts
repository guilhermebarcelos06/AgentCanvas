import { contextBridge, ipcRenderer } from 'electron'

export interface TerminalSpawnOptions {
  id: string
  name: string
  cwd?: string
  cols?: number
  rows?: number
  command?: string
  isMaestro?: boolean
}

export interface NoteItem {
  id: string
  name: string
  content: string
}

export interface FloorItem {
  name: string
  branch: string
  path: string
  isMain: boolean
}

export interface WorkspaceItem {
  id: string
  name: string
  rootPath: string
  createdAt: number
  state?: any
}

export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  extension?: string
  size?: number
  children?: FileEntry[]
}

export const agentCanvasAPI = {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  // Native Dialog
  pickDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:openDirectory'),

  // Workspaces
  listWorkspaces: (): Promise<WorkspaceItem[]> => ipcRenderer.invoke('workspace:list'),
  getActiveWorkspace: (): Promise<WorkspaceItem | undefined> => ipcRenderer.invoke('workspace:getActive'),
  createWorkspace: (name: string, rootPath: string): Promise<WorkspaceItem> =>
    ipcRenderer.invoke('workspace:create', { name, rootPath }),
  switchWorkspace: (id: string): Promise<WorkspaceItem | undefined> =>
    ipcRenderer.invoke('workspace:switch', id),
  saveWorkspaceState: (id: string, state: any): Promise<boolean> =>
    ipcRenderer.invoke('workspace:saveState', { id, state }),
  deleteWorkspace: (id: string): Promise<boolean> => ipcRenderer.invoke('workspace:delete', id),

  // File Tree & FS
  listFileTree: (dirPath?: string): Promise<FileEntry[]> => ipcRenderer.invoke('files:listTree', dirPath),
  readFileContent: (filePath: string): Promise<string | null> =>
    ipcRenderer.invoke('files:readContent', filePath),

  // Terminal PTY
  spawnTerminal: (opts: TerminalSpawnOptions) => ipcRenderer.invoke('terminal:spawn', opts),
  writeTerminal: (id: string, data: string) => ipcRenderer.invoke('terminal:write', { id, data }),
  resizeTerminal: (id: string, cols: number, rows: number) =>
    ipcRenderer.invoke('terminal:resize', { id, cols, rows }),
  killTerminal: (id: string) => ipcRenderer.invoke('terminal:kill', { id }),
  listTerminals: () => ipcRenderer.invoke('terminal:list'),
  getTerminalScrollback: (id: string): Promise<string> =>
    ipcRenderer.invoke('terminal:get-scrollback', id),
  onTerminalData: (callback: (payload: { id: string; data: string }) => void) => {
    const handler = (_: unknown, val: { id: string; data: string }) => callback(val)
    ipcRenderer.on('terminal:data', handler)
    return () => {
      ipcRenderer.removeListener('terminal:data', handler)
    }
  },
  onTerminalExit: (callback: (payload: { id: string; exitCode: number; signal?: number }) => void) => {
    const handler = (_: unknown, val: { id: string; exitCode: number; signal?: number }) => callback(val)
    ipcRenderer.on('terminal:exit', handler)
    return () => {
      ipcRenderer.removeListener('terminal:exit', handler)
    }
  },

  // Socket & Sync
  getSocketInfo: () => ipcRenderer.invoke('socket:info'),
  syncNotes: (notes: NoteItem[]) => ipcRenderer.invoke('notes:sync', notes),
  onRemoteNoteUpdate: (callback: (payload: { name: string; content: string }) => void) => {
    const handler = (_: unknown, val: { name: string; content: string }) => callback(val)
    ipcRenderer.on('note:remote-update', handler)
    return () => {
      ipcRenderer.removeListener('note:remote-update', handler)
    }
  },
  onAgentAsked: (callback: (payload: { target: string; prompt: string }) => void) => {
    const handler = (_: unknown, val: { target: string; prompt: string }) => callback(val)
    ipcRenderer.on('agent:asked', handler)
    return () => {
      ipcRenderer.removeListener('agent:asked', handler)
    }
  },

  // Git Worktrees (Floors)
  listFloors: () => ipcRenderer.invoke('worktree:list'),
  createFloor: (name: string) => ipcRenderer.invoke('worktree:create', name),
  removeFloor: (floorPath: string, deleteBranch = false) =>
    ipcRenderer.invoke('worktree:remove', { floorPath, deleteBranch }),
  landFloor: (floorPath: string, targetBranch = 'main') =>
    ipcRenderer.invoke('worktree:land', { floorPath, targetBranch })
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('agentCanvasAPI', agentCanvasAPI)
  } catch (error) {
    console.error('Failed to expose agentCanvasAPI:', error)
  }
} else {
  // @ts-ignore
  window.agentCanvasAPI = agentCanvasAPI
}
