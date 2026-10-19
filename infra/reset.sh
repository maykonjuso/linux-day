#!/usr/bin/env bash
# Reset do ambiente de um participante. ~1 segundo, e não afeta mais ninguém.
# Resetar é SEMPRE de graça: medo de quebrar a máquina é o maior freio do
# iniciante, e tirar esse medo vale mais que qualquer ponto.
set -euo pipefail
u=${1:?uso: sudo bash infra/reset.sh aluno07}
SEEDS=${ARENA_SEEDS:-/opt/seed}

id "$u" >/dev/null
pkill -u "$u" -f 'node .*app.js' 2>/dev/null || true
rm -rf "/home/$u"/* "/home/$u"/.arena
cp -a /etc/skel/. "/home/$u/"
chown -R "$u:$u" "/home/$u"
for m in m1 m2 m3 m4 m5; do sudo -u "$u" -H bash "$SEEDS/$m.sh" >/dev/null; done
echo "✅ $u resetado (XP mantido: o placar vive no banco do app)"
