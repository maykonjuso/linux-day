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

export function abrirSessao(participanteId, conta, aoReceber) {
  let s = sessoes.get(participanteId);
  if (s && !s.morto) {
    s.ouvintes.add(aoReceber);
    aoReceber(s.buffer);            // repinta o histórico para quem acabou de chegar
    return s;
  }

  const { arquivo, args, cwd, home } = shellDe(conta);
  const proc = spawn(arquivo, args, {
    name: 'xterm-256color',
    cols: 100, rows: 28, cwd,
    env: { ...process.env, HOME: home, USER: conta, LOGNAME: conta, PS1: '\\u@linuxday:\\w$ ', TERM: 'xterm-256color', LANG: 'pt_BR.UTF-8' },
  });

  s = { proc, conta, buffer: '', ouvintes: new Set([aoReceber]), morto: false };
  sessoes.set(participanteId, s);

  proc.onData((d) => {
    s.buffer = (s.buffer + d).slice(-BUFFER_MAX);
    for (const o of s.ouvintes) { try { o(d); } catch { /* ouvinte morto */ } }
  });
  proc.onExit(() => { s.morto = true; sessoes.delete(participanteId); });

  return s;
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
