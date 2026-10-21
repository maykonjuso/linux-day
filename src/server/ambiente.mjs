/**
 * O ambiente Linux de cada participante.
 *
 * Dois modos, porque o app é desenvolvido no macOS e roda na Lima VM:
 *   ARENA_MODO=local      → cada participante recebe uma "casa" em data/casas/<conta>
 *                           e o shell roda como você. Serve para desenvolver e ensaiar.
 *   ARENA_MODO=usuarios   → conta = alunoNN de verdade (a VM, no dia): o shell abre
 *                           com `su - alunoNN` e os checks rodam como root.
 *
 * Nos dois modos a interface é a mesma, e é só esta: alocar conta, semear,
 * resetar, aplicar gabarito, rodar check.
 */
import { execFile } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { atalhosDeGuarda } from './guarda.mjs';

const exec = promisify(execFile);

function acharExecutavel(nome, candidatos = []) {
  const doAmbiente = String(process.env.PATH ?? '').split(':').filter(Boolean).map((p) => resolve(p, nome));
  return [...candidatos, ...doAmbiente].find((p) => existsSync(p)) ?? null;
}

export const MODO = process.env.ARENA_MODO ?? 'local';
export const PREFIXO = process.env.ARENA_PREFIXO ?? 'aluno';
const RAIZ = resolve(process.env.ARENA_CASAS ?? './data/casas');
const SEEDS = resolve('./infra/seed');
const SOLVES = resolve('./infra/solve');
export const RAIZ_GRUPOS = MODO === 'local' ? resolve('./data/chamado') : '/srv/chamado';

const contasEmUso = new Map(); // conta -> participanteId

if (MODO === 'local') mkdirSync(RAIZ, { recursive: true });

/** Aloca a próxima conta livre (aluno01, aluno02, …) e fixa para aquele participante. */
export function alocarConta(participanteId, contaExistente) {
  if (contaExistente) {
    contasEmUso.set(contaExistente, participanteId);
    return contaExistente;
  }
  for (const [conta, dono] of contasEmUso) if (dono === participanteId) return conta;
  const limite = Number(process.env.ARENA_MAX_CONTAS ?? 150);
  for (let i = 1; i <= limite; i++) {
    const conta = `${PREFIXO}${String(i).padStart(2, '0')}`;
    if (!contasEmUso.has(conta)) {
      contasEmUso.set(conta, participanteId);
      return conta;
    }
  }
  throw new Error(`sem contas livres (limite de ${limite})`);
}

export function liberarConta(conta) {
  contasEmUso.delete(conta);
}

/**
 * Repovoação do map contasEmUso depois de um reinício do servidor.
 * Sem isso, ao rearrancar o servidor o map começa vazio e `alocarConta`
 * distribui a mesma conta para participantes diferentes que já estavam no banco.
 * Deve ser chamada uma vez, logo depois de `jogo.recarregarDoBanco()`.
 */
export function restaurarContas(participantes) {
  contasEmUso.clear();
  for (const [id, p] of participantes) {
    if (p.conta) contasEmUso.set(p.conta, id);
  }
}

export function casaDe(conta) {
  return MODO === 'local' ? resolve(RAIZ, conta) : `/home/${conta}`;
}

/** Como rodar um comando *como* o participante (ou como root, no modo usuarios). */
function comoUsuario(conta, script, env = {}, timeout = 10_000) {
  const home = casaDe(conta);
  const ambiente = {
    // os atalhos locais (whoami/id) vêm antes do PATH do sistema
    PATH: MODO === 'local' ? `${resolve(home, '.arena/bin')}:${process.env.PATH}` : process.env.PATH,
    HOME: home,
    USER: conta,
    LOGNAME: conta,
    LANG: 'C.UTF-8',
    TERM: 'xterm-256color',
    ...env,
  };
  if (MODO === 'usuarios') {
    // `su -` dá um login shell limpo; passamos o script pelo stdin do bash
    return exec('su', ['-', conta, '-c', `bash -c ${JSON.stringify(script)}`], {
      timeout, maxBuffer: 1 << 22, env: ambiente,
    });
  }
  mkdirSync(home, { recursive: true });
  return exec('bash', ['-c', script], { cwd: home, timeout, maxBuffer: 1 << 22, env: ambiente });
}

/** Argumentos do PTY: o shell interativo que aparece dentro do slide. */
/**
 * Travas aplicadas ANTES de entregar o shell para a pessoa.
 *
 * São limites por processo do próprio sistema (setrlimit), então valem para
 * tudo que ela rodar dali para frente, inclusive o que ela escrever num script:
 *   -u  quantos processos pode criar      (barra fork bomb)
 *   -v  memória virtual por processo      (barra `dd` e laço que aloca sem fim)
 *   -f  tamanho de arquivo que pode criar (barra encher o disco)
 *   -t  segundos de CPU por processo      (mata `while :; do :; done` sozinho)
 *   -n  arquivos abertos ao mesmo tempo
 *   -c  sem core dump (um só enche o disco)
 *
 * O `-t` é o mais importante para um workshop: o laço infinito é o acidente
 * mais comum, e com ele o próprio kernel encerra o processo sem ninguém
 * precisar notar.
 */
export const TRAVAS = {
  processos: Number(process.env.ARENA_MAX_PROC ?? 120),
  memoriaKb: Number(process.env.ARENA_MAX_MEM_KB ?? 768 * 1024),
  arquivoKb: Number(process.env.ARENA_MAX_ARQUIVO_KB ?? 200 * 1024),
  cpuSegundos: Number(process.env.ARENA_MAX_CPU ?? 90),
  arquivosAbertos: Number(process.env.ARENA_MAX_FD ?? 256),
};

function comandoComTravas(comandoFinal) {
  const t = TRAVAS;
  /*
   * `ulimit -u` conta processos POR USUÁRIO DO SISTEMA, não por sessão.
   *
   * No modo de contas reais (a VM do evento) isso é exatamente o que
   * queremos: cada pessoa tem o próprio usuário, e o limite é dela.
   *
   * No modo local todas as sessões rodam como o MESMO usuário do Mac, junto
   * com os seus aplicativos: pôr um teto baixo ali não protege nada e quebra
   * o shell na hora ("fork: Resource temporarily unavailable"), como apareceu
   * no teste. Nesse modo quem cuida da quantidade de processos é o vigia.
   *
   * `ulimit -v` também não é aplicado pelo kernel do macOS; no Linux é.
   */
  const limites = [];
  if (MODO === 'usuarios') {
    limites.push(`ulimit -u ${t.processos} 2>/dev/null || true`);
    limites.push(`ulimit -v ${t.memoriaKb} 2>/dev/null || true`);
  }
  // `|| true` em cada ulimit: num sistema onde um limite não pode ser baixado,
  // o shell não deve morrer antes de a pessoa ver o prompt
  return [
    ...limites,
    `ulimit -f ${Math.round(t.arquivoKb / 512)} 2>/dev/null || true`,
    `ulimit -t ${t.cpuSegundos} 2>/dev/null || true`,
    `ulimit -n ${t.arquivosAbertos} 2>/dev/null || true`,
    'ulimit -c 0 2>/dev/null || true',
    comandoFinal,
  ].join('; ');
}

export function shellDe(conta, nomeVisivel = conta) {
  const home = casaDe(conta);
  if (MODO === 'usuarios') {
    // conta real do sistema; os atalhos abaixo fazem o `whoami` responder o
    // nome escolhido pela pessoa, que é o que ela lê no prompt
    prepararAtalhosLocais(nomeVisivel, home);
    const rc = escreverBashrc(home, nomeVisivel);
    return {
      arquivo: 'su',
      // o shell da pessoa, com as travas já aplicadas e o rcfile nosso
      args: ['-', conta, '-c', comandoComTravas(`exec bash --noprofile --rcfile ${JSON.stringify(rc)} -i`)],
      cwd: '/', home, caminhoExtra: resolve(home, '.arena/bin'),
    };
  }
  mkdirSync(home, { recursive: true });
  // No modo local todo mundo roda como o MESMO usuário do sistema, então
  // `whoami` e `id` respondiam o seu usuário do Mac para a sala inteira.
  // Estes atalhos deixam o ambiente de desenvolvimento igual ao do evento.
  prepararAtalhosLocais(nomeVisivel, home);
  const rc = escreverBashrc(home, nomeVisivel);
  // No modo local, aliases não são uma fronteira de segurança: caminhos
  // absolutos os contornam. Usamos o isolador nativo de cada plataforma e
  // falhamos fechado quando nenhum estiver disponível.
  const shell = comandoComTravas(`exec bash --noprofile --rcfile ${JSON.stringify(rc)} -i`);
  if (process.platform === 'linux') {
    const bwrap = acharExecutavel('bwrap', ['/usr/bin/bwrap', '/bin/bwrap']);
    if (!bwrap) throw new Error('modo local no Linux requer o pacote bubblewrap (comando bwrap)');
    return {
      arquivo: bwrap,
      args: [
        '--die-with-parent', '--unshare-user', '--unshare-pid', '--unshare-uts', '--unshare-ipc',
        '--ro-bind', '/usr', '/usr',
        '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib',
        '--symlink', 'usr/lib64', '/lib64',
        '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--dir', '/home',
        '--bind', home, home, '--chdir', home,
        '--setenv', 'HOME', home, '--setenv', 'USER', conta, '--setenv', 'LOGNAME', conta,
        '--setenv', 'PATH', `${resolve(home, '.arena/bin')}:/usr/bin:/bin`,
        'bash', '--noprofile', '--norc', '-c', shell,
      ],
      cwd: '/', home, caminhoExtra: resolve(home, '.arena/bin'),
    };
  }
  if (process.platform === 'darwin') {
    const sandbox = acharExecutavel('sandbox-exec', ['/usr/bin/sandbox-exec']);
    if (!sandbox) throw new Error('o sandbox nativo do macOS não está disponível');
    const seguro = (p) => p.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
    const perfil = `(version 1)
(deny default)
(import "system.sb")
(allow process-fork process-exec)
(allow signal (target same-sandbox))
(allow file-read* (subpath "/System") (subpath "/Library") (subpath "/usr") (subpath "/bin") (subpath "/private/etc") (subpath "/dev") (subpath "${seguro(home)}"))
(allow file-write* (subpath "${seguro(home)}") (subpath "/private/tmp") (subpath "/tmp") (subpath "/dev"))`;
    return {
      arquivo: sandbox,
      args: ['-p', perfil, '/bin/bash', '--noprofile', '--norc', '-c', shell],
      cwd: home, home, caminhoExtra: resolve(home, '.arena/bin'),
    };
  }
  throw new Error(`modo local seguro ainda não é suportado em ${process.platform}`);
}

/**
 * `whoami`, `id` e `groups` respondendo o nome que a pessoa escolheu.
 * Sem isso, no modo local todo mundo via o usuário do Mac ("aluno1"), e no
 * modo de contas reais via "aluno07", que não diz nada para ela.
 */
/**
 * Arquivo de inicialização do shell da pessoa.
 *
 * Definir o prompt escrevendo no terminal depois de abrir tinha dois defeitos:
 * a pessoa via por um instante o prompt padrão (`bash-3.2$`) e o aviso do
 * macOS sobre o zsh, e o `\w` do prompt se perdia pelo caminho (o JavaScript
 * engolia a barra invertida, e o prompt virava "nome@linuxday:w$").
 *
 * Com um rcfile próprio o shell já nasce certo, e ainda é o lugar natural para
 * o PATH dos atalhos e para um aviso de boas-vindas.
 */
export function escreverBashrc(home, nomeVisivel) {
  const bin = resolve(home, '.arena/bin');
  mkdirSync(bin, { recursive: true });
  const arquivo = resolve(home, '.arena/bashrc');

  // No modo local o shell roda como o usuário do Mac, então sem restrição o
  // aluno poderia `cd /` e navegar pelo computador do apresentador.
  // A função `cd` abaixo intercepta o builtin e bloqueia sair da casa.
  // No modo VM (usuarios) o chmod 700 dos homes e o hidepid=2 já isolam de
  // verdade; esta função é uma camada extra de conforto para o modo local.
  const guardaDeNavegacao = MODO === 'local' ? [
    `cd() {`,
    `  local dest`,
    `  if [ $# -eq 0 ] || [ "$1" = "~" ]; then`,
    `    builtin cd "$HOME"`,
    `  else`,
    `    dest=$(builtin cd "$@" 2>/dev/null && pwd)`,
    `    case "$dest" in`,
    `      "$HOME"/*|"$HOME") builtin cd "$@" ;;`,
    // data/casas está fora do home simbólico, então permitimos subir até a
    // raiz dos casas para que `cd ..` funcione como o aluno espera, mas
    // barramos qualquer caminho que não começa com o HOME real.
    `      *) echo "cd: acesso bloqueado fora do seu diretório de trabalho" >&2; return 1 ;;`,
    `    esac`,
    `  fi`,
    `}`,
  ] : [];

  writeFileSync(arquivo, [
    `export PATH="${bin}:$PATH"`,
    `export PS1='${nomeVisivel}@linuxday:\\w$ '`,
    "export PS2='> '",
    'export LANG=C.UTF-8',
    'export HISTSIZE=500',
    // um alias de cortesia, e o módulo do alias no fim do workshop mostra como
    // criar os próprios
    "alias ll='ls -la'",
    ...guardaDeNavegacao,
    '',
  ].join('\n'));
  return arquivo;
}

function prepararAtalhosLocais(conta, home) {
  const bin = resolve(home, '.arena/bin');
  mkdirSync(bin, { recursive: true });
  const escrever = (nome, corpo) => {
    const caminho = resolve(bin, nome);
    writeFileSync(caminho, corpo, { mode: 0o755 });
  };
  escrever('whoami', `#!/bin/sh\necho ${conta}\n`);
  escrever('id', `#!/bin/sh\nif [ "$1" = "-u" ]; then echo 1000; else echo "uid=1000(${conta}) gid=1000(${conta}) groups=1000(${conta}),27(sudo)"; fi\n`);
  escrever('groups', `#!/bin/sh\necho "${conta} sudo"\n`);
  // no modo local o shell é o usuário do apresentador: sudo, apt e afins
  // respondem por aqui, e não pelo sistema (ver src/server/guarda.mjs)
  if (MODO === 'local') for (const [nome, corpo] of Object.entries(atalhosDeGuarda())) escrever(nome, corpo);
}

async function rodarScriptDeArquivo(pasta, nome, conta, env) {
  const caminho = resolve(pasta, nome);
  if (!existsSync(caminho)) return { ok: false, saida: `script não encontrado: ${caminho}` };
  const corpo = readFileSync(caminho, 'utf8');
  try {
    // 60s: semear 50 mil linhas de log é lento comparado a um check
    const { stdout } = await comoUsuario(conta, corpo, env, 60_000);
    return { ok: true, saida: stdout.trim() };
  } catch (e) {
    // a mensagem do execFile embute o script inteiro; só o stderr interessa
    const motivo = String(e.stderr || '').trim() || (e.killed ? 'timeout' : e.code ?? 'erro');
    return { ok: false, saida: `${nome}: ${motivo}` };
  }
}

/** `all.sh` é expandido aqui (e não por include) para funcionar nos dois modos. */
/** regrava os atalhos (whoami, id, groups) com o nome novo da pessoa */
export function atualizarIdentidade(conta, nomeVisivel) {
  const home = casaDe(conta);
  prepararAtalhosLocais(nomeVisivel, home);
  escreverBashrc(home, nomeVisivel);   // vale para a próxima sessão também
}

export const MODULOS_SEED = ['m1.sh', 'm2.sh', 'm3.sh', 'm4.sh', 'm5.sh'];

export async function semear(conta, nome = 'all.sh', env) {
  if (nome !== 'all.sh') return rodarScriptDeArquivo(SEEDS, nome, conta, env);
  const saidas = [];
  for (const m of MODULOS_SEED) {
    const r = await rodarScriptDeArquivo(SEEDS, m, conta, env);
    saidas.push(`${m}: ${r.ok ? 'ok' : r.saida}`);
    if (!r.ok) return { ok: false, saida: saidas.join('\n') };
  }
  return { ok: true, saida: saidas.join('\n') };
}
export const gabaritar = (conta, nome, env) => rodarScriptDeArquivo(SOLVES, nome, conta, env);

/** Reset: apaga a casa e semeia tudo de novo. Nunca cobre nada por isso. */
export async function resetar(conta) {
  const home = casaDe(conta);
  if (MODO === 'local') {
    await exec('bash', ['-c', `rm -rf ${JSON.stringify(home)} && mkdir -p ${JSON.stringify(home)}`]);
  } else {
    await exec('bash', ['-c', `rm -rf /home/${conta}/* /home/${conta}/.arena && cp -a /etc/skel/. /home/${conta}/ && chown -R ${conta}:${conta} /home/${conta}`]);
  }
  return semear(conta, 'all.sh');
}

/**
 * Roda o check de um critério. Devolve { passou, mensagem }.
 * Exit 0 = passou; a primeira linha do stdout em caso de falha é a mensagem
 * que o participante vê (sempre uma pergunta que aponta o próximo passo).
 */
export async function rodarCheck(conta, script, env = {}) {
  try {
    const { stdout } = await comoUsuario(conta, script, env);
    const sobra = stdout.trim();
    return { passou: true, mensagem: sobra.split('\n').pop() || '' };
  } catch (e) {
    const texto = String(e.stdout || e.stderr || e.message).trim();
    return { passou: false, mensagem: texto.split('\n').filter(Boolean).pop() || 'não passou ainda' };
  }
}

/** Roda um comando e devolve a saída inteira (saída e erro juntos, cortada em 2 KB). */
export async function rodarComando(conta, script, env = {}) {
  const cortar = (t) => (t.length > 2048 ? `${t.slice(0, 2048)}\n…` : t);
  try {
    const { stdout, stderr } = await comoUsuario(conta, script, env);
    return { ok: true, saida: cortar(`${stdout}${stderr}`.trim()) };
  } catch (e) {
    return { ok: false, saida: cortar(`${e.stdout ?? ''}${e.stderr ?? ''}`.trim() || (e.killed ? 'demorou demais' : 'o comando falhou')) };
  }
}

export function dirDoGrupo(grupo) {
  return `${RAIZ_GRUPOS}/grupo-${grupo}`;
}
