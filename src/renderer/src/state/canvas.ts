import { atom } from 'jotai'

export type NodeType = 'terminal' | 'note' | 'portal'

export interface CanvasNode {
  id: string
  type: NodeType
  title: string
  x: number
  y: number
  width: number
  height: number
  color?: string
  isMaestro?: boolean
  command?: string
  cwd?: string
  data: {
    terminalId?: string
    shell?: string
    content?: string
    url?: string
    [key: string]: unknown
  }
}

export interface CableConnection {
  id: string
  fromNodeId: string
  toNodeId: string
  color?: string
}

export interface WorkspaceItem {
  id: string
  name: string
  rootPath: string
  createdAt: number
  state?: any
}

// Canvas viewport transforms
export const panAtom = atom<{ x: number; y: number }>({ x: 200, y: 150 })
export const zoomAtom = atom(1)
export const selectedNodeIdAtom = atom(null as string | null)
export const expandedNodeIdAtom = atom(null as string | null)
export const canvasModeAtom = atom<'select' | 'draw'>('select')

// Cable interaction atoms
export type PortSide = 'top' | 'bottom' | 'left' | 'right'
export const connectingFromNodeIdAtom = atom(null as string | null)
export const connectingFromPortAtom = atom(null as PortSide | null)
export const connectingLineEndpointAtom = atom(null as { x: number; y: number } | null)

// UI panels atoms
export const sidebarOpenAtom = atom(false)
export const activeSidebarTabAtom = atom<'floors' | 'files'>('floors')
export const commandPaletteOpenAtom = atom(false)
export const minimapOpenAtom = atom(true)
export const newTerminalModalOpenAtom = atom(false)
export const newWorkspaceModalOpenAtom = atom(false)

// Workspaces
export const workspacesAtom = atom<WorkspaceItem[]>([])
export const activeWorkspaceAtom = atom(null as WorkspaceItem | null)

// Nodes & Connections on canvas
export const nodesAtom = atom<CanvasNode[]>([
  {
    id: 'term-1',
    type: 'terminal',
    title: 'Agent Antigravity (Maestro)',
    isMaestro: true,
    color: '#8B5CF6',
    x: 100,
    y: 100,
    width: 620,
    height: 420,
    data: {
      terminalId: 'term-1',
      shell: 'bash'
    }
  },
  {
    id: 'term-2',
    type: 'terminal',
    title: 'Agent Codex (Implementer)',
    color: '#A855F7',
    x: 820,
    y: 100,
    width: 620,
    height: 420,
    data: {
      terminalId: 'term-2',
      shell: 'bash'
    }
  },
  {
    id: 'note-1',
    type: 'note',
    title: 'Notas da Sessão & Diretrizes',
    color: '#EC4899',
    x: 480,
    y: 580,
    width: 580,
    height: 340,
    data: {
      content: `# 🚀 AgentCanvas - Workspace Espacial

Conecte agentes em tempo real com cabos e compartilhe contexto.

\`\`\`mermaid
graph LR
  Antigravity -->|agentcanvas ask| Codex
  Codex -->|Code Review| Antigravity
\`\`\`

- **Tema**: Preto & Roxo Neon
- **Sockets**: Unix Domain Socket e Named Pipe ativos
- **CLI**: \`agentcanvas ask "Agent Codex" "status"\`
`
    }
  }
])

export const connectionsAtom = atom<CableConnection[]>([
  {
    id: 'conn-1',
    fromNodeId: 'term-1',
    toNodeId: 'note-1',
    color: '#8B5CF6'
  },
  {
    id: 'conn-2',
    fromNodeId: 'term-2',
    toNodeId: 'note-1',
    color: '#A855F7'
  },
  {
    id: 'conn-3',
    fromNodeId: 'term-1',
    toNodeId: 'term-2',
    color: '#C084FC'
  }
])

// Algoritmo Tidy Nodes: organiza os nós em grade/colunas limpas
export function tidyNodes(nodes: CanvasNode[]): CanvasNode[] {
  const SPACING_X = 50
  const SPACING_Y = 50
  const COLUMNS = 2
  const START_X = 100
  const START_Y = 100

  const colHeights = new Array(COLUMNS).fill(START_Y)
  const colWidths = new Array(COLUMNS).fill(0)

  // Calcular larguras máximas por coluna
  nodes.forEach((node, idx) => {
    const col = idx % COLUMNS
    colWidths[col] = Math.max(colWidths[col], node.width)
  })

  return nodes.map((node, idx) => {
    const col = idx % COLUMNS
    let currentX = START_X
    for (let c = 0; c < col; c++) {
      currentX += colWidths[c] + SPACING_X
    }
    const currentY = colHeights[col]
    colHeights[col] += node.height + SPACING_Y

    return {
      ...node,
      x: currentX,
      y: currentY
    }
  })
}
