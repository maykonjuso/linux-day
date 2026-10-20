/**
 * As regras novas, sem servidor: perguntas embaralhadas, foto, endereço da
 * rede, travas do computador principal, cartões do chamado, roleta e eventos.
 *
 * Uso: npm run teste:novidades
 */
import { mkdtempSync, writeFileSync, chmodSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DECK } from '../src/deck/content.ts';
import { ESCAPE, PERIGO, PREVER, ERROS } from '../src/deck/rodadas.ts';
import { embaralhar } from '../src/deck/embaralhar.ts';
import { GABARITOS } from '../src/server/gabaritos.mjs';
import { validarFoto, TETO_DA_FOTO } from '../src/server/fotos.mjs';
import { enderecosDaRede, rodandoNoWsl, descreverRede } from '../src/server/rede.mjs';
import { atalhosDeGuarda, podeSerApresentador, criarLimitador, PACOTES_DO_LAB } from '../src/server/guarda.mjs';
import { CARTOES, cartoesLiberados, prepararCartao } from '../src/server/chamado.mjs';
import { criarRoleta, quantosGiram, faixaDe, fatiasDa, VALOR } from '../src/server/roleta.mjs';
import { eventosElegiveis, sortearEvento, proximoIntervalo, EVENTOS } from '../src/server/eventos.mjs';

let falhas = 0;
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${msg}${extra ? ` ${extra}` : ''}`);
  if (!cond) falhas++;
};

// ─────────────────────────── perguntas ────────────────────────────────────
console.log('▸ perguntas');
const quizzes = DECK.filter((c) => c.tipo === 'QuizScene');
ok(quizzes.every((c) => c.alternativas.length >= 4), 'toda pergunta do quiz tem pelo menos 4 alternativas', `(${quizzes.map((c) => c.alternativas.length)})`);
const rodadas = [...ESCAPE, ...PERIGO, ...PREVER, ...ERROS];
ok(rodadas.every((r) => r.opcoes.length >= 4), 'toda rodada dos exercícios tem pelo menos 4 alternativas', `(${rodadas.map((r) => r.opcoes.length)})`);
ok(rodadas.every((r) => r.opcoes.filter((o) => o.certo).length === 1), 'e exatamente uma certa');

const ordem = embaralhar(['a', 'b', 'c', 'd'], 'm0-q1');
ok(JSON.stringify(ordem) === JSON.stringify(embaralhar(['a', 'b', 'c', 'd'], 'm0-q1')), 'a mesma pergunta sai na mesma ordem em todas as telas');
ok([...ordem].sort().join() === 'a,b,c,d', 'embaralhar não perde nem repete alternativa');
const posicoes = quizzes.map((c) => embaralhar(c.alternativas, c.id).findIndex((a) => a.id === GABARITOS[c.id]?.correta));
ok(new Set(posicoes).size > 1, 'a certa do quiz não cai sempre na mesma posição', `(${posicoes})`);
const posRodadas = rodadas.map((r) => embaralhar(r.opcoes, r.contexto + r.pergunta).findIndex((o) => o.certo));
ok(new Set(posRodadas).size > 1, 'nem a certa dos exercícios', `(${posRodadas})`);

// ──────────────────────────────── foto ────────────────────────────────────
console.log('▸ foto');
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
ok(validarFoto(`data:image/png;base64,${png.toString('base64')}`).mime === 'image/png', 'aceita uma PNG pequena');
ok(!!validarFoto(`data:image/svg+xml;base64,${Buffer.from('<svg onload="x()"/>').toString('base64')}`).erro, 'recusa SVG (carrega script)');
ok(!!validarFoto(`data:image/png;base64,${Buffer.from('<html>oi</html>').toString('base64')}`).erro, 'recusa arquivo que diz ser PNG e não é');
const grande = Buffer.concat([png, Buffer.alloc(TETO_DA_FOTO)]);
ok(!!validarFoto(`data:image/png;base64,${grande.toString('base64')}`).erro, 'recusa foto acima do teto do servidor');

// ──────────────────────────────── rede ────────────────────────────────────
console.log('▸ rede');
const ifaces = {
  lo: [{ family: 'IPv4', address: '127.0.0.1', internal: true }],
  docker0: [{ family: 'IPv4', address: '172.17.0.1', internal: false }],
  wlan0: [{ family: 'IPv4', address: '192.168.0.12', internal: false }, { family: 'IPv6', address: 'fe80::1', internal: false }],
};
const ends = enderecosDaRede(ifaces);
ok(ends[0].ip === '192.168.0.12' && !ends.some((e) => e.ip === '127.0.0.1'), 'o endereço da rede vem primeiro, sem localhost nem interface virtual na frente', `(${ends.map((e) => e.ip)})`);
ok(rodandoNoWsl(() => 'Linux version 6.6 (microsoft-standard-WSL2)') && !rodandoNoWsl(() => 'Linux version 6.6 generic'), 'reconhece quando o servidor está no WSL');
ok(descreverRede({ porta: 3000, interfaces: ifaces, lerVersao: () => '' }).principal === 'http://192.168.0.12:3000', 'monta o endereço com a porta');

// ─────────────────────────── travas da máquina ────────────────────────────
console.log('▸ travas do computador principal');
const bin = mkdtempSync(join(tmpdir(), 'guarda-'));
for (const [nome, corpo] of Object.entries(atalhosDeGuarda())) { writeFileSync(join(bin, nome), corpo); chmodSync(join(bin, nome), 0o755); }
const rodar = (...args) => {
  try { return { codigo: 0, saida: execFileSync('bash', ['-c', args.join(' ')], { env: { PATH: `${bin}:/usr/bin:/bin` }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; }
  catch (e) { return { codigo: e.status, saida: `${e.stdout}${e.stderr}` }; }
};
const pkg = PACOTES_DO_LAB[1];
ok(rodar('sudo apt install -y', pkg).codigo === 0 && existsSync(join(bin, pkg)), `sudo apt install -y ${pkg} funciona, sem instalar nada no sistema`);
ok(rodar(pkg).saida.includes('simulado'), 'e o programa "instalado" responde');
ok(rodar('sudo apt install -y vim').codigo !== 0, 'pacote fora do laboratório é recusado');
ok(rodar('sudo rm -rf /tmp/x').codigo !== 0, 'sudo com outro comando é recusado');
ok(/root/.test(rodar('apt install jq').saida), 'apt sem sudo responde como o de verdade (pede root)');
for (const cmd of ['su', 'brew install x', 'shutdown now', 'reboot', 'systemctl stop x', 'dpkg -i x.deb']) {
  ok(rodar(cmd).codigo !== 0, `"${cmd}" é bloqueado`);
}
rmSync(bin, { recursive: true, force: true });

ok(podeSerApresentador({ endereco: '127.0.0.1' }) === null && podeSerApresentador({ endereco: '::1' }) === null, 'o painel abre no computador do servidor');
ok(!!podeSerApresentador({ endereco: '192.168.0.50', remotoLiberado: false, pinDefinido: true }), 'pela rede, sem liberar, não abre');
ok(!!podeSerApresentador({ endereco: '192.168.0.50', remotoLiberado: true, pinDefinido: false }), 'pela rede com o PIN do README, não abre');
ok(podeSerApresentador({ endereco: '192.168.0.50', remotoLiberado: true, pinDefinido: true }) === null, 'pela rede, liberado e com PIN próprio, abre');
let relogio = 0;
const limitar = criarLimitador({ limite: 3, janelaMs: 1000, agora: () => relogio });
ok([1, 2, 3].every(() => limitar('x')) && !limitar('x'), 'a 4ª tentativa de PIN na mesma janela é recusada');
relogio = 2000;
ok(limitar('x'), 'e volta depois da janela');

// ─────────────────────────── cartões do chamado ───────────────────────────
console.log('▸ cartões do chamado');
const papeis = { ana: 'investigador', bia: 'operador' };
const daBia = cartoesLiberados({ meuPapel: 'operador', papeisDaEquipe: papeis });
ok(daBia.every((c) => c.papel !== 'investigador') && daBia.some((c) => c.papel === 'operador'), 'cada um vê os cartões do próprio cargo, e não os de cargo com dono');
ok(daBia.some((c) => c.papel === 'mecanico') && daBia.some((c) => c.papel === 'relator'), 'cargo sem dono fica aberto para a equipe');
ok(!!prepararCartao({ cartaoId: 'inv-grep', meuPapel: 'operador', papeisDaEquipe: papeis }).erro, 'enviar cartão de outro cargo é recusado');
ok(!!prepararCartao({ cartaoId: 'inv-grep', meuPapel: null, papeisDaEquipe: papeis }).erro, 'quem está sem carta também não envia cartão de cargo com dono');
ok(prepararCartao({ cartaoId: 'inv-grep', meuPapel: 'investigador', papeisDaEquipe: papeis }).script?.includes('grep FATAL'), 'o dono do cargo envia');
ok(!!prepararCartao({ cartaoId: 'op-reboot', meuPapel: 'operador', papeisDaEquipe: papeis }).armadilha, 'cartão-armadilha não roda: devolve o porquê');
ok(!!prepararCartao({ cartaoId: 'op-kill', valor: '1 2', meuPapel: 'operador', papeisDaEquipe: papeis }).erro, 'PID com espaço é recusado');
const kill = prepararCartao({ cartaoId: 'op-kill', valor: '4321', meuPapel: 'operador', papeisDaEquipe: papeis });
ok(kill.env?.VALOR === '4321' && !kill.script.includes('4321') && kill.script.includes('arena-travado-$GRUPO'), 'o PID vai por variável, e o kill só vale para o processo travado da equipe');
ok(!!prepararCartao({ cartaoId: 'rel-laudo', valor: 'azul $(rm -rf ~)', meuPapel: 'relator', papeisDaEquipe: {} }).erro, 'laudo com $( ) é recusado');
const laudo = prepararCartao({ cartaoId: 'rel-laudo', valor: 'equipe azul, 38 ERROR, PID 4321', meuPapel: 'relator', papeisDaEquipe: {} });
ok(laudo.exibir === 'echo "equipe azul, 38 ERROR, PID 4321" > laudo.txt', 'o cartão mostra o comando com o que a pessoa preencheu', `(${laudo.exibir})`);
ok(['investigador', 'operador', 'mecanico', 'relator'].every((p) => CARTOES.some((c) => c.papel === p && c.armadilha)), 'todo cargo tem um cartão que parece resolver e não resolve');

// ──────────────────────────────── roleta ──────────────────────────────────
console.log('▸ roleta');
ok(quantosGiram(1) === 1 && quantosGiram(20) === 1 && quantosGiram(21) === 2 && quantosGiram(45) === 3, 'gira uma pessoa a cada 20');
const sala = Array.from({ length: 9 }, (_, i) => ({ id: `p${i}`, xp: i * 100 }));
ok(faixaDe('p0', sala) === 'baixo' && faixaDe('p4', sala) === 'medio' && faixaDe('p8', sala) === 'alto', 'a faixa sai da posição no XP da sala');
ok(VALOR.baixo > VALOR.medio && VALOR.medio > VALOR.alto, 'quem tem menos XP joga valendo mais');
ok(!fatiasDa('alto').some((f) => f.id === 'bonus-direto') && fatiasDa('baixo').some((f) => f.id === 'bonus-direto'), 'XP de presente só aparece para quem está embaixo');

const seq = (...vs) => { let i = 0; return () => vs[i++ % vs.length]; };
const r1 = criarRoleta({ rng: seq(0) });
r1.iniciar(sala.slice(0, 3));
r1.proximo(sala);
const quem = r1.atual.id;
ok(!!r1.girar('outra-pessoa').erro, 'só a pessoa da vez gira');
ok(!!r1.iniciar(sala).erro, 'não começa uma roleta por cima de outra');
ok(!!r1.proximo(sala).erro, 'a próxima pessoa espera a dinâmica da anterior terminar');
// rng 0 cai na primeira fatia com peso: para a faixa baixa, XP de presente
const g = r1.girar(quem);
ok(r1.atual.fase === 'fim' && g.premios?.[0]?.xp > 0, 'XP de presente termina na hora e premia', `(${JSON.stringify(g.premios)})`);
ok(!!r1.proximo(sala).acabou, 'depois da última pessoa, a roleta acaba');

// par ou ímpar contra o servidor: rng escolhe a fatia e depois o número
const comFatia = (fatia, ...depois) => {
  const r = criarRoleta({ rng: seq(...depois) });
  r.iniciar([{ id: 'p4' }]);
  r.proximo(sala);
  r.atual.fatia = fatia;
  r.atual.fase = ['par-impar', 'ppt', 'perde-token'].includes(fatia) ? 'indicar' : 'julgar';
  return r;
};
const pi = comFatia('par-impar');
ok(pi.atual.fase === 'indicar', 'par ou ímpar também é duelo: quem gira escolhe o adversário');
pi.indicar('p4', 'p1', sala);
ok(!!pi.escolher('p4', '3').erro, 'quem gira precisa dizer o lado junto com os dedos');
ok(!!pi.escolher('p1', 'par:2').erro, 'o adversário só manda os dedos (fica com o outro lado)');
ok(!!pi.escolher('p4', 'par:9').erro, 'dedos vão de 0 a 5');
ok(pi.escolher('p4', 'par:3').esperando, 'o resultado espera os dois');
const rp = pi.escolher('p1', '1');
ok(rp.premios[0].id === 'p4' && pi.atual.resultado.soma === 4, '3 + 1 = 4, deu par: vence quem ficou com par', `(${pi.atual.resultado.texto})`);
const pi2 = comFatia('par-impar');
pi2.indicar('p4', 'p1', sala);
pi2.escolher('p4', 'par:2');
ok(pi2.escolher('p1', '3').premios[0].id === 'p1', '2 + 3 = 5, deu ímpar: vence o adversário');
ok(VALOR.alto >= 120, 'os mini games valem mais XP (até a faixa de cima ganha 120)');
const tk = comFatia('perde-token');
ok(!!tk.indicar('p4', 'p4', sala).erro, 'não dá para indicar a si mesmo');
const rt = tk.indicar('p4', 'p1', sala);
ok(rt.tokens.some((t) => t.id === 'p1' && t.delta === -1) && rt.tokens.some((t) => t.id === 'p4' && t.delta === 1), '"perder" é perder token, nunca XP');
const du = comFatia('ppt');
ok(du.atual.fase === 'indicar', 'pedra, papel e tesoura começa com quem girou escolhendo o adversário');
du.indicar('p4', 'p1', sala);
ok(!!du.escolher('p2', 'pedra').erro, 'quem não está no duelo não joga');
ok(du.escolher('p4', 'pedra').esperando, 'o resultado espera os dois escolherem');
ok(!!du.escolher('p4', 'papel').erro, 'e ninguém troca de lance depois de escolher');
const rd = du.escolher('p1', 'tesoura');
ok(rd.premios[0].id === 'p4' && du.atual.fase === 'fim' && du.atual.resultado.vencedor === 'p4', 'pedra ganha de tesoura');
ok(!fatiasDa('baixo').some((f) => f.id === 'duelo'), 'não sobrou fatia de duelo separada');
const fl = comFatia('fala-comando');
ok(!!fl.agirPorEla(sala) && fl.atual.fase === 'julgar', 'dinâmica falada espera o apresentador (o servidor não decide por ele)');
ok(fl.julgar(true, () => []).premios[0].xp === VALOR.medio, 'o apresentador confirma e a pessoa ganha');
const sumiu = comFatia('ppt', 0);
sumiu.agirPorEla(sala);            // indica alguém por ela
sumiu.agirPorEla(sala);            // um lance
sumiu.agirPorEla(sala);            // o outro lance
ok(sumiu.atual.fase === 'fim', 'quem some não trava a fila: o servidor joga por ela');

// ─────────────────────────────── eventos ──────────────────────────────────
console.log('▸ eventos');
const base = { pausado: false, fase: 'idle', tipoDaCena: 'TerminalDemo', multiplicador: 1, passouDoM3: false, ativos: 20, equipesComGente: 3, roletaAtiva: false };
ok(!eventosElegiveis(base).includes('sabotagem'), 'sabotagem não sai antes de a turma passar do M3');
ok(eventosElegiveis({ ...base, passouDoM3: true }).includes('sabotagem'), 'e sai depois');
ok(eventosElegiveis({ ...base, fase: 'aberta', tipoDaCena: 'QuizScene' }).length === 0, 'nada entra no meio de uma pergunta aberta');
ok(eventosElegiveis({ ...base, pausado: true }).length === 0, 'nem com a sala pausada');
ok(!eventosElegiveis({ ...base, multiplicador: 2 }).some((e) => e === 'xp-dobrado' || e === 'relampago'), 'não empilha multiplicador');
ok(!eventosElegiveis({ ...base, roletaAtiva: true }).includes('roleta'), 'não abre roleta por cima de roleta');
ok(EVENTOS[sortearEvento(base, () => 0.99)] !== undefined, 'o sorteio escolhe um evento que existe');
const iv = proximoIntervalo(() => 0.5);
ok(iv >= 6 * 60_000 && iv <= 10 * 60_000, 'o automático espera de 6 a 10 minutos entre eventos');

console.log(`\n${falhas === 0 ? '✅ TUDO PASSOU' : `❌ ${falhas} falha(s)`}`);
process.exit(falhas === 0 ? 0 : 1);
