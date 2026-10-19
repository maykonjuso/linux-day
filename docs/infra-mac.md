# Infraestrutura no Mac — Guia Concreto

> Tudo roda no seu Mac (M4, 24 GB). Os participantes acessam `http://<seu-ip>:3000` pelo Wi-Fi da sala.
> Pilha: **macOS → uma Lima VM (Ubuntu) → um usuário Linux por participante**.
> Faça este guia inteiro **uma vez, até o fim, na primeira semana**. Cada etapa aqui é um lugar onde o dia do evento pode dar errado.

---

## 1. Por que uma VM com usuários (e não containers, nem o shell do Mac)

O currículo precisa de `apt`, `sudo`, `/home`, `/var/log`, `ps`/`kill` e utilitários GNU. O macOS não tem nenhum deles (é BSD + `launchd` + `brew`), então **ensinar no shell do Mac não funciona** — e colocaria 30 pessoas na sua `$HOME`.

Containers por pessoa seriam necessários se ensinássemos serviço e rede. Não ensinamos mais: o que cada pessoa precisa é uma `$HOME` própria e um `sudo` que não derrube a casa. **Um usuário Linux por participante** entrega isso com ~400 MB no total, reset em 1 segundo e nenhuma peça extra para falhar no dia.

---

## 2. A VM

| Fatia | Quanto |
|---|---|
| macOS + navegador + projeção | ~14 GB |
| **Lima VM** | **8 GB, 6 vCPU, 40 GB de disco** |
| 30 shells + app + SQLite dentro dela | ~1,5 GB — sobra folga enorme |

O M4 tem 10 núcleos: 6 para a VM, 4 para o macOS e o espelhamento de tela. A suavidade da *sua* tela durante a apresentação vale mais que 2 vCPUs que 30 shells ociosos não vão usar.

```bash
brew install lima qrencode

limactl create --name=linuxday --vm-type=vz \
  --cpus=6 --memory=8 --disk=40 template://ubuntu-24.04
```

Edite `~/.lima/linuxday/lima.yaml` **antes de iniciar** — sem `hostIP`, o Lima só expõe em `127.0.0.1` e ninguém da sala acessa:

```yaml
portForwards:
  - guestPort: 3000
    hostIP: "0.0.0.0"

mounts:
  - location: "~/Developer/linux-day"
    writable: true
```

```bash
limactl start linuxday
limactl shell linuxday
```

**Se for MacBook Air M4:** ele é sem ventoinha. 2 h de carga + espelhamento de tela derruba o clock por volta dos 15–20 min. Máquina em superfície dura e elevada, só o app e o navegador abertos, build de produção, e **um ensaio de 40 min com carga real** olhando `pmset -g thermlog` no fim. Em Mac mini ou MacBook Pro, não é problema.

---

## 3. Preparar a VM (uma vez)

```bash
sudo apt update
sudo apt install -y nodejs npm quota tree htop less nano vim curl \
    bash-completion locales tldr jq cowsay figlet ncdu sl fortune-mod neofetch
sudo locale-gen pt_BR.UTF-8 && sudo update-locale LANG=pt_BR.UTF-8
```

**`hidepid=2` — a linha mais importante do arquivo.** Sem ela, qualquer um vê (e mata) o processo do colega no `ps aux`, e o M5 vira bagunça:

```bash
echo 'proc /proc proc defaults,hidepid=2,gid=proc 0 0' | sudo tee -a /etc/fstab
sudo groupadd -f proc
sudo mount -o remount,hidepid=2,gid=proc /proc
```

Limites por usuário (um `fork bomb` derruba só a sessão de quem rodou):

```bash
sudo tee /etc/security/limits.d/90-workshop.conf >/dev/null <<'LIM'
@alunos  hard  nproc   300
@alunos  hard  as      524288
@alunos  hard  fsize   204800
LIM
```

`sudo` em **lista branca** — real para a aula, inofensivo para a máquina. `$PKG` é o pacote sorteado para aquele aluno (§4):

```bash
sudo tee /etc/sudoers.d/workshop >/dev/null <<'SUDO'
%alunos ALL=(root) NOPASSWD: /usr/bin/apt-get update
%alunos ALL=(root) NOPASSWD: /usr/bin/apt-get install -y htop, /usr/bin/apt-get install -y jq, \
  /usr/bin/apt-get install -y cowsay, /usr/bin/apt-get install -y figlet, \
  /usr/bin/apt-get install -y ncdu, /usr/bin/apt-get install -y sl, \
  /usr/bin/apt-get install -y neofetch, /usr/bin/apt-get install -y fortune-mod
%alunos ALL=(root) NOPASSWD: /bin/cat /srv/cofre/*
SUDO
sudo visudo -c   # valide SEMPRE, senão você se tranca fora do sudo
```

---

## 4. Provisionar a turma

`infra/provision.sh`, rodado na VM no dia -1:

```bash
#!/usr/bin/env bash
set -euo pipefail
N=${1:-30}
PKGS=(htop jq cowsay figlet ncdu sl neofetch fortune-mod)

sudo groupadd -f alunos
for i in $(seq -w 1 "$N"); do
  u="aluno$i"
  sudo useradd -m -s /bin/bash -G alunos "$u"
  echo "$u:linux" | sudo chpasswd
  sudo chmod 700 "/home/$u"                       # ninguém entra na casa do outro
  sudo setquota -u "$u" 400000 500000 0 0 /        # cota de ~500 MB

  # o pacote que ESTE aluno vai instalar no M5 (cada um recebe um diferente:
  # senão o segundo a instalar vê "already the newest version" e a aula morre)
  echo "${PKGS[$((10#$i % ${#PKGS[@]}))]}" | sudo tee "/home/$u/.pacote" >/dev/null

  # cofre que só abre com sudo, para o M3
  sudo install -d -m 755 /srv/cofre
  echo "parabens $u, voce usou sudo" | sudo tee "/srv/cofre/$u.txt" >/dev/null
  sudo chmod 600 "/srv/cofre/$u.txt"

  sudo -u "$u" bash /opt/seed/all.sh               # semeia os labs do M1 ao M5
  echo "ok $u"
done
```

Grupos do boss (o diretório compartilhado é a própria aula de grupo em Linux):

```bash
for g in azul verde vermelho amarelo; do
  sudo groupadd -f "g-$g"
  sudo install -d -m 2770 -g "g-$g" "/srv/chamado/grupo-$g"   # 2770 = setgid
  sudo bash /opt/seed/boss.sh "$g"
done
# e, ao formar os grupos na hora: sudo usermod -aG g-azul aluno07
```

O `boss.sh` monta o chamado: gera `/srv/chamado/grupo-X/log/relatorio.log` com as linhas de `ERROR`, sobe um processo que consome CPU com nome plausível, cria `backup.sh` **sem** permissão de execução, e não deixa pista de onde nada está — achar é parte da prova.

Operação durante o evento, do **seu** shell (é para isso que ele serve):

```bash
who                                   # quem está logado
sudo -u aluno07 -i                    # entrar no ambiente de alguém para ajudar
sudo /opt/seed/reset.sh aluno07       # reset em ~1s: limpa a home e re-semeia
ps -eo user,pcpu,etime,comm --sort=-pcpu | head   # quem está comendo CPU
sudo -u aluno07 dpkg -s htop | head -2            # checagem manual
```

---

## 5. O app

```bash
limactl shell linuxday
cd ~/Developer/linux-day
npm install && npm run build && npm start     # produção, nunca `dev`, no dia
```

Ele abre um PTY por participante com `su - alunoNN` (via `node-pty`), roda os checkers como `root` numa fila de no máximo 6 em paralelo, e serve o deck em `:3000`. Nada mais sai para a rede.

---

## 6. Checklist de T-2h

```bash
ipconfig getifaddr en0
qrencode -t ANSIUTF8 "http://$(ipconfig getifaddr en0):3000"
caffeinate -dimsu &
```

- [ ] IP fixado manualmente (ou reservado no roteador) — DHCP trocando IP no meio do evento é game over
- [ ] Firewall do macOS já autorizou o processo (teste de **outro aparelho**, não do próprio Mac)
- [ ] **Dois celulares no Wi-Fi abriram o deck** — é o único teste que prova que não há AP isolation
- [ ] `who` vazio, 30 usuários criados, `sudo visudo -c` limpo, `hidepid` ativo (`ps aux` como aluno não mostra o processo de outro)
- [ ] seeds aplicados: `ls ~aluno07` mostra o lab do M1 ao M5
- [ ] boss semeado nos 4 diretórios de grupo e o checker passando no cenário resolvido
- [ ] Mac na tomada, apps fechados, build de produção
- [ ] SSD externo com `restore.sh`, imagem da VM, banco e PDF dos slides
- [ ] QR code projetado e impresso em A4 na porta

---

## 7. Os três jeitos de isso dar errado

| Problema | Sintoma no dia | O que fazer |
|---|---|---|
| **AP isolation no Wi-Fi** | você acessa pelo Mac, mais ninguém acessa | roteador de bolso próprio (~R$ 200), todos conectam nele. **Teste no local antes** |
| **Térmica** (RAM está folgada) | terminal engasgando a partir do minuto 40 | ensaio de 40 min com carga total e tela espelhada; superfície dura; nada além do app aberto |
| **Mac morre** | o evento acaba | SSD com `restore.sh` + segundo notebook assumindo o mesmo IP + PDF dos slides + labs impressos |
