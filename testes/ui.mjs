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
import { io } from 'socket.io-client';

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

// o XP não aparece mais na barra do participante (só no pódio): um socket
// espião lê o placar que o servidor manda para todas as telas
let ultimoPlacar = null;
const espiao = io(URL, { path: '/rt', transports: ['websocket'] });
espiao.on('placar', (p) => { ultimoPlacar = p; });
const xpDaAna = async () => { await new Promise((r) => setTimeout(r, 200)); return ultimoPlacar?.individual.find((p) => p.nick === 'ana')?.xp ?? 0; };
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
await aluno.fill('input[placeholder="seu nome"]', 'ana');
await aluno.getByRole('button', { name: /^entrar$/ }).click();
await dormir(1200);
ok(await aluno.locator('.controles').isVisible(), 'participante entra e vê a barra de controles');
ok((await xpDaAna()) >= 20, 'o XP do check-in entra no placar', `(${await xpDaAna()})`);
ok((await aluno.locator('.controles', { hasText: /XP/ }).count()) === 0, 'a barra do participante não mostra placar (ele só aparece no pódio)');

// nome repetido: a sala não pode ter dois "ana"
const repetido = await abrir('/');
await repetido.fill('input[placeholder="seu nome"]', 'Ana');
await repetido.getByRole('button', { name: /^entrar$/ }).click();
await dormir(900);
ok((await repetido.locator('.cartao', { hasText: /Já tem alguém chamado/ }).count()) > 0, 'nome repetido é recusado com explicação');
const sugestao = repetido.locator('.cartao button').first();
ok((await sugestao.count()) > 0, 'e a tela oferece nomes livres', `("${await sugestao.textContent()}")`);
await sugestao.click();
await dormir(1100);
ok((await repetido.locator('.controles').count()) > 0, 'clicar numa sugestão entra na hora');
await repetido.close();

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

// ─────────────── sem equipe, a apresentação não passa da escolha ───────────
for (let i = 0; i < 6; i++) {
  if ((await host.locator('.estado-faixa .chip', { hasText: /grupos/ }).count()) > 0) break;
  await host.locator('button[title*="avançar"]').click();
  await dormir(300);
}
ok((await host.locator('.estado-faixa .chip', { hasText: /grupos/ }).count()) > 0, 'cheguei na escolha de equipes');
ok((await aluno.locator('[data-aviso="sem-equipe"]').count()) > 0, 'quem está sem equipe vê que a apresentação espera por ele');
ok((await host.locator('[data-aviso="sem-equipe"]', { hasText: 'ana' }).count()) > 0, 'o painel diz quem ainda falta escolher');
const naEscolha = await cenaDoHost();
await host.locator('button[title*="avançar"]').click();
await dormir(600);
ok((await cenaDoHost()) === naEscolha, 'avançar com alguém sem equipe NÃO muda a cena');
ok((await host.locator('.toast', { hasText: /sem equipe/ }).count()) > 0, 'e o painel explica por quê');
await host.locator('select').first().selectOption({ label: 'módulo 2' });
await dormir(600);
ok((await cenaDoHost()) === naEscolha, 'pular de módulo com alguém sem equipe também NÃO muda a cena');
await host.locator('button[title*="quem ainda está sem"]').click();
await dormir(800);
ok((await aluno.locator('[data-aviso="sem-equipe"]').count()) === 0, '"completar equipes" põe a pessoa numa equipe');
await host.locator('button[title*="avançar"]').click();
await dormir(600);
ok((await cenaDoHost()) !== naEscolha, 'com todo mundo em equipe, a apresentação avança');
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
// Kahoot: ao chegar, a turma vê só o enunciado (quem apresenta explica)
ok((await alternativas.count()) === 0, 'ao chegar na pergunta, as alternativas ainda NÃO aparecem (só o enunciado)');
ok(await aluno.locator('.aguardando').isVisible(), 'e a tela avisa que as opções aparecem quando o apresentador liberar');
ok((await host.locator('.alt').count()) >= 2, 'o apresentador já vê a prévia das alternativas');
await host.locator('button[title*="avançar"]').click();   // liberar opções
await dormir(600);
const nAlt = await alternativas.count();
ok(nAlt >= 2, 'o avançar libera as alternativas para o participante', `(${nAlt})`);
const primeiraHabilitada = await alternativas.first().isEnabled();
ok(primeiraHabilitada, 'e elas já podem ser clicadas');

const xpAntes = await xpDaAna();
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
const xpDepois = await xpDaAna();
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
ok((await aluno.locator('button', { hasText: /^[rwx]$/ }).count()) === 0, 'o exercício só aparece depois de liberado');
await host.locator('button[title*="avançar"]').click();   // liberar exercício
await dormir(500);
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
await dormir(500);
ok((await aluno.locator('#slot-terminal').count()) === 0, 'o terminal só aparece depois de o apresentador liberar');
await host.locator('button[title*="avançar"]').click();   // liberar terminal
await dormir(2500);

ok((await aluno.locator('.item-check').count()) === 6, 'os 6 critérios aparecem na tela do lab', `(${await aluno.locator('.item-check').count()})`);
ok(await aluno.locator('.xterm').isVisible(), 'o TERMINAL aparece dentro do slide');
await aluno.locator('.xterm').click();
await aluno.keyboard.type('echo ui-terminal-ok\n');
await dormir(1500);
const telaTerm = await aluno.locator('.xterm').textContent();
ok((telaTerm ?? '').includes('ui-terminal-ok'), 'digitar no terminal funciona e a saída volta');

// a fonte do terminal: com `var(--mono)` o xterm media errado e o texto saía torto
const fonte = await aluno.evaluate(() => {
  const el = document.querySelector('.xterm-rows span');
  const s = el ? getComputedStyle(el) : null;
  return {
    familia: s?.fontFamily ?? '',
    cssDoXterm: !!document.querySelector('.xterm-viewport'),
    linhas: document.querySelectorAll('.xterm-rows > div').length,
  };
});
ok(!fonte.familia.includes('var('), 'a fonte do terminal é uma pilha real, não variável CSS', `(${fonte.familia.slice(0, 30)}…)`);
ok(fonte.cssDoXterm, 'o CSS do xterm está carregado (cursor e espaçamento corretos)');
// 12 linhas é o mínimo para trabalhar: cabe o comando, a saída e o prompt de
// volta sem a pessoa precisar rolar a cada passo
ok(fonte.linhas >= 12, 'o terminal tem altura de trabalho', `(${fonte.linhas} linhas)`);

// cada pessoa vê o PRÓPRIO nome, não o usuário do dono do Mac nem "aluno01"
await aluno.keyboard.type('whoami\n');
await dormir(1400);
const quemSouEu = (await aluno.locator('.xterm-rows').textContent()) ?? '';
ok(/\bana\b/.test(quemSouEu), 'o whoami responde o nome da própria pessoa', `(${quemSouEu.match(/\b[a-z]+@linuxday/)?.[0] ?? '?'})`);
ok(/ana@linuxday/.test(quemSouEu), 'e o prompt mostra esse mesmo nome');
ok(!/aluno\d/.test(quemSouEu), 'e não aparece aluno01 em lugar nenhum do terminal');

const btnDica = aluno.locator('[data-acao="dica"]');
ok(await btnDica.isEnabled(), 'o botão de dica está habilitado (há token e há dica)');
const saldo = async () => Number(((await aluno.locator('.controles .btn-icone', { hasText: /tokens/ }).first().textContent()) ?? '0').replace(/\D/g, ''));
const tokensAntes = await saldo();
await btnDica.click();
await dormir(900);
ok(await aluno.locator('.cartao', { hasText: /coringa|renomear|comando/ }).first().isVisible(), 'a dica aparece na tela');
// o acerto no quiz tinha dado +1 token, então o número absoluto varia: compare
const tokensDepois = await saldo();
ok(tokensDepois === tokensAntes - 1, 'a dica desconta exatamente 1 token na barra', `(${tokensAntes} → ${tokensDepois})`);
await btnDica.click();
await dormir(700);
ok((await aluno.locator('[data-acao="dica"][data-sem-dicas="true"]').count()) > 0,
  'quando as dicas acabam, o botão diz isso e desabilita');

// sem botão de Verificar: o laboratório confere sozinho a cada 5 segundos
ok((await aluno.locator('[data-acao="verificar"]').count()) === 0, 'não existe botão de Verificar (a conferência é automática)');
await dormir(6000);
ok((await aluno.locator('.item-check .pista').count()) === 0, 'a conferência automática NÃO mostra dicas sozinha (dica é só pelo botão)');

// resolve mesmo, pelo terminal
await aluno.locator('.xterm').click();
await aluno.keyboard.type('cd ~/bagunca && mkdir -p imagens docs scripts && mv *.png *.jpg imagens/ && mv rascunho.txt docs/notas.md && mv *.txt *.md docs/ && mv *.sh scripts/ && rm -f tmp_* && echo "organizado por ana" > README.md\n');
await aluno.locator('.item-check[data-novo="true"]').first().waitFor({ timeout: 9000 }).catch(() => {});
ok((await aluno.locator('.item-check[data-novo="true"]').count()) > 0, 'os itens que acabaram de ficar prontos ganham a animação de conquista');
await dormir(3000);
ok((await aluno.locator('.item-check[data-ok="true"]').count()) === 6, 'depois dos comandos, os 6 critérios acendem sozinhos', `(${await aluno.locator('.item-check[data-ok="true"]').count()})`);

// ──────────────────────── botões do apresentador ──────────────────────────
await host.locator('button[title*="grade pessoas"]').click();
await dormir(900);
ok(await host.locator('table').isVisible(), 'o botão "grade" abre a grade pessoas × critérios');
await host.locator('button[title*="grade pessoas"]').click();
await dormir(400);

// pedido de ajuda: um clique = uma entrada na fila do apresentador.
// Sem remover o ouvinte do socket na limpeza, cada re-render registrava outro
// e o mesmo clique aparecia três vezes.
const filaDeAjuda = () => host.locator('.estado-faixa', { hasText: /ana/ }).locator('button', { hasText: 'ana' });
await aluno.locator('[data-acao="ajuda"]').click();
await dormir(900);
const textoFila = (await host.locator('.estado-faixa').textContent()) ?? '';
const vezes = (textoFila.match(/ana/g) ?? []).length;
ok(vezes === 1, 'um clique em Ajuda aparece UMA vez no painel', `(apareceu ${vezes}x)`);
await aluno.locator('[data-acao="ajuda"]').click();
await dormir(700);
const textoFila2 = (await host.locator('.estado-faixa').textContent()) ?? '';
ok((textoFila2.match(/ana/g) ?? []).length === 1, 'clicar de novo também não duplica');
await host.locator('.estado-faixa button', { hasText: 'ana' }).first().click();
await dormir(400);
ok(!((await host.locator('.estado-faixa').textContent()) ?? '').includes('ana'), 'e o apresentador limpa a fila com um clique');

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
// a escolha de equipe é no começo do workshop (módulo 0); no módulo 6 ficam
// só as cartas de função do chamado
await host.locator('select').first().selectOption({ label: 'módulo 0' });
await dormir(600);
for (let i = 0; i < 8; i++) {
  if ((await host.locator('.estado-faixa .chip', { hasText: /grupos/ }).count()) > 0) break;
  await host.locator('button[title*="avançar"]').click();
  await dormir(260);
}
ok((await host.locator('.estado-faixa .chip', { hasText: /grupos/ }).count()) > 0, 'cheguei na cena de equipes');
await dormir(400);
/*
  O sortear grupos do passo anterior pode já ter colocado a ana numa equipe, e
  clicar na equipe em que ela está SAI dela (o card alterna). Então tentamos
  alguns cards até ela estar dentro de uma.
*/
const dentroDeUmaEquipe = async () => ((await aluno.locator('.cena').textContent()) ?? '').includes('você está aqui');
for (let i = 0; i < 4 && !(await dentroDeUmaEquipe()); i++) {
  await aluno.locator('.cena button').nth(i).click();
  await dormir(700);
}
ok(await dentroDeUmaEquipe(), 'entrar numa equipe acende o card dela');

// vai para a cena das cartas, no módulo 6
await host.locator('select').first().selectOption({ label: 'módulo 6' });
await dormir(600);
for (let i = 0; i < 4; i++) {
  if (((await aluno.locator('.cena').textContent()) ?? '').includes('carta livre')) break;
  await host.locator('button[title*="avançar"]').click();
  await dormir(300);
}
const carta = aluno.locator('.cartao', { hasText: 'Investigador' }).first();
if (await carta.count()) {
  await carta.click();
  await dormir(700);
  ok(((await carta.textContent()) ?? '').includes('você'), 'assumir a carta de função aparece na própria tela');
  await carta.click();
  await dormir(600);
  ok(((await carta.textContent()) ?? '').includes('carta livre'), 'e clicar de novo larga a carta');
}
ok((await aluno.locator('input[placeholder="mensagem para a equipe"]').count()) > 0, 'a cena das cartas tem o chat da equipe');

// ── temas: slide claro/escuro e cores do terminal ──
const temaDoHtml = () => aluno.evaluate(() => document.documentElement.dataset.tema);
const temaInicial = await temaDoHtml();
await aluno.locator('button[title*="slide claro e escuro"]').click();
await dormir(500);
ok((await temaDoHtml()) !== temaInicial, 'o botão de tema troca o slide entre claro e escuro', `(${temaInicial} → ${await temaDoHtml()})`);
await aluno.reload({ waitUntil: 'domcontentloaded' });
await dormir(1800);
ok((await temaDoHtml()) !== temaInicial, 'e a escolha sobrevive ao recarregar');

await aluno.locator('button[title*="cores do terminal"]').click();
await dormir(500);
const temas = await aluno.locator('button[title*="tema"], button[title*="abre no nível"]').count();
ok(temas >= 6, 'a janela de cores mostra os temas do terminal', `(${temas})`);
ok((await aluno.locator('.xp-item', { hasText: /nível \d/ }).count()) > 0, 'e mostra quais ainda estão trancados por nível');
await aluno.locator('button[title*="usar o tema"]').first().click();
await dormir(600);
ok((await aluno.locator('.xterm').count()) > 0, 'escolher um tema não quebra o terminal');

// ── tela de pessoas do apresentador ──
await host.locator('button[title*="pessoas na sala"]').click();
await dormir(900);
ok((await host.locator('button[title="expulsar da sala"]').count()) > 0, 'a tela de Pessoas lista quem está na sala com ação de expulsar');
ok((await host.locator('button[title*="silenciar o chat"]').count()) > 0, 'e ação de silenciar o chat');
await host.locator('input[placeholder*="buscar por nome"]').fill('ana');
await dormir(400);
ok((await host.locator('.item-check').count()) >= 1, 'a busca por nome filtra a lista');
await host.locator('input[placeholder*="buscar por nome"]').fill('');
await dormir(300);

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
