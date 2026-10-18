#!/bin/bash
set -e

# 1. Configurar permissão SUID no chrome-sandbox (padrão Chromium)
if [ -f /opt/AgentCanvas/chrome-sandbox ]; then
  chown root:root /opt/AgentCanvas/chrome-sandbox 2>/dev/null || true
  chmod 4755 /opt/AgentCanvas/chrome-sandbox 2>/dev/null || true
fi

# 2. Configurar perfil AppArmor no Ubuntu 24.04/26.04 permitindo userns
if [ -d /etc/apparmor.d ]; then
  cat > /etc/apparmor.d/agentcanvas << 'EOF'
abi <abi/4.0>,
include <tunables/global>

profile "agentcanvas" "/opt/AgentCanvas/agentcanvas" flags=(unconfined) {
  userns,

  # Inclusões locais específicas
  include if exists <local/agentcanvas>
}
EOF
  apparmor_parser -r /etc/apparmor.d/agentcanvas 2>/dev/null || true
fi

# 3. Atualizar cache de ícones do sistema
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache /usr/share/icons/hicolor -f -t 2>/dev/null || true
fi

# 4. Atualizar banco de dados desktop
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database -q /usr/share/applications 2>/dev/null || true
fi
