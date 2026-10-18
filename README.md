# 🚀 AgentCanvas

<div align="center">
  <img src="resources/icon.svg" width="160" alt="AgentCanvas Logo" />
  <h3>Spatial AI Agent Canvas Workspace for Linux & Windows</h3>
  <p>Conecte agentes de inteligência artificial em um canvas 2D infinito com terminais PTY WebGL, notas sincronizadas e cabos Bézier luminosos em Preto e Roxo Neon.</p>
</div>

---

## ✨ Funcionalidades Principais

- 🌌 **Infinite 2D Spatial Canvas**: Pan e Zoom suaves em um viewport infinito com grid pontilhado com paralaxe.
- ⚡ **Terminais PTY Acelerados por WebGL**: Terminais reais com `@xterm/xterm` e `node-pty`, suportando Bash/Zsh no Linux e ConPTY (PowerShell/CMD) no Windows.
- 💜 **Estética Preto & Roxo Neon**: Design system imersivo inspirado em ferramentas de ponta (Linear, Raycast, Warp).
- 🔌 **Cabos SVG Bézier Conectores**: Interligação visual entre nós de agentes com animação e brilho neon.
- 📡 **Servidor Socket IPC Integrado**: Unix Domain Sockets no Linux (`/tmp/agentcanvas-*.sock`) e Named Pipes no Windows (`\\.\pipe\agentcanvas-*`).
- 🤖 **CLI Companheiro (`agentcanvas`)**:
  - `agentcanvas list`: Lista agentes e notas conectadas no canvas.
  - `agentcanvas ask "<Agent>" "<prompt>"`: Entrega de mensagens e prompts entre agentes.
  - `agentcanvas check "<Agent>"`: Leitura do buffer e saída do terminal.
  - `agentcanvas note read/write`: Leitura e escrita de notas no canvas.
- 🌳 **Isolamento de Níveis (Git Worktrees / Floors)**: Criação de branches isoladas no disco sem duplicação de repositório.
- 📝 **Editor de Notas Markdown**: Suporte completo a Markdown, diagramas Mermaid e fórmulas matemáticas.

---

## 🛠️ Tecnologias Utilizadas

- **Core Desktop**: Electron 33+, Node.js 22, electron-vite
- **Frontend**: React 19, TypeScript 5.7, Tailwind CSS, Jotai
- **Emulação de Terminal**: node-pty, @xterm/xterm, @xterm/addon-webgl, @xterm/addon-fit
- **Empacotamento**: electron-builder (`.deb`, `.AppImage`, `.exe` NSIS)

---

## 📦 Como Instalar e Rodar

### Modo Desenvolvimento
```bash
# Instalar dependências
npm install

# Iniciar em modo de desenvolvimento
npm run dev
```

### Build para Produção
```bash
# Compilar pacote para Linux (.deb e .AppImage)
npm run build:linux

# Compilar pacote para Windows (.exe e .zip)
npm run build:win
```

---

## 📄 Licença
Distribuído sob a licença MIT.
