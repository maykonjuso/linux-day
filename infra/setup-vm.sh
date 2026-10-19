#!/usr/bin/env bash
# Prepara a VM: pacotes, locale, isolamento entre usuários e sudo em lista branca.
# Rode UMA vez, dentro da VM (limactl shell linuxday), como seu usuário.
set -euo pipefail

echo "▸ pacotes"
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends \
  nodejs npm quota htop less nano vim curl ca-certificates \
  bash-completion locales tldr procps psmisc

# Os pacotes do sorteio do M5 só são BAIXADOS (ficam no cache do apt), não
# instalados: assim o `sudo apt install` do laboratório funciona sem internet e
# é rápido, mas instala de verdade. Instalados de antemão, o critério "seu
# pacote está instalado" ficava verde antes de a pessoa digitar qualquer coisa.
# O htop fica instalado de propósito: o boss usa ele para achar o processo.
sudo apt-get install -y --download-only --no-install-recommends \
  jq cowsay figlet ncdu sl neofetch tree cmatrix

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
# o deck ensina `sudo apt install -y <pacote>`: o apt precisa estar liberado,
# não só o apt-get (antes o comando do slide era recusado)
sudo tee /etc/sudoers.d/workshop >/dev/null <<'SUDO'
%alunos ALL=(root) NOPASSWD: /usr/bin/apt update
%alunos ALL=(root) NOPASSWD: /usr/bin/apt install -y jq, /usr/bin/apt install -y cowsay, /usr/bin/apt install -y figlet, /usr/bin/apt install -y ncdu, /usr/bin/apt install -y sl, /usr/bin/apt install -y neofetch, /usr/bin/apt install -y tree, /usr/bin/apt install -y cmatrix
%alunos ALL=(root) NOPASSWD: /usr/bin/apt-get update
%alunos ALL=(root) NOPASSWD: /usr/bin/apt-get install -y jq, /usr/bin/apt-get install -y cowsay, /usr/bin/apt-get install -y figlet, /usr/bin/apt-get install -y ncdu, /usr/bin/apt-get install -y sl, /usr/bin/apt-get install -y neofetch, /usr/bin/apt-get install -y tree, /usr/bin/apt-get install -y cmatrix
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
