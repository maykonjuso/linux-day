/**
 * Servidor único: Next.js + Socket.IO no mesmo processo.
 * Um processo só é requisito do modo offline — tudo roda no seu Mac, na rede
 * local da sala, sem nuvem e sem internet.
 *
 * O estado do evento vive AQUI e é a única fonte de verdade: o cliente nunca
 * calcula cena, passo, tempo nem XP. Quem reconectar pede o estado inteiro de
 * volta e cai exatamente no lugar onde estava — que é o caso normal num
 * auditório, não a exceção.
 */
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import next from 'next';
import { Server } from 'socket.io';

import { dao } from './src/server/db.mjs';
import { criarJogo, nivelDe } from './src/server/jogo.mjs';
import { criarFila } from './src/server/fila.mjs';
import { LABS, labDe, scriptDoCheck } from './src/server/labs.mjs';
import * as amb from './src/server/ambiente.mjs';
import * as pty from './src/server/pty.mjs';

const dev = process.env.NODE_ENV !== 'production';
const port = Number(process.env.PORT ?? 3000);
const PIN_HOST = process.env.PIN_HOST ?? '1991';

const app = next({ dev });
const handle = app.getRequestHandler();
const server = createServer((req, res) => handle(req, res));
const io = new Server(server, { path: '/rt', cors: { origin: '*' }, maxHttpBufferSize: 1e6 });

const fila = criarFila(Number(process.env.ARENA_CHECKERS ?? 6));

// ───────────────────────────── estado do evento ─────────────────────────────
const estado = dao.getEstado('evento') ?? { cenaIndex: 0, passo: 0, fase: 'idle', pausado: false, restante: null, cenaId: null };
estado.restante = null;

const jogo = criarJogo({
  emitir: (ev, dados) => io.emit(ev, dados),
  emitirPara: (id, ev, dados) => io.to(`p:${id}`).emit(ev, dados),
});
jogo.recarregarDoBanco();

const emitirPlacar = () => io.emit('placar', jogo.placar());
const emitirPresenca = () => io.emit('presenca', [...jogo.participantes.values()].map(jogo.publico));
const salvarEstado = () => dao.setEstado('evento', { ...estado, restante: null });

let timer = null;
function pararTimer() { if (timer) clearInterval(timer); timer = null; }
function iniciarTimer(segundos) {
  pararTimer();
  estado.restante = segundos;
  timer = setInterval(() => {
    if (estado.pausado) return;
    estado.restante = Math.max(0, (estado.restante ?? 0) - 1);
    io.emit('tempo', estado.restante);
    if (estado.restante === 0) { pararTimer(); estado.fase = 'encerrada'; io.emit('estado', estado); }
  }, 1000);
}

/** Resultado de um critério = passou agora OU já foi premiado antes (adesivo). */
async function avaliar(dono, conta, taskSlug, extra = {}) {
  const lab = labDe(taskSlug);
  if (!lab) return [];
  const jaPremiados = new Set(dao.criteriosDe(dono));
  const resultados = await Promise.all(lab.criterios.map((c) => fila.adicionar(async () => {
    if (jaPremiados.has(c.id)) return { id: c.id, passou: true, mensagem: '', adesivo: true };
    const r = await amb.rodarCheck(conta, scriptDoCheck(c), extra);
    return { id: c.id, passou: r.passou, mensagem: r.mensagem, xp: c.xp, papel: c.papel ?? null };
  })));
  return resultados;
}

// ──────────────────────────────── sockets ───────────────────────────────────
io.on('connection', (socket) => {
  let eu = null;
  let host = false;
  let ouvinteTerm = null;

  socket.emit('estado', estado);
  socket.emit('placar', jogo.placar());
  socket.emit('labs', Object.fromEntries(Object.entries(LABS).map(([k, l]) => [k, { dicas: l.dicas?.length ?? 0 }])));

  async function registrar({ id, nick, emoji }, ack) {
    const existente = id && jogo.participantes.get(id);
    if (existente) {
      eu = existente;
      eu.presenca = 'ativo';
      eu.visto = Date.now();
    } else {
      const novoId = id || Math.random().toString(36).slice(2, 10);
      const conta = amb.alocarConta(novoId);
      eu = {
        id: novoId, nick: String(nick || 'anônimo').slice(0, 20), emoji: emoji || '🐧',
        conta, grupo: null, papel: null, tokens: 3, xp: 0, nivel: 1,
        presenca: 'ativo', livre: false, visto: Date.now(), criterios: [], badges: [],
      };
      jogo.participantes.set(eu.id, eu);
      dao.salvarParticipante(eu);
      jogo.premiar(eu.id, 20, 'check-in', 'entrada');
      if (Date.now() - jogo.abertoEm < 3 * 60_000) jogo.darBadge(eu.id, 'chegou-cedo');
      // semeia o ambiente em segundo plano: a pessoa já pode ver o slide
      amb.semear(conta, 'all.sh', { NICK: eu.nick }).then((r) => {
        if (!r.ok) console.warn('[seed]', conta, r.saida);
        io.to(`p:${eu.id}`).emit('ambiente', { conta, pronto: r.ok });
      });
    }
    socket.join(`p:${eu.id}`);
    if (eu.grupo) socket.join(`g:${eu.grupo}`);
    dao.salvarParticipante(eu);
    ack?.({ eu: jogo.publico(eu), estado, placar: jogo.placar() });
    emitirPresenca();
  }

  socket.on('entrar', registrar);
  socket.on('batida', () => { if (eu) { eu.presenca = 'ativo'; eu.visto = Date.now(); } });
  socket.on('livre', (v) => { if (eu) { eu.livre = !!v; emitirPresenca(); } });

  // ─────────────────────────────── terminal ─────────────────────────────────
  socket.on('term:abrir', ({ cols, rows } = {}) => {
    if (!eu?.conta) return;
    ouvinteTerm = (d) => socket.emit('term:dados', d);
    pty.abrirSessao(eu.id, eu.conta, ouvinteTerm);
    if (cols && rows) pty.redimensionar(eu.id, cols, rows);
  });
  socket.on('term:entrada', (d) => { if (eu) pty.escrever(eu.id, d); });
  socket.on('term:resize', ({ cols, rows }) => { if (eu) pty.redimensionar(eu.id, cols, rows); });

  // ──────────────────────────────── labs ───────────────────────────────────
  socket.on('lab:verificar', async ({ taskSlug, resposta = '' }, ack) => {
    if (!eu?.conta) return ack?.({ erro: 'sem ambiente' });
    const lab = labDe(taskSlug);
    if (!lab) return ack?.({ erro: 'lab desconhecido' });

    const extra = { NICK: eu.nick, RESPOSTA: String(resposta).trim() };
    if (lab.escopo === 'grupo') {
      if (!eu.grupo) return ack?.({ erro: 'entre num grupo primeiro' });
      extra.GRUPO = eu.grupo;
      extra.DIR_GRUPO = amb.dirDoGrupo(eu.grupo);
    }

    const dono = lab.escopo === 'grupo' ? `grupo:${eu.grupo}` : eu.id;
    const antes = new Set(dao.criteriosDe(dono));
    const resultados = await avaliar(dono, eu.conta, taskSlug, extra);

    let ganho = 0;
    for (const r of resultados) {
      if (!r.passou || antes.has(r.id)) continue;
      const criterio = lab.criterios.find((c) => c.id === r.id);
      // carta de função: no boss, só quem tem o papel pode fechar o critério
      if (criterio.papel && eu.papel && criterio.papel !== eu.papel) {
        r.passou = false;
        r.mensagem = `esse critério é da carta "${criterio.papel}" — quem está com ela submete`;
        continue;
      }
      if (!dao.premiarCriterio(dono, r.id)) continue;
      ganho += jogo.premiar(eu.id, criterio.xp, 'criterio', r.id, { usarCombo: true });
      if (lab.escopo === 'grupo') {
        for (const outroId of jogo.grupos.get(eu.grupo)?.membros ?? []) {
          if (outroId !== eu.id) jogo.premiar(outroId, criterio.xp, 'criterio-grupo', r.id);
        }
        if (r.id === 'b-c4') jogo.darBadge(eu.id, 'chamado-fechado');
      }
    }

    const todos = resultados.every((r) => r.passou);
    jogo.mexerCombo(eu.id, todos);
    if (todos) {
      if (antes.size === 0) { jogo.darBadge(eu.id, 'mao-de-vidro'); jogo.mexerTokens(eu.id, 1, 'lab-limpo'); }
      if (jogo.contador(eu.id).tokensGastos === 0) jogo.darBadge(eu.id, 'autodidata');
      if (taskSlug === 'm4-pipes') jogo.darBadge(eu.id, 'encanador');
      if (taskSlug === 'm5-processos') jogo.darBadge(eu.id, 'dedetizador');
      if (jogo.contador(eu.id).resets > 0) jogo.darBadge(eu.id, 'sobreviveu-ao-rm-rf');
    }

    dao.registrarSubmissao(dono, taskSlug, resultados);
    // sempre a lista PESSOAL: num lab de grupo o `dono` é "grupo:<cor>", e
    // sobrescrever com ela apagava os critérios individuais de quem reconecta
    eu.criterios = dao.criteriosDe(eu.id);
    ack?.({ resultados, ganho, todos });
    io.to('host').emit('submissao', { id: eu.id, nick: eu.nick, taskSlug, resultados });
    emitirPlacar();
  });

  socket.on('lab:dica', ({ taskSlug, indice }, ack) => {
    const lab = labDe(taskSlug);
    const dica = lab?.dicas?.[indice];
    if (!eu || !dica) return ack?.({ erro: 'sem dica' });
    const custo = indice === 0 ? 1 : 2;
    if (!jogo.mexerTokens(eu.id, -custo, `dica:${taskSlug}`)) return ack?.({ erro: 'sem tokens' });
    emitirPlacar();   // o saldo de tokens aparece no placar e no painel
    ack?.({ dica, custo });
  });

  socket.on('lab:reset', async (_, ack) => {
    if (!eu?.conta) return ack?.({ erro: 'sem ambiente' });
    jogo.contador(eu.id).resets += 1;
    const r = await amb.resetar(eu.conta);               // sempre grátis: medo de
    pty.matarSessao(eu.id);                              // quebrar a máquina é o
    ack?.({ ok: r.ok, saida: r.saida });                 // maior freio do iniciante
  });

  // ───────────────────────── quiz, widgets, predições ──────────────────────
  socket.on('responder', ({ cenaId, alternativa }, ack) => {
    if (!eu || estado.fase !== 'aberta') return ack?.({ ok: false, motivo: 'fechado' });
    const chave = `${cenaId}:${eu.id}`;
    if (!dao.registrarResposta(chave, cenaId, eu.id, alternativa, estado.restante ?? 0)) {
      return ack?.({ ok: false, motivo: 'já respondeu' });
    }
    ack?.({ ok: true });
    io.to('host').emit('respostas', { cenaId, total: dao.respostasDaCena(cenaId).length });
  });

  socket.on('widget:concluido', ({ cenaId, xp = 60 }) => {
    if (!eu) return;
    const chave = `w:${cenaId}:${eu.id}`;
    if (!dao.registrarResposta(chave, `w:${cenaId}`, eu.id, 'ok', estado.restante ?? 0)) return;
    jogo.premiar(eu.id, Math.min(xp, 100), 'widget', cenaId);
    if (cenaId === 'm1-fuga-widget') jogo.darBadge(eu.id, 'escapista');
    emitirPlacar();
  });

  socket.on('predicao', ({ cenaId, correta }, ack) => {
    if (!eu) return;
    const chave = `pr:${cenaId}:${eu.id}`;
    if (!dao.registrarResposta(chave, `pr:${cenaId}`, eu.id, correta ? '1' : '0', 0)) return ack?.({ ok: false });
    if (correta) {
      jogo.premiar(eu.id, 15, 'predicao', cenaId);
      jogo.mexerTokens(eu.id, 1, 'predicao');
      const c = jogo.contador(eu.id);
      if (++c.predicoes >= 4) jogo.darBadge(eu.id, 'vidente');
    }
    ack?.({ ok: true });
    emitirPlacar();
  });

  socket.on('diagnostico', ({ criterioId, correta }, ack) => {
    if (!eu) return;
    const chave = `dg:${criterioId}:${eu.id}`;
    if (!dao.registrarResposta(chave, `dg:${criterioId}`, eu.id, correta ? '1' : '0', 0)) return ack?.({ ok: false });
    if (correta) {
      jogo.premiar(eu.id, 20, 'diagnostico', criterioId);
      const c = jogo.contador(eu.id);
      if (++c.diagnosticos >= 3) jogo.darBadge(eu.id, 'detetive');
    }
    ack?.({ ok: true });
    emitirPlacar();
  });

  // ──────────────────────────────── grupos ─────────────────────────────────
  socket.on('grupo:entrar', (nome) => {
    if (!eu) return;
    for (const g of jogo.grupos.values()) { g.membros.delete(eu.id); delete g.papeis[eu.id]; }
    if (eu.grupo) socket.leave(`g:${eu.grupo}`);
    const g = jogo.grupos.get(nome);
    if (g && g.membros.size < g.capacidade) {
      g.membros.add(eu.id); eu.grupo = nome; eu.papel = null; socket.join(`g:${nome}`);
    } else eu.grupo = null;
    dao.salvarParticipante(eu);
    emitirPlacar(); emitirPresenca();
  });

  socket.on('grupo:papel', (papel) => {
    if (!eu?.grupo) return;
    const g = jogo.grupos.get(eu.grupo);
    const tomado = Object.entries(g.papeis).find(([pid, p]) => p === papel && pid !== eu.id);
    if (tomado) return;
    g.papeis[eu.id] = papel;
    eu.papel = papel;
    dao.salvarParticipante(eu);
    emitirPlacar();
  });

  socket.on('grupo:chat', (texto) => {
    if (!eu?.grupo) return;
    const msg = { nick: eu.nick, emoji: eu.emoji, texto: String(texto).slice(0, 300), em: Date.now() };
    jogo.grupos.get(eu.grupo).chat.push(msg);
    io.to(`g:${eu.grupo}`).emit('grupo:chat', msg);
  });

  socket.on('ajuda', () => { if (eu) io.to('host').emit('ajuda', jogo.publico(eu)); });
  socket.on('pulso', (valor) => io.to('host').emit('pulso', { valor }));
  socket.on('mentoria', (mentorId) => {
    const m = jogo.participantes.get(mentorId);
    if (!m || !eu || mentorId === eu.id) return;
    jogo.premiar(mentorId, 40, 'mentoria', eu.id);
    jogo.mexerTokens(mentorId, 2, 'mentoria');
    if (++jogo.contador(mentorId).ajudas >= 3) jogo.darBadge(mentorId, 'mentor');
    emitirPlacar();
  });

  // ───────────────────────────────── host ──────────────────────────────────
  socket.on('host:entrar', (pin, ack) => {
    host = pin === PIN_HOST;
    if (host) socket.join('host');
    ack?.(host);
  });
  const soHost = (fn) => (...a) => { if (host) return fn(...a); };

  socket.on('host:ir', soHost(({ cenaIndex, cenaId = null, passo = 0, fase = 'idle', segundos = null }) => {
    Object.assign(estado, { cenaIndex, cenaId, passo, fase });
    pararTimer(); estado.restante = null;
    if (segundos && fase === 'aberta') iniciarTimer(segundos);
    salvarEstado(); io.emit('estado', estado);
  }));
  socket.on('host:passo', soHost((d) => { estado.passo = Math.max(0, estado.passo + d); salvarEstado(); io.emit('estado', estado); }));
  socket.on('host:fase', soHost(({ fase, segundos = null, cenaId = null }) => {
    estado.fase = fase; if (cenaId) estado.cenaId = cenaId;
    if (fase === 'aberta' && segundos) iniciarTimer(segundos);
    else { pararTimer(); if (fase === 'idle') estado.restante = null; }
    salvarEstado(); io.emit('estado', estado);
  }));

  socket.on('host:revelar', soHost(({ cenaId, correta, xpBase = 40, segundos = 20 }) => {
    const distribuicao = {};
    for (const r of dao.respostasDaCena(cenaId)) {
      distribuicao[r.alternativa] = (distribuicao[r.alternativa] ?? 0) + 1;
      if (r.alternativa !== correta) { jogo.mexerCombo(r.participante_id, false); continue; }
      const bonus = Math.round(30 * ((r.restante ?? 0) / segundos));
      jogo.premiar(r.participante_id, xpBase + bonus, 'quiz', cenaId, { usarCombo: true });
      jogo.mexerTokens(r.participante_id, 1, 'quiz');
      jogo.mexerCombo(r.participante_id, true);
    }
    estado.fase = 'revelada'; salvarEstado();
    io.emit('estado', estado);
    io.emit('revelacao', { cenaId, correta, distribuicao });
    emitirPlacar();
  }));

  socket.on('host:gabarito', soHost(async ({ taskSlug }, ack) => {
    const lab = labDe(taskSlug);
    if (!lab) return ack?.({ erro: 'lab desconhecido' });
    const alvos = lab.escopo === 'grupo'
      ? [...jogo.grupos.values()].filter((g) => g.membros.size).map((g) => ({ conta: jogo.participantes.get([...g.membros][0])?.conta, env: { GRUPO: g.nome, DIR_GRUPO: amb.dirDoGrupo(g.nome) } }))
      : [...jogo.participantes.values()].map((p) => ({ conta: p.conta, env: { NICK: p.nick } }));
    let n = 0;
    for (const a of alvos) {
      if (!a.conta) continue;
      const r = await fila.adicionar(() => amb.gabaritar(a.conta, lab.solve, a.env));
      if (r.ok) n++;
    }
    io.emit('gabarito', { taskSlug });   // o cliente mostra "o gabarito foi aplicado"
    ack?.({ aplicados: n });
  }));

  socket.on('host:evento', soHost(async ({ tipo, segundos = 180 }) => {
    if (tipo === 'xp-dobrado') {
      jogo.multiplicadorGlobal = 2;
      setTimeout(() => { jogo.multiplicadorGlobal = 1; io.emit('evento:fim', { tipo }); }, segundos * 1000);
    }
    if (tipo === 'sabotagem') {
      for (const p of jogo.participantes.values()) {
        if (p.conta) fila.adicionar(() => amb.rodarCheck(p.conta, 'chmod -x "$HOME/deploy.sh" 2>/dev/null; exit 0', {}));
      }
    }
    if (tipo === 'resgate') {
      const atrasados = [...jogo.participantes.values()].sort((a, b) => a.xp - b.xp).slice(0, 5);
      for (const p of atrasados) jogo.premiar(p.id, 80, 'resgate', 'evento');
      emitirPlacar();
    }
    io.emit('evento', { tipo, segundos });
  }));

  socket.on('host:reset', soHost(async ({ id }, ack) => {
    const p = jogo.participantes.get(id);
    if (!p?.conta) return ack?.({ erro: 'sem ambiente' });
    pty.matarSessao(id);
    const r = await amb.resetar(p.conta);
    ack?.({ ok: r.ok });
  }));

  socket.on('host:grade', soHost((_, ack) => {
    const porDono = {};
    for (const r of dao.todosCriterios()) (porDono[r.dono] ??= []).push(r.criterio_id);
    ack?.({
      labs: Object.fromEntries(Object.entries(LABS).map(([k, l]) => [k, l.criterios.map((c) => ({ id: c.id, descricao: c.descricao, xp: c.xp }))])),
      pessoas: [...jogo.participantes.values()].map((p) => ({
        ...jogo.publico(p),
        feitos: porDono[p.id] ?? [],
        travado: p.presenca === 'ativo' && estado.fase === 'aberta' && (estado.restante ?? 999) < 120 && (porDono[p.id] ?? []).length === 0,
      })),
      grupos: Object.fromEntries([...jogo.grupos.keys()].map((g) => [g, porDono[`grupo:${g}`] ?? []])),
      sessoes: pty.sessoesAbertas(), fila: fila.tamanho, modo: amb.MODO,
    });
  }));

  socket.on('host:pausar', soHost((v) => { estado.pausado = !!v; salvarEstado(); io.emit('estado', estado); }));
  socket.on('host:aviso', soHost((t) => io.emit('aviso', String(t).slice(0, 200))));
  socket.on('host:aovivo', soHost(() => {
    for (const p of jogo.participantes.values()) p.livre = false;
    io.emit('aovivo'); emitirPresenca();
  }));
  socket.on('host:grupo:criar', soHost(({ nome, cor = '#475569', capacidade = 5 }) => {
    if (!jogo.grupos.has(nome)) {
      jogo.grupos.set(nome, { nome, cor, capacidade, membros: new Set(), papeis: {}, chat: [] });
      dao.salvarGrupo({ nome, cor, capacidade });
    }
    emitirPlacar();
  }));
  socket.on('host:grupo:sortear', soHost(() => {
    const ids = [...jogo.participantes.keys()].sort(() => Math.random() - 0.5);
    const nomes = [...jogo.grupos.keys()];
    for (const g of jogo.grupos.values()) { g.membros.clear(); g.papeis = {}; }
    ids.forEach((id, i) => {
      const nome = nomes[i % nomes.length];
      jogo.grupos.get(nome).membros.add(id);
      const p = jogo.participantes.get(id);
      p.grupo = nome; p.papel = null; dao.salvarParticipante(p);
      io.to(`p:${id}`).emit('grupo', nome);
    });
    emitirPlacar(); emitirPresenca();
  }));
  socket.on('host:boss:semear', soHost(async (_, ack) => {
    let n = 0;
    for (const g of jogo.grupos.values()) {
      if (!g.membros.size) continue;
      const conta = jogo.participantes.get([...g.membros][0])?.conta;
      if (!conta) continue;
      const r = await amb.semear(conta, 'boss.sh', { GRUPO: g.nome, DIR_GRUPO: amb.dirDoGrupo(g.nome) });
      if (r.ok) n++; else console.warn('[boss]', g.nome, r.saida);
    }
    ack?.({ semeados: n });
  }));

  socket.on('disconnect', () => {
    if (ouvinteTerm && eu) pty.desligarOuvinte(eu.id, ouvinteTerm);
    if (eu) { eu.presenca = 'desconectado'; emitirPresenca(); }
  });
});

// marca ocioso quem não dá sinal há 90s (e nunca tira XP por isso)
setInterval(() => {
  const agora = Date.now();
  let mudou = false;
  for (const p of jogo.participantes.values()) {
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
    const l = (t) => console.log('  │ ' + t.padEnd(56) + '│');
    console.log('\n  ┌' + '─'.repeat(57) + '┐');
    l('Linux Day Arena');
    l('');
    l(`participantes   http://${ip}:${port}`);
    l(`projetor        http://localhost:${port}/screen`);
    l(`apresentador    http://localhost:${port}/host   (PIN ${PIN_HOST})`);
    l('');
    l(`modo do lab: ${amb.MODO}${amb.MODO === 'local' ? '  (desenvolvimento)' : '  (contas reais)'}`);
    console.log('  └' + '─'.repeat(57) + '┘\n');
  });
});
