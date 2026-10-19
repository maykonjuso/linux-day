/**
 * Varredura do deck inteiro, cena por cena, nas três telas.
 *
 * Para cada cena do deck verifica:
 *   - avançar realmente sai da cena (nenhum passo "engole" o clique)
 *   - o participante e o projetor mostram a mesma coisa
 *   - nada é cortado: ou cabe na tela, ou rola (nunca conteúdo invisível)
 *   - nenhum erro de JavaScript
 *
 * É o teste que pega "bug ao passar o slide" e "está cortando conteúdo".
 */
import { spawn, execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { chromium } from 'playwright';
import { io } from 'socket.io-client';

const PORTA = 3093;
const URL = `http://localhost:${PORTA}`;
let falhas = 0;
const ok = (c, msg, extra = '') => { console.log(`${c ? '✅' : '❌'} ${msg}${extra ? ` ${extra}` : ''}`); if (!c) falhas++; };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

try { execSync(`lsof -nP -iTCP:${PORTA} -sTCP:LISTEN -t | xargs kill -9`, { stdio: 'ignore' }); } catch { /* vazio */ }
for (const f of ['./data/arena-d.db', './data/arena-d.db-wal', './data/arena-d.db-shm']) rmSync(f, { force: true });
rmSync('./data/casas-d', { recursive: true, force: true });

const srv = spawn('node', ['server.mjs'], {
  env: { ...process.env, PORT: String(PORTA), NODE_ENV: 'production', ARENA_DB: './data/arena-d.db', ARENA_CASAS: './data/casas-d', ARENA_MODO: 'local' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const matar = () => { try { srv.kill('SIGKILL'); } catch { /* vazio */ } };
process.on('uncaughtException', (e) => { console.error('\n❌', e.message); matar(); process.exit(1); });
let subiu = false;
srv.stderr.on('data', (d) => { if (/EADDRINUSE/.test(String(d))) console.error(`  ⚠ porta ${PORTA} ocupada por um servidor antigo`); });
await new Promise((r) => { const t = setTimeout(r, 40_000); srv.stdout.on('data', (d) => { if (String(d).includes('apresentador')) { subiu = true; clearTimeout(t); r(); } }); });
ok(subiu, 'servidor no ar (processo novo, estado limpo)');
if (!subiu) { matar(); process.exit(1); }

const { DECK } = await import('../src/deck/content.ts');
const host = io(URL, { path: '/rt', transports: ['websocket'] });
await dormir(400);
await new Promise((r) => host.emit('host:entrar', '1991', r));

const navegador = await chromium.launch();
const erros = [];
const telas = {};
for (const [nome, rota, tamanho] of [
  ['participante', '/', { width: 1280, height: 800 }],
  ['projetor', '/screen', { width: 1920, height: 1080 }],
  ['celular', '/', { width: 390, height: 844 }],
]) {
  const ctx = await navegador.newContext({ viewport: tamanho });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => erros.push(`${nome}: ${e.message}`));
  pg.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) erros.push(`${nome}: ${m.text()}`); });
  await pg.goto(URL + rota, { waitUntil: 'domcontentloaded' });
  if (rota === '/') {
    await pg.fill('input[placeholder="seu nome"]', nome === 'celular' ? 'bia' : 'ana');
    await pg.getByRole('button', { name: /^entrar$/ }).click();
    await dormir(900);
  }
  telas[nome] = pg;
}
await dormir(1200);

/** a cena cabe na tela, ou rola? (cortar é o que não pode) */
/**
 * A cena CABE? Rolar não conta como caber: numa apresentação ninguém rola o
 * projetor, e o que está embaixo não existe para a turma. Também checamos a
 * escala aplicada pelo encaixe automático: abaixo de 0,7 a letra fica pequena
 * demais para a última fileira.
 */
async function medir(pg) {
  return pg.evaluate(() => {
    const caixa = document.querySelector('[data-encaixe]');
    const c = document.querySelector('.cena');
    if (!c || !caixa) return null;
    const conteudo = caixa.firstElementChild;
    const escala = Number((getComputedStyle(conteudo).transform.match(/matrix\(([-\d.]+)/) ?? [0, 1])[1]);
    const precisaRolar = caixa.scrollHeight - caixa.clientHeight > 4;
    const titulo = c.querySelector('.titulo, .olho');
    const r = titulo?.getBoundingClientRect();
    return {
      precisaRolar,
      escala: Number.isFinite(escala) ? escala : 1,
      tituloVisivel: !!r && r.top >= -2 && r.bottom <= window.innerHeight + 2,
      largura: c.scrollWidth - c.clientWidth,
    };
  });
}

const cortadas = [];
const semAvancar = [];
const divergentes = [];

for (let i = 0; i < DECK.length; i++) {
  const c = DECK[i];
  // mede a cena já liberada (o estado mais cheio: opções, exercício, terminal)
  const interativa = ['QuizScene', 'WidgetScene', 'LabScene', 'ArenaScene'].includes(c.tipo);
  host.emit('host:ir', {
    cenaIndex: i, cenaId: c.id, passo: 0,
    fase: interativa ? 'aberta' : 'idle',
    segundos: interativa ? (c.segundos ?? null) : null,
    arena: c.tipo === 'ArenaScene' ? c.jogo : null, premios: c.premios ?? null,
  });
  await dormir(c.tipo === 'LabScene' ? 900 : 420);

  // percorre todos os passos internos da cena
  for (let passo = 1; passo < c.passos; passo++) {
    host.emit('host:passo', 1);
    await dormir(200);
  }

  for (const [nome, pg] of Object.entries(telas)) {
    const m = await medir(pg);
    if (!m) { cortadas.push(`${c.id} (${nome}: sem cena)`); continue; }
    // No celular, laboratório, equipes, exercícios e jogos rolam de propósito:
    // o terminal e os painéis não cabem numa tela de 390px, e lá a pessoa rola
    // com o dedo sem estranhar. O que não pode rolar é o projetor e o notebook.
    const rolarTolerado = nome === 'celular' && ['LabScene', 'GroupScene', 'WidgetScene', 'ArenaScene', 'Controles', 'Recap'].includes(c.tipo);
    if (m.precisaRolar && !rolarTolerado) cortadas.push(`${c.id} (${nome}: precisa rolar)`);
    if (m.escala < (nome === 'celular' ? 0.62 : 0.72)) cortadas.push(`${c.id} (${nome}: encolheu para ${m.escala})`);
    if (!m.tituloVisivel) cortadas.push(`${c.id} (${nome}: título fora da tela)`);
    if (m.largura > 4) cortadas.push(`${c.id} (${nome}: ${m.largura}px de corte lateral)`);
  }

    // o projetor não tem barra de status: conferimos que ela não voltou
  if ((await telas.projetor.locator('.controles, .barra').count()) > 0) {
    cortadas.push(`${c.id} (projetor: barra de status na tela do projetor)`);
  }

  // marcação crua na tela: **negrito** ou `código` aparecendo literalmente
  // significa que algum texto não passou pelo componente Texto
  const cru = await telas.participante.evaluate(() => {
    const t = document.querySelector('.cena')?.textContent ?? '';
    const achados = [];
    if (/\*\*[^*]+\*\*/.test(t)) achados.push('**negrito**');
    if (/`[^`]+`/.test(t)) achados.push('`código`');
    return achados;
  });
  for (const marca of cru) cortadas.push(`${c.id}: marcação crua na tela (${marca})`);

  // ilustrações: arquivo faltando aparece como imagem quebrada no projetor
  const ilustracoes = await telas.participante.evaluate(() =>
    [...document.querySelectorAll('img[src^="/ilustra/"]')].map((i) => ({
      src: i.getAttribute('src'),
      carregou: i.complete && i.naturalWidth > 0,
    })));
  for (const il of ilustracoes) {
    if (!il.carregou) cortadas.push(`${c.id}: ilustração não carregou (${il.src})`);
  }
  if (['ModuleCover', 'MentalModel', 'QuizScene'].includes(c.tipo) && ilustracoes.length === 0) {
    cortadas.push(`${c.id}: cena sem ilustração`);
  }

  const tParticipante = (await telas.participante.locator('.cena .titulo, .cena .olho').first().textContent())?.trim();
  const tProjetor = (await telas.projetor.locator('.cena .titulo, .cena .olho').first().textContent())?.trim();
  if (tParticipante !== tProjetor) divergentes.push(`${c.id} ("${tParticipante}" × "${tProjetor}")`);
}

ok(cortadas.length === 0, `nenhuma das ${DECK.length} cenas corta conteúdo`,
  cortadas.length ? `\n   ${cortadas.slice(0, 14).join('\n   ')}${cortadas.length > 14 ? `\n   … e mais ${cortadas.length - 14}` : ''}` : '');
ok(divergentes.length === 0, 'participante e projetor sempre mostram a mesma cena',
  divergentes.length ? `\n   ${divergentes.slice(0, 8).join('\n   ')}` : '');

// ── avançar: percorre o deck inteiro só com o botão, como no evento ──
const hostPg = await (await navegador.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
hostPg.on('pageerror', (e) => erros.push(`host: ${e.message}`));
await hostPg.goto(URL + '/host');
await hostPg.fill('input[placeholder="PIN"]', '1991');
await hostPg.getByRole('button', { name: 'entrar' }).click();
await dormir(700);
await hostPg.locator('select').first().selectOption({ label: 'módulo 0' });
await dormir(500);

const indice = async () => Number(((await hostPg.locator('.estado-faixa .chip', { hasText: /^cena / }).textContent()) ?? '').match(/\d+/)?.[0] ?? 0);
let travadas = 0;
for (let n = 0; n < DECK.length + 40; n++) {
  const antes = await indice();
  const cenaAtual = DECK[antes - 1];
  // uma cena pode consumir vários cliques de propósito: os passos internos
  // (linhas do terminal demonstrado); no quiz, liberar as opções, revelar e o
  // pódio; nas outras cenas em que a turma age, liberar e o pódio
  const extra = cenaAtual?.tipo === 'QuizScene' ? 3
    : ['WidgetScene', 'LabScene', 'ArenaScene'].includes(cenaAtual?.tipo) ? 2 : 0;
  const cliquesEsperados = (cenaAtual?.passos ?? 1) + extra + 1;
  let mudou = false;
  for (let k = 0; k < cliquesEsperados && !mudou; k++) {
    await hostPg.locator('button[title*="avançar"]').click();
    await dormir(240);
    mudou = (await indice()) !== antes;
  }
  if (!mudou) { travadas++; semAvancar.push(cenaAtual?.id ?? `cena ${antes}`); break; }
  if (await indice() >= DECK.length) break;
}
ok(travadas === 0, 'o botão avançar nunca empaca numa cena',
  semAvancar.length ? `\n   travou em: ${[...new Set(semAvancar)].slice(0, 8).join(', ')}` : '');
ok(await indice() >= DECK.length - 1, 'o deck inteiro é percorrido até o fim só com o avançar', `(parou em ${await indice()}/${DECK.length})`);

// ── voltar ──
for (let i = 0; i < 5; i++) { await hostPg.locator('button[title*="cena anterior"]').click(); await dormir(260); }
ok(await indice() < DECK.length - 1, 'o botão ◀ volta cenas de verdade', `(voltou para ${await indice()})`);

ok(erros.length === 0, 'nenhum erro de JavaScript em nenhuma tela',
  erros.length ? `\n   ${[...new Set(erros)].slice(0, 6).join('\n   ')}` : '');

await navegador.close();
host.close();
matar();
console.log(`\n${falhas === 0 ? '✅ TUDO PASSOU' : `❌ ${falhas} falha(s)`}`);
process.exit(falhas === 0 ? 0 : 1);
