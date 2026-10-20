/**
 * Equipes obrigatórias e cartas do chamado.
 *
 * Duas partes:
 *   1. as regras puras de src/server/equipes.mjs, sem servidor;
 *   2. o servidor de verdade: a trava do avançar, o "completar equipes", a
 *      validação das cartas e as cartas sobrevivendo a um reinício (o defeito
 *      que deixava o módulo 6 sem dono de carta nenhum depois de reiniciar).
 *
 * Uso: npm run teste:equipes (precisa do build: npm run build)
 */
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { io } from 'socket.io-client';
import { DECK } from '../src/deck/content.ts';
import { LABS } from '../src/server/labs.mjs';
import {
  bloqueioDoAvanco, distribuirSemEquipe, remontarCartas, cartasDoDeck, cenasDeEscolha, semEquipe,
} from '../src/server/equipes.mjs';

let falhas = 0;
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${msg}${extra ? ` ${extra}` : ''}`);
  if (!cond) falhas++;
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const pedir = (s, ev, dados) => new Promise((r) => s.emit(ev, dados, r));

// ───────────────────────────── regras puras ───────────────────────────────
console.log('▸ regras puras');
const escolhas = cenasDeEscolha(DECK);
const iEquipes = DECK.findIndex((c) => c.id === 'abertura-grupos');
const iCartas = DECK.findIndex((c) => c.id === 'm6-cartas');
ok(escolhas.includes(iEquipes) && escolhas.includes(iCartas), 'a escolha de equipe e a das cartas são cenas de escolha', `(${escolhas})`);

const pessoa = (id, grupo = null, presenca = 'ativo') => ({ id, nick: id, emoji: '🐧', grupo, presenca });
const sala = [pessoa('ana', 'azul'), pessoa('bia'), pessoa('caio', null, 'ocioso'), pessoa('davi', null, 'desconectado')];
ok(semEquipe(sala).map((p) => p.id).join() === 'bia', 'só quem está ativo conta como pendente');

const b1 = bloqueioDoAvanco({ deck: DECK, de: iEquipes, para: iEquipes + 1, participantes: sala });
ok(b1?.cenaId === 'abertura-grupos' && b1.pendentes.length === 1, 'sair da escolha de equipe com alguém sem equipe é bloqueado');
ok(!!bloqueioDoAvanco({ deck: DECK, de: 0, para: iEquipes + 3, participantes: sala }), 'pular por cima da escolha (ir para…) também é bloqueado');
ok(!bloqueioDoAvanco({ deck: DECK, de: 0, para: iEquipes, participantes: sala }), 'chegar NA cena de escolha é livre');
ok(!bloqueioDoAvanco({ deck: DECK, de: iEquipes + 2, para: iEquipes + 3, participantes: sala }), 'avançar entre cenas que não são de escolha é livre');
ok(!bloqueioDoAvanco({ deck: DECK, de: iEquipes + 3, para: 0, participantes: sala }), 'voltar é sempre livre');
ok(!!bloqueioDoAvanco({ deck: DECK, de: iCartas, para: iCartas + 1, participantes: sala }), 'sair da cena das cartas com alguém sem equipe é bloqueado');
ok(!bloqueioDoAvanco({ deck: DECK, de: iEquipes, para: iEquipes + 1, participantes: [pessoa('ana', 'azul')] }), 'com todo mundo em equipe, avança');

const grupos = [
  { nome: 'azul', capacidade: 3, membros: new Set(['x', 'y']) },
  { nome: 'verde', capacidade: 3, membros: new Set() },
  { nome: 'roxo', capacidade: 1, membros: new Set(['z']) },
];
const pares = distribuirSemEquipe(grupos, ['a', 'b', 'c', 'd', 'e']);
ok(pares.map(([, g]) => g).join() === 'verde,verde,azul,verde', 'completar enche a equipe com menos gente e respeita a capacidade', `(${pares.map(([, g]) => g)})`);
ok(pares.length === 4, 'quem não cabe em lugar nenhum fica de fora, sem erro');
// o servidor passa jogo.grupos.values(), um iterador de uma passada só
const doIterador = distribuirSemEquipe(new Map(grupos.map((g) => [g.nome, g])).values(), ['a', 'b']);
ok(doIterador.length === 2, 'completar funciona recebendo um iterador (como o servidor passa)');

const validas = new Set(cartasDoDeck(DECK).map((c) => c.id));
const { porEquipe, soltos } = remontarCartas([
  { id: 'ana', grupo: 'azul', papel: 'investigador' },
  { id: 'bia', grupo: 'azul', papel: 'investigador' },
  { id: 'caio', grupo: 'azul', papel: 'carta-inventada' },
  { id: 'davi', grupo: 'verde', papel: 'investigador' },
  { id: 'eva', grupo: null, papel: 'operador' },
], validas);
ok(porEquipe.get('azul')?.ana === 'investigador' && !porEquipe.get('azul')?.bia, 'carta repetida na equipe fica com quem veio primeiro');
ok(porEquipe.get('verde')?.davi === 'investigador', 'a mesma carta pode existir em equipes diferentes');
ok(soltos.includes('bia') && soltos.includes('caio') && !soltos.includes('eva'), 'carta repetida ou inexistente é solta; quem não tem equipe é ignorado');

// o deck (o que a tela mostra) e o lab (o que o servidor confere) concordam
const cenaBoss = DECK.find((c) => c.id === 'm6-boss');
const doLab = LABS['boss-chamado'].criterios;
ok(cenaBoss.criterios.every((c) => validas.has(c.papel)), 'todo item do chamado no deck tem uma carta válida');
ok(cenaBoss.criterios.every((c) => doLab.find((l) => l.id === c.id)?.papel === c.papel), 'a carta de cada item é a mesma no deck e no lab');
ok(!cenaBoss.criterios.some((c) => /^(Investigador|Operador|Mecânico|Relator):/.test(c.descricao)), 'o texto do item não repete a carta (ela aparece no selo do item)');
ok(!cenaBoss.comandosDoModulo.includes('./deploy.sh') && cenaBoss.comandosDoModulo.includes('./backup.sh'), 'a régua do chamado fala do backup.sh, que é o script do chamado');

// ──────────────────────────── servidor de verdade ─────────────────────────
const PORTA = 3098;
const URL = `http://localhost:${PORTA}`;
const DB = './data/arena-equipes.db';
for (const f of [DB, `${DB}-wal`, `${DB}-shm`]) rmSync(f, { force: true });
rmSync('./data/casas-equipes', { recursive: true, force: true });

let srv = null;
async function subir() {
  srv = spawn('node', ['server.mjs'], {
    env: { ...process.env, PORT: String(PORTA), NODE_ENV: 'production', ARENA_DB: DB, ARENA_CASAS: './data/casas-equipes', ARENA_MODO: 'local' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  srv.stderr.on('data', (d) => { const t = String(d); if (/Error|error/.test(t)) process.stderr.write(`  [srv] ${t}`); });
  return new Promise((r) => {
    const t = setTimeout(() => r(false), 40_000);
    srv.stdout.on('data', (d) => { if (String(d).includes('apresentador')) { clearTimeout(t); r(true); } });
  });
}
async function derrubar() {
  srv.kill('SIGTERM');
  await esperar(600);
  srv.kill('SIGKILL');
}

console.log('▸ subindo o servidor…');
ok(await subir(), 'servidor no ar');

const novo = () => io(URL, { path: '/rt', transports: ['websocket'] });
let host = novo();
const ana = novo();
const bia = novo();
const caio = novo();
await esperar(500);
await pedir(host, 'host:entrar', '1991');
const ra = await pedir(ana, 'entrar', { nick: 'ana', emoji: '🐧' });
const rb = await pedir(bia, 'entrar', { nick: 'bia', emoji: '🦊' });
const rc = await pedir(caio, 'entrar', { nick: 'caio', emoji: '🐢' });

let estado = null;
host.on('estado', (e) => { estado = e; });
let avisosDaBia = [];
bia.on('aviso', (t) => avisosDaBia.push(t));

const ir = (i) => pedir(host, 'host:ir', { cenaIndex: i, cenaId: DECK[i].id, passo: 0, fase: 'idle' });

ok((await ir(iEquipes))?.ok, 'o apresentador chega na cena de equipes');
const r1 = await ir(iEquipes + 1);
ok(!!r1?.bloqueado && r1.bloqueado.pendentes.length === 3, 'sem equipe ninguém passa da escolha', `(${r1?.bloqueado?.pendentes.map((p) => p.nick)})`);
await esperar(200);
ok(estado?.cenaIndex === iEquipes, 'a sala continua na cena de equipes');
ok(avisosDaBia.some((t) => /equipe/.test(t)), 'quem está sem equipe recebe o aviso na própria tela');

await pedir(ana, 'grupo:entrar', 'azul');
await pedir(bia, 'grupo:entrar', 'azul');
const r2 = await ir(iEquipes + 1);
ok(r2?.bloqueado?.pendentes.map((p) => p.nick).join() === 'caio', 'enquanto faltar uma pessoa, continua bloqueado', `(${r2?.bloqueado?.pendentes.map((p) => p.nick)})`);

// quem ficou ocioso (aba esquecida) não segura a sala
caio.emit('batida', { inativoMs: 5 * 60_000 });
await esperar(200);
ok((await ir(iEquipes + 1))?.ok, 'pessoa ociosa não segura a apresentação');
ok((await ir(iEquipes))?.ok, 'voltar para a escolha é livre');
caio.emit('voltei');
await esperar(200);
ok(!!(await ir(iEquipes + 1))?.bloqueado, 'quando ela volta, conta de novo');

// o completar só mexe em quem está sem equipe
let placar = null;
host.on('placar', (p) => { placar = p; });
let grupoDoCaio;
caio.on('grupo', (g) => { grupoDoCaio = g; });
const comp = await pedir(host, 'host:grupo:completar', null);
await esperar(300);
ok(comp.colocados === 1 && !!grupoDoCaio, 'completar equipes coloca quem estava sem', `(caio → ${grupoDoCaio})`);
ok(placar.grupos.find((g) => g.nome === 'azul').membros.length === 2, 'e não tira ninguém da equipe que escolheu');
ok((await ir(iEquipes + 1))?.ok, 'com todo mundo em equipe, a apresentação avança');

// chat da equipe chega a quem foi colocado pelo apresentador
let chatDoCaio = null;
caio.on('grupo:chat', (m) => { chatDoCaio = m; });
const outro = novo();
await pedir(outro, 'entrar', { nick: 'davi', emoji: '🐙' });
await pedir(outro, 'grupo:entrar', grupoDoCaio);
outro.emit('grupo:chat', 'oi equipe');
await esperar(300);
ok(chatDoCaio?.texto === 'oi equipe', 'quem foi colocado pelo apresentador recebe o chat da equipe nova');

const ordens = placar.grupos.map((g) => g.ordem).sort((a, b) => a - b);
ok(ordens.every((o, i) => o === i), 'cada equipe tem uma ordem fixa para a tela de escolha');

// ─────────────────────────────── cartas ───────────────────────────────────
let papelDaBia = 'nada';
bia.on('papel', (p) => { papelDaBia = p; });
ana.emit('grupo:papel', 'investigador');
bia.emit('grupo:papel', 'carta-inventada');
await esperar(300);
ok(papelDaBia === null, 'carta que não existe no deck é recusada');
bia.emit('grupo:papel', 'investigador');
await esperar(300);
ok(papelDaBia === null, 'carta que já tem dono é recusada');
bia.emit('grupo:papel', 'mecanico');
await esperar(300);
const azulAntes = placar.grupos.find((g) => g.nome === 'azul').papeis;
ok(azulAntes[ra.eu.id] === 'investigador' && azulAntes[rb.eu.id] === 'mecanico', 'cada uma fica com a sua carta');

// ───────────────────── reinício: as cartas sobrevivem ─────────────────────
console.log('▸ reiniciando o servidor…');
[host, ana, bia, caio, outro].forEach((s) => s.close());
await derrubar();
ok(await subir(), 'servidor no ar de novo');

host = novo();
const ana2 = novo();
const bia2 = novo();
await esperar(500);
await pedir(host, 'host:entrar', '1991');
placar = null;
host.on('placar', (p) => { placar = p; });
const va = await pedir(ana2, 'entrar', { id: ra.eu.id, nick: 'ana', emoji: '🐧' });
await pedir(bia2, 'entrar', { id: rb.eu.id, nick: 'bia', emoji: '🦊' });
await esperar(300);
ok(va.eu.papel === 'investigador', 'a pessoa volta com a própria carta');
const azulDepois = placar.grupos.find((g) => g.nome === 'azul').papeis;
ok(azulDepois[ra.eu.id] === 'investigador' && azulDepois[rb.eu.id] === 'mecanico', 'e a equipe volta sabendo quem tem cada carta', `(${JSON.stringify(azulDepois)})`);

let papelDaBia2 = 'nada';
bia2.on('papel', (p) => { papelDaBia2 = p; });
bia2.emit('grupo:papel', 'investigador');
await esperar(300);
ok(papelDaBia2 === 'mecanico', 'depois do reinício, a carta de outra pessoa continua recusada');

// a trava da carta vale no chamado: só quem tem a carta entrega o item dela
const sem = await pedir(host, 'host:boss:semear', null);
ok(sem.semeados >= 1, 'chamado semeado');
await pedir(host, 'host:gabarito', { taskSlug: 'boss-chamado' });
await esperar(500);
const doLaudo = await pedir(bia2, 'lab:verificar', { taskSlug: 'boss-chamado', resposta: '' });
const porId = Object.fromEntries(doLaudo.resultados.map((r) => [r.id, r]));
ok(porId['b-c3'].passou, 'a Mecânica entrega o item dela');
ok(porId['b-c2'].passou && porId['b-c4'].passou, 'cartas sem dono (Operador, Relator) qualquer um da equipe entrega');
const respostaFatal = 'permissao negada ao executar backup.sh';
const tentativa = await pedir(bia2, 'lab:verificar', { taskSlug: 'boss-chamado', resposta: respostaFatal });
const c1 = tentativa.resultados.find((r) => r.id === 'b-c1');
ok(!c1.passou && /investigador/.test(c1.mensagem ?? ''), 'o item do Investigador NÃO fecha com outra pessoa, mesmo depois do reinício', `("${c1.mensagem}")`);
const daAna = await pedir(ana2, 'lab:verificar', { taskSlug: 'boss-chamado', resposta: respostaFatal });
ok(daAna.resultados.find((r) => r.id === 'b-c1').passou, 'e fecha com quem tem a carta');

// ───────────────────────────────── fim ────────────────────────────────────
[host, ana2, bia2].forEach((s) => s.close());
await derrubar();

console.log(`\n${falhas === 0 ? '✅ TUDO PASSOU' : `❌ ${falhas} falha(s)`}`);
process.exit(falhas === 0 ? 0 : 1);
