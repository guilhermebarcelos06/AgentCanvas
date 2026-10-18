---
name: spatial_canvas_ui
description: Engenharia de interfaces espaciais 2D infinitas (Infinite Canvas), minimapa interativo com PointerCapture, zoom centrado no cursor, cabos Bézier adaptativos e barras de ferramentas flutuantes.
---

# Spatial Canvas UI Skill

Padrões de implementação para canvases infinitos de 60 FPS (estilo Maestri, Figma, tldraw).

## 1. Câmera 2D, Pan & Zoom
- Aplique a transformação do plano infinito exclusivamente via GPU em um único contêiner:
  `transform: translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` com `transformOrigin: '0 0'`.
- **Regra do Wheel (Scroll vs Zoom)**:
  - `e.ctrlKey || e.metaKey`: executa **Zoom** ancorado exatamente na posição do cursor (`mouseX - (mouseX - pan.x) * (newZoom / zoom)`).
  - Sem modificador: se o alvo estiver dentro de `.xterm-viewport`, `textarea`, `.overflow-y-auto` ou `iframe`, permita a rolagem nativa do elemento; caso contrário, desloque o `pan` do canvas suavemente.

## 2. Minimapa Radar com Arraste Contínuo (`PointerCapture`)
- **Nunca use apenas `onClick`** no minimapa.
- Implemente `onPointerDown` + `e.currentTarget.setPointerCapture(e.pointerId)` + `onPointerMove` chamando `jumpToClient(clientX, clientY)` para permitir arrastar a câmera continuamente mesmo quando o cursor sai dos limites do minimapa.
- Calcule o bounding box do mundo como a **união** dos limites dos nós e do retângulo do viewport atual da câmera (`worldViewX`, `worldViewY`, `worldViewW`, `worldViewH`), garantindo que o indicador da câmera nunca escape da superfície do radar.

## 3. Posicionamento e Cabos Inteligentes
- Novos elementos criados pela toolbar devem nascer no **centro do viewport visível** (`(-pan.x + viewportW / 2 - nodeW / 2) / zoom`) com leve cascata determinística.
- Ao excluir qualquer nó, limpe simultaneamente todas as conexões incidentes (`fromNodeId === id || toNodeId === id`).
