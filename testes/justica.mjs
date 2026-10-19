/**
 * Testes de justiça: as trapaças que alguém vai tentar, e os jogos de equipe.
 *
 * Cada verificação aqui corresponde a uma brecha que existiu de verdade no
 * caminho. Elas não podem voltar sem o teste reclamar.
 *
 * Uso: npm run teste:justica
 */
import { spawn, execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { io } from 'socket.io-client';

const PORTA = 3087;
const URL = `http://localhost:${PORTA}`;
let falhas = 0;
const ok = (c, msg, extra = '') => { console.log(`${c ? '✅' : '❌'} ${msg}${extra ? ` ${extra}` : ''}`); if (!c) falhas++; };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
/**
 * Pede e espera a confirmação, com prazo.
 * Sem o prazo, um handler que esquece de confirmar trava o teste inteiro em
 * silêncio, e foi o que aconteceu com o `grupo:entrar`.
 */
const pedir = (s, ev, dados) => new Promise((r) => {
  const prazo = setTimeout(() => r({ erro: 'sem resposta do servidor' }), 4000);
  s.emit(ev, dados, (x) => { clearTimeout(prazo); r(x); });
});

try { execSync(`lsof -nP -iTCP:${PORTA} -sTCP:LISTEN -t | xargs kill -9`, { stdio: 'ignore' }); } catch { /* vazio */ }
for (const f of ['./data/justica.db', './data/justica.db-wal', './data/justica.db-shm']) rmSync(f, { force: true });
rmSync('./data/casas-justica', { recursive: true, force: true });

const srv = spawn('node', ['server.mjs'], {
  env: {
    ...process.env, PORT: String(PORTA), NODE_ENV: 'production',
    ARENA_DB: './data/justica.db', ARENA_CASAS: './data/casas-justica', ARENA_MODO: 'local',
    ARENA_MAX_TROCAS: '2',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const matar = () => { try { srv.kill('SIGKILL'); } catch { /* já morreu */ } };
process.on('uncaughtException', (e) => { console.error('\n❌', e.message); matar(); process.exit(1); });
srv.stderr.on('data', (d) => { const t = String(d); if (/uncaughtException|ReferenceError/.test(t)) { console.error('  [servidor]', t.slice(0, 160)); falhas++; } });

let subiu = false;
await new Promise((r) => { const t = setTimeout(r, 40_000); srv.stdout.on('data', (d) => { if (String(d).includes('apresentador')) { subiu = true; clearTimeout(t); r(); } }); });
ok(subiu, 'servidor no ar sem quebrar na primeira conexão');
if (!subiu) { matar(); process.exit(1); }

const novo = () => io(URL, { path: '/rt', transports: ['websocket'] });
const host = novo();
const ana = novo();
const bia = novo();
await espera(600);

let gabaritosDoHost = null;
host.on('gabaritos', (g) => { gabaritosDoHost = g; });
await pedir(host, 'host:entrar', '1991');
await espera(400);

const ra = await pedir(ana, 'entrar', { nick: 'Ana', emoji: '🐧' });
const rb = await pedir(bia, 'entrar', { nick: 'Bia', emoji: '🦊' });
await espera(2200);

// ─────────────────────── gabarito fora do navegador ───────────────────────
ok(!!gabaritosDoHost && Object.keys(gabaritosDoHost).length >= 10,
  'o apresentador recebe os gabaritos do servidor', `(${Object.keys(gabaritosDoHost ?? {}).length})`);
let gabaritoVazou = false;
ana.on('gabaritos', () => { gabaritoVazou = true; });
await espera(500);
ok(!gabaritoVazou, 'e o participante NÃO recebe gabarito nenhum');

const conteudo = await import('../src/deck/content.ts');
const temResposta = JSON.stringify(conteudo.DECK).includes('"correta"');
ok(!temResposta, 'o deck que vai para o navegador não carrega nenhuma resposta certa');

// ───────────────────── assumir a conta de outra pessoa ────────────────────
const ladrao = novo();
await espera(300);
const tentativa = await pedir(ladrao, 'entrar', { nick: 'Ana', emoji: '🐼' });
ok(tentativa?.erro === 'nome-em-uso', 'não dá para entrar com o nome de quem já está na sala', `(${tentativa?.erro})`);
ok((tentativa?.sugestoes ?? []).length > 0, 'e a recusa vem com nomes livres para escolher');

// mesmo com o nome livre depois, a conta só volta com o código
const codigoCerto = ra.codigo;
const comCodigoErrado = await pedir(ladrao, 'entrar', { nick: 'Roubador', emoji: '🐼', codigo: 'XXXX' });
ok(comCodigoErrado?.eu?.id !== ra.eu.id, 'código errado não devolve a conta de ninguém');
ok(!!codigoCerto && codigoCerto.length === 4, 'cada pessoa tem um código de retorno de 4 letras', `(${codigoCerto})`);

// ───────────────── placar de equipe não premia trocar de time ─────────────
let placar = null;
host.on('placar', (p) => { placar = p; });
await pedir(ana, 'grupo:entrar', 'azul');
await pedir(bia, 'grupo:entrar', 'verde');
await espera(600);
const azulAntes = placar.grupos.find((g) => g.nome === 'azul');
ok(azulAntes.xp === 0, 'equipe começa com zero XP de equipe, mesmo com gente pontuada', `(xp ${azulAntes.xp}, média ${azulAntes.media})`);

// XP pessoal (evento de resgate) não pode mover o placar de equipes
host.emit('host:evento', { tipo: 'resgate' });
await espera(700);
ok(placar.grupos.find((g) => g.nome === 'azul').xp === 0, 'XP pessoal não entra no placar de equipes');

// ───────────────────── limite de trocas, numa pessoa só ───────────────────
// (pessoa própria para o teste, para não mexer nas equipes da ana e da bia)
const trocador = novo();
await espera(300);
await pedir(trocador, 'entrar', { nick: 'Trocador', emoji: '🦝' });
await espera(1800);
const t1 = await pedir(trocador, 'grupo:entrar', 'roxo');
const t2 = await pedir(trocador, 'grupo:entrar', 'laranja');
const t3 = await pedir(trocador, 'grupo:entrar', 'ciano');
ok(t1?.ok && t2?.ok, 'as primeiras trocas de equipe são livres');
ok(t3?.erro === 'limite-de-trocas', 'depois do limite, não dá mais para trocar de equipe', `(${t3?.erro})`);

// ─────────────────────────── jogos de equipe ──────────────────────────────
let arena = null;
ana.on('arena', (a) => { arena = a; });
host.emit('host:ir', { cenaIndex: 0, cenaId: 'arena-pipeline', passo: 0, fase: 'aberta', segundos: 150, arena: 'montagem', premios: [300, 200, 140, 90] });
await espera(800);
ok(arena?.jogo === 'montagem' && (arena.desafio?.pecas?.length ?? 0) > 0, 'o jogo de montagem abre com as peças vindas do servidor', `(${arena?.desafio?.pecas?.length} peças)`);
ok(!JSON.stringify(arena).includes('"ordem"'), 'e a ordem certa não vem junto');

const erradaM = await pedir(ana, 'arena:tentar', { resposta: ['grep', 'cat'] });
ok(erradaM?.certo === false, 'tentativa errada é recusada e não pontua');
const certaM = await pedir(ana, 'arena:tentar', { resposta: ['cat', 'grep', 'cut', 'sort', 'uniq', 'sortrn', 'head'] });
ok(certaM?.certo === true && certaM.posicao === 1, 'tentativa certa pontua por posição', `(${certaM?.posicao}º, +${certaM?.xp} XP)`);
const repetida = await pedir(ana, 'arena:tentar', { resposta: ['cat', 'grep', 'cut', 'sort', 'uniq', 'sortrn', 'head'] });
ok(!!repetida?.erro, 'a mesma equipe não pontua duas vezes no mesmo jogo', `(${repetida?.erro})`);
await espera(500);
ok((placar.grupos.find((g) => g.nome === 'azul')?.xp ?? 0) >= 300,
  'o XP do jogo vai para o placar da equipe que jogou', `(azul: ${placar.grupos.find((g) => g.nome === 'azul')?.xp} XP)`);
ok((placar.grupos.find((g) => g.nome === 'verde')?.xp ?? 0) === 0,
  'e não vai para as outras equipes');

// caça ao erro
host.emit('host:ir', { cenaIndex: 1, cenaId: 'arena-caca-erro', passo: 0, fase: 'aberta', segundos: 150, arena: 'caca-erro' });
await espera(700);
ok((arena?.desafio?.linhas?.length ?? 0) >= 6, 'a caça ao erro abre com as linhas do servidor', `(${arena?.desafio?.linhas?.length})`);
ok(!JSON.stringify(arena).includes('"erro"'), 'e sem dizer quais são as erradas');
const cacaErrada = await pedir(ana, 'arena:tentar', { resposta: ['l1'] });
ok(cacaErrada?.certo === false, 'marcar a linha errada não pontua');
const cacaCerta = await pedir(ana, 'arena:tentar', { resposta: ['l3', 'l5', 'l8'] });
ok(cacaCerta?.certo === true, 'marcar as três certas pontua', `(${cacaCerta?.detalhe})`);

// buzzer com roubo
host.emit('host:ir', { cenaIndex: 2, cenaId: 'arena-buzzer', passo: 0, fase: 'aberta', segundos: 120, arena: 'buzzer', premios: [250] });
await espera(700);
await pedir(ana, 'arena:buzz');
await pedir(bia, 'arena:buzz');
await espera(400);
ok(arena?.fila?.length === 2, 'as duas equipes entram na fila do buzzer na ordem', `(${arena?.fila?.map((f) => f.equipe).join(' → ')})`);
const errou = await pedir(host, 'host:arena:julgar', false);
await espera(400);
ok(arena?.fila?.[0]?.equipe !== errou?.equipe, 'quem errou perde a vez e a próxima equipe assume');
const acertou = await pedir(host, 'host:arena:julgar', true);
await espera(400);
ok(acertou?.xp === 250 && arena?.resolvido === true, 'quem acerta encerra a rodada e leva o XP', `(${acertou?.equipe})`);
const depoisDeResolvido = await pedir(ana, 'arena:buzz');
ok(depoisDeResolvido?.ok !== true, 'depois de resolvido ninguém mais aperta');

[host, ana, bia, ladrao].forEach((s) => s.close());
matar();
console.log(`\n${falhas === 0 ? '✅ TUDO PASSOU' : `❌ ${falhas} falha(s)`}`);
process.exit(falhas === 0 ? 0 : 1);
