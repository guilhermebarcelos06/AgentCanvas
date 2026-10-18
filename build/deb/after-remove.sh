#!/bin/bash
set -e

# Limpar perfil AppArmor ao desinstalar
if [ -f /etc/apparmor.d/agentcanvas ]; then
  apparmor_parser -R /etc/apparmor.d/agentcanvas 2>/dev/null || true
  rm -f /etc/apparmor.d/agentcanvas 2>/dev/null || true
fi

# Atualizar cache de ícones do sistema
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache /usr/share/icons/hicolor -f -t 2>/dev/null || true
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database -q /usr/share/applications 2>/dev/null || true
fi
