/**
 * O vigia dos terminais.
 *
 * As travas de `ulimit` resolvem o acidente comum (laço infinito, alocar
 * memória sem parar, encher o disco), mas elas são POR PROCESSO: alguém
 * determinado ainda consegue criar muitos processos pequenos, cada um dentro do
 * seu limite, e somados eles pesam na máquina.
 *
 * Então, a cada poucos segundos, olhamos a árvore de processos de cada sessão e
 * aplicamos um teto de conjunto: número de processos, memória somada e CPU
 * somada. Quem passar do teto tem a árvore encerrada e recebe um aviso na tela
 * explicando o que aconteceu. O ambiente dela continua intacto: o que morre é a
 * sessão, não os arquivos.
 *
 * Isso existe porque o servidor roda na máquina de quem apresenta, com dezenas
 * de pessoas digitando ao mesmo tempo. Travar essa máquina encerra o workshop.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export const TETOS = {
  processos: Number(process.env.ARENA_TETO_PROC ?? 60),
  memoriaMb: Number(process.env.ARENA_TETO_MEM_MB ?? 900),
  cpuSegundos: Number(process.env.ARENA_TETO_CPU ?? 150),
};

/** lê a tabela de processos uma vez e devolve um mapa pid -> dados */
async function tabelaDeProcessos() {
  // `-ww` para o comando não vir truncado, e sem cabeçalho (o `=` em cada campo)
  const { stdout } = await exec('ps', ['-axww', '-o', 'pid=,ppid=,rss=,time=,comm='], { maxBuffer: 1 << 24 });
  const mapa = new Map();
  const filhos = new Map();
  for (const linha of stdout.split('\n')) {
    const m = linha.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+([0-9:.]+)\s+(.*)$/);
    if (!m) continue;
    const [, pid, ppid, rss, tempo, comm] = m;
    const p = { pid: +pid, ppid: +ppid, rssKb: +rss, cpuSegundos: segundosDe(tempo), comm };
    mapa.set(p.pid, p);
    if (!filhos.has(p.ppid)) filhos.set(p.ppid, []);
    filhos.get(p.ppid).push(p.pid);
  }
  return { mapa, filhos };
}

/**
 * Converte o tempo de CPU do `ps` em segundos.
 * Formatos possíveis: "0:00.12" (macOS), "00:01:30" e "2-03:04:05" (Linux, com
 * dias antes do traço).
 */
function segundosDe(tempo) {
  let dias = 0;
  let resto = tempo;
  const traco = tempo.indexOf('-');
  if (traco > 0) { dias = Number(tempo.slice(0, traco)) || 0; resto = tempo.slice(traco + 1); }
  const partes = resto.split(':').map(Number);
  const base =
    partes.length === 3 ? partes[0] * 3600 + partes[1] * 60 + partes[2] :
    partes.length === 2 ? partes[0] * 60 + partes[1] :
    Number(resto) || 0;
  return dias * 86400 + base;
}

function descendentes(raiz, filhos) {
  const fila = [raiz];
  const todos = [];
  while (fila.length) {
    const pid = fila.shift();
    todos.push(pid);
    for (const f of filhos.get(pid) ?? []) fila.push(f);
    if (todos.length > 5000) break;      // proteção contra ciclo
  }
  return todos;
}

/**
 * Confere todas as sessões abertas e encerra as que passaram do teto.
 * `sessoes` é um mapa participanteId -> { proc }. O retorno lista quem foi
 * encerrado, para o servidor avisar a pessoa e registrar.
 */
export async function vistoriar(sessoes) {
  if (sessoes.size === 0) return [];
  let tabela;
  try { tabela = await tabelaDeProcessos(); } catch { return []; }

  const encerrados = [];
  for (const [id, sessao] of sessoes) {
    const raiz = sessao.proc?.pid;
    if (!raiz || !tabela.mapa.has(raiz)) continue;

    const pids = descendentes(raiz, tabela.filhos);
    let memoriaKb = 0;
    let cpu = 0;
    for (const pid of pids) {
      const p = tabela.mapa.get(pid);
      if (!p) continue;
      memoriaKb += p.rssKb;
      cpu += p.cpuSegundos;
    }

    const motivo =
      pids.length > TETOS.processos ? `criou ${pids.length} processos` :
      memoriaKb / 1024 > TETOS.memoriaMb ? `passou de ${TETOS.memoriaMb} MB de memória` :
      cpu > TETOS.cpuSegundos ? `consumiu ${Math.round(cpu)}s de CPU` :
      null;

    if (motivo) encerrados.push({ id, motivo, processos: pids.length, memoriaMb: Math.round(memoriaKb / 1024) });
  }
  return encerrados;
}
