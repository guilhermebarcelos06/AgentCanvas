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

export const panAtom = atom<{ x: number; y: number }>({ x: 200, y: 150 })
export const zoomAtom = atom(1)
export const selectedNodeIdAtom = atom(null as string | null)

// Default nodes showing a multi-agent setup out-of-the-box
export const nodesAtom = atom<CanvasNode[]>([
  {
    id: 'term-1',
    type: 'terminal',
    title: 'Agent Antigravity (Maestro)',
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
