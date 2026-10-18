import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { PtyManager } from './pty-manager'
import { SocketServer, NoteItem } from './socket-server'
import { WorktreeManager } from './worktree-manager'

let mainWindow: BrowserWindow | null = null
let ptyManager: PtyManager | null = null
let socketServer: SocketServer | null = null
let worktreeManager: WorktreeManager | null = null

function createWindow(): void {
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
    icon: join(__dirname, '../../resources/icon.png'),
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

  // 1. Initialize PTY Manager
  ptyManager = new PtyManager(`/tmp/agentcanvas-${process.getuid?.() || 1000}/agentcanvas.sock`)

  // 2. Initialize Socket Server
  socketServer = new SocketServer(ptyManager, sessionId)
  const actualSocketPath = await socketServer.start()
  // Update PTY manager with exact socket path
  ptyManager = new PtyManager(actualSocketPath)

  // 3. Initialize Worktree Manager
  worktreeManager = new WorktreeManager(process.cwd())

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

  // Register IPC Handlers
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:toggle-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.handle('window:close', () => mainWindow?.close())

  // Terminal IPCs
  ipcMain.handle('terminal:spawn', (_, { id, name, cwd, cols, rows }) => {
    return ptyManager?.spawn(id, name, cwd, cols, rows)
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

app.on('window-all-closed', () => {
  socketServer?.stop()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
