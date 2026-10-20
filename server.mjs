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
import next from 'next';
import { Server } from 'socket.io';

import { dao } from './src/server/db.mjs';
import { criarJogo, nivelDe, CAPACIDADE_DO_GRUPO, enderecoDaFoto } from './src/server/jogo.mjs';
import { validarFoto } from './src/server/fotos.mjs';
import { descreverRede, enderecosDaRede } from './src/server/rede.mjs';
import { podeSerApresentador, criarLimitador } from './src/server/guarda.mjs';
import { prepararCartao, CARTOES } from './src/server/chamado.mjs';
import { criarRoleta } from './src/server/roleta.mjs';
import { EVENTOS, sortearEvento, proximoIntervalo } from './src/server/eventos.mjs';
import { criarFila } from './src/server/fila.mjs';
import { LABS, labDe, scriptDoCheck } from './src/server/labs.mjs';
import * as amb from './src/server/ambiente.mjs';
import * as pty from './src/server/pty.mjs';
import { vistoriar, TETOS } from './src/server/vigia.mjs';
import { usuarioDoNick } from './src/server/nomes.mjs';
import { GABARITOS, gabaritoDe } from './src/server/gabaritos.mjs';
import { criarArena } from './src/server/arena.mjs';
import { bloqueioDoAvanco, semEquipe, distribuirSemEquipe, cartasDoDeck } from './src/server/equipes.mjs';
// o Node 22.18+ lê TypeScript sem build (remove os tipos); o deck é o mesmo do navegador
import { DECK } from './src/deck/content.ts';

const CARTAS_VALIDAS = new Set(cartasDoDeck(DECK).map((c) => c.id));

const dev = process.env.NODE_ENV !== 'production';
const port = Number(process.env.PORT ?? 3000);
const PIN_HOST = process.env.PIN_HOST ?? '1991';
const HOST_REMOTO = process.env.ARENA_HOST_REMOTO === '1';
const tentarPin = criarLimitador({ limite: 5, janelaMs: 60_000 });

const app = next({ dev });
const handle = app.getRequestHandler();
const server = createServer((req, res) => {
  // a foto de cada pessoa sai daqui, e não do placar (ver src/server/fotos.mjs)
  // a página /ip pergunta em que endereço o servidor está (só o servidor sabe)
  if (req.url === '/api/rede') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(descreverRede({ porta: port })));
    return;
  }
  const foto = /^\/foto\/([^/?]+)/.exec(req.url ?? '');
  if (foto) {
    const r = dao.foto(decodeURIComponent(foto[1]));
    if (!r) { res.writeHead(404).end(); return; }
    res.writeHead(200, {
      'Content-Type': r.mime, 'Cache-Control': 'public, max-age=31536000, immutable',
      // a imagem nunca é interpretada como outra coisa
      'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'",
    });
    res.end(Buffer.from(r.dados));
    return;
  }
  return handle(req, res);
});
const io = new Server(server, { path: '/rt', cors: { origin: '*' }, maxHttpBufferSize: 1e6 });

const fila = criarFila(Number(process.env.ARENA_CHECKERS ?? 6));

// ───────────────────────────── estado do evento ─────────────────────────────
const estado = dao.getEstado('evento') ?? { cenaIndex: 0, maxCenaIndex: 0, passo: 0, fase: 'idle', pausado: false, restante: null, cenaId: null };
estado.maxCenaIndex = Math.max(estado.maxCenaIndex ?? 0, estado.cenaIndex ?? 0);
estado.restante = null;

/**
 * Código de retorno: quatro caracteres do próprio id. Serve para a pessoa
 * recuperar a conta num outro computador, e só aparece na tela dela (e na
 * grade do apresentador, para ele poder ajudar quem perdeu).
 */
const codigoDe = (id) => String(id).slice(0, 4).toUpperCase();

const jogo = criarJogo({
  emitir: (ev, dados) => io.emit(ev, dados),
  emitirPara: (id, ev, dados) => io.to(`p:${id}`).emit(ev, dados),
  cartasValidas: CARTAS_VALIDAS,
});
jogo.recarregarDoBanco();

/**
 * XP de cada pessoa e equipe no começo da cena da vez. Vai junto com o placar
 * para o pódio mostrar quanto cada um ganhou NAQUELA rodada. Precisa ser
 * guardado aqui: o navegador só recebe o placar quando alguém pontua, então
 * uma foto tirada lá chegava atrasada (depois da revelação) e o ganho dava 0.
 */
let baseDaCena = null;
function fotografarCena(cenaId) {
  const p = jogo.placar();
  baseDaCena = {
    cenaId,
    ind: Object.fromEntries(p.individual.map((x) => [x.id, x.xp])),
    grp: Object.fromEntries(p.grupos.map((g) => [g.nome, g.media])),
  };
}
const emitirPlacar = () => io.emit('placar', { ...jogo.placar(), base: baseDaCena });

/** os jogos de equipe (corrida e buzzer) */
const arena = criarArena({
  emitir: (ev, dados) => io.emit(ev, dados),
  premiarEquipe: (equipe, xp) => jogo.premiarEquipe(equipe, xp),
  premiarPessoa: (id, xp, tipo, ref) => jogo.premiar(id, xp, tipo, ref),
  membrosDaEquipe: (equipe) => [...(jogo.grupos.get(equipe)?.membros ?? [])],
});
const emitirPresenca = () => io.emit('presenca', [...jogo.participantes.values()].map(jogo.publico));
const salvarEstado = () => dao.setEstado('evento', { ...estado, restante: null });

let timer = null;
/**
 * O quiz da vez. Guardado no servidor para que a revelação possa acontecer
 * sozinha, igual ao Kahoot: quando todo mundo responde, ou quando o tempo
 * acaba. Sem isso só o apresentador poderia revelar, e a sala fica esperando.
 */
let quizAtual = null;   // { cenaId, correta, xpBase, segundos }

/**
 * Equipes trancadas.
 *
 * Sem tranca, dava para esperar o chamado começar e pular para a equipe que
 * está ganhando. Quando um laboratório de grupo abre, as equipes trancam
 * sozinhas: quem está dentro fica, quem está fora não entra. O apresentador
 * pode destrancar se precisar remanejar alguém.
 */
let equipesTrancadas = false;

/** quantas vezes cada pessoa já trocou de equipe (limite baixo de propósito) */
const trocasDeEquipe = new Map();
const LIMITE_DE_TROCAS = Number(process.env.ARENA_MAX_TROCAS ?? 3);
const XP_DO_WIDGET = 90;

/** em que conta o processo travado de cada equipe nasceu (o kill roda nela) */
const contaDoBoss = new Map();

/** o chamado está aberto agora? (é o único momento em que cartão roda) */
const CENA_DO_CHAMADO = DECK.find((c) => c.tipo === 'LabScene' && c.cartoes)?.id ?? null;
const chamadoAberto = () => estado.cenaId === CENA_DO_CHAMADO && estado.fase === 'aberta';

/**
 * Prepara o chamado (os quatro defeitos) na pasta de cada equipe. `so` limita
 * às equipes ainda não preparadas nesta sessão: é o que a abertura do chamado
 * usa, para não desfazer o progresso de quem já começou se o apresentador
 * reabrir a cena. O botão "preparar boss" refaz em todas.
 */
async function semearChamado({ soNovas = false } = {}) {
  let n = 0;
  for (const g of jogo.grupos.values()) {
    if (!g.membros.size || (soNovas && contaDoBoss.has(g.nome))) continue;
    // O processo travado nasce na conta do Operador. Com hidepid=2 cada
    // pessoa só enxerga os próprios processos: semeado na conta de outro
    // membro, o Operador não via nem conseguia matar, e o checker (que roda
    // como quem verifica) achava que ele já estava morto.
    const operador = Object.entries(g.papeis).find(([, p]) => p === 'operador')?.[0];
    const conta = jogo.participantes.get(operador ?? [...g.membros][0])?.conta;
    if (!conta) continue;
    contaDoBoss.set(g.nome, conta);
    const r = await amb.semear(conta, 'boss.sh', { GRUPO: g.nome, DIR_GRUPO: amb.dirDoGrupo(g.nome) });
    if (r.ok) n++; else { contaDoBoss.delete(g.nome); console.warn('[boss]', g.nome, r.saida); }
    g.jogadas = [];
  }
  return n;
}

/**
 * Começo do chamado: cada pessoa com carta ganha a conquista do cargo e um
 * token. Quem faltou aos módulos anteriores começa o desafio final com algo
 * na mão, e o token paga a primeira dica.
 */
function iniciarChamado() {
  // a equipe que ainda não tem o servidor quebrado ganha um agora: sem isso o
  // chamado abria sem defeito nenhum e os critérios passavam sozinhos
  semearChamado({ soNovas: true });
  for (const g of jogo.grupos.values()) {
    for (const [id, papel] of Object.entries(g.papeis)) {
      if (!jogo.participantes.has(id)) continue;
      const antes = dao.badgesDe(id).includes(`carta-${papel}`);
      jogo.darBadge(id, `carta-${papel}`);
      if (!antes) jogo.mexerTokens(id, 1, `carta-${papel}`);
    }
  }
  emitirPlacar();
}

/**
 * Coloca a pessoa numa equipe por decisão do apresentador (sortear, completar).
 * Muda também a sala de socket: sem isso o chat da equipe nova não chegava a
 * quem foi sorteado, e o da antiga continuava chegando.
 */
function colocarNaEquipe(id, nome) {
  const p = jogo.participantes.get(id);
  if (!p) return;
  for (const g of jogo.grupos.values()) { g.membros.delete(id); delete g.papeis[id]; }
  if (p.grupo) io.in(`p:${id}`).socketsLeave(`g:${p.grupo}`);
  jogo.grupos.get(nome).membros.add(id);
  p.grupo = nome; p.papel = null;
  dao.salvarParticipante(p);
  io.in(`p:${id}`).socketsJoin(`g:${nome}`);
  io.to(`p:${id}`).emit('grupo', nome);
}

function pararTimer() { if (timer) clearInterval(timer); timer = null; }
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
      // tempo esgotado em pergunta de quiz: revela na hora, como no Kahoot
      if (quizAtual && quizAtual.cenaId === estado.cenaId) revelarQuiz(quizAtual);
    }
  }, 1000);
}

/** quantas pessoas estão na sala e quantas já responderam a cena da vez */
function contagemDeRespostas(cenaId) {
  // Só conta quem está REALMENTE acompanhando. Quem fechou o navegador ou
  // parou de interagir não pode travar a revelação da sala inteira.
  const esperados = [...jogo.participantes.values()].filter((p) => p.presenca === 'ativo').length;
  const total = dao.respostasDaCena(cenaId).length;
  return { cenaId, total, esperados };
}

/** Revelação: pontua quem acertou (com bônus por velocidade) e mostra o gráfico. */
function revelarQuiz({ cenaId, correta, xpBase = 40, segundos = 20 }) {
  if (estado.fase === 'revelada' && estado.cenaId === cenaId) return;
  const distribuicao = {};
  for (const r of dao.respostasDaCena(cenaId)) {
    distribuicao[r.alternativa] = (distribuicao[r.alternativa] ?? 0) + 1;
    if (r.alternativa !== correta) { jogo.mexerCombo(r.participante_id, false); continue; }
    // quem responde mais rápido ganha mais, igual ao Kahoot
    const bonus = Math.round(30 * ((r.restante ?? 0) / segundos));
    jogo.premiar(r.participante_id, xpBase + bonus, 'quiz', cenaId, { usarCombo: true });
    jogo.mexerTokens(r.participante_id, 1, 'quiz');
    jogo.mexerCombo(r.participante_id, true);
  }
  pararTimer();
  estado.fase = 'revelada';
  salvarEstado();
  io.emit('estado', estado);
  io.emit('revelacao', { cenaId, correta, distribuicao });
  emitirPlacar();
}

/** Resultado de um critério = passou agora OU já foi premiado antes (adesivo). */
async function avaliar(dono, conta, taskSlug, extra = {}) {
  const lab = labDe(taskSlug);
  if (!lab) return [];
  const jaPremiados = new Set(dao.criteriosDe(dono));
  const resultados = await Promise.all(lab.criterios.map((c) => fila.adicionar(async () => {
    if (jaPremiados.has(c.id)) return { id: c.id, passou: true, mensagem: '', adesivo: true };
    const r = await amb.rodarCheck(conta, scriptDoCheck(c), extra);
    return { id: c.id, passou: r.passou, mensagem: r.mensagem, xp: c.xp, papel: c.papel ?? null, tipo: c.tipo ?? null };
  })));
  return resultados;
}

// ─────────────────────────────── eventos ─────────────────────────────────────
const ativosDaSala = () => [...jogo.participantes.values()].filter((p) => p.presenca === 'ativo');
const membrosDaEquipeDe = (id) => {
  const g = jogo.participantes.get(id)?.grupo;
  return g ? [...(jogo.grupos.get(g)?.membros ?? [])] : [];
};
const INDICE_DO_M3 = DECK.findIndex((c) => c.tipo === 'LabScene' && c.taskSlug === 'm3-permissoes');

/** quanto dura cada evento de multiplicador */
const MULTIPLICADORES = { 'xp-dobrado': { mult: 2, segundos: 180 }, relampago: { mult: 3, segundos: 60 } };

/**
 * Dispara um evento. Serve ao painel e ao sorteio automático.
 * `contemplados` vai junto para cada tela dizer o que mudou para ELA.
 */
function executarEvento(tipo) {
  if (!EVENTOS[tipo]) return { erro: 'evento desconhecido' };
  let contemplados = [];
  let segundos = null;
  if (MULTIPLICADORES[tipo]) {
    if (jogo.multiplicadorGlobal !== 1) return { erro: 'já tem um multiplicador valendo' };
    ({ segundos } = MULTIPLICADORES[tipo]);
    jogo.multiplicadorGlobal = MULTIPLICADORES[tipo].mult;
    setTimeout(() => { jogo.multiplicadorGlobal = 1; io.emit('evento:fim', { tipo }); }, segundos * 1000);
  }
  if (tipo === 'sabotagem') {
    for (const p of jogo.participantes.values()) {
      if (p.conta) fila.adicionar(() => amb.rodarCheck(p.conta, 'chmod -x "$HOME/deploy.sh" 2>/dev/null; exit 0', {}));
    }
  }
  if (tipo === 'resgate') {
    // todo mundo, inclusive quem saiu: o XP fica guardado e volta com a pessoa
    const atrasados = [...jogo.participantes.values()].sort((a, b) => a.xp - b.xp).slice(0, 5);
    for (const p of atrasados) jogo.premiar(p.id, 80, 'resgate', 'evento');
    contemplados = atrasados.map((p) => p.id);
  }
  if (tipo === 'resgate-de-equipe') {
    const ultima = jogo.placar().grupos.filter((g) => g.membros.length).sort((a, b) => a.xp - b.xp || a.media - b.media)[0];
    if (ultima) {
      jogo.premiarEquipe(ultima.nome, 60);
      for (const m of ultima.membros) jogo.premiar(m.id, 60, 'resgate-de-equipe', 'evento');
      contemplados = ultima.membros.map((m) => m.id);
    }
  }
  if (tipo === 'chuva-de-tokens') {
    for (const p of ativosDaSala()) jogo.mexerTokens(p.id, 1, 'chuva-de-tokens');
    contemplados = ativosDaSala().map((p) => p.id);
  }
  if (tipo === 'roleta') {
    const r = roleta.iniciar(ativosDaSala());
    if (r.erro) return r;
    contemplados = r.sorteados;
    // a roleta aparece na hora, em todas as telas ao mesmo tempo
    passoDaRoleta(() => roleta.proximo(ativosDaSala()));
  }
  emitirPlacar();
  io.emit('evento', { tipo, segundos, contemplados });
  return { ok: true, tipo, contemplados };
}

// ─────────────────────────────── roleta ──────────────────────────────────────
const roleta = criarRoleta();
let esperaDaRoleta = null;

function estadoDaRoleta() {
  const { fila: proximos, atual } = roleta.publico();
  const quem = (id) => {
    const p = jogo.participantes.get(id);
    return p ? { id, nick: p.nick, emoji: p.emoji, foto: p.foto ?? null } : null;
  };
  return atual || proximos.length ? {
    atual: atual ? {
      ...atual, pessoa: quem(atual.id), alvoPessoa: atual.alvo ? quem(atual.alvo) : null,
      // no duelo, cada lado só sabe que o outro já escolheu, não o quê
      escolhas: atual.escolhas && atual.fase !== 'fim' ? Object.fromEntries(Object.keys(atual.escolhas).map((k) => [k, 'escolheu'])) : atual.escolhas,
    } : null,
    fila: proximos.map(quem).filter(Boolean),
  } : null;
}
const emitirRoleta = () => io.emit('roleta', estadoDaRoleta());

/**
 * Aplica um passo da roleta (girar, escolher, indicar, julgar) e cuida do
 * relógio: quem some tem 30 s antes de o servidor agir por ela, e depois do
 * resultado a próxima pessoa é chamada sozinha.
 */
function passoDaRoleta(passo) {
  const r = passo();
  if (r?.erro) return r;
  for (const pr of r?.premios ?? []) jogo.premiar(pr.id, pr.xp, 'roleta', 'roleta');
  for (const t of r?.tokens ?? []) jogo.mexerTokens(t.id, t.delta, 'roleta');
  if (r?.premios?.length || r?.tokens?.length) emitirPlacar();
  emitirRoleta();

  clearTimeout(esperaDaRoleta);
  const atual = roleta.atual;
  if (atual?.fase === 'fim') {
    // tempo de a sala ler o resultado (e de a roleta terminar de girar)
    esperaDaRoleta = setTimeout(() => passoDaRoleta(() => roleta.proximo(ativosDaSala())), 9000);
  } else if (atual && atual.fase !== 'julgar') {
    esperaDaRoleta = setTimeout(() => passoDaRoleta(() => roleta.agirPorEla(ativosDaSala())), 30_000);
  }
  return { ok: true, ...(r ?? {}) };
}

// ─────────────────────────── eventos automáticos ─────────────────────────────
let esperaDoEvento = null;
function agendarEventoAutomatico() {
  clearTimeout(esperaDoEvento);
  if (!estado.eventosAuto) return;
  esperaDoEvento = setTimeout(() => {
    const cena = DECK[estado.cenaIndex];
    const tipo = sortearEvento({
      pausado: estado.pausado, fase: estado.fase, tipoDaCena: cena?.tipo,
      multiplicador: jogo.multiplicadorGlobal,
      passouDoM3: INDICE_DO_M3 >= 0 && estado.cenaIndex > INDICE_DO_M3,
      ativos: ativosDaSala().length,
      equipesComGente: [...jogo.grupos.values()].filter((g) => g.membros.size).length,
      roletaAtiva: !!(roleta.atual || roleta.fila.length),
    });
    if (tipo) {
      executarEvento(tipo);
      io.to('host').emit('aviso', `evento automático: ${EVENTOS[tipo].rotulo}`);
    }
    agendarEventoAutomatico();
  }, proximoIntervalo());
}
agendarEventoAutomatico();

// ──────────────────────────────── sockets ───────────────────────────────────
io.on('connection', (socket) => {
  let eu = null;
  let host = false;

  /**
   * Envolve um handler que só o apresentador pode disparar.
   *
   * Fica declarado AQUI, antes de qualquer `socket.on`, porque `const` não é
   * elevado: um handler registrado acima desta linha quebrava o servidor na
   * primeira conexão com "Cannot access 'soHost' before initialization".
   */
  const soHost = (fn) => (...a) => { if (host) return fn(...a); };
  let ouvinteTerm = null;

  socket.emit('estado', estado);
  socket.emit('placar', { ...jogo.placar(), base: baseDaCena });
  // a pasta do chamado vai junto para o enunciado poder dizer o caminho exato
  // (muda entre o modo local e a VM, então não pode ficar escrita no deck)
  // os cartões do chamado sem o script e sem dizer qual é armadilha
  socket.emit('chamado:cartoes', CARTOES.map(({ id, papel, comando, campo }) => ({ id, papel, comando, campo: campo ?? null })));
  socket.emit('labs', Object.fromEntries(Object.entries(LABS).map(([k, l]) => [k, {
    dicas: l.dicas?.length ?? 0,
    pasta: l.seed === 'boss.sh' ? amb.dirDoGrupo('') : null,
  }])));
  socket.emit('arena', arena.estadoPublico());
  // quem chega no meio do chamado precisa saber que as equipes estão trancadas
  socket.emit('equipes', { trancadas: equipesTrancadas });
  socket.emit('roleta', estadoDaRoleta());

  /**
   * Dois "Ana" na sala viram dois `ana@linuxday` e dois nomes iguais no placar:
   * ninguém sabe de quem é o XP, e o apresentador não sabe quem chamar. Então o
   * nome é único, comparado pela forma tratada (sem acento, sem espaço).
   */
  /**
   * O nome fica reservado pelo evento inteiro, inclusive para quem fechou o
   * navegador. Liberar o nome de quem saiu abriria a porta para alguém assumir
   * a identidade (e o XP) de um colega que foi ao banheiro.
   */
  function nomeOcupado(nick, meuId) {
    const alvo = usuarioDoNick(nick);
    return [...jogo.participantes.values()].some(
      (p) => p.id !== meuId && usuarioDoNick(p.nick) === alvo,
    );
  }

  function sugerirNomes(nick, meuId) {
    const base = String(nick).trim();
    const sugestoes = [];
    for (let n = 2; n <= 40 && sugestoes.length < 3; n++) {
      const tentativa = `${base} ${n}`;
      if (!nomeOcupado(tentativa, meuId)) sugestoes.push(tentativa);
    }
    return sugestoes;
  }

  async function registrar({ id, nick, emoji, codigo }, ack) {
    /**
     * Identidade tem que ser PROVADA, nunca digitada.
     *
     * Antes, quem entrasse com o nome de outra pessoa herdava a conta dela (e
     * bastava renomear depois para ficar com o XP). Agora só duas coisas
     * devolvem uma identidade: o id guardado neste navegador, ou o código de
     * retorno que só aparece na tela da própria pessoa.
     */
    const porCodigo = !id && codigo
      ? [...jogo.participantes.values()].find((p) => codigoDe(p.id) === String(codigo).trim().toUpperCase())
      : null;
    const existente = (id && jogo.participantes.get(id)) || porCodigo;
    let ambientePronto = true;   // quem volta já tem ambiente semeado

    // quem está voltando mantém o próprio nome; quem está chegando não pode
    // repetir o de alguém que já está na sala
    if (nomeOcupado(nick, existente?.id)) {
      return ack?.({ erro: 'nome-em-uso', nome: String(nick).trim(), sugestoes: sugerirNomes(nick, existente?.id) });
    }
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
      ambientePronto = false;
      // semeia o ambiente em segundo plano: a pessoa já pode ver o slide
      amb.semear(conta, 'all.sh', { NICK: eu.nick, USUARIO: usuarioDoNick(eu.nick) }).then((r) => {
        if (!r.ok) console.warn('[seed]', conta, r.saida);
        io.to(`p:${eu.id}`).emit('ambiente', { conta, pronto: r.ok });
      });
    }
    socket.join(`p:${eu.id}`);
    if (eu.grupo) socket.join(`g:${eu.grupo}`);
    dao.salvarParticipante(eu);
    ack?.({ eu: jogo.publico(eu), codigo: codigoDe(eu.id), estado, placar: jogo.placar(), ambientePronto });
    emitirPresenca();
    // quem chega entra no placar de todas as telas (senão só aparecia no
    // pódio depois da primeira vez que alguém pontuasse)
    emitirPlacar();
  }

  socket.on('entrar', registrar);
  /**
   * A batida agora carrega há quanto tempo a pessoa não interage. Antes ela
   * era automática a cada 20s, então ninguém ficava "ocioso" nunca, e um
   * notebook aberto numa aba esquecida travava a contagem do quiz.
   */
  socket.on('batida', ({ inativoMs = 0 } = {}) => {
    if (!eu) return;
    const antes = eu.presenca;
    eu.visto = Date.now();
    eu.presenca = inativoMs > 4 * 60_000 ? 'ocioso' : 'ativo';
    if (antes !== eu.presenca) {
      emitirPresenca();
      if (estado.cenaId) io.emit('respostas', contagemDeRespostas(estado.cenaId));
    }
  });

  /** a própria pessoa diz que voltou (clicou no "ainda estou aqui") */
  socket.on('voltei', () => {
    if (!eu) return;
    eu.presenca = 'ativo';
    eu.visto = Date.now();
    emitirPresenca();
    if (estado.cenaId) io.emit('respostas', contagemDeRespostas(estado.cenaId));
  });
  socket.on('livre', (v) => { if (eu) { eu.livre = !!v; emitirPresenca(); } });

  /** enviar a própria foto (data URL já reduzida no navegador), ou `null` para tirar */
  socket.on('perfil:foto', (dataUrl, ack) => {
    if (!eu) return ack?.({ erro: 'entre primeiro' });
    if (dataUrl === null) {
      dao.apagarFoto(eu.id);
      eu.foto = null;
    } else {
      const v = validarFoto(dataUrl);
      if (v.erro) return ack?.({ erro: v.erro });
      eu.foto = enderecoDaFoto(eu.id, dao.salvarFoto(eu.id, v.mime, v.dados));
    }
    ack?.({ ok: true, foto: eu.foto });
    emitirPlacar(); emitirPresenca();
  });

  // ─────────────────────────────── terminal ─────────────────────────────────
  socket.on('term:abrir', ({ cols, rows } = {}) => {
    if (!eu?.conta) return;
    ouvinteTerm = (d) => socket.emit('term:dados', d);
    pty.abrirSessao(eu.id, eu.conta, ouvinteTerm, usuarioDoNick(eu.nick));
    if (cols && rows) pty.redimensionar(eu.id, cols, rows);
  });
  socket.on('term:entrada', (d) => { if (eu) pty.escrever(eu.id, d); });
  socket.on('term:resize', ({ cols, rows }) => { if (eu) pty.redimensionar(eu.id, cols, rows); });

  // ──────────────────────────────── labs ───────────────────────────────────
  // `auto`: a verificação que o laboratório faz sozinho a cada poucos segundos.
  // Ela premia igual, mas só deixa rastro (combo, submissão, aviso ao
  // apresentador) quando algo novo passou; senão um item ainda por fazer
  // zerava o combo a cada 5 segundos e o banco enchia de linhas repetidas.
  socket.on('lab:verificar', async ({ taskSlug, resposta = '', auto = false }, ack) => {
    if (!eu?.conta) return ack?.({ erro: 'sem ambiente' });
    const lab = labDe(taskSlug);
    if (!lab) return ack?.({ erro: 'lab desconhecido' });

    // primeira verificação de um lab de equipe tranca as equipes: daqui para
    // frente ninguém troca de time para pegar carona no resultado
    if (lab.escopo === 'grupo' && !equipesTrancadas) {
      equipesTrancadas = true;
      io.emit('equipes', { trancadas: true });
    }

    // USUARIO é o nome do prompt (sem acento nem espaço): é o que a pessoa vê
    // na tela, então os checkers aceitam ele tanto quanto o nick
    const extra = { NICK: eu.nick, USUARIO: usuarioDoNick(eu.nick), RESPOSTA: String(resposta).trim() };
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
      // Só bloqueia se a carta deste critério tem dono e não é você. Carta sem
      // dono (equipe com menos de 4 pessoas) pode ser entregue por qualquer um;
      // antes, numa equipe de 3, o quarto item não tinha quem entregasse.
      const donoDaCarta = lab.escopo === 'grupo' && criterio.papel
        ? Object.entries(jogo.grupos.get(eu.grupo)?.papeis ?? {}).find(([, p]) => p === criterio.papel)?.[0]
        : null;
      if (criterio.papel && donoDaCarta && donoDaCarta !== eu.id) {
        r.passou = false;
        r.mensagem = `esse critério é da carta "${criterio.papel}" — quem está com ela submete`;
        continue;
      }
      if (!dao.premiarCriterio(dono, r.id)) continue;
      ganho += jogo.premiar(eu.id, criterio.xp, 'criterio', r.id, { usarCombo: true });
      if (lab.escopo === 'grupo') {
        // o XP conta para a EQUIPE (é o que ordena o placar de equipes) e
        // também para cada pessoa que estava nela na hora
        jogo.premiarEquipe(eu.grupo, criterio.xp);
        for (const outroId of jogo.grupos.get(eu.grupo)?.membros ?? []) {
          if (outroId !== eu.id) jogo.premiar(outroId, criterio.xp, 'criterio-grupo', r.id);
        }
        if (r.id === 'b-c4') jogo.darBadge(eu.id, 'chamado-fechado');
      }
    }

    // corrida de equipes: quem chega primeiro leva mais
    if (taskSlug === 'corrida-1' && resultados.every((r) => r.passou) && eu.grupo) {
      const chegada = arena.registrarChegada(eu.grupo, eu.nick);
      if (chegada) {
        io.emit('aviso', `equipe ${eu.grupo} chegou em ${chegada.posicao}º lugar`);
        emitirPlacar();
      }
    }

    const todos = resultados.every((r) => r.passou);
    if (auto && ganho === 0) {
      ack?.({ resultados, ganho, todos });
      return;
    }
    if (ganho > 0 || !auto) jogo.mexerCombo(eu.id, todos || ganho > 0);
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
    socket.emit('criterios', eu.criterios);
    socket.emit('badges', dao.badgesDe(eu.id));
    ack?.({ resultados, ganho, todos });
    io.to('host').emit('submissao', { id: eu.id, nick: eu.nick, taskSlug, resultados });
    emitirPlacar();
  });

  socket.on('lab:dica', ({ taskSlug, indice }, ack) => {
    const lab = labDe(taskSlug);
    const total = lab?.dicas?.length ?? 0;
    const dica = lab?.dicas?.[indice];
    if (!eu) return ack?.({ erro: 'entre primeiro' });
    if (!dica) return ack?.({ erro: total ? 'as dicas deste lab acabaram' : 'este lab não tem dica' });
    const custo = indice === 0 ? 1 : 2;
    if (eu.tokens < custo) return ack?.({ erro: `essa dica custa ${custo} 🪙 e você tem ${eu.tokens}` });
    if (!jogo.mexerTokens(eu.id, -custo, `dica:${taskSlug}`)) return ack?.({ erro: 'sem tokens' });
    emitirPlacar();   // o saldo de tokens aparece no placar e no painel
    ack?.({ dica, custo, restantes: total - indice - 1 });
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
    // Aceita enquanto a pergunta não foi revelada, inclusive depois de o
    // cronômetro fechar: quem respondeu tarde perde o bônus de velocidade, e
    // não o direito de responder. Travar aqui era o "não consigo responder".
    if (!eu) return ack?.({ ok: false, motivo: 'entre primeiro' });
    if (estado.cenaId && cenaId !== estado.cenaId) return ack?.({ ok: false, motivo: 'essa não é a pergunta da vez' });
    if (estado.fase === 'revelada') return ack?.({ ok: false, motivo: 'a resposta já foi revelada' });
    if (estado.fase === 'idle') return ack?.({ ok: false, motivo: 'a pergunta ainda não abriu' });
    const chave = `${cenaId}:${eu.id}`;
    if (!dao.registrarResposta(chave, cenaId, eu.id, alternativa, estado.restante ?? 0)) {
      return ack?.({ ok: false, motivo: 'já respondeu' });
    }
    ack?.({ ok: true });
    const contagem = contagemDeRespostas(cenaId);
    io.emit('respostas', contagem);           // todos veem quantos faltam
    // todo mundo respondeu: revela na hora, sem esperar o cronômetro
    if (quizAtual && quizAtual.cenaId === cenaId && contagem.total >= contagem.esperados) {
      setTimeout(() => revelarQuiz(quizAtual), 400);
    }
  });

  // o XP do exercício é do servidor: antes ele vinha do navegador (até 100),
  // e qualquer um mandava o máximo
  socket.on('widget:concluido', ({ cenaId }) => {
    if (!eu) return;
    const chave = `w:${cenaId}:${eu.id}`;
    if (!dao.registrarResposta(chave, `w:${cenaId}`, eu.id, 'ok', estado.restante ?? 0)) return;
    jogo.premiar(eu.id, XP_DO_WIDGET, 'widget', cenaId);
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
  socket.on('grupo:entrar', (nome, ack) => {
    if (!eu) return;

    // trancado: ninguém entra nem sai no meio do chamado
    if (equipesTrancadas) {
      socket.emit('aviso', 'as equipes estão trancadas para o chamado');
      return ack?.({ erro: 'trancado' });
    }

    // limite de trocas: entrar e sair para caçar a equipe que está ganhando
    // deixa de ser estratégia
    const trocas = trocasDeEquipe.get(eu.id) ?? 0;
    if (nome && nome !== eu.grupo && trocas >= LIMITE_DE_TROCAS) {
      socket.emit('aviso', `você já trocou de equipe ${trocas} vezes, que é o limite`);
      return ack?.({ erro: 'limite-de-trocas' });
    }
    if (nome && nome !== eu.grupo) trocasDeEquipe.set(eu.id, trocas + 1);
    for (const g of jogo.grupos.values()) { g.membros.delete(eu.id); delete g.papeis[eu.id]; }
    if (eu.grupo) socket.leave(`g:${eu.grupo}`);
    eu.papel = null;
    if (!nome) {                       // clicou na própria equipe: saiu dela
      eu.grupo = null;
      dao.salvarParticipante(eu);
      socket.emit('grupo', null);
      emitirPlacar(); emitirPresenca();
      return ack?.({ ok: true, grupo: null });
    }
    const g = jogo.grupos.get(nome);
    if (g && g.membros.size < g.capacidade) {
      g.membros.add(eu.id); eu.grupo = nome; eu.papel = null; socket.join(`g:${nome}`);
    } else {
      eu.grupo = null;
      socket.emit('aviso', `a equipe ${nome} está cheia: escolha outra`);
    }
    dao.salvarParticipante(eu);
    socket.emit('grupo', eu.grupo);   // sem o eco, a própria tela não atualiza
    emitirPlacar(); emitirPresenca();
    // confirma SEMPRE: quem chama com callback (o app e os testes) ficava
    // esperando para sempre quando a entrada dava certo
    ack?.({ ok: !!eu.grupo, grupo: eu.grupo, cheia: !!nome && !eu.grupo });
  });

  /**
   * Assumir ou largar uma carta de função.
   *
   * Um grupo pode ter dez pessoas e só quatro cartas: quem está sem carta
   * trabalha e ajuda igual, e pode assumir uma carta livre ou receber a de
   * alguém que largou. Mandar `null` larga a sua.
   */
  socket.on('grupo:papel', (papel) => {
    if (!eu?.grupo) return;
    const g = jogo.grupos.get(eu.grupo);
    if (!g) return;

    if (papel && !CARTAS_VALIDAS.has(papel)) return socket.emit('papel', eu.papel ?? null);

    if (!papel) {                       // largou
      delete g.papeis[eu.id];
      eu.papel = null;
      dao.salvarParticipante(eu);
      socket.emit('papel', null);
      return emitirPlacar();
    }

    const tomada = Object.entries(g.papeis).find(([pid, p]) => p === papel && pid !== eu.id);
    if (tomada) return socket.emit('papel', eu.papel ?? null);

    delete g.papeis[eu.id];             // troca de carta: solta a anterior
    g.papeis[eu.id] = papel;
    eu.papel = papel;
    dao.salvarParticipante(eu);
    socket.emit('papel', papel);
    emitirPlacar();
  });

  /**
   * Trocar o próprio nome, mantendo tudo o que já conquistou.
   *
   * O terminal NÃO é reiniciado: o prompt e o `whoami` passam a responder o
   * nome novo na mesma sessão. Reiniciar quebrava quem estava no meio de um
   * laboratório.
   */
  socket.on('renomear', ({ nick, emoji }, ack) => {
    if (!eu) return ack?.({ erro: 'entre primeiro' });
    const novo = String(nick ?? '').trim().slice(0, 20);
    if (!novo) return ack?.({ erro: 'escolha um nome' });
    if (nomeOcupado(novo, eu.id)) {
      return ack?.({ erro: 'nome-em-uso', nome: novo, sugestoes: sugerirNomes(novo, eu.id) });
    }
    eu.nick = novo;
    if (emoji) eu.emoji = emoji;
    dao.salvarParticipante(eu);

    // o terminal continua vivo: só o prompt e o `whoami` passam a responder o
    // nome novo. Matar a sessão aqui quebrava o laboratório em andamento.
    const usuario = usuarioDoNick(novo);
    amb.atualizarIdentidade(eu.conta, usuario);
    pty.atualizarNome(eu.id, usuario);
    ack?.({ eu: jogo.publico(eu), codigo: codigoDe(eu.id) });
    emitirPresenca();
    emitirPlacar();
  });

  /**
   * Sair. A pessoa deixa a sala na hora (libera o nome e sai da contagem do
   * quiz), mas o XP, os critérios e o grupo continuam gravados: se ela voltar
   * com o mesmo nome, encontra tudo no lugar.
   */
  socket.on('sair', (_, ack) => {
    if (!eu) return ack?.({ ok: true });
    eu.presenca = 'desconectado';
    dao.salvarParticipante(eu);
    pty.matarSessao(eu.id);
    const quem = eu.id;
    eu = null;
    socket.leave(`p:${quem}`);
    ack?.({ ok: true });
    emitirPresenca();
    if (estado.cenaId) io.emit('respostas', contagemDeRespostas(estado.cenaId));
  });

  socket.on('grupo:chat', (texto) => {
    if (!eu?.grupo || eu.silenciado) return;
    const msg = { nick: eu.nick, emoji: eu.emoji, texto: String(texto).slice(0, 300), em: Date.now() };
    jogo.grupos.get(eu.grupo).chat.push(msg);
    io.to(`g:${eu.grupo}`).emit('grupo:chat', msg);
  });

  /**
   * Um cartão de comando do chamado. Só roda o que a pessoa pode enviar (o
   * cargo dela ou um cargo sem dono) e só com o chamado aberto. A saída vai
   * para a equipe inteira: é assim que o Relator fica sabendo o PID que o
   * Operador encerrou.
   */
  socket.on('chamado:cartao', async ({ cartaoId, valor } = {}, ack) => {
    if (!eu?.grupo) return ack?.({ erro: 'entre numa equipe primeiro' });
    if (!chamadoAberto()) return ack?.({ erro: 'o chamado não está aberto agora' });
    const g = jogo.grupos.get(eu.grupo);
    const p = prepararCartao({ cartaoId, valor, meuPapel: eu.papel, papeisDaEquipe: g.papeis });
    if (p.erro) return ack?.({ erro: p.erro });

    const jogada = { nick: eu.nick, emoji: eu.emoji, papel: p.cartao.papel, comando: p.exibir ?? p.cartao.comando, em: Date.now() };
    if (p.armadilha) {
      Object.assign(jogada, { ok: false, armadilha: p.armadilha });
    } else {
      // o processo travado é da conta em que nasceu: só nela o kill alcança
      const conta = p.cartao.papel === 'operador' ? contaDoBoss.get(eu.grupo) ?? eu.conta : eu.conta;
      const r = await fila.adicionar(() => amb.rodarComando(conta, p.script, { ...p.env, GRUPO: eu.grupo, DIR_GRUPO: amb.dirDoGrupo(eu.grupo) }));
      Object.assign(jogada, { ok: r.ok, saida: r.saida });
    }
    g.jogadas = [...(g.jogadas ?? []), jogada].slice(-40);
    io.to(`g:${eu.grupo}`).emit('chamado:jogada', jogada);
    ack?.({ ok: true, jogada });
  });
  socket.on('chamado:historico', (_, ack) => ack?.(eu?.grupo ? jogo.grupos.get(eu.grupo)?.jogadas ?? [] : []));

  /** buzzer: a primeira equipe que aperta ganha a vez de responder */
  socket.on('arena:buzz', (_, ack) => {
    if (!eu?.grupo) return ack?.({ erro: 'entre numa equipe primeiro' });
    const entrou = arena.buzinar(eu.grupo, eu.nick);
    ack?.({ ok: entrou });
  });

  /** tentativa da equipe nos jogos de montagem e caça ao erro */
  socket.on('arena:tentar', ({ resposta } = {}, ack) => {
    if (!eu?.grupo) return ack?.({ erro: 'entre numa equipe primeiro' });
    const r = arena.tentar(eu.grupo, eu.nick, resposta);
    if (r?.certo) {
      io.emit('aviso', `equipe ${eu.grupo} acertou em ${r.posicao}º lugar`);
      emitirPlacar();
    }
    ack?.(r);
  });

  /** o apresentador mostra a resposta do jogo para a sala */
  socket.on('host:arena:revelar', soHost((_, ack) => {
    const e = arena.revelarResposta();
    ack?.({ ok: !!e });
  }));

  socket.on('host:arena:julgar', soHost((acertou, ack) => {
    const r = arena.julgar(!!acertou);
    if (r) { emitirPlacar(); io.emit('aviso', acertou ? `equipe ${r.equipe} acertou e levou ${r.xp} XP` : `equipe ${r.equipe} errou, a vez passa`); }
    ack?.(r);
  }));

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
    // o painel controla a sala inteira e aplica gabaritos: por padrão, só no
    // computador do servidor (ver src/server/guarda.mjs)
    const endereco = socket.handshake.address;
    const recusa = podeSerApresentador({ endereco, remotoLiberado: HOST_REMOTO, pinDefinido: !!process.env.PIN_HOST });
    if (recusa) { console.warn('[host] recusado de', endereco, '-', recusa); return ack?.(false); }
    if (!tentarPin(endereco)) return ack?.(false);
    host = pin === PIN_HOST;
    if (host) {
      socket.join('host');
      // só o apresentador recebe os gabaritos, e só depois do PIN
      socket.emit('gabaritos', GABARITOS);
    }
    ack?.(host);
  });

  socket.on('host:ir', soHost(({ cenaIndex, cenaId = null, passo = 0, fase = 'idle', segundos = null, arena: jogoDaArena = null, premios = null }, ack) => {
    // a trava fica aqui, e não só no botão do painel: o "ir para…", o teclado
    // e qualquer outro caminho passam por este evento
    const bloqueio = bloqueioDoAvanco({ deck: DECK, de: estado.cenaIndex, para: cenaIndex, participantes: jogo.participantes.values() });
    if (bloqueio) {
      for (const p of bloqueio.pendentes) io.to(`p:${p.id}`).emit('aviso', 'escolha uma equipe: a apresentação está esperando por você');
      socket.emit('host:bloqueado', bloqueio);
      return ack?.({ bloqueado: bloqueio });
    }
    const maxCenaIndex = Math.max(estado.maxCenaIndex ?? 0, cenaIndex);
    // voltar para a mesma cena não refaz a foto (senão o ganho da rodada some)
    if (cenaId && baseDaCena?.cenaId !== cenaId) { fotografarCena(cenaId); emitirPlacar(); }
    Object.assign(estado, { cenaIndex, maxCenaIndex, cenaId, passo, fase });
    pararTimer(); estado.restante = null;
    // o gabarito vem do servidor, nunca do cliente
    const gab = cenaId ? gabaritoDe(cenaId) : null;
    quizAtual = gab ? { cenaId, ...gab } : null;
    if (segundos && fase === 'aberta') iniciarTimer(segundos);
    if (cenaId === CENA_DO_CHAMADO && fase === 'aberta') iniciarChamado();

    // o chamado começou: tranca as equipes sozinho
    if (cenaId && LABS[cenaId]?.escopo === 'grupo') { /* nunca cai aqui: labs são por slug */ }

    // jogo de equipe nesta cena: abre a rodada; em qualquer outra, fecha
    if (jogoDaArena && fase === 'aberta') arena.abrir(cenaId, jogoDaArena, premios ?? undefined);
    else arena.fechar();

    salvarEstado();
    io.emit('estado', estado);
    if (cenaId) io.emit('respostas', contagemDeRespostas(cenaId));
    ack?.({ ok: true });
  }));
  socket.on('host:passo', soHost((d) => { estado.passo = Math.max(0, estado.passo + d); salvarEstado(); io.emit('estado', estado); }));
  socket.on('host:fase', soHost(({ fase, segundos = null, cenaId = null, arena: jogoDaArena = null, premios = null }) => {
    estado.fase = fase;
    if (cenaId) estado.cenaId = cenaId;
    const gabFase = estado.cenaId ? gabaritoDe(estado.cenaId) : null;
    if (gabFase) quizAtual = { cenaId: estado.cenaId, ...gabFase };
    if (jogoDaArena && fase === 'aberta') arena.abrir(estado.cenaId, jogoDaArena, premios ?? undefined);
    if (fase === 'aberta' && segundos) iniciarTimer(segundos);
    else { pararTimer(); if (fase === 'idle') estado.restante = null; }
    if (fase === 'aberta' && estado.cenaId === CENA_DO_CHAMADO) iniciarChamado();
    salvarEstado();
    io.emit('estado', estado);
    if (estado.cenaId) io.emit('respostas', contagemDeRespostas(estado.cenaId));
  }));

  /** o apresentador pede para revelar; o gabarito sai do servidor */
  socket.on('host:revelar', soHost(({ cenaId } = {}) => {
    const alvo = cenaId ?? estado.cenaId;
    const gab = gabaritoDe(alvo);
    if (gab) revelarQuiz({ cenaId: alvo, ...gab });
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

  // o resultado é calculado ANTES do ack: `ack?.(executar())` nem chama a
  // função quando não há ack, e o evento disparado sem callback não rodava
  socket.on('host:evento', soHost(({ tipo }, ack) => { const r = executarEvento(tipo); ack?.(r); }));

  /** liga ou desliga o sorteio automático de eventos */
  socket.on('host:eventos:auto', soHost((ligado, ack) => {
    estado.eventosAuto = !!ligado;
    salvarEstado();
    agendarEventoAutomatico();
    io.emit('estado', estado);
    ack?.({ ligado: estado.eventosAuto });
  }));

  // ── roleta: só a pessoa da vez gira, escolhe e indica; o apresentador julga ──
  socket.on('roleta:girar', (_, ack) => { const r = passoDaRoleta(() => roleta.girar(eu?.id)); ack?.(r); });
  socket.on('roleta:escolher', (escolha, ack) => { const r = passoDaRoleta(() => roleta.escolher(eu?.id, escolha)); ack?.(r); });
  socket.on('roleta:indicar', (alvo, ack) => { const r = passoDaRoleta(() => roleta.indicar(eu?.id, alvo, ativosDaSala())); ack?.(r); });
  socket.on('host:roleta:julgar', soHost((cumpriu, ack) => { const r = passoDaRoleta(() => roleta.julgar(!!cumpriu, membrosDaEquipeDe)); ack?.(r); }));
  socket.on('host:roleta:cancelar', soHost((_, ack) => { roleta.cancelar(); emitirRoleta(); ack?.({ ok: true }); }));

  /**
   * Expulsar. A pessoa sai da sala na hora: a sessão de terminal morre, ela
   * volta para a tela de entrada com o aviso, e o nome dela é liberado.
   * O XP fica gravado, porque expulsar costuma ser engano de nome ou brincadeira
   * de quem entrou duas vezes, e refazer uma conta no meio do workshop é pior.
   */
  socket.on('host:expulsar', soHost(({ id, motivo = '' }, ack) => {
    const p = jogo.participantes.get(id);
    if (!p) return ack?.({ erro: 'não encontrei essa pessoa' });
    pty.matarSessao(id);
    for (const g of jogo.grupos.values()) { g.membros.delete(id); delete g.papeis[id]; }
    jogo.participantes.delete(id);
    io.to(`p:${id}`).emit('expulso', { motivo: String(motivo).slice(0, 140) });
    ack?.({ ok: true, nick: p.nick });
    emitirPresenca(); emitirPlacar();
    if (estado.cenaId) io.emit('respostas', contagemDeRespostas(estado.cenaId));
  }));

  /** Silenciar só o chat. Serve para resolver bagunça sem tirar a pessoa da aula. */
  socket.on('host:silenciar', soHost(({ id, silenciado = true }, ack) => {
    const p = jogo.participantes.get(id);
    if (!p) return ack?.({ erro: 'não encontrei essa pessoa' });
    p.silenciado = !!silenciado;
    io.to(`p:${id}`).emit('silenciado', p.silenciado);
    ack?.({ ok: true, nick: p.nick, silenciado: p.silenciado });
    emitirPresenca();
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
        codigo: codigoDe(p.id),
        feitos: porDono[p.id] ?? [],
        travado: p.presenca === 'ativo' && estado.fase === 'aberta' && (estado.restante ?? 999) < 120 && (porDono[p.id] ?? []).length === 0,
      })),
      grupos: Object.fromEntries([...jogo.grupos.keys()].map((g) => [g, porDono[`grupo:${g}`] ?? []])),
      sessoes: pty.sessoesAbertas(), fila: fila.tamanho, modo: amb.MODO,
      travas: { ...amb.TRAVAS, tetos: TETOS },
    });
  }));

  socket.on('host:pausar', soHost((v) => { estado.pausado = !!v; salvarEstado(); io.emit('estado', estado); }));
  socket.on('host:aviso', soHost((t) => io.emit('aviso', String(t).slice(0, 200))));
  socket.on('host:aovivo', soHost(() => {
    for (const p of jogo.participantes.values()) p.livre = false;
    io.emit('aovivo'); emitirPresenca();
  }));
  socket.on('host:grupo:criar', soHost(({ nome, cor = '#475569', capacidade = CAPACIDADE_DO_GRUPO }) => {
    if (!jogo.grupos.has(nome)) {
      jogo.grupos.set(nome, { nome, cor, capacidade, membros: new Set(), papeis: {}, chat: [] });
      dao.salvarGrupo({ nome, cor, capacidade });
    }
    emitirPlacar();
  }));
  /** trancar e destrancar as equipes à mão */
  socket.on('host:trancar', soHost((v, ack) => {
    equipesTrancadas = !!v;
    io.emit('equipes', { trancadas: equipesTrancadas });
    ack?.({ trancadas: equipesTrancadas });
  }));

  socket.on('host:grupo:sortear', soHost(() => {
    const ids = [...jogo.participantes.keys()].sort(() => Math.random() - 0.5);
    const nomes = [...jogo.grupos.keys()];
    for (const g of jogo.grupos.values()) { g.membros.clear(); g.papeis = {}; }
    ids.forEach((id, i) => colocarNaEquipe(id, nomes[i % nomes.length]));
    emitirPlacar(); emitirPresenca();
  }));

  /**
   * Põe na equipe só quem está sem. É a saída para a trava do avançar sem
   * desfazer a escolha de quem já escolheu (o sortear redistribui todo mundo).
   * Vale mesmo com as equipes trancadas: trancar impede trocar, não chegar.
   */
  socket.on('host:grupo:completar', soHost((_, ack) => {
    const ids = semEquipe(jogo.participantes.values()).map((p) => p.id);
    const pares = distribuirSemEquipe(jogo.grupos.values(), ids);
    for (const [id, nome] of pares) colocarNaEquipe(id, nome);
    emitirPlacar(); emitirPresenca();
    ack?.({ colocados: pares.length, sobraram: ids.length - pares.length });
  }));
  socket.on('host:boss:semear', soHost(async (_, ack) => { const semeados = await semearChamado(); ack?.({ semeados }); }));
  /**
   * Fechou o navegador: a sessão de apresentação dela encerra na hora (sai da
   * contagem, não trava mais a sala). O XP, os critérios e o grupo ficam
   * guardados no banco, então ao voltar ela cai exatamente onde estava.
   * A sessão de terminal continua viva de propósito: é o estado do Linux dela.
   */
  socket.on('disconnect', () => {
    if (!eu) return;
    if (ouvinteTerm) pty.desligarOuvinte(eu.id, ouvinteTerm);
    eu.presenca = 'desconectado';
    dao.salvarParticipante(eu);
    emitirPresenca();
    if (estado.cenaId) io.emit('respostas', contagemDeRespostas(estado.cenaId));
  });
});

/**
 * Vigia dos terminais.
 *
 * O servidor roda na máquina de quem apresenta, com dezenas de pessoas
 * digitando ao mesmo tempo: travar essa máquina encerra o workshop. As travas
 * de `ulimit` já cuidam de cada processo; aqui olhamos o CONJUNTO de cada
 * sessão e encerramos quem passar do teto, avisando a pessoa.
 */
setInterval(async () => {
  const encerrados = await vistoriar(pty.paraVigia());
  for (const { id, motivo, processos, memoriaMb } of encerrados) {
    const p = jogo.participantes.get(id);
    pty.matarSessao(id);
    io.to(`p:${id}`).emit('terminal:encerrado', { motivo });
    io.to('host').emit('vigia', { id, nick: p?.nick ?? id, motivo, processos, memoriaMb });
    console.warn(`[vigia] sessão de ${p?.nick ?? id} encerrada: ${motivo}`);
  }
}, Number(process.env.ARENA_VIGIA_MS ?? 5000));

/**
 * Quem sumiu sem o navegador avisar (rede caiu, tampa fechada) para de dar
 * sinal: depois de 70s sem batida, sai da contagem. Nunca custa XP.
 */
setInterval(() => {
  const agora = Date.now();
  let mudou = false;
  for (const p of jogo.participantes.values()) {
    if (p.presenca !== 'desconectado' && p.visto && agora - p.visto > 70_000) {
      p.presenca = 'desconectado';
      mudou = true;
    }
  }
  if (mudou) {
    emitirPresenca();
    if (estado.cenaId) io.emit('respostas', contagemDeRespostas(estado.cenaId));
  }
}, 15_000);


app.prepare().then(() => {
  server.listen(port, '0.0.0.0', () => {
    const ip = enderecosDaRede()[0]?.ip ?? 'localhost';
    const l = (t) => console.log('  │ ' + t.padEnd(56) + '│');
    console.log('\n  ┌' + '─'.repeat(57) + '┐');
    l('Linux Day Arena');
    l('');
    l(`participantes   http://${ip}:${port}`);
    l(`projetor        http://localhost:${port}/screen`);
    l(`apresentador    http://localhost:${port}/host   (PIN ${PIN_HOST})`);
    l(`endereço + QR   http://localhost:${port}/ip`);
    l('');
    l(`modo do lab: ${amb.MODO}${amb.MODO === 'local' ? '  (desenvolvimento)' : '  (contas reais)'}`);
    console.log('  └' + '─'.repeat(57) + '┘\n');
  });
});
