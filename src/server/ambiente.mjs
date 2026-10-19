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

const exec = promisify(execFile);

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
  for (let i = 1; i <= 99; i++) {
    const conta = `${PREFIXO}${String(i).padStart(2, '0')}`;
    if (!contasEmUso.has(conta)) {
      contasEmUso.set(conta, participanteId);
      return conta;
    }
  }
  throw new Error('sem contas livres (limite de 99)');
}

export function liberarConta(conta) {
  contasEmUso.delete(conta);
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
    LANG: 'pt_BR.UTF-8',
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
export function shellDe(conta) {
  const home = casaDe(conta);
  if (MODO === 'usuarios') return { arquivo: 'su', args: ['-', conta], cwd: '/', home };
  mkdirSync(home, { recursive: true });
  // No modo local todo mundo roda como o MESMO usuário do sistema, então
  // `whoami` e `id` respondiam o seu usuário do Mac para a sala inteira.
  // Estes atalhos deixam o ambiente de desenvolvimento igual ao do evento.
  prepararAtalhosLocais(conta, home);
  return {
    arquivo: 'bash', args: ['--noprofile', '--norc', '-i'], cwd: home, home,
    caminhoExtra: resolve(home, '.arena/bin'),
  };
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

export function dirDoGrupo(grupo) {
  return `${RAIZ_GRUPOS}/grupo-${grupo}`;
}
