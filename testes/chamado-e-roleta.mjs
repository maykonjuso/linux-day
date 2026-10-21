/**
 * O chamado com cartões, a roleta, a foto e os eventos novos, contra um
 * servidor de verdade.
 *
 * Uso: npm run teste:chamado (precisa do build: npm run build)
 */
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { io } from 'socket.io-client';
import { DECK } from '../src/deck/content.ts';

const PORTA = 3096;
const URL = `http://localhost:${PORTA}`;
let falhas = 0;
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${msg}${extra ? ` ${extra}` : ''}`);
  if (!cond) falhas++;
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const pedir = (s, ev, dados) => new Promise((r) => s.emit(ev, dados, r));

const DB = './data/arena-chamado.db';
for (const f of [DB, `${DB}-wal`, `${DB}-shm`]) rmSync(f, { force: true });
rmSync('./data/casas-chamado', { recursive: true, force: true });

console.log('▸ subindo o servidor…');
const srv = spawn('node', ['server.mjs'], {
  env: { ...process.env, PORT: String(PORTA), NODE_ENV: 'production', ARENA_DB: DB, ARENA_CASAS: './data/casas-chamado', ARENA_MODO: 'local' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
srv.stderr.on('data', (d) => { const t = String(d); if (/Error|error/.test(t)) process.stderr.write(`  [srv] ${t}`); });
ok(await new Promise((r) => {
  const t = setTimeout(() => r(false), 40_000);
  srv.stdout.on('data', (d) => { if (String(d).includes('apresentador')) { clearTimeout(t); r(true); } });
}), 'servidor no ar');

const novo = () => io(URL, { path: '/rt', transports: ['websocket'] });
const host = novo();
const pessoas = { ana: novo(), bia: novo(), caio: novo(), davi: novo() };
await esperar(500);
ok(await pedir(host, 'host:entrar', '1991'), 'o painel abre no computador do servidor');
const ids = {};
for (const [nick, s] of Object.entries(pessoas)) ids[nick] = (await pedir(s, 'entrar', { nick, emoji: '🐧' })).eu.id;
let placar = null;
host.on('placar', (p) => { placar = p; });
await esperar(2500);   // semear o ambiente de cada um

// ─────────────────────────── página do IP e foto ──────────────────────────
const rede = await (await fetch(`${URL}/api/rede`)).json();
ok(rede.porta === PORTA && Array.isArray(rede.enderecos), '/api/rede diz a porta e os endereços', `(${rede.principal})`);
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)]);
const foto = await pedir(pessoas.ana, 'perfil:foto', `data:image/png;base64,${png.toString('base64')}`);
ok(foto.ok && /^\/foto\//.test(foto.foto), 'a foto é aceita e ganha um endereço', `(${foto.foto})`);
const resp = await fetch(URL + foto.foto);
ok(resp.status === 200 && resp.headers.get('content-type') === 'image/png' && resp.headers.get('x-content-type-options') === 'nosniff', 'e é servida como imagem, sem o navegador adivinhar o tipo');
await esperar(200);
ok(placar.individual.find((p) => p.nick === 'ana')?.foto === foto.foto, 'o placar leva o endereço da foto, não a foto');
ok(!!(await pedir(pessoas.bia, 'perfil:foto', 'data:image/svg+xml;base64,PHN2Zy8+')).erro, 'SVG é recusado');

// ─────────────────────────── eventos novos ────────────────────────────────
const tokensAntes = placar.individual.find((p) => p.nick === 'bia').tokens;
ok((await pedir(host, 'host:evento', { tipo: 'chuva-de-tokens' })).ok, 'chuva de tokens dispara');
await esperar(200);
ok(placar.individual.find((p) => p.nick === 'bia').tokens === tokensAntes + 1, 'e dá 1 token para quem está na sala');
ok((await pedir(host, 'host:evento', { tipo: 'relampago' })).ok, 'relâmpago dispara');
ok(!!(await pedir(host, 'host:evento', { tipo: 'xp-dobrado' })).erro, 'mas não empilha com outro multiplicador');
const auto = await pedir(host, 'host:eventos:auto', true);
ok(auto.ligado, 'o sorteio automático liga');
ok(!(await pedir(host, 'host:eventos:auto', false)).ligado, 'e desliga');

// ──────────────────────────────── roleta ──────────────────────────────────
console.log('▸ roleta');
let roleta = null;
host.on('roleta', (r) => { roleta = r; });
const rr = await pedir(host, 'host:evento', { tipo: 'roleta' });
ok(rr.ok && rr.contemplados.length === 1, 'com 4 pessoas na sala, uma é sorteada para girar');
ok(!!(await pedir(host, 'host:evento', { tipo: 'roleta' })).erro, 'não abre outra roleta por cima');
for (let i = 0; i < 40 && !roleta?.atual; i++) await esperar(200);
const vez = roleta?.atual;
ok(vez?.fase === 'girar' && vez.id === rr.contemplados[0], 'a sorteada é chamada para girar', `(${vez?.pessoa?.nick})`);
const sorteada = Object.entries(ids).find(([, id]) => id === vez?.id)?.[0];
const outra = Object.keys(ids).find((n) => n !== sorteada);
ok(!!(await pedir(pessoas[outra], 'roleta:girar', null)).erro, 'quem não é da vez não gira');
await pedir(pessoas[sorteada], 'roleta:girar', null);
await esperar(200);
// joga o que a fatia pedir, até o fim
for (let passo = 0; passo < 6 && roleta?.atual?.fase !== 'fim'; passo++) {
  const a = roleta.atual;
  if (a.fase === 'escolher' && a.fatia === 'par-impar') {
    await pedir(pessoas[sorteada], 'roleta:escolher', 'par:2');
    const alvo = Object.entries(ids).find(([, id]) => id === a.alvo)?.[0];
    await pedir(pessoas[alvo], 'roleta:escolher', '3');
  } else if (a.fase === 'escolher') {
    await pedir(pessoas[sorteada], 'roleta:escolher', 'pedra');
    if (a.fatia === 'ppt') {
      await esperar(150);
      ok(!Object.values(roleta.atual.escolhas ?? {}).includes('pedra'), 'no duelo, o outro lado não vê a escolha antes de escolher');
      const alvo = Object.entries(ids).find(([, id]) => id === a.alvo)?.[0];
      await pedir(pessoas[alvo], 'roleta:escolher', 'papel');
    }
  } else if (a.fase === 'indicar') await pedir(pessoas[sorteada], 'roleta:indicar', ids[outra]);
  else if (a.fase === 'julgar') await pedir(host, 'host:roleta:julgar', true);
  await esperar(200);
}
ok(roleta?.atual?.fase === 'fim' && !!roleta.atual.resultado?.texto, 'a dinâmica chega ao fim com um resultado', `(${roleta?.atual?.fatia}: ${roleta?.atual?.resultado?.texto})`);
await pedir(host, 'host:roleta:cancelar', null);

// ─────────────────────────────── chamado ──────────────────────────────────
console.log('▸ chamado com cartões');
for (const n of ['ana', 'bia', 'caio', 'davi']) await pedir(pessoas[n], 'grupo:entrar', 'azul');
const cartas = { ana: 'investigador', bia: 'operador', caio: 'mecanico', davi: 'relator' };
for (const [n, c] of Object.entries(cartas)) pessoas[n].emit('grupo:papel', c);
await esperar(300);
const iBoss = DECK.findIndex((c) => c.id === 'm6-boss');
ok((await pedir(host, 'host:ir', { cenaIndex: iBoss, cenaId: 'm6-boss', passo: 0, fase: 'idle' }))?.ok, 'com todo mundo em equipe, o apresentador vai ao chamado');
ok(!!(await pedir(pessoas.ana, 'chamado:cartao', { cartaoId: 'inv-grep' })).erro, 'cartão não roda com o chamado fechado');
// sem clicar em "preparar boss": abrir o chamado prepara sozinho
host.emit('host:fase', { fase: 'aberta', cenaId: 'm6-boss', segundos: 540 });
// O primeiro cartão pode ser enviado imediatamente: ele deve aguardar o
// preparo da pasta, não falhar numa corrida contra a semeadura assíncrona.
const primeiroCartao = await pedir(pessoas.ana, 'chamado:cartao', { cartaoId: 'inv-ls' });
ok(primeiroCartao.jogada?.ok && /relatorio\.log/.test(primeiroCartao.jogada?.saida ?? ''), 'o primeiro cartão aguarda a pasta da equipe ficar pronta');
const logo = {};
for (const s of Object.values(pessoas)) {
  const v = await pedir(s, 'lab:verificar', { taskSlug: 'boss-chamado', auto: true });
  for (const r of v.resultados ?? []) if (r.passou) logo[r.id] = true;
}
ok(Object.keys(logo).length === 0, 'ao abrir o chamado nenhum defeito fecha sozinho', `(${Object.keys(logo)})`);
ok(placar.individual.find((p) => p.nick === 'bia').badges?.includes('carta-operador'), 'quem tem carta começa o chamado com a conquista do cargo');

// A trava impede trocar de time, mas um participante atrasado não pode ficar
// preso sem equipe quando usa o seletor global fora do slide de equipes.
const atrasado = novo();
await esperar(200);
await pedir(atrasado, 'entrar', { nick: 'eva', emoji: '🐧' });
const entradaTardia = await pedir(atrasado, 'grupo:entrar', 'verde');
ok(entradaTardia.ok && entradaTardia.grupo === 'verde', 'quem chegou atrasado entra numa equipe mesmo com o chamado trancado');
const trocaNoChamado = await pedir(pessoas.ana, 'grupo:entrar', 'verde');
ok(trocaNoChamado.erro === 'trancado', 'quem já tem equipe não troca no meio do chamado');

let registroDaDavi = [];
pessoas.davi.on('chamado:jogada', (j) => registroDaDavi.push(j));
const r0 = await pedir(pessoas.bia, 'chamado:cartao', { cartaoId: 'inv-grep' });
ok(/investigador/.test(r0.erro ?? ''), 'a Operadora não envia cartão do Investigador', `(${r0.erro})`);
const r1 = await pedir(pessoas.ana, 'chamado:cartao', { cartaoId: 'inv-grep' });
const fatal = (r1.jogada?.saida ?? '').replace(/.*FATAL /, '').trim();
ok(r1.ok && /FATAL/.test(r1.jogada.saida), 'o Investigador acha a linha FATAL', `("${fatal}")`);
await esperar(200);
ok(registroDaDavi.some((j) => j.comando.includes('grep FATAL') && j.nick === 'ana'), 'o resto da equipe vê o cartão e a saída');
const arm = await pedir(pessoas.bia, 'chamado:cartao', { cartaoId: 'op-reboot' });
ok(!!arm.jogada?.armadilha, 'o cartão-armadilha não roda e explica por quê');

const ps = await pedir(pessoas.bia, 'chamado:cartao', { cartaoId: 'op-ps' });
const linha = (ps.jogada?.saida ?? '').split('\n').find((l) => l.includes('arena-travado-azul'));
const pid = linha?.trim().split(/\s+/)[1];
ok(!!pid, 'o ps mostra o processo travado no topo, com o PID na 2ª coluna', `(${pid})`);
const errado = await pedir(pessoas.bia, 'chamado:cartao', { cartaoId: 'op-kill', valor: String(process.pid) });
ok(/não é o processo/.test(errado.jogada?.saida ?? '') && !errado.jogada.ok, 'kill com o PID de outro processo é recusado (o servidor sobrevive)');
const mata = await pedir(pessoas.bia, 'chamado:cartao', { cartaoId: 'op-kill', valor: pid });
ok(mata.jogada?.ok, 'kill com o PID certo encerra o processo travado', `(${mata.jogada?.saida})`);

await pedir(pessoas.caio, 'chamado:cartao', { cartaoId: 'mec-chmod' });
const roda = await pedir(pessoas.caio, 'chamado:cartao', { cartaoId: 'mec-rodar' });
ok(/backup ok/.test(roda.jogada?.saida ?? ''), 'o Mecânico dá o x e o backup roda');

const conta = await pedir(pessoas.davi, 'chamado:cartao', { cartaoId: 'rel-contar' });
const n = (conta.jogada?.saida ?? '').trim();
ok(/^\d+$/.test(n), 'o Relator conta os ERROR', `(${n})`);
const sujo = await pedir(pessoas.davi, 'chamado:cartao', { cartaoId: 'rel-laudo', valor: 'azul $(whoami)' });
ok(!!sujo.erro, 'laudo com comando escondido é recusado');
await pedir(pessoas.davi, 'chamado:cartao', { cartaoId: 'rel-laudo', valor: `equipe azul: ${n} ERROR, PID ${pid} encerrado` });

const fechou = {};
for (const [nome, s] of [['ana', pessoas.ana], ['bia', pessoas.bia], ['caio', pessoas.caio], ['davi', pessoas.davi]]) {
  const v = await pedir(s, 'lab:verificar', { taskSlug: 'boss-chamado', resposta: nome === 'ana' ? fatal : '' });
  for (const r of v.resultados ?? []) if (r.passou) fechou[r.id] = true;
}
ok(['b-c1', 'b-c2', 'b-c3', 'b-c4'].every((c) => fechou[c]), 'os quatro defeitos fecham, cada um com o seu cargo', `(${Object.keys(fechou)})`);

// ───────────────────────────────── fim ────────────────────────────────────
[host, atrasado, ...Object.values(pessoas)].forEach((s) => s.close());
// o processo travado do boss vive fora do servidor: sem isto, fica gastando CPU
// e o próximo teste encontra dois
spawn('pkill', ['-f', '[a]rena-travado-']);
srv.kill('SIGTERM');
await esperar(600);
srv.kill('SIGKILL');
console.log(`\n${falhas === 0 ? '✅ TUDO PASSOU' : `❌ ${falhas} falha(s)`}`);
process.exit(falhas === 0 ? 0 : 1);
