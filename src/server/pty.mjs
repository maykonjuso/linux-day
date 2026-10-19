/**
 * Sessões de terminal. Uma por participante, criada na primeira vez e **viva
 * do começo ao fim do workshop**: trocar de cena não cria shell novo, porque o
 * estado do sistema de arquivos tem que acompanhar a pessoa do M1 ao boss.
 *
 * Guardamos os últimos N bytes de saída para repintar a tela depois de um F5
 * ou de uma tampa de notebook fechada — que é o caso normal, não a exceção.
 */
import { spawn } from 'node-pty';
import { shellDe } from './ambiente.mjs';

const BUFFER_MAX = 60_000;
const sessoes = new Map(); // participanteId -> sessão

export function abrirSessao(participanteId, conta, aoReceber, nomeVisivel = conta) {
  let s = sessoes.get(participanteId);
  if (s && !s.morto) {
    s.ouvintes.add(aoReceber);
    aoReceber(s.buffer);            // repinta o histórico para quem acabou de chegar
    return s;
  }

  const { arquivo, args, cwd, home, caminhoExtra } = shellDe(conta, nomeVisivel);
  const proc = spawn(arquivo, args, {
    name: 'xterm-256color',
    cols: 100, rows: 28, cwd,
    env: {
      ...process.env,
      HOME: home, USER: conta, LOGNAME: conta,
      PATH: caminhoExtra ? `${caminhoExtra}:${process.env.PATH}` : process.env.PATH,
      /**
       * O nome da conta vai LITERAL no prompt. Com `\u` o bash mostra o
       * usuário real do sistema operacional, e no modo local isso é o seu
       * usuário do Mac: a sala inteira aparecia como "aluno1".
       */
      PS1: `${nomeVisivel}@linuxday:\\w$ `,
      TERM: 'xterm-256color', LANG: 'pt_BR.UTF-8', LC_ALL: 'pt_BR.UTF-8',
    },
  });

  s = { proc, conta, nomeVisivel, buffer: '', ouvintes: new Set([aoReceber]), morto: false };
  sessoes.set(participanteId, s);

  /**
   * O prompt é definido DENTRO do shell, e não pelo ambiente.
   *
   * Passar PS1 por variável de ambiente parecia funcionar, mas o bash do macOS
   * mostrava o prompt padrão (`bash-3.2$`) e ainda imprimia o aviso do sistema
   * sobre o zsh. Escrevendo no próprio terminal o resultado é o mesmo em
   * qualquer versão de bash, e é também o que permite TROCAR o prompt depois,
   * quando a pessoa muda de nome, sem matar a sessão dela.
   *
   * O `clear` no fim some com estas linhas, então a pessoa só vê o prompt.
   */
  aplicarPrompt(s, nomeVisivel);

  proc.onData((d) => {
    s.buffer = (s.buffer + d).slice(-BUFFER_MAX);
    for (const o of s.ouvintes) { try { o(d); } catch { /* ouvinte morto */ } }
  });
  proc.onExit(() => { s.morto = true; sessoes.delete(participanteId); });

  return s;
}

/** escreve o prompt e limpa a tela, sem a pessoa ver o comando */
function aplicarPrompt(sessao, nomeVisivel) {
  const linha = [
    `export PS1='${nomeVisivel}@linuxday:\w$ '`,
    'export PS2="> "',
    'clear',
  ].join('; ');
  setTimeout(() => {
    if (!sessao.morto) sessao.proc.write(`${linha}\r`);
  }, 120);
}

/**
 * A pessoa trocou de nome: o prompt acompanha na hora, com a sessão viva.
 * Matar e reabrir o terminal aqui quebrava o laboratório em que ela estava.
 */
export function atualizarNome(participanteId, nomeVisivel) {
  const s = sessoes.get(participanteId);
  if (!s || s.morto) return false;
  s.nomeVisivel = nomeVisivel;
  s.proc.write(`export PS1='${nomeVisivel}@linuxday:\w$ '\r`);
  s.proc.write(`printf '\\033[2magora você é %s\\033[0m\\n' '${nomeVisivel}'\r`);
  return true;
}

export function escrever(participanteId, dados) {
  const s = sessoes.get(participanteId);
  if (s && !s.morto) s.proc.write(dados);
}

export function redimensionar(participanteId, cols, rows) {
  const s = sessoes.get(participanteId);
  if (s && !s.morto && cols > 0 && rows > 0) {
    try { s.proc.resize(cols, rows); } catch { /* corrida com o resize do navegador */ }
  }
}

export function desligarOuvinte(participanteId, aoReceber) {
  sessoes.get(participanteId)?.ouvintes.delete(aoReceber);
}

export function matarSessao(participanteId) {
  const s = sessoes.get(participanteId);
  if (!s) return;
  try { s.proc.kill(); } catch { /* já morreu */ }
  sessoes.delete(participanteId);
}

export const sessoesAbertas = () => sessoes.size;

/**
 * O vigia precisa do pid de cada sessão para medir a árvore de processos.
 * Devolvemos uma cópia só com o que ele usa, para ninguém de fora mexer no
 * estado das sessões.
 */
export const paraVigia = () => new Map([...sessoes].map(([id, s]) => [id, { proc: s.proc }]));
