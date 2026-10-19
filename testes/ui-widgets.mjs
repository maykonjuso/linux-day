/**
 * Varredura de TODOS os widgets e dos controles que o teste principal não
 * toca. Cada widget é jogado até o fim, como um participante faria, e o teste
 * confere que ele conclui e paga XP. Depois vêm os controles soltos: gaveta do
 * terminal, consulta, resetar, pedir ajuda, placar, recarregar a página e dois
 * quizzes em sequência.
 *
 * O estado da apresentação é dirigido por socket (como se fosse o
 * apresentador), e as asserções são feitas no navegador.
 */
import { spawn, execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { chromium } from 'playwright';
import { io } from 'socket.io-client';

const PORTA = 3096;
const URL = `http://localhost:${PORTA}`;
let falhas = 0;
const ok = (c, msg, extra = '') => { console.log(`${c ? '✅' : '❌'} ${msg}${extra ? ` ${extra}` : ''}`); if (!c) falhas++; };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

try { execSync(`lsof -nP -iTCP:${PORTA} -sTCP:LISTEN -t | xargs kill -9`, { stdio: 'ignore' }); } catch { /* vazio */ }
for (const f of ['./data/arena-w.db', './data/arena-w.db-wal', './data/arena-w.db-shm']) rmSync(f, { force: true });
rmSync('./data/casas-w', { recursive: true, force: true });

const srv = spawn('node', ['server.mjs'], {
  env: { ...process.env, PORT: String(PORTA), NODE_ENV: 'production', ARENA_DB: './data/arena-w.db', ARENA_CASAS: './data/casas-w', ARENA_MODO: 'local' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const matar = () => { try { srv.kill('SIGKILL'); } catch { /* já morreu */ } };
process.on('uncaughtException', (e) => { console.error('\n❌ erro no teste:', e.message); matar(); process.exit(1); });
process.on('unhandledRejection', (e) => { console.error('\n❌ erro no teste:', e); matar(); process.exit(1); });
await new Promise((r) => { const t = setTimeout(r, 40_000); srv.stdout.on('data', (d) => { if (String(d).includes('apresentador')) { clearTimeout(t); r(); } }); });

// o deck, para saber o índice de cada cena
const { DECK } = await import('../src/deck/content.ts');
const indiceDe = (id) => DECK.findIndex((c) => c.id === id);

const host = io(URL, { path: '/rt', transports: ['websocket'] });
await dormir(400);
await new Promise((r) => host.emit('host:entrar', '1991', r));

const navegador = await chromium.launch();
const erros = [];
const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 } });
const pg = await ctx.newPage();
pg.on('pageerror', (e) => erros.push(e.message));
pg.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) erros.push(m.text()); });
await pg.goto(URL);
await pg.fill('input[placeholder="seu nome"]', 'ana');
await pg.getByRole('button', { name: /^entrar$/ }).click();
await dormir(1500);

const xp = async () => Number(((await pg.locator('.controles .btn-icone', { hasText: /XP/ }).first().textContent()) ?? '0').replace(/\D/g, ''));

async function irPara(id) {
  const i = indiceDe(id);
  const c = DECK[i];
  const interativa = ['QuizScene', 'WidgetScene', 'LabScene'].includes(c.tipo);
  host.emit('host:ir', { cenaIndex: i, cenaId: id, passo: 0, fase: interativa ? 'aberta' : 'idle', segundos: interativa ? (c.segundos ?? null) : null });
  await dormir(700);
}

/** clica nas opções até acertar, e segue para a rodada seguinte; repete N vezes */
async function jogarEscolhas(rodadas) {
  for (let r = 0; r < rodadas; r++) {
    let acertou = false;
    for (let tentativa = 0; tentativa < 5 && !acertou; tentativa++) {
      const opcoes = pg.locator('.alt');
      const n = await opcoes.count();
      if (!n) break;
      await opcoes.nth(tentativa % n).click();
      await dormir(220);
      const seguir = pg.locator('button', { hasText: /^(próxima|concluir|continuar)$/ });
      if (await seguir.count()) { await seguir.first().click(); acertou = true; await dormir(260); }
      else { const retry = pg.locator('button', { hasText: 'tentar de novo' }); if (await retry.count()) await retry.first().click(); await dormir(160); }
    }
    if (!acertou) return false;
  }
  return true;
}

console.log('\n── os 9 widgets ──');

// 1 · escape-room
let antes = await xp();
await irPara('m1-fuga-widget');
ok(await jogarEscolhas(3), 'escape-room: três rodadas jogáveis até o fim');
await dormir(600);
ok(await xp() > antes, 'escape-room paga XP', `(${antes} → ${await xp()})`);

// 2 · path-quiz
antes = await xp();
await irPara('m1-widget');
ok(await jogarEscolhas(3), 'path-quiz: três rodadas jogáveis');
await dormir(600);
ok(await xp() > antes, 'path-quiz paga XP');

// 3 · spot-the-danger
antes = await xp();
await irPara('m2-perigo');
ok(await jogarEscolhas(2), 'spot-the-danger: duas rodadas jogáveis');
await dormir(600);
ok(await xp() > antes, 'spot-the-danger paga XP');

// 4 · fs-dragdrop
antes = await xp();
await irPara('m2-widget');
const pastaDe = (nome) => /\.(png|jpg)$/.test(nome) ? 'imagens' : /^tmp_/.test(nome) ? 'lixeira' : /\.sh$/.test(nome) ? 'scripts' : 'docs';
for (let i = 0; i < 14; i++) {
  const soltos = pg.locator('[data-arquivo]');
  if (!(await soltos.count())) break;
  const nome = await soltos.first().getAttribute('data-arquivo');
  await soltos.first().click();
  await pg.locator(`[data-pasta="${pastaDe(nome)}"]`).click();
  await dormir(140);
}
const ponte = pg.locator('.cartao', { hasText: 'você acabou de executar isto' });
ok(await ponte.count() > 0, 'fs-dragdrop: arrastar tudo mostra os comandos mv equivalentes');
if (await ponte.count()) { await pg.getByRole('button', { name: /agora no teclado/ }).click(); await dormir(500); }
ok(await xp() > antes, 'fs-dragdrop paga XP');

// 5 · permission-toggles
antes = await xp();
await irPara('m3-widget');
const numeroAtual = async () => (((await pg.locator('.term').first().textContent()) ?? '').match(/\d{3}/) ?? ['000'])[0];
const bits = pg.locator('button').filter({ hasText: /^[rwx]$/ });
for (const alvo of ['700', '644', '755']) {
  for (let volta = 0; volta < 12; volta++) {
    const atual = await numeroAtual();
    if (atual === alvo) break;
    for (let q = 0; q < 3; q++) {
      const quero = Number(alvo[q]);
      const tenho = Number(atual[q]);
      for (const [bit, peso] of [[0, 4], [1, 2], [2, 1]]) {
        if (((quero & peso) !== 0) !== ((tenho & peso) !== 0)) await bits.nth(q * 3 + bit).click();
      }
    }
    await dormir(150);
  }
  const seguir = pg.locator('button', { hasText: /^(próximo|concluir)$/ });
  ok(await seguir.count() > 0, `permission-toggles: desafio ${alvo} reconhecido`, `(mostrando ${await numeroAtual()})`);
  if (await seguir.count()) { await seguir.first().click(); await dormir(300); }
}
await dormir(500);
ok(await xp() > antes, 'permission-toggles paga XP');

// 6 · pipe-builder
antes = await xp();
await irPara('m4-widget');
for (const peca of ['grep', 'cut', 'sort', 'uniq', 'sortrn', 'head']) {
  await pg.locator(`[data-peca="${peca}"]`).click();
  await dormir(170);
}
const certo = pg.locator('.cartao', { hasText: 'é esse o top 3' });
ok(await certo.count() > 0, 'pipe-builder: a ordem correta é reconhecida e mostra a saída final');
if (await certo.count()) { await pg.getByRole('button', { name: 'concluir' }).click(); await dormir(500); }
ok(await xp() > antes, 'pipe-builder paga XP');

// 7 · predict-output
antes = await xp();
await irPara('m5-prever');
ok(await jogarEscolhas(3), 'predict-output: três rodadas jogáveis');
await dormir(500);
ok(await xp() > antes, 'predict-output paga XP');

// 8 · command-builder
antes = await xp();
await irPara('m5-builder');
for (const peca of ['sudo', 'apt', 'install', '-y', 'htop']) {
  await pg.locator('button').filter({ hasText: new RegExp(`^${peca}`) }).first().click();
  await dormir(160);
}
ok((await pg.locator('.cartao', { hasText: 'é exatamente isso' }).count()) > 0, 'command-builder: a ordem certa é reconhecida');
await pg.getByRole('button', { name: 'concluir' }).click();
await dormir(500);
ok(await xp() > antes, 'command-builder paga XP');

// 9 · error-match
antes = await xp();
await irPara('pre-boss-erros');
ok(await jogarEscolhas(3), 'error-match: três rodadas jogáveis');
await dormir(500);
ok(await xp() > antes, 'error-match paga XP');

console.log('\n── controles do participante ──');

// dois quizzes em sequência (a trava da resposta precisa soltar na próxima)
await irPara('m0-q1');
await pg.locator('.alt').nth(1).click();
await dormir(300);
host.emit('host:revelar', { cenaId: 'm0-q1', correta: 'b', xpBase: 40, segundos: 20 });
await dormir(500);
await irPara('m0-q2');
ok(await pg.locator('.alt').first().isEnabled(), 'na pergunta seguinte as alternativas destravam');
await pg.locator('.alt').first().click();
await dormir(400);
ok(await pg.locator('.chip', { hasText: /resposta enviada/ }).count() > 0, 'e aceita a nova resposta');

// cena de placar
await irPara('fim-placar');
ok((await pg.locator('.cartao', { hasText: 'ana' }).count()) > 0, 'a cena de placar lista os participantes');

// consulta (tecla ?) — precisa de uma cena de lab para ter o que consultar
await irPara('m2-lab');
await dormir(2200);
await pg.locator('.cena').click({ position: { x: 5, y: 5 } });   // tira o foco do terminal
await pg.keyboard.press('?');
await dormir(500);
const consultaAberta = () => pg.locator('button', { hasText: 'fechar (Esc)' }).count();
ok((await consultaAberta()) > 0, 'a tecla ? abre a consulta');
await pg.keyboard.press('Escape');
await dormir(300);
ok((await consultaAberta()) === 0, 'e Esc fecha');

// botão de consultar na barra
await pg.locator('button[title*="comandos, glossário"]').click();
await dormir(400);
ok((await consultaAberta()) > 0, 'o botão consultar também abre');
// as três abas da consulta
for (const [rotulo, procura] of [['comandos por situação', /Onde eu estou/], ['palavras difíceis', /kernel/]]) {
  await pg.locator('button', { hasText: rotulo }).click();
  await dormir(300);
  ok((await pg.locator('body').textContent())?.match(procura) !== null, `a aba "${rotulo}" mostra conteúdo`);
}
await pg.keyboard.press('Escape');

// pedir ajuda
let pediuAjuda = false;
host.on('ajuda', () => { pediuAjuda = true; });
await pg.getByRole('button', { name: /Ajuda/ }).click();
await dormir(500);
ok(pediuAjuda, 'o botão de pedir ajuda chega no painel do apresentador');

// me perdi (pulso anônimo)
let pulso = false;
host.on('pulso', () => { pulso = true; });
await pg.locator('button[title*="avisa o monitor"]').click();
await dormir(400);
ok(pulso, 'o botão "me perdi" chega no painel, sem custar nada');

// resetar ambiente
const xpAntesReset = await xp();
await pg.getByRole('button', { name: /Começar de novo/ }).click();
await dormir(2500);
ok((await pg.locator('.chip', { hasText: /ambiente novo|resetando/ }).count()) > 0, 'o botão de começar de novo confirma na tela');
ok(await xp() === xpAntesReset, 'resetar não tira XP');

// terminal na gaveta, fora do lab
await irPara('m1-arvore');
await dormir(400);
await pg.locator('button[title*="abrir o terminal"]').click();
await dormir(600);
ok(await pg.locator('.xterm').isVisible(), 'a gaveta do terminal abre fora das cenas de lab');

// recarregar a página no meio do workshop
const xpAntesF5 = await xp();
await pg.reload({ waitUntil: 'domcontentloaded' });
await dormir(2000);
ok((await pg.locator('.controles').count()) > 0, 'depois do F5 a pessoa volta direto, sem reentrar');
ok(await xp() === xpAntesF5, 'e com o XP intacto', `(${xpAntesF5})`);
ok((await pg.locator('.titulo').first().textContent())?.length > 0, 'e na cena em que a sala está');

ok(erros.length === 0, 'nenhum erro de JavaScript', erros.length ? `\n   ${erros.slice(0, 5).join('\n   ')}` : '');

await navegador.close();
host.close();
matar();
console.log(`\n${falhas === 0 ? '✅ TUDO PASSOU' : `❌ ${falhas} falha(s)`}`);
process.exit(falhas === 0 ? 0 : 1);
