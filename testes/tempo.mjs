/**
 * O deck cabe em 2 horas? E todo comando listado tem explicação?
 *
 * Lê o deck direto do TypeScript (o Node 22.6+ remove os tipos sozinho) e
 * confere três coisas que, quebradas, só apareceriam no meio do workshop:
 *   1. a soma dos `minutos` de todas as cenas é no máximo 90 (1h30 de workshop);
 *   2. toda cena tem `minutos`, e todo lab/exercício/jogo dá tempo de fazer
 *      (os minutos da cena cobrem o cronômetro dela);
 *   3. todo comando de `comandosDoModulo` e `resumo` tem "o que faz" em
 *      src/deck/comandos.ts, e toda referência aponta para um slide anterior.
 */
import { DECK, MINUTOS_TOTAIS } from '../src/deck/content.ts';
import { COMANDOS } from '../src/deck/comandos.ts';

let falhas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) falhas++; };

ok(MINUTOS_TOTAIS <= 90, `o deck inteiro cabe em 1h30 (planejado: ${MINUTOS_TOTAIS} min)`);

const semMinutos = DECK.filter((c) => typeof c.minutos !== 'number' || c.minutos <= 0).map((c) => c.id);
ok(semMinutos.length === 0, `toda cena declara minutos ${semMinutos.join(', ')}`);

const apertadas = DECK.filter((c) => 'segundos' in c && c.segundos / 60 > c.minutos).map((c) => `${c.id} (${c.segundos}s em ${c.minutos} min)`);
ok(apertadas.length === 0, `o cronômetro de cada cena cabe nos minutos dela ${apertadas.join(', ')}`);

const listados = DECK.flatMap((c) => [...(c.comandosDoModulo ?? []), ...(c.resumo ?? [])]);
const semExplicacao = [...new Set(listados)].filter((c) => !COMANDOS[c]);
ok(semExplicacao.length === 0, `todo comando listado tem explicação ${semExplicacao.join(', ')}`);

const indice = Object.fromEntries(DECK.map((c, i) => [c.id, i]));
const refRuins = DECK.flatMap((c, i) => (c.referencias ?? [])
  .filter((r) => !(r.id in indice) || indice[r.id] >= i)
  .map((r) => `${c.id} → ${r.id}`));
ok(refRuins.length === 0, `toda referência aponta para um slide que veio antes ${refRuins.join(', ')}`);

const ids = DECK.map((c) => c.id);
ok(new Set(ids).size === ids.length, 'nenhuma cena repete id');

// por bloco, para quem for cortar ou acrescentar saber onde está o tempo
const porModulo = {};
for (const c of DECK) porModulo[c.modulo] = (porModulo[c.modulo] ?? 0) + c.minutos;
console.log('\nminutos por módulo:', Object.entries(porModulo).map(([m, n]) => `M${m} ${n}`).join(' · '));

process.exit(falhas ? 1 : 0);
