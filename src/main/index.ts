import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { PtyManager } from './pty-manager'
import { SocketServer, NoteItem } from './socket-server'
import { WorktreeManager } from './worktree-manager'
import { WorkspaceStore } from './workspace-store'
import { FileManager } from './file-manager'

// Configurações defensivas para compatibilidade perfeita com Ubuntu 24.04/26.04 AppArmor
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-setuid-sandbox')
}

let mainWindow: BrowserWindow | null = null
let ptyManager: PtyManager | null = null
let socketServer: SocketServer | null = null
let worktreeManager: WorktreeManager | null = null
let workspaceStore: WorkspaceStore | null = null

function createWindow(): void {
  const iconPath = is.dev
    ? join(__dirname, '../../resources/icon.png')
    : join(process.resourcesPath, 'resources/icon.png')

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#08070D',
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.agentcanvas.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Session ID for local socket/pipe naming
  const sessionId = `${process.pid}-${Date.now().toString(36)}`

  // 1. Initialize Single Shared PTY Manager
  ptyManager = new PtyManager(`/tmp/agentcanvas-${process.getuid?.() || 1000}/agentcanvas.sock`)

  // 2. Initialize Socket Server with shared PTY Manager
  socketServer = new SocketServer(ptyManager, sessionId)
  const actualSocketPath = await socketServer.start()
  ptyManager.setSocketPath(actualSocketPath)

  // Initialize Workspace Store
  workspaceStore = new WorkspaceStore()
  const initialActiveWs = workspaceStore.getActive()
  const initialRootPath = initialActiveWs?.rootPath || process.cwd()

  // 3. Initialize Worktree Manager with active workspace path
  worktreeManager = new WorktreeManager(initialRootPath)

  // Forward PTY streams to Renderer
  ptyManager.on('data', ({ id, data }) => {
    mainWindow?.webContents.send('terminal:data', { id, data })
  })

  ptyManager.on('exit', ({ id, exitCode, signal }) => {
    mainWindow?.webContents.send('terminal:exit', { id, exitCode, signal })
  })

  // Forward Socket Server note events to Renderer
  socketServer.on('note:write', (noteData) => {
    mainWindow?.webContents.send('note:remote-update', noteData)
  })

  socketServer.on('agent:asked', (askData) => {
    mainWindow?.webContents.send('agent:asked', askData)
  })

  // Register Window IPC Handlers
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:toggle-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.handle('window:close', () => {
    try {
      ptyManager?.killAll()
      socketServer?.stop()
    } finally {
      app.exit(0)
    }
  })

  // Native Dialog: Folder Picker ("Procurar...")
  ipcMain.handle('dialog:openDirectory', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Selecionar Diretório de Trabalho',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // Workspace IPCs
  ipcMain.handle('workspace:list', () => {
    return workspaceStore?.list() || []
  })
  ipcMain.handle('workspace:getActive', () => {
    return workspaceStore?.getActive()
  })
  ipcMain.handle('workspace:create', (_, { name, rootPath }) => {
    const ws = workspaceStore?.create(name, rootPath)
    if (ws) {
      worktreeManager = new WorktreeManager(ws.rootPath)
    }
    return ws
  })
  ipcMain.handle('workspace:switch', (_, id: string) => {
    const ws = workspaceStore?.switch(id)
    if (ws) {
      worktreeManager = new WorktreeManager(ws.rootPath)
    }
    return ws
  })
  ipcMain.handle('workspace:saveState', (_, { id, state }) => {
    return workspaceStore?.saveState(id, state) ?? false
  })
  ipcMain.handle('workspace:delete', (_, id: string) => {
    return workspaceStore?.delete(id) ?? false
  })

  // File Manager IPCs (Sidebar File Tree & Notes)
  ipcMain.handle('files:listTree', (_, dirPath?: string) => {
    const targetDir = dirPath || workspaceStore?.getActive()?.rootPath || process.cwd()
    return FileManager.listTree(targetDir)
  })
  ipcMain.handle('files:readContent', (_, filePath: string) => {
    return FileManager.readFileContent(filePath)
  })

  // Terminal IPCs with auto-run support (returns serializable DTO)
  ipcMain.handle('terminal:spawn', (_, { id, name, cwd, cols, rows, command, isMaestro }) => {
    const targetCwd = cwd || workspaceStore?.getActive()?.rootPath || process.cwd()
    const session = ptyManager?.spawn(id, name, targetCwd, cols, rows, command, isMaestro)
    if (!session) return null
    return {
      id: session.id,
      name: session.name,
      cwd: session.cwd,
      shell: session.shell,
      command: session.command,
      isMaestro: session.isMaestro
    }
  })

  ipcMain.handle('terminal:write', (_, { id, data }) => {
    return ptyManager?.write(id, data)
  })

  ipcMain.handle('terminal:resize', (_, { id, cols, rows }) => {
    return ptyManager?.resize(id, cols, rows)
  })

  ipcMain.handle('terminal:kill', (_, { id }) => {
    return ptyManager?.kill(id)
  })

  ipcMain.handle('terminal:list', () => {
    return ptyManager?.list() || []
  })

  // Sockets & Notes IPCs
  ipcMain.handle('socket:info', () => {
    return {
      socketPath: socketServer?.socketPath,
      platform: process.platform
    }
  })

  ipcMain.handle('notes:sync', (_, notes: NoteItem[]) => {
    socketServer?.setNotes(notes)
    return true
  })

  // Worktree IPCs
  ipcMain.handle('worktree:list', async () => {
    return worktreeManager?.listFloors() || []
  })

  ipcMain.handle('worktree:create', async (_, name: string) => {
    return worktreeManager?.createFloor(name)
  })

  ipcMain.handle('worktree:remove', async (_, { floorPath, deleteBranch }) => {
    return worktreeManager?.removeFloor(floorPath, deleteBranch)
  })

  ipcMain.handle('worktree:land', async (_, { floorPath, targetBranch }) => {
    return worktreeManager?.landFloor(floorPath, targetBranch)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  try {
    ptyManager?.killAll()
    socketServer?.stop()
  } catch {}
})

app.on('window-all-closed', () => {
  try {
    ptyManager?.killAll()
    socketServer?.stop()
  } finally {
    app.exit(0)
  }
})
