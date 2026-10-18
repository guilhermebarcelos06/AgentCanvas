---
name: app_performance_tuning
description: Otimização de performance para 60 FPS em React + Electron + Xterm.js, prevenção de re-renderizações em cascata, batching por requestAnimationFrame e isolamento de estado Jotai.
---

# App Performance Tuning (60 FPS) Skill

Checklist e técnicas para eliminar engasgos, reduzir uso de CPU/GPU e manter 60 FPS constantes em aplicações com múltiplos terminais e iframes.

## 1. Isolamento Reativo e Prevenção de Re-renders
- **Proibido assinar `panAtom` ou `zoomAtom` dentro de nós filhos (`NodeContainer`)**:
  - Se cada nó assinar `panAtom`, qualquer movimento de 1px da câmera forçará o React a re-renderizar todos os nós do canvas.
  - Leia átomos transitórios dentro de handlers de eventos usando `store.get(panAtom)` / `store.get(zoomAtom)` e envolva `NodeContainer`, `TerminalNode`, `NoteNode`, `PortalNode` e `CableLayer` em `React.memo`.

## 2. Batching de Saída PTY com `requestAnimationFrame`
- Terminais que despejam milhares de linhas por segundo não devem chamar `term.write(data)` sincronamente a cada evento IPC.
- Acumule os chunks em uma variável `pendingBuffer` e faça flush uma única vez por quadro via `window.requestAnimationFrame`.

## 3. Desacoplamento de Efeitos Colaterais (IPC Debounce & Diff)
- Nunca dispare sincronização de notas (`syncNotes`) em resposta a alterações de coordenadas `x`/`y` ou `width`/`height` de nós.
- Derive uma chave memoizada contendo apenas `id`, `title` e `content` das notas antes de acionar o IPC.
- Evite filtros SVG caros (`feGaussianBlur` combinados com `animate-pulse` infinitos) sobre dezenas de cabos simultâneos.
