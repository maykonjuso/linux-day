#!/usr/bin/env bash
# Prepara a VM: pacotes, locale, isolamento entre usuários e sudo em lista branca.
# Rode UMA vez, dentro da VM (limactl shell linuxday), como seu usuário.
set -euo pipefail

echo "▸ pacotes"
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends \
  nodejs npm quota tree htop less nano vim curl ca-certificates \
  bash-completion locales tldr jq cowsay figlet ncdu sl fortune-mod neofetch \
  procps psmisc

echo "▸ locale pt_BR"
sudo locale-gen pt_BR.UTF-8
sudo update-locale LANG=pt_BR.UTF-8

echo "▸ isolamento de processos (hidepid=2)"
# A linha mais importante do arquivo: sem ela, qualquer participante vê e mata
# o processo do colega no `ps aux`, e o módulo 5 vira bagunça.
sudo groupadd -f proc
if ! grep -q 'hidepid=2' /etc/fstab; then
  echo 'proc /proc proc defaults,hidepid=2,gid=proc 0 0' | sudo tee -a /etc/fstab >/dev/null
fi
sudo mount -o remount,hidepid=2,gid=proc /proc

echo "▸ limites por usuário (fork bomb derruba só a própria sessão)"
sudo tee /etc/security/limits.d/90-workshop.conf >/dev/null <<'LIM'
@alunos  hard  nproc   300
@alunos  hard  as      524288
@alunos  hard  fsize   204800
LIM

echo "▸ sudo em lista branca (real para a aula, inofensivo para a máquina)"
sudo tee /etc/sudoers.d/workshop >/dev/null <<'SUDO'
%alunos ALL=(root) NOPASSWD: /usr/bin/apt-get update
%alunos ALL=(root) NOPASSWD: /usr/bin/apt-get install -y htop, /usr/bin/apt-get install -y jq, \
  /usr/bin/apt-get install -y cowsay, /usr/bin/apt-get install -y figlet, \
  /usr/bin/apt-get install -y ncdu, /usr/bin/apt-get install -y sl, \
  /usr/bin/apt-get install -y neofetch, /usr/bin/apt-get install -y tree, \
  /usr/bin/apt-get install -y fortune-mod
%alunos ALL=(root) NOPASSWD: /bin/cat /srv/cofre/*
SUDO
sudo chmod 440 /etc/sudoers.d/workshop
sudo visudo -c   # um sudoers quebrado te tranca fora da própria VM

echo "▸ seeds em /opt/seed"
sudo mkdir -p /opt/seed /srv/cofre /srv/chamado
sudo cp "$(dirname "$0")"/seed/*.sh /opt/seed/
sudo chmod +x /opt/seed/*.sh

echo
echo "✅ VM pronta. Agora:  sudo bash infra/provision.sh 30"
