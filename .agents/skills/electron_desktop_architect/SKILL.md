---
name: electron_desktop_architect
description: Arquitetura avançada de aplicativos Desktop em Electron + React + TypeScript com gerenciamento determinístico de processos PTY, IPC tipado, compatibilidade com AppArmor/Wayland no Linux e inicialização rápida.
---

# Electron Desktop Architect Skill

Diretrizes de engenharia para construção de aplicativos desktop nativos de alta confiabilidade em Electron, Node-PTY e React.

## 1. Ciclo de Vida de Processos Nativos (Node-PTY)
- **Single Source of Truth**: Instancie apenas um gerenciador `PtyManager` no processo Main e compartilhe a mesma referência entre o servidor de sockets/pipes e os handlers `ipcMain`.
- **Spawn Idempotente e Seguro**:
  - Se `spawn(id)` for chamado para um `id` já ativo, encerre explicitamente o processo anterior (`ptyProcess.kill()`) antes de registrar o novo.
  - No callback `ptyProcess.onExit`, verifique sempre `if (currentSession?.ptyProcess === ptyProcess)` antes de remover a sessão do `Map`, evitando que o encerramento tardio de um processo antigo apague uma sessão recém-criada.
- **Limpeza no Encerramento**:
  - Em `before-quit` e `window-all-closed`, invoque `ptyManager.killAll()`, feche o servidor Unix Socket / Named Pipe e chame `app.exit(0)` para evitar processos órfãos em background.

## 2. Contratos IPC e Serialização Estruturada
- Nunca retorne objetos complexos ou instâncias de classes nativas (`IPty`, `EventEmitter`, `Socket`) diretamente em `ipcMain.handle`.
- Retorne exclusivamente DTOs planos serializáveis pelo algoritmo Structured Clone (`{ id, name, cols, rows, cwd, isMaestro }`).

## 3. Compatibilidade Linux (Ubuntu 24.04+ / GNOME / AppArmor)
- Aplique `app.commandLine.appendSwitch('no-sandbox')` e `app.commandLine.appendSwitch('disable-setuid-sandbox')` no início do processo Main antes do `app.whenReady()`.
- Nos arquivos `.desktop` do usuário (`~/.local/share/applications/`), aponte o `Exec=` para o binário atualizado com `--no-sandbox %U` e mascare entradas quebradas em `/usr/share/applications/` com `Hidden=true` para evitar timeouts de 30s do `StartupNotify` do GNOME Shell.
