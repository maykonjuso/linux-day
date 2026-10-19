#!/usr/bin/env bash
# Cria as contas dos participantes. Rode como root DENTRO da VM, no dia -1:
#   sudo bash infra/provision.sh 30
set -euo pipefail
N=${1:-30}
PREFIXO=${ARENA_PREFIXO:-aluno}
SEEDS=${ARENA_SEEDS:-/opt/seed}
# Cada participante instala um pacote DIFERENTE no M5: se todos instalassem o
# mesmo, do segundo em diante o apt diria "already the newest version" e o lab
# perderia o sentido.
PKGS=(htop jq cowsay figlet ncdu sl neofetch tree)

[ "$(id -u)" = 0 ] || { echo "rode com sudo"; exit 1; }

groupadd -f alunos
mkdir -p /srv/cofre
chmod 755 /srv/cofre

for i in $(seq -w 1 "$N"); do
  u="$PREFIXO$i"
  if ! id "$u" >/dev/null 2>&1; then
    useradd -m -s /bin/bash -G alunos "$u"
    echo "$u:linux" | chpasswd
  fi
  chmod 700 "/home/$u"                       # ninguém entra na casa do outro
  setquota -u "$u" 400000 500000 0 0 / 2>/dev/null || true

  echo "${PKGS[$((10#$i % ${#PKGS[@]}))]}" > "/home/$u/.pacote"
  chown "$u:$u" "/home/$u/.pacote"

  # cofre que só abre com sudo, para o módulo 3
  echo "parabens $u, voce usou sudo" > "/srv/cofre/$u.txt"
  chmod 600 "/srv/cofre/$u.txt"

  for m in m1 m2 m3 m4 m5; do
    sudo -u "$u" -H bash "$SEEDS/$m.sh" >/dev/null 2>&1 || echo "  ⚠ seed $m falhou para $u"
  done
  echo "ok $u"
done

# grupos do boss: diretório compartilhado com setgid (e uma aula de grupo em
# Linux de graça)
for g in azul verde vermelho amarelo roxo laranja ciano rosa lima grafite; do
  groupadd -f "g-$g"
  install -d -m 2770 -g "g-$g" "/srv/chamado/grupo-$g"
done

echo
echo "✅ $N contas criadas. Senha de todas: linux"
echo "   boss:   sudo GRUPO=azul DIR_GRUPO=/srv/chamado/grupo-azul bash $SEEDS/boss.sh"
echo "   grupos: sudo usermod -aG g-azul ${PREFIXO}07"
