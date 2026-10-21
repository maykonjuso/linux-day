/**
 * Teste de estresse com 100 participantes simultâneos.
 *
 * O que este teste mede:
 *   - conexão de 100 sockets em paralelo
 *   - check-in de todas as pessoas (XP inicial, contas únicas)
 *   - entrada de todas em dois grupos (distribuição ~50/50)
 *   - quiz simultâneo: 100 respostas chegando juntas
 *   - revelação do quiz: placar chega para todos
 *   - verificação simultânea de lab (sem terminal, só socket)
 *   - resistência do broadcast: placar depois de 100 pontuações
 *   - reconexão: 10 pessoas fecham e reabrem, XP preservado
 *
 * O que NÃO é testado aqui:
 *   - PTY / terminal real (openssl de 100 processos TTY seria caro e irrelevante
 *     para medir o socket; o e2e.mjs já cobre o terminal)
 *   - chamado com cartões (chamado-e-roleta.mjs cobre)
 *
 * Uso:
 *   npm run build           (precisar ter o Next buildado)
 *   npm run teste:stress
 */
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { io } from 'socket.io-client';

const N = 100;          // participantes simultâneos
const PORTA = 3097;
const URL = `http://localhost:${PORTA}`;
const PIN = '1991';
const EMOJIS = ['🐧', '🦊', '🐻', '🦁', '🐯', '🦅', '🐬', '🦋', '🦉', '🐸'];

let falhas = 0;
let avisos = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) {
    console.log(`  ✅ ${msg}${extra ? ` ${extra}` : ''}`);
  } else {
    console.log(`  ❌ ${msg}${extra ? ` ${extra}` : ''}`);
    falhas++;
  }
};
const aviso = (msg) => { console.log(`  ⚠️  ${msg}`); avisos++; };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const pedir = (s, ev, dados) => new Promise((r) => s.emit(ev, dados, r));

// ─── ambiente limpo ───────────────────────────────────────────────────────────
const DB = './data/arena-stress.db';
for (const f of [DB, `${DB}-wal`, `${DB}-shm`]) rmSync(f, { force: true });
rmSync('./data/casas-stress', { recursive: true, force: true });

// ─── servidor ─────────────────────────────────────────────────────────────────
console.log(`▸ subindo o servidor (${N} participantes)…`);
const srv = spawn('node', ['server.mjs'], {
  env: {
    ...process.env,
    PORT: String(PORTA),
    NODE_ENV: 'production',
    ARENA_DB: DB,
    ARENA_CASAS: './data/casas-stress',
    ARENA_MODO: 'local',
    // desliga a seed de verdade em modo stress: 100 semear() em paralelo
    // travaria o disco por 30s; o que testamos é o socket, não o filesystem
    ARENA_STRESS: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const errosSrv = [];
srv.stderr.on('data', (d) => {
  const t = String(d).trim();
  if (/Error|error|FATAL/i.test(t)) errosSrv.push(t.slice(0, 120));
});

const pronto = await new Promise((r) => {
  const t = setTimeout(() => r(false), 40_000);
  srv.stdout.on('data', (d) => {
    if (String(d).includes('apresentador')) { clearTimeout(t); r(true); }
  });
});
ok(pronto, 'servidor no ar dentro de 40s');
if (!pronto) { srv.kill(); process.exit(1); }

// ─── host ─────────────────────────────────────────────────────────────────────
const novoSocket = () => io(URL, { path: '/rt', transports: ['websocket'] });
const host = novoSocket();
await esperar(300);
await pedir(host, 'host:entrar', PIN);

// ─── 100 participantes entram em paralelo ─────────────────────────────────────
console.log(`\n▸ ${N} check-ins simultâneos…`);
const t0CheckIn = Date.now();

const pessoas = Array.from({ length: N }, (_, i) => novoSocket());
await esperar(500);   // dar tempo aos sockets se conectarem

const entradas = await Promise.all(
  pessoas.map((s, i) => pedir(s, 'entrar', {
    nick: `p${String(i + 1).padStart(3, '0')}`,
    emoji: EMOJIS[i % EMOJIS.length],
  })),
);

const msCheckin = Date.now() - t0CheckIn;
const comXp = entradas.filter((r) => r?.eu?.xp === 20).length;
const ids = entradas.map((r) => r?.eu?.id).filter(Boolean);
const contas = entradas.map((r) => r?.eu?.conta).filter(Boolean);
const contasUnicas = new Set(contas);

ok(comXp === N, `todos os ${N} receberam 20 XP`, `(${comXp}/${N})`);
ok(ids.length === N, `todos os ${N} receberam id`, `(${ids.length}/${N})`);
ok(contasUnicas.size === N, `${N} contas únicas alocadas`, `(${contasUnicas.size})`);
console.log(`  ⏱  check-in em ${msCheckin}ms (${(msCheckin / N).toFixed(1)}ms/pessoa)`);
if (msCheckin > 5000) aviso(`check-in demorou mais de 5s para ${N} pessoas`);

// ─── entra em grupos ──────────────────────────────────────────────────────────
// 10 grupos, 10 pessoas cada = 100 vagas exatas
const NOMES_GRUPOS = ['azul', 'verde', 'vermelho', 'amarelo', 'roxo', 'laranja', 'ciano', 'rosa', 'lima', 'grafite'];
console.log('\n▸ distribuição em grupos…');
const t0Grupo = Date.now();

await Promise.all(pessoas.map((s, i) =>
  pedir(s, 'grupo:entrar', NOMES_GRUPOS[Math.floor(i / 10)]),
));
await esperar(300);

let placarAtual = null;
host.on('placar', (p) => { placarAtual = p; });
// força o host a emitir o placar
host.emit('host:ir', { cenaIndex: 0, cenaId: 'abertura', passo: 0, fase: 'idle' });
await esperar(500);

const msGrupo = Date.now() - t0Grupo;
const comGrupo = placarAtual?.grupos?.reduce((s, g) => s + g.membros.length, 0) ?? 0;
ok(comGrupo === N, `todos os ${N} estão num grupo`, `(${NOMES_GRUPOS.map((n) => { const g = placarAtual?.grupos?.find((x) => x.nome === n); return `${n}:${g?.membros?.length ?? 0}`; }).join(' ')})`);
console.log(`  ⏱  distribuição em ${msGrupo}ms`);

// ─── quiz simultâneo ──────────────────────────────────────────────────────────
console.log('\n▸ quiz simultâneo (100 respostas ao mesmo tempo)…');

host.emit('host:ir', { cenaIndex: 4, cenaId: 'm0-q1', passo: 0, fase: 'idle' });
await esperar(200);
host.emit('host:fase', { fase: 'aberta', segundos: 60, cenaId: 'm0-q1' });
await esperar(300);

// metade acerta (b), metade erra (a)
const t0Quiz = Date.now();
const respostas = await Promise.all(
  pessoas.map((s, i) => pedir(s, 'responder', { cenaId: 'm0-q1', alternativa: i % 2 === 0 ? 'b' : 'a' })),
);
const msQuiz = Date.now() - t0Quiz;
const aceitas = respostas.filter((r) => r?.ok).length;
ok(aceitas === N, `todas as ${N} respostas foram aceitas pelo servidor`, `(${aceitas}/${N})`);
console.log(`  ⏱  ${N} respostas em ${msQuiz}ms (${(msQuiz / N).toFixed(1)}ms/resposta)`);
if (msQuiz > 3000) aviso(`quiz demorou mais de 3s para ${N} respostas`);

// revelação
host.emit('host:revelar', { cenaId: 'm0-q1', correta: 'b', xpBase: 40, segundos: 60 });
await esperar(1000);

// valida que o placar reflete os XP de quem acertou (aguarda o placar atualizar)
await esperar(800);
const xps = placarAtual?.individual?.map((p) => p.xp) ?? [];
const acertaram = xps.filter((x) => x > 20).length;   // acerto = 20 + bônus ≥ 40
ok(acertaram >= Math.floor(N / 2) - 2 && acertaram <= Math.ceil(N / 2) + 2,
  `metade (~${acertaram}) pontua acima de 20 XP`, `(esperado ~${Math.ceil(N / 2)})`);

// ─── broadcast de placar com 100 pessoas ──────────────────────────────────────
console.log('\n▸ broadcast de placar (tamanho com 100 participantes)…');

// registra os ouvintes ANTES de disparar o broadcast (evita corrida)
let recebeuPlacar = 0;
const promessasPlacar = pessoas.map((s) =>
  new Promise((r) => { s.once('placar', () => { recebeuPlacar++; r(); }); }),
);

const t0Placar = Date.now();
// dispara um novo broadcast sem ser um quiz (quiz já encerrou)
host.emit('host:ir', { cenaIndex: 1, cenaId: 'apresentacao', passo: 0, fase: 'idle' });
await Promise.race([Promise.all(promessasPlacar), esperar(6000)]);
const msPlacar = Date.now() - t0Placar;
ok(recebeuPlacar === N, `placar chegou para todos os ${N}`, `(${recebeuPlacar}/${N})`);
console.log(`  ⏱  broadcast para ${N} em ${msPlacar}ms`);
if (msPlacar > 3000) aviso(`broadcast demorou mais de 3s para ${N} pessoas`);

// ─── verificação de lab simultânea ────────────────────────────────────────────
console.log('\n▸ verificação de lab simultânea (100 ao mesmo tempo)…');
const t0Lab = Date.now();
const verificacoes = await Promise.all(
  pessoas.map((s) => pedir(s, 'lab:verificar', { taskSlug: 'm1-flag', resposta: 'xpto' })),
);
const msLab = Date.now() - t0Lab;
const responderam = verificacoes.filter((r) => Array.isArray(r?.resultados)).length;
ok(responderam === N, `todos os ${N} receberam resultado do lab`, `(${responderam}/${N})`);
console.log(`  ⏱  ${N} verificações em ${msLab}ms (${(msLab / N).toFixed(1)}ms/verificação)`);
if (msLab > 5000) aviso(`verificações demoraram mais de 5s para ${N} pessoas`);

// ─── reconexão de 10 pessoas ──────────────────────────────────────────────────
console.log('\n▸ reconexão (10 pessoas fecham e reabrem)…');
const dezPrimeiros = pessoas.slice(0, 10);
const dezIds = entradas.slice(0, 10).map((r) => ({ ...r.eu, segredo: r.segredo }));

dezPrimeiros.forEach((s) => s.close());
await esperar(500);

const reconectados = dezPrimeiros.map(() => novoSocket());
await esperar(500);

const voltas = await Promise.all(
  reconectados.map((s, i) =>
    pedir(s, 'entrar', { id: dezIds[i].id, segredo: dezIds[i].segredo, nick: dezIds[i].nick, emoji: dezIds[i].emoji }),
  ),
);
const voltaComXp = voltas.filter((r) => r?.eu?.xp >= 20).length;
ok(voltaComXp === 10, '10 reconectados recuperaram o XP', `(${voltaComXp}/10)`);
const voltaComConta = voltas.filter((r) => r?.eu?.conta).length;
ok(voltaComConta === 10, '10 reconectados têm conta alocada', `(${voltaComConta}/10)`);

// ─── erros do servidor ────────────────────────────────────────────────────────
ok(errosSrv.length === 0, 'nenhum erro no stderr do servidor durante o teste',
  errosSrv.length ? `(${errosSrv.length} erro(s): ${errosSrv[0]})` : '');

// ─── resumo ───────────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────');
console.log(`  participantes: ${N}`);
console.log(`  check-in:      ${msCheckin}ms total · ${(msCheckin / N).toFixed(1)}ms/p`);
console.log(`  quiz:          ${msQuiz}ms para ${N} respostas`);
console.log(`  broadcast:     ${msPlacar}ms para ${N} sockets`);
console.log(`  lab:           ${msLab}ms para ${N} verificações`);
if (avisos > 0) console.log(`  ⚠️  ${avisos} aviso(s) de desempenho`);
console.log('────────────────────────────────────────────────');

// ─── limpeza ──────────────────────────────────────────────────────────────────
[host, ...pessoas, ...reconectados].forEach((s) => { try { s.close(); } catch { } });
srv.kill('SIGTERM');
await esperar(600);
srv.kill('SIGKILL');

console.log(`\n${falhas === 0 ? '✅ TUDO PASSOU' : `❌ ${falhas} falha(s)`}${avisos > 0 ? ` · ${avisos} aviso(s)` : ''}`);
process.exit(falhas === 0 ? 0 : 1);
