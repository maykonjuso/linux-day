/**
 * Teste de ponta a ponta do fluxo do workshop, contra um servidor de verdade.
 * Sobe o app numa porta separada, conecta clientes socket como participantes e
 * como apresentador, e exercita o caminho inteiro: entrar → quiz → revelação →
 * terminal → lab verificado → dica → reset → grupos → cartas → boss.
 *
 * Uso: npm run teste
 */
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { io } from 'socket.io-client';

const PORTA = 3099;
const URL = `http://localhost:${PORTA}`;
const PIN = '1991';

let falhas = 0;
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${msg}${extra ? ` ${extra}` : ''}`);
  if (!cond) falhas++;
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const pedir = (s, ev, dados) => new Promise((r) => s.emit(ev, dados, r));

// ambiente limpo
rmSync('./data/arena-teste.db', { force: true });
rmSync('./data/arena-teste.db-wal', { force: true });
rmSync('./data/casas-teste', { recursive: true, force: true });

console.log('▸ subindo o servidor…');
const srv = spawn('node', ['server.mjs'], {
  env: {
    ...process.env,
    PORT: String(PORTA),
    NODE_ENV: 'production',
    ARENA_DB: './data/arena-teste.db',
    ARENA_CASAS: './data/casas-teste',
    ARENA_MODO: 'local',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
srv.stderr.on('data', (d) => { const t = String(d); if (/Error|error/.test(t)) process.stderr.write(`  [srv] ${t}`); });

const pronto = await new Promise((r) => {
  const t = setTimeout(() => r(false), 40_000);
  srv.stdout.on('data', (d) => { if (String(d).includes('apresentador')) { clearTimeout(t); r(true); } });
});
ok(pronto, 'servidor no ar');
if (!pronto) { srv.kill(); process.exit(1); }

const novo = () => io(URL, { path: '/rt', transports: ['websocket'] });
const host = novo();
const ana = novo();
const bia = novo();
await esperar(600);

// ─────────────────────────────── entrada ──────────────────────────────────
await pedir(host, 'host:entrar', PIN);
const ra = await pedir(ana, 'entrar', { nick: 'ana', emoji: '🐧' });
const rb = await pedir(bia, 'entrar', { nick: 'bia', emoji: '🦊' });
ok(ra.eu.xp === 20 && rb.eu.xp === 20, 'check-in dá 20 XP para cada');
ok(ra.eu.conta && ra.eu.conta !== rb.eu.conta, 'cada participante recebe uma conta própria', `(${ra.eu.conta} / ${rb.eu.conta})`);
ok(ra.eu.tokens === 3, 'começam com 3 tokens');

console.log('▸ esperando o seed do ambiente…');
await esperar(2500);

// ──────────────────────────────── quiz ────────────────────────────────────
host.emit('host:ir', { cenaIndex: 4, cenaId: 'm0-q1', passo: 0, fase: 'idle' });
await esperar(200);
host.emit('host:fase', { fase: 'aberta', segundos: 20, cenaId: 'm0-q1' });
await esperar(300);
const r1 = await pedir(ana, 'responder', { cenaId: 'm0-q1', alternativa: 'b' });   // correta
const r2 = await pedir(bia, 'responder', { cenaId: 'm0-q1', alternativa: 'a' });   // errada
const r3 = await pedir(ana, 'responder', { cenaId: 'm0-q1', alternativa: 'c' });
ok(r1.ok && r2.ok, 'quiz aceita a primeira resposta de cada um');
ok(!r3.ok, 'quiz recusa a segunda resposta da mesma pessoa', `(${r3.motivo})`);

let placar = null;
host.on('placar', (p) => { placar = p; });
host.emit('host:revelar', { cenaId: 'm0-q1', correta: 'b', xpBase: 40, segundos: 20 });
await esperar(600);
const xpAna = placar.individual.find((p) => p.nick === 'ana').xp;
const xpBia = placar.individual.find((p) => p.nick === 'bia').xp;
ok(xpAna >= 60 && xpAna <= 90, 'acerto vale 40 XP + bônus de velocidade', `(ana: ${xpAna})`);
ok(xpBia === 20, 'errar NÃO tira XP', `(bia: ${xpBia})`);

// ─────────────────────────────── terminal ─────────────────────────────────
let saida = '';
ana.on('term:dados', (d) => { saida += d; });
ana.emit('term:abrir', { cols: 90, rows: 24 });
await esperar(900);
ana.emit('term:entrada', 'echo terminal-vivo\n');
await esperar(900);
ok(saida.includes('terminal-vivo'), 'o terminal é um PTY real e responde');
ana.emit('term:entrada', 'ls -la ~ | head -3\n');
await esperar(700);
ok(/total|bagunca|app/.test(saida), 'o shell abre na casa do participante, com o lab semeado');
const gradeTerm = await pedir(host, 'host:grade', null);
ok(gradeTerm.sessoes >= 1, 'o painel vê a sessão de terminal aberta', `(${gradeTerm.sessoes})`);

// ──────────────────────────── lab verificado ──────────────────────────────
const v0 = await pedir(ana, 'lab:verificar', { taskSlug: 'm2-bagunca' });
ok(v0.resultados.length === 6 && v0.resultados.every((r) => !r.passou), 'lab começa com os 6 critérios abertos');
ok(/mkdir|imagens/.test(v0.resultados[0].mensagem ?? ''), 'a mensagem de falha aponta o próximo passo', `("${v0.resultados[0].mensagem}")`);

// resolve de verdade, pelo terminal, como o participante faria
ana.emit('term:entrada', 'cd ~/bagunca && mkdir -p imagens docs scripts && mv *.png *.jpg imagens/ && mv rascunho.txt docs/notas.md && mv *.txt *.md docs/ && mv *.sh scripts/ && rm -f tmp_* && echo "organizado por ana" > README.md\n');
await esperar(1800);
const v1 = await pedir(ana, 'lab:verificar', { taskSlug: 'm2-bagunca' });
ok(v1.todos, 'depois dos comandos, os 6 critérios passam', `(ganho ${v1.ganho} XP)`);
ok(v1.ganho === 240, 'o lab paga os 240 XP dos 6 critérios', `(${v1.ganho})`);

const v2 = await pedir(ana, 'lab:verificar', { taskSlug: 'm2-bagunca' });
ok(v2.ganho === 0, 'verificar de novo NÃO pontua duas vezes (idempotência)');

// resposta digitada (flag sorteada)
ana.emit('term:entrada', 'cat ~/.arena/flag\n');
await esperar(800);
const flag = (saida.match(/tux-[0-9a-f]{6}/g) ?? []).pop();
ok(!!flag, 'a flag é sorteada por participante', `(${flag})`);
const vf = await pedir(ana, 'lab:verificar', { taskSlug: 'm1-flag', resposta: flag });
ok(vf.todos, 'critério de resposta digitada valida contra a flag da pessoa');
const vfErrado = await pedir(bia, 'lab:verificar', { taskSlug: 'm1-flag', resposta: flag });
ok(!vfErrado.todos, 'a flag da ana NÃO serve para a bia (copiar resposta não funciona)');

// ──────────────────────── dicas, tokens e reset ───────────────────────────
const antes = placar.individual.find((p) => p.nick === 'bia');
const d1 = await pedir(bia, 'lab:dica', { taskSlug: 'm2-bagunca', indice: 0 });
ok(!!d1.dica && d1.custo === 1, 'dica custa token (não XP)', `("${d1.dica?.slice(0, 30)}…")`);
await esperar(300);
const depois = placar.individual.find((p) => p.nick === 'bia');
ok(depois.xp === antes.xp, 'comprar dica não mexe no XP');
ok(depois.tokens === 2, 'comprar dica desconta 1 token', `(${depois.tokens})`);

const xpAntesReset = placar.individual.find((p) => p.nick === 'ana').xp;
const rst = await pedir(ana, 'lab:reset', null);
await esperar(1200);
ok(rst.ok, 'reset do ambiente funciona');
ok(placar.individual.find((p) => p.nick === 'ana').xp === xpAntesReset, 'reset NÃO tira XP');

// ─────────────────────────── grupos e cartas ──────────────────────────────
ana.emit('grupo:entrar', 'azul');
bia.emit('grupo:entrar', 'azul');
await esperar(500);
const azul = placar.grupos.find((g) => g.nome === 'azul');
ok(azul.membros.length === 2, 'duas pessoas no mesmo grupo');
ok(azul.media === Math.round((placar.individual.find((p) => p.nick === 'ana').xp + placar.individual.find((p) => p.nick === 'bia').xp) / 2),
  'placar de grupo é a MÉDIA (time grande não ganha por tamanho)', `(${azul.media} XP)`);

ana.emit('grupo:papel', 'investigador');
bia.emit('grupo:papel', 'investigador');   // já tomada
await esperar(400);
const papeis = Object.values(placar.grupos.find((g) => g.nome === 'azul').papeis);
ok(papeis.filter((p) => p === 'investigador').length === 1, 'carta de função não pode ser assumida por dois');

// ──────────────────────────────── boss ────────────────────────────────────
const semeado = await pedir(host, 'host:boss:semear', null);
ok(semeado.semeados >= 1, 'boss semeado no diretório do grupo', `(${semeado.semeados})`);
const b0 = await pedir(ana, 'lab:verificar', { taskSlug: 'boss-chamado' });
ok(b0.resultados.length === 4, 'boss tem 4 defeitos');
ok(b0.resultados.some((r) => !r.passou), 'o boss começa quebrado (como deveria)');

// ───────────────────── eventos ao vivo e gabarito ─────────────────────────
host.emit('host:evento', { tipo: 'resgate' });
await esperar(500);
ok(placar.individual.every((p) => p.xp > 20), 'evento "resgate" dá XP para os mais atrasados');

const gab = await pedir(host, 'host:gabarito', { taskSlug: 'm3-permissoes' });
ok(gab.aplicados >= 2, 'gabarito em 1 clique é aplicado em todos', `(${gab.aplicados})`);
const v3 = await pedir(bia, 'lab:verificar', { taskSlug: 'm3-permissoes' });
ok(v3.todos, 'depois do gabarito, o lab do M3 passa para quem não terminou');

// ─────────────────────── grade do apresentador ────────────────────────────
const grade = await pedir(host, 'host:grade', null);
ok(grade.pessoas.length === 2 && grade.pessoas.every((p) => Array.isArray(p.feitos)), 'grade pessoas × critérios responde');
ok(typeof grade.fila === 'number' && grade.modo === 'local', 'o painel reporta fila de checkers e modo do lab', `(${grade.modo})`);

// ───────────────────────── reconexão e persistência ───────────────────────
ana.close();
await esperar(400);
const ana2 = novo();
await esperar(400);
const volta = await pedir(ana2, 'entrar', { id: ra.eu.id, nick: 'ana', emoji: '🐧' });
ok(volta.eu.xp > 200, 'quem reconecta recupera o XP inteiro', `(${volta.eu.xp})`);
ok(volta.eu.criterios.length >= 7, 'e recupera os critérios já conquistados', `(${volta.eu.criterios.length})`);
// 3 iniciais + 1 do acerto no quiz + 1 do lab aprovado na primeira submissão
ok(volta.eu.tokens === 5, 'e o saldo de tokens (3 iniciais + 1 do quiz + 1 do lab limpo)', `(${volta.eu.tokens})`);
ok(volta.estado.cenaIndex === 4, 'e cai exatamente na cena em que a sala está');

// ───────────────────────────────── fim ────────────────────────────────────
[host, bia, ana2].forEach((s) => s.close());
srv.kill('SIGTERM');
await esperar(600);
srv.kill('SIGKILL');

console.log(`\n${falhas === 0 ? '✅ TUDO PASSOU' : `❌ ${falhas} falha(s)`}`);
process.exit(falhas === 0 ? 0 : 1);
