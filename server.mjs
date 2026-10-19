/**
 * Servidor único: Next.js + Socket.IO no mesmo processo.
 * Um processo só é requisito do modo offline (tudo roda no Mac, na rede local).
 *
 * O estado do evento vive AQUI, na memória do servidor, e é a única fonte de
 * verdade: o cliente nunca calcula cena, passo, XP nem tempo. Quem reconectar
 * pede o estado inteiro de volta (evento "estado") e volta exatamente ao lugar.
 */
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const port = Number(process.env.PORT ?? 3000);
const PIN_HOST = process.env.PIN_HOST ?? '1991';

const app = next({ dev });
const handle = app.getRequestHandler();

// ─────────────────────────────── estado ────────────────────────────────────
const estado = { cenaIndex: 0, passo: 0, fase: 'idle', pausado: false, restante: null };
/** id -> participante */
const participantes = new Map();
/** nome -> { nome, cor, capacidade, membros: Set<id> } */
const grupos = new Map(
  [['azul', '#2563eb'], ['verde', '#16a34a'], ['vermelho', '#dc2626'], ['amarelo', '#ca8a04']].map(
    ([nome, cor]) => [nome, { nome, cor, capacidade: 5, membros: new Set() }],
  ),
);
/** livro-caixa append-only: nunca mutamos xp direto */
const ledger = [];
/** respostas de quiz/widget: `${cenaId}:${participanteId}` -> dados */
const respostas = new Map();
/** critérios já pontuados: `${participanteId}:${criterioId}` */
const premiados = new Set();

let timer = null;

const NIVEIS = [0, 300, 700, 1300, 1900];
const nivelDe = (xp) => NIVEIS.reduce((n, min, i) => (xp >= min ? i + 1 : n), 1);

function xpDe(id) {
  return ledger.filter((l) => l.participanteId === id).reduce((s, l) => s + l.xp, 0);
}

function premiar(id, xp, tipo, referencia) {
  if (!xp) return;
  ledger.push({ participanteId: id, xp, tipo, referencia, em: Date.now() });
  const p = participantes.get(id);
  if (!p) return;
  const antes = p.nivel;
  p.xp = xpDe(id);
  p.nivel = nivelDe(p.xp);
  io.to(`p:${id}`).emit('xp', { xp, tipo, referencia, total: p.xp });
  if (p.nivel > antes) io.emit('nivel', { id, nick: p.nick, nivel: p.nivel });
  emitirPlacar();
}

function publico(p) {
  return { id: p.id, nick: p.nick, emoji: p.emoji, xp: p.xp, tokens: p.tokens, nivel: p.nivel, grupo: p.grupo, presenca: p.presenca, livre: p.livre };
}

function placar() {
  const individual = [...participantes.values()].map(publico).sort((a, b) => b.xp - a.xp);
  const porGrupo = [...grupos.values()].map((g) => {
    const membros = [...g.membros].map((id) => participantes.get(id)).filter(Boolean);
    const media = membros.length ? Math.round(membros.reduce((s, m) => s + m.xp, 0) / membros.length) : 0;
    return { nome: g.nome, cor: g.cor, capacidade: g.capacidade, media, membros: membros.map(publico) };
  }).sort((a, b) => b.media - a.media);
  return { individual, grupos: porGrupo };
}

const emitirPlacar = () => io.emit('placar', placar());
const emitirPresenca = () => io.emit('presenca', [...participantes.values()].map(publico));

function pararTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

function iniciarTimer(segundos) {
  pararTimer();
  estado.restante = segundos;
  timer = setInterval(() => {
    if (estado.pausado) return;
    estado.restante = Math.max(0, (estado.restante ?? 0) - 1);
    io.emit('tempo', estado.restante);
    if (estado.restante === 0) {
      pararTimer();
      estado.fase = 'encerrada';
      io.emit('estado', estado);
    }
  }, 1000);
}

// ────────────────────────────── bootstrap ──────────────────────────────────
const server = createServer((req, res) => handle(req, res));
const io = new Server(server, { path: '/rt', cors: { origin: '*' } });

io.on('connection', (socket) => {
  let eu = null;
  let host = false;

  socket.emit('estado', estado);
  socket.emit('placar', placar());

  socket.on('entrar', ({ id, nick, emoji }, ack) => {
    const existente = id && participantes.get(id);
    if (existente) {
      eu = existente;
      eu.presenca = 'ativo';
    } else {
      eu = {
        id: id || Math.random().toString(36).slice(2, 10),
        nick: String(nick || 'anônimo').slice(0, 20),
        emoji: emoji || '🐧',
        xp: 0, tokens: 3, nivel: 1, grupo: null, presenca: 'ativo', livre: false,
      };
      participantes.set(eu.id, eu);
      premiar(eu.id, 20, 'check-in', 'entrada');
    }
    socket.join(`p:${eu.id}`);
    ack?.({ eu: publico(eu), estado, placar: placar() });
    emitirPresenca();
  });

  socket.on('host:auth', (pin, ack) => {
    host = pin === PIN_HOST;
    ack?.(host);
  });

  socket.on('batida', () => {
    if (eu) { eu.presenca = 'ativo'; eu.visto = Date.now(); }
  });

  // ─── respostas de cena (quiz, widget, predição) ───
  socket.on('responder', ({ cenaId, alternativa, xpBase = 40, segundos = 20 }, ack) => {
    if (!eu || estado.fase !== 'aberta') return ack?.({ ok: false });
    const chave = `${cenaId}:${eu.id}`;
    if (respostas.has(chave)) return ack?.({ ok: false, motivo: 'já respondeu' });
    const restante = estado.restante ?? 0;
    respostas.set(chave, { alternativa, restante, em: Date.now() });
    ack?.({ ok: true });
    io.to('host').emit('respostas', { cenaId, total: [...respostas.keys()].filter((k) => k.startsWith(`${cenaId}:`)).length });
    socket.data.pendente = { cenaId, xpBase, segundos };
  });

  socket.on('widget:concluido', ({ cenaId, xp = 50 }) => {
    if (!eu) return;
    const chave = `w:${cenaId}:${eu.id}`;
    if (respostas.has(chave)) return;
    respostas.set(chave, { em: Date.now() });
    premiar(eu.id, xp, 'widget', cenaId);
  });

  socket.on('criterio', ({ criterioId, xp }) => {
    if (!eu) return;
    const chave = `${eu.id}:${criterioId}`;
    if (premiados.has(chave)) return;        // idempotência: reenviar não pontua 2x
    premiados.add(chave);
    premiar(eu.id, xp, 'criterio', criterioId);
  });

  socket.on('grupo:entrar', (nome) => {
    if (!eu) return;
    for (const g of grupos.values()) g.membros.delete(eu.id);
    const g = grupos.get(nome);
    if (g && g.membros.size < g.capacidade) { g.membros.add(eu.id); eu.grupo = nome; }
    else eu.grupo = null;
    emitirPlacar(); emitirPresenca();
  });

  socket.on('ajuda', () => {
    if (eu) io.to('host').emit('ajuda', publico(eu));
  });

  socket.on('livre', (v) => { if (eu) { eu.livre = !!v; emitirPresenca(); } });

  // ─────────────────────────── controles do host ───────────────────────────
  socket.on('host:entrar', (pin) => { if (pin === PIN_HOST) { host = true; socket.join('host'); } });

  const soHost = (fn) => (...args) => { if (host) fn(...args); };

  socket.on('host:ir', soHost(({ cenaIndex, passo = 0, fase = 'idle', segundos = null }) => {
    estado.cenaIndex = cenaIndex; estado.passo = passo; estado.fase = fase;
    pararTimer(); estado.restante = null;
    if (segundos) iniciarTimer(segundos);
    io.emit('estado', estado);
  }));

  socket.on('host:passo', soHost((delta) => {
    estado.passo = Math.max(0, estado.passo + delta);
    io.emit('estado', estado);
  }));

  socket.on('host:fase', soHost(({ fase, segundos = null }) => {
    estado.fase = fase;
    if (fase === 'aberta' && segundos) iniciarTimer(segundos);
    if (fase !== 'aberta') { pararTimer(); if (fase === 'idle') estado.restante = null; }
    if (fase === 'revelada') {                       // pontua o quiz ao revelar
      for (const [chave, r] of respostas) {
        if (!chave.startsWith(`${estado.cenaId ?? ''}`)) { /* pontuação por cena abaixo */ }
      }
    }
    io.emit('estado', estado);
  }));

  /** revelação do quiz: o servidor decide quem acertou e quanto ganhou */
  socket.on('host:revelar', soHost(({ cenaId, correta, xpBase = 40, segundos = 20 }) => {
    const distribuicao = {};
    for (const [chave, r] of respostas) {
      if (!chave.startsWith(`${cenaId}:`)) continue;
      distribuicao[r.alternativa] = (distribuicao[r.alternativa] ?? 0) + 1;
      if (r.alternativa !== correta) continue;
      const id = chave.slice(cenaId.length + 1);
      const bonus = Math.round(30 * (r.restante / segundos));   // até +30 por velocidade
      premiar(id, xpBase + bonus, 'quiz', cenaId);
      const p = participantes.get(id);
      if (p) p.tokens += 1;
    }
    estado.fase = 'revelada';
    io.emit('estado', estado);
    io.emit('revelacao', { cenaId, correta, distribuicao });
  }));

  socket.on('host:pausar', soHost((v) => { estado.pausado = !!v; io.emit('estado', estado); }));
  socket.on('host:aviso', soHost((texto) => io.emit('aviso', String(texto).slice(0, 200))));
  socket.on('host:aovivo', soHost(() => {
    for (const p of participantes.values()) p.livre = false;
    io.emit('aovivo'); emitirPresenca();
  }));
  socket.on('host:grupo:criar', soHost(({ nome, cor = '#475569', capacidade = 5 }) => {
    if (!grupos.has(nome)) grupos.set(nome, { nome, cor, capacidade, membros: new Set() });
    emitirPlacar();
  }));

  socket.on('disconnect', () => {
    if (eu) { eu.presenca = 'desconectado'; emitirPresenca(); }
  });
});

// marca ocioso quem não dá sinal há 90s
setInterval(() => {
  const agora = Date.now();
  let mudou = false;
  for (const p of participantes.values()) {
    if (p.presenca === 'ativo' && p.visto && agora - p.visto > 90_000) { p.presenca = 'ocioso'; mudou = true; }
  }
  if (mudou) emitirPresenca();
}, 15_000);

function ipLocal() {
  for (const ifaces of Object.values(networkInterfaces())) {
    for (const i of ifaces ?? []) if (i.family === 'IPv4' && !i.internal) return i.address;
  }
  return 'localhost';
}

app.prepare().then(() => {
  server.listen(port, '0.0.0.0', () => {
    const ip = ipLocal();
    console.log('\n  ┌─────────────────────────────────────────────┐');
    console.log('  │  Linux Day Arena                            │');
    console.log(`  │  participantes:  http://${ip}:${port}`.padEnd(47) + '│');
    console.log(`  │  projetor:       http://localhost:${port}/screen`.padEnd(47) + '│');
    console.log(`  │  apresentador:   http://localhost:${port}/host  (PIN ${PIN_HOST})`.padEnd(47) + '│');
    console.log('  └─────────────────────────────────────────────┘\n');
  });
});
