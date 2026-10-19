/**
 * Teste de interface: um navegador de verdade clicando nos botões, nas duas
 * telas ao mesmo tempo (apresentador e participante), do jeito que acontece
 * no evento. É o único teste que pega botão morto, clique sem efeito e
 * dessincronia entre as telas.
 *
 * Uso: npm run teste:ui
 */
import { spawn, execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { chromium } from 'playwright';

const PORTA = 3098;
const URL = `http://localhost:${PORTA}`;
let falhas = 0;
const ok = (c, msg, extra = '') => { console.log(`${c ? '✅' : '❌'} ${msg}${extra ? ` ${extra}` : ''}`); if (!c) falhas++; };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// mata servidor zumbi de uma execução anterior que tenha quebrado no meio:
// senão o teste conversa com ELE (com o estado antigo) e as falhas são fantasmas
try { execSync(`lsof -nP -iTCP:${PORTA} -sTCP:LISTEN -t | xargs kill -9`, { stdio: 'ignore' }); } catch { /* ninguém lá */ }

rmSync('./data/arena-ui.db', { force: true });
rmSync('./data/arena-ui.db-wal', { force: true });
rmSync('./data/arena-ui.db-shm', { force: true });
rmSync('./data/casas-ui', { recursive: true, force: true });

console.log('▸ subindo o servidor…');
const srv = spawn('node', ['server.mjs'], {
  env: { ...process.env, PORT: String(PORTA), NODE_ENV: 'production', ARENA_DB: './data/arena-ui.db', ARENA_CASAS: './data/casas-ui', ARENA_MODO: 'local' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let subiu = false;
srv.stderr.on('data', (d) => { const t = String(d); if (/EADDRINUSE/.test(t)) console.error('  ⚠ porta ocupada'); });
await new Promise((r) => { const t = setTimeout(r, 40_000); srv.stdout.on('data', (d) => { if (String(d).includes('apresentador')) { subiu = true; clearTimeout(t); r(); } }); });
ok(subiu, 'servidor no ar (processo novo, estado limpo)');
if (!subiu) { srv.kill('SIGKILL'); process.exit(1); }

const matarServidor = () => { try { srv.kill('SIGKILL'); } catch { /* já morreu */ } };
process.on('uncaughtException', (e) => { console.error('\n❌ erro no teste:', e.message); matarServidor(); process.exit(1); });
process.on('unhandledRejection', (e) => { console.error('\n❌ erro no teste:', e); matarServidor(); process.exit(1); });

const navegador = await chromium.launch();
const erros = [];
const abrir = async (rota) => {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => erros.push(`${rota}: ${e.message}`));
  pg.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) erros.push(`${rota} console: ${m.text()}`); });
  await pg.goto(URL + rota, { waitUntil: 'domcontentloaded' });
  return pg;
};

// ───────────────────────────── entrada ────────────────────────────────────
const aluno = await abrir('/');
await aluno.fill('input[placeholder="seu nick"]', 'ana');
await aluno.getByRole('button', { name: /^entrar$/ }).click();
await dormir(1200);
ok(await aluno.locator('.controles').isVisible(), 'participante entra e vê a barra de controles');
ok((await aluno.locator('.controles .btn-icone', { hasText: /XP/ }).first().textContent())?.includes('20'), 'o XP do check-in aparece na barra',
  `(${(await aluno.locator('.controles .btn-icone', { hasText: /XP/ }).first().textContent())?.trim()})`);

const host = await abrir('/host');
await host.fill('input[placeholder="PIN"]', '1991');
await host.getByRole('button', { name: 'entrar' }).click();
await dormir(800);
ok(await host.locator('.controles').isVisible(), 'apresentador entra com o PIN');

const projetor = await abrir('/screen');
await dormir(400);

// ──────────────────── passar slide: cena e passos ─────────────────────────
const cenaDoHost = async () => (await host.locator('.estado-faixa .chip', { hasText: /^cena / }).textContent()) ?? '';
const cenaDoAluno = async () => (await aluno.locator('.titulo').first().textContent()) ?? '';

const antes = await cenaDoHost();
await host.locator('button[title*="avançar"]').click();
await dormir(500);
ok(antes !== (await cenaDoHost()), 'avançar muda a cena no painel', `(${antes.trim()} → ${(await cenaDoHost()).trim()})`);
ok((await cenaDoAluno()).length > 0, 'o slide do participante acompanha');

const tituloAluno = await cenaDoAluno();
const tituloProjetor = (await projetor.locator('.titulo').first().textContent()) ?? '';
ok(tituloAluno === tituloProjetor, 'participante e projetor mostram a MESMA cena', `("${tituloAluno}")`);

// voltar
const c1 = await cenaDoHost();
await host.locator('button[title*="cena anterior"]').click();
await dormir(400);
ok(c1 !== (await cenaDoHost()), 'o botão ◀ volta uma cena');

// passos internos (TerminalDemo tem várias linhas)
await host.locator('select').first().selectOption({ label: 'módulo 1' });
await dormir(500);
for (let i = 0; i < 4; i++) { await host.locator('button[title*="avançar"]').click(); await dormir(250); }
const demo = await aluno.locator('.term').first().textContent();
ok((demo ?? '').includes('whoami') || (demo ?? '').includes('pwd'), 'as linhas do terminal demonstrado aparecem passo a passo');

// ─────────────────────── quiz: responder e revelar ────────────────────────
// vai para a primeira pergunta do M0 pelo seletor e depois avança até ela
await host.locator('select').first().selectOption({ label: 'módulo 0' });
await dormir(400);
for (let i = 0; i < 40; i++) {
  const t = await host.locator('.estado-faixa .chip', { hasText: /pergunta/ }).count();
  if (t > 0) break;
  await host.locator('button[title*="avançar"]').click();
  await dormir(220);
}
ok(await host.locator('.estado-faixa .chip', { hasText: /pergunta/ }).count() > 0, 'cheguei numa cena de quiz');
await dormir(400);

const alternativas = aluno.locator('.alt');
const nAlt = await alternativas.count();
ok(nAlt >= 2, 'as alternativas aparecem para o participante', `(${nAlt})`);
const primeiraHabilitada = await alternativas.first().isEnabled();
ok(primeiraHabilitada, 'a pergunta JÁ está aberta ao chegar (não precisa apertar "abrir")');

const xpAntes = await aluno.locator('.controles .btn-icone', { hasText: /XP/ }).first().textContent();
await alternativas.nth(1).click();   // a correta do m0-q1 é a B
await dormir(250);
ok(!(await alternativas.first().isEnabled()), 'depois de responder, as alternativas travam');

// Kahoot: com todos tendo respondido, o servidor revela sozinho, sem o
// apresentador precisar apertar nada
const revelouSozinho = await aluno.locator('.alt[data-estado="certa"]')
  .waitFor({ timeout: 6000 }).then(() => true).catch(() => false);
ok(revelouSozinho, 'quando todos respondem, a resposta é revelada sozinha (igual ao Kahoot)');
ok(await aluno.locator('.alt[data-estado="certa"]').count() === 1, 'a alternativa correta é destacada na revelação');
ok((await host.locator('.estado-faixa .chip', { hasText: /responderam/ }).count()) > 0, 'o painel mostra quantos já responderam');
const xpDepois = await aluno.locator('.controles .btn-icone', { hasText: /XP/ }).first().textContent();
ok(xpAntes !== xpDepois, 'o XP do participante muda com o acerto', `(${xpAntes} → ${xpDepois})`);
ok((await projetor.locator('.barra-votos').count()) > 0, 'o projetor mostra a distribuição de respostas');

// ─────────────────────────── widget jogável ───────────────────────────────
await host.locator('select').first().selectOption({ label: 'módulo 3' });
await dormir(400);
for (let i = 0; i < 12; i++) {
  if ((await host.locator('.estado-faixa .chip', { hasText: /exercício na tela/ }).count()) > 0) break;
  await host.locator('button[title*="avançar"]').click();
  await dormir(250);
}
ok((await host.locator('.estado-faixa .chip', { hasText: /exercício na tela/ }).count()) > 0, 'cheguei na cena de widget');
await dormir(300);
const botoesRwx = aluno.locator('button', { hasText: /^[rwx]$/ });
ok((await botoesRwx.count()) === 9, 'o widget de permissões mostra os 9 cadeados', `(${await botoesRwx.count()})`);
const numeroAntes = await aluno.locator('.term').first().textContent();
await botoesRwx.nth(2).click();
await dormir(300);
const numeroDepois = await aluno.locator('.term').first().textContent();
ok(numeroAntes !== numeroDepois, 'clicar num cadeado muda o rwx e o número ao vivo', `(${(numeroAntes ?? '').trim()} → ${(numeroDepois ?? '').trim()})`);

// ──────────────────── lab: terminal, dica e verificar ─────────────────────
await host.locator('select').first().selectOption({ label: 'módulo 2' });
await dormir(400);
for (let i = 0; i < 14; i++) {
  if ((await host.locator('.estado-faixa .chip', { hasText: /laboratório/ }).count()) > 0) break;
  await host.locator('button[title*="avançar"]').click();
  await dormir(250);
}
ok((await host.locator('.estado-faixa .chip', { hasText: /laboratório/ }).count()) > 0, 'cheguei na cena de lab');
await dormir(2500);

ok((await aluno.locator('.criterio').count()) === 6, 'os 6 critérios aparecem na tela do lab');
ok(await aluno.locator('.xterm').isVisible(), 'o TERMINAL aparece dentro do slide');
await aluno.locator('.xterm').click();
await aluno.keyboard.type('echo ui-terminal-ok\n');
await dormir(1500);
const telaTerm = await aluno.locator('.xterm').textContent();
ok((telaTerm ?? '').includes('ui-terminal-ok'), 'digitar no terminal funciona e a saída volta');

const btnDica = aluno.getByRole('button', { name: /Dica/ });
ok(await btnDica.isEnabled(), 'o botão de dica está habilitado (há token e há dica)');
const saldo = async () => Number(((await aluno.locator('.controles .btn-icone', { hasText: /^\s*\d+\s*$/ }).first().textContent()) ?? '0').replace(/\D/g, ''));
const tokensAntes = await saldo();
await btnDica.click();
await dormir(900);
ok(await aluno.locator('.cartao', { hasText: /coringa|renomear|comando/ }).first().isVisible(), 'a dica aparece na tela');
// o acerto no quiz tinha dado +1 token, então o número absoluto varia: compare
const tokensDepois = await saldo();
ok(tokensDepois === tokensAntes - 1, 'a dica desconta exatamente 1 token na barra', `(${tokensAntes} → ${tokensDepois})`);
await btnDica.click();
await dormir(700);
const btnDica2 = aluno.getByRole('button', { name: /Dica|sem mais dicas/ });
ok((await btnDica2.textContent())?.includes('sem mais dicas'), 'quando as dicas acabam, o botão diz isso e desabilita');

await aluno.getByRole('button', { name: 'Verificar' }).click();
await dormir(2500);
ok((await aluno.locator('.criterio small').count()) > 0, 'Verificar devolve mensagem por critério que aponta o próximo passo');

// resolve mesmo, pelo terminal
await aluno.locator('.xterm').click();
await aluno.keyboard.type('cd ~/bagunca && mkdir -p imagens docs scripts && mv *.png *.jpg imagens/ && mv rascunho.txt docs/notas.md && mv *.txt *.md docs/ && mv *.sh scripts/ && rm -f tmp_* && echo "organizado por ana" > README.md\n');
await dormir(2500);
await aluno.getByRole('button', { name: /Verificar/ }).click();
await dormir(3000);
ok((await aluno.locator('.criterio[data-ok="true"]').count()) === 6, 'depois dos comandos, os 6 critérios acendem na tela', `(${await aluno.locator('.criterio[data-ok="true"]').count()})`);

// ──────────────────────── botões do apresentador ──────────────────────────
await host.locator('button[title*="grade pessoas"]').click();
await dormir(900);
ok(await host.locator('table').isVisible(), 'o botão "grade" abre a grade pessoas × critérios');
await host.locator('button[title*="grade pessoas"]').click();
await dormir(400);

await host.fill('input[placeholder="recado para a sala"]', 'teste de recado');
await host.keyboard.press('Enter');
await dormir(600);
ok(await aluno.locator('.toast', { hasText: 'teste de recado' }).isVisible(), 'o recado do apresentador aparece na tela de todos');

await host.locator('select').nth(1).selectOption('resgate');
await dormir(800);
ok(await host.locator('.toast').isVisible(), 'o seletor de evento ao vivo dispara e confirma');

const pausa = host.locator('button[title*="congela"]');
await pausa.click();
await dormir(500);
ok(await aluno.locator('.chip', { hasText: /pausado/ }).isVisible(), 'a pausa global aparece na tela do participante');
await pausa.click();
await dormir(300);

const gabarito = host.locator('button[title*="aplica a solução"]');
if (await gabarito.count()) {
  await gabarito.click();
  const confirmou = await host.locator('.toast', { hasText: /gabarito/ })
    .waitFor({ timeout: 15_000 }).then(() => true).catch(() => false);
  ok(confirmou, 'o botão gabarito confirma quantos receberam');
}

// dois toasts seguidos: o segundo não pode ser apagado pelo timer do primeiro
await host.fill('input[placeholder="recado para a sala"]', 'primeiro');
await host.keyboard.press('Enter');
await dormir(400);
await host.fill('input[placeholder="recado para a sala"]', 'segundo');
await host.keyboard.press('Enter');
await dormir(1200);
ok((await aluno.locator('.toast').first().textContent())?.includes('segundo'),
  'dois avisos seguidos: o segundo sobrevive ao timer do primeiro');

// ───────────────────── grupos, cartas e extras ────────────────────────────
await host.locator('button[title*="distribui todos"]').click();
await dormir(900);
await host.locator('select').first().selectOption({ label: 'módulo 6' });
await dormir(600);
for (let i = 0; i < 6; i++) {
  if ((await host.locator('.estado-faixa .chip', { hasText: /grupos/ }).count()) > 0) break;
  await host.locator('button[title*="avançar"]').click();
  await dormir(250);
}
if ((await host.locator('.estado-faixa .chip', { hasText: /grupos/ }).count()) > 0) {
  await dormir(400);
  const cards = aluno.locator('.cartao');
  await cards.first().click();
  await dormir(700);
  ok((await aluno.locator('.olho', { hasText: /chat do grupo/ }).count()) > 0, 'entrar num grupo acende o card e abre o chat do grupo');
  const carta = aluno.locator('.cartao', { hasText: 'Investigador' });
  if (await carta.count()) {
    await carta.first().click();
    await dormir(600);
    ok((await carta.first().textContent())?.includes('ana'), 'assumir a carta de função aparece na própria tela');
  }
}

// páginas extras
for (const rota of ['/regras', '/cheatsheet', '/me']) {
  const pg = await abrir(rota);
  await dormir(700);
  const texto = (await pg.locator('body').textContent()) ?? '';
  ok(texto.length > 400, `a página ${rota} renderiza conteúdo`, `(${texto.length} caracteres)`);
  await pg.close();
}

// ───────────────────────────── erros de JS ────────────────────────────────
ok(erros.length === 0, 'nenhum erro de JavaScript nas telas', erros.length ? `\n   ${erros.slice(0, 6).join('\n   ')}` : '');

await navegador.close();
srv.kill('SIGTERM');
await dormir(500);
srv.kill('SIGKILL');
console.log(`\n${falhas === 0 ? '✅ TUDO PASSOU' : `❌ ${falhas} falha(s)`}`);
process.exit(falhas === 0 ? 0 : 1);
