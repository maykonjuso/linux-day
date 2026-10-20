/**
 * Travas que protegem o computador principal dos alunos.
 *
 * Duas portas de entrada:
 *
 * 1. O terminal no modo local. Ali o shell de cada aluno é o SEU usuário, na
 *    SUA máquina: um `sudo apt install` de verdade instalaria pacote no
 *    computador do apresentador (e sem pedir senha, se o sudo for NOPASSWD,
 *    como é comum no WSL). Os atalhos abaixo ficam na frente do PATH e
 *    respondem no lugar dos comandos que mexem no sistema. O `sudo` só libera
 *    o que a aula usa, como o sudoers da VM (infra/setup-vm.sh), e "instala"
 *    o pacote do M5 como um atalho na casa do aluno.
 *    Isto é quebra-molas, não muralha: quem digita /usr/bin/sudo passa por
 *    cima. A proteção de verdade é a VM (ARENA_MODO=usuarios), onde cada
 *    aluno é um usuário Linux sem poder nenhum.
 *
 * 2. O painel do apresentador. O PIN padrão está no README, então qualquer
 *    aluno na mesma rede abria /host. Por padrão o painel só aceita o próprio
 *    computador; pela rede só com ARENA_HOST_REMOTO=1 E um PIN definido.
 */

/** os pacotes do sorteio do M5, os mesmos de infra/provision.sh */
export const PACOTES_DO_LAB = ['cmatrix', 'jq', 'cowsay', 'figlet', 'ncdu', 'sl', 'neofetch', 'tree'];

const RECUSA = (nome, porque) => `#!/bin/bash
echo "${nome}: bloqueado no workshop. ${porque}" >&2
exit 1
`;

export function atalhosDeGuarda() {
  const pacotes = ` ${PACOTES_DO_LAB.join(' ')} `;
  const sudo = `#!/bin/bash
# sudo do workshop no modo local: libera só o que a aula usa (o mesmo do
# sudoers da VM) e nunca chama o sudo de verdade do computador principal.
PACOTES="${pacotes}"
recusa() { echo "sudo: neste workshop o sudo só libera o que a aula usa: sudo apt update e sudo apt install -y <seu pacote> (está em ~/.pacote)." >&2; exit 1; }
case "$1" in
  apt|apt-get)
    case "$2" in
      update) echo "Lendo listas de pacotes... Pronto"; exit 0 ;;
      install)
        shift 2
        [ "$1" = "-y" ] && shift
        [ $# -eq 1 ] || { echo "E: instale um pacote por vez: sudo apt install -y <pacote>" >&2; exit 100; }
        case "$PACOTES" in *" $1 "*) ;; *) echo "E: o pacote '$1' não está liberado no workshop. O seu está em ~/.pacote" >&2; exit 100 ;; esac
        destino="$(dirname "$0")/$1"
        if [ -x "$destino" ]; then echo "$1 já é a versão mais nova."; exit 0; fi
        printf '#!/bin/sh\\necho "%s: instalado pelo workshop (simulado neste computador)"\\n' "$1" > "$destino"
        chmod +x "$destino"
        echo "Selecionando o pacote $1..."
        echo "Configurando $1... pronto"
        exit 0 ;;
    esac ;;
esac
recusa
`;
  const apt = `#!/bin/bash
case "$1" in
  install|remove|purge|upgrade|update|full-upgrade|autoremove)
    echo "E: Não foi possível abrir o arquivo de trava - você é root? Use sudo na frente: sudo $(basename "$0") $*" >&2
    exit 100 ;;
esac
echo "$(basename "$0"): no workshop o que vale é sudo apt update e sudo apt install -y <pacote>" >&2
exit 1
`;
  const sistema = 'isso mexe no computador do apresentador, e não na sua máquina de treino.';
  return {
    sudo, apt, 'apt-get': apt,
    su: RECUSA('su', 'trocar de usuário não faz parte da aula.'),
    dpkg: RECUSA('dpkg', 'para instalar use sudo apt install -y <pacote>.'),
    brew: RECUSA('brew', sistema),
    snap: RECUSA('snap', sistema),
    shutdown: RECUSA('shutdown', sistema),
    reboot: RECUSA('reboot', sistema),
    poweroff: RECUSA('poweroff', sistema),
    halt: RECUSA('halt', sistema),
    systemctl: RECUSA('systemctl', sistema),
    launchctl: RECUSA('launchctl', sistema),
  };
}

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
export const ehLocal = (endereco) => LOOPBACK.has(String(endereco ?? ''));

/**
 * Quem pode entrar no painel. Devolve `null` quando pode, ou o motivo.
 * `pinDefinido` diz se o PIN veio do ambiente (e não é o padrão do README).
 */
export function podeSerApresentador({ endereco, remotoLiberado, pinDefinido }) {
  if (ehLocal(endereco)) return null;
  if (!remotoLiberado) return 'o painel só abre no computador que roda o servidor (ARENA_HOST_REMOTO=1 libera pela rede)';
  if (!pinDefinido) return 'para abrir o painel pela rede, defina um PIN próprio em PIN_HOST';
  return null;
}

/** no máximo `limite` tentativas de PIN por endereço a cada `janelaMs` */
export function criarLimitador({ limite = 5, janelaMs = 60_000, agora = () => Date.now() } = {}) {
  const tentativas = new Map();
  return (chave) => {
    const t = agora();
    const recentes = (tentativas.get(chave) ?? []).filter((x) => t - x < janelaMs);
    if (recentes.length >= limite) { tentativas.set(chave, recentes); return false; }
    recentes.push(t);
    tentativas.set(chave, recentes);
    return true;
  };
}
