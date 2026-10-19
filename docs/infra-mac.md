# Infraestrutura no Mac — Guia Concreto

> Tudo roda no seu Mac. Os participantes acessam `http://<seu-ip>:3000` pelo Wi-Fi da sala.
> Pilha: **macOS → Lima VM (Ubuntu) → Incus → um container Linux por participante**.
> Faça este guia inteiro **uma vez, até o fim, na primeira semana**. Cada etapa aqui é um lugar onde o dia do evento pode dar errado.

---

## 1. Por que essa pilha (e não Docker)

O currículo depende de `apt`, `sudo`, `/home`, `/var/log`, `ps`/`kill` e utilitários GNU — um Linux honesto por pessoa, isolado dos outros. O macOS não tem quase nada disso (é BSD + `launchd` + `brew`), e container Docker comum não tem `systemd` como PID 1 nem se comporta como máquina. **Incus** dá containers de *sistema* (Ubuntu completo, systemd de verdade, ~200 MB de RAM cada), e **Lima** dá o Linux onde o Incus roda, usando a Virtualization.framework da Apple.

---

## 2. A VM

### Dimensionamento para o seu Mac (M4, 24 GB)

| Fatia | Quanto | Por quê |
|---|---|---|
| macOS + navegador + projeção | **8 GB** | a mesma máquina apresenta; sufocar o host trava a sua tela, não a deles |
| **Lima VM** | **14 GB** | o que o Incus tem para trabalhar |
| Folga não alocada | 2 GB | com `vz` a memória da VM é alocada de verdade; não encoste no teto |
| Dentro da VM: app + apt-cacher + Incus + Ubuntu | ~1,7 GB | sobram **~12 GB para containers** |
| Por container, uso real | ~150–250 MB | Ubuntu + systemd idle ~110 MB; pico no lab (`nano`, `grep` no log de 50k linhas, `htop`, app Node) ~250 MB |

**Conclusão: 30 participantes com folga de mais de 2×. Teto técnico ~40.** Acima de 40 o gargalo deixa de ser RAM e passa a ser **você** (1 monitor por 10 pessoas) e a térmica do Mac — não a máquina.

vCPU: o M4 tem 10 núcleos. Dê **6 à VM** e deixe 4 para o macOS, navegador e espelhamento de tela — a suavidade da *sua* tela durante a apresentação vale mais que 2 vCPUs que 30 containers ociosos não vão usar.

```bash
brew install lima qrencode

limactl create --name=linuxday --vm-type=vz \
  --cpus=6 --memory=14 --disk=80 template://ubuntu-24.04
```

Edite `~/.lima/linuxday/lima.yaml` **antes de iniciar** — estes dois blocos são obrigatórios:

```yaml
# Sem hostIP 0.0.0.0, o Lima só expõe em 127.0.0.1 e NINGUÉM da sala acessa.
portForwards:
  - guestPort: 3000
    hostIP: "0.0.0.0"

mounts:
  - location: "~/Developer/linux-day"
    writable: true
```

```bash
limactl start linuxday
limactl shell linuxday          # entra na VM
```

Se for um **MacBook Air M4**, atenção: ele é **sem ventoinha**. Carga sustentada de 30 containers + espelhamento de tela derruba o clock depois de ~15–20 min — e o workshop tem 120. Mitigação: máquina em superfície dura e elevada (nunca sobre tecido ou mesa fechada), nada além do app e do navegador aberto, build de produção, e **um ensaio de 40 minutos com os 30 containers rodando e a tela espelhada**, olhando `pmset -g thermlog` e `powermetrics` no fim. Em Mac mini ou MacBook Pro M4 isso é um não-problema.

---

## 3. Incus e o cache de pacotes (dentro da VM)

```bash
sudo apt update
sudo apt install -y incus incus-client apt-cacher-ng btrfs-progs
sudo adduser "$USER" incus-admin && newgrp incus-admin

incus admin init --minimal
# pool com clone copy-on-write: 30 cópias da imagem base custam quase nada de disco
incus storage create fast btrfs size=50GiB
```

O `apt-cacher-ng` (porta 3142) é o que faz os **30 `apt install` do M5 baixarem uma vez só** — e o que mantém o lab funcionando se a internet do local cair. Aponte os containers para ele via a base (§4).

---

## 4. A imagem base do participante

```bash
incus launch images:ubuntu/24.04 base --storage fast
incus exec base -- bash -euxo pipefail <<'SETUP'
  # apt via cache da VM (10.x.x.1 = gateway da incusbr0; confirme com `ip route`)
  echo 'Acquire::http::Proxy "http://10.0.0.1:3142";' > /etc/apt/apt.conf.d/01proxy

  apt-get update
  apt-get install -y --no-install-recommends \
      nano vim less tree htop curl ca-certificates sudo \
      iproute2 ufw nodejs tldr bash-completion locales

  # pacotes do M5 pré-baixados: o `apt install` da aula fica instantâneo e funciona offline
  apt-get install -y --download-only htop jq ncdu cowsay

  locale-gen pt_BR.UTF-8 && update-locale LANG=pt_BR.UTF-8

  # O participante NÃO é root: é assim que `sudo` e o módulo de permissões fazem sentido
  useradd -m -s /bin/bash -G sudo aluno
  echo 'aluno:linux' | chpasswd

  # app de exemplo do M4/M5
  install -d -o aluno -g aluno /home/aluno/app
  cat > /home/aluno/app/app.js <<'APP'
const http = require('http');
const os = require('os');
http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<h1>No ar em ${os.hostname()}</h1>`);
}).listen(3000, () => console.log('ouvindo na porta 3000'));
APP
  chown -R aluno:aluno /home/aluno/app
SETUP

incus stop base
incus snapshot create base golden
```

**Não** pré-instale os pacotes do M5 (`htop`, `jq`, `cowsay`): instalar é a aula. Pré-baixar os `.deb` é o que torna isso instantâneo sem tirar o aprendizado — e o `cowsay` existe na lista porque `apt install` ficar divertido na primeira vez importa.

---

## 5. Provisionar a turma

`infra/provision.sh` (rode da VM, no dia -1):

```bash
#!/usr/bin/env bash
set -euo pipefail
N=${1:-30}
for i in $(seq -w 1 "$N"); do
  c="ld-$i"
  incus copy base "$c" --storage fast
  incus config set "$c" \
      limits.cpu=1 limits.cpu.allowance=50% \
      limits.memory=640MiB limits.memory.enforce=hard \
      limits.memory.swap=false \
      limits.processes=400
  incus start "$c"
  incus snapshot create "$c" inicio      # reset do participante volta para cá
  echo "ok $c"
done
```

Operação durante o evento (do **seu** shell, que é para isso que ele serve):

```bash
incus list                                   # quem está vivo, IP, RAM
incus exec ld-07 -- su - aluno               # entrar no ambiente de alguém para ajudar
incus snapshot restore ld-07 inicio          # reset em ~2s, sem perder XP
incus info ld-07 --resources                 # quem está comendo CPU
incus exec ld-07 -- ls -la /home/aluno           # checagem manual do ambiente
```

Containers de grupo para o boss (compartilhados de propósito — 4 terminais na mesma máquina, cada um com os 4 defeitos semeados):

```bash
for g in azul verde vermelho amarelo; do
  incus copy base "grupo-$g" --storage fast
  incus config set "grupo-$g" limits.cpu=2 limits.memory=1GiB
  incus start "grupo-$g"
  incus exec "grupo-$g" -- bash /opt/seed/boss.sh     # semeia os 4 defeitos
  incus snapshot create "grupo-$g" chamado            # para resetar o boss entre ensaios
done
```

O `boss.sh` monta o cenário do chamado: gera `/var/log/app/relatorio.log` com as linhas de `ERROR`, sobe um processo que consome CPU (um `while true` com nome plausível), cria `~/backup.sh` **sem** permissão de execução, e **não** deixa pista de onde nada está — achar é parte da prova.

---

## 6. Isolamento entre participantes

```bash
# ACL: container fala com o gateway/cache da VM, não com os colegas
incus network acl create isolado
incus network acl rule add isolado egress action=allow destination=10.0.0.1/32
incus network acl rule add isolado egress action=allow destination=0.0.0.0/0 \
    protocol=tcp destination_port=80,443       # apt, se precisar sair
incus network acl rule add isolado egress action=reject destination=10.0.0.0/24
incus network set incusbr0 security.acls=isolado
```

A ACL fica ligada do começo ao fim: nenhum participante precisa alcançar a máquina do outro, e o boss acontece **dentro** de um container compartilhado. Uma regra a menos para errar no dia.

Garantias que isso te dá, e que um shell compartilhado nunca daria: sistema de arquivos próprio, `root` sem risco para o host, **porta 80 livre para todos ao mesmo tempo**, e `fork bomb` matando só o próprio container.

---

## 7. O app

```bash
limactl shell linuxday
cd ~/Developer/linux-day
pnpm install && pnpm build && pnpm start       # produção, nunca `dev`, no dia
```

Ele fala com o Incus pelo socket local (`/var/lib/incus/unix.socket`), alcança os containers pela `incusbr0` e expõe:
- o deck em `:3000`;
- o proxy dos grupos em `/g/<grupo>` → `grupo-<cor>:80`;
- as portas de efeito dramático `8081+` → `grupo-<cor>:80`.

---

## 8. Checklist de T-2h (no dia)

```bash
ipconfig getifaddr en0                          # seu IP na sala
qrencode -t ANSIUTF8 "http://$(ipconfig getifaddr en0):3000"
caffeinate -dimsu &                             # Mac não dorme
```

- [ ] IP fixado manualmente (ou reservado no roteador) — DHCP trocando IP no meio do evento é game over
- [ ] Firewall do macOS já autorizou o processo (teste de outro aparelho, não do próprio Mac)
- [ ] **Dois celulares conectados ao Wi-Fi abriram o deck** — é o único teste que prova que não há AP isolation
- [ ] `incus list` com todos os containers `RUNNING` e com snapshot `inicio`
- [ ] Mac na tomada, apps fechados, build de produção rodando
- [ ] containers de grupo com os 4 defeitos semeados e o checker do boss passando no cenário resolvido
- [ ] SSD externo com `restore.sh`, imagem da VM, banco e PDF dos slides
- [ ] QR code projetado e impresso em A4 na porta

---

## 9. Os três jeitos de isso dar errado

| Problema | Sintoma no dia | O que fazer |
|---|---|---|
| **AP isolation no Wi-Fi** | você acessa pelo Mac, mais ninguém acessa | roteador de bolso próprio (GL.iNet, ~R$ 200) — todos conectam nele. **Teste no local antes** |
| **Térmica do Mac** (RAM está resolvida com 24 GB) | containers lentos e terminal engasgando a partir do minuto 40 | ensaio de 40 min com carga total e tela espelhada; superfície dura; só o app e o navegador abertos; se for Air (sem ventoinha), é o item mais provável de te atrapalhar |
| **Mac morre** | o evento acaba | SSD com `restore.sh` + segundo notebook assumindo o mesmo IP + PDF dos slides + labs impressos |
