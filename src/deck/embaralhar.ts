/**
 * Embaralha de forma determinística: a mesma semente dá sempre a mesma ordem.
 *
 * Precisa ser assim porque projetor e participante desenham a mesma pergunta
 * em aparelhos diferentes, e a cor e a forma (▲ ◆ ● ■) de cada alternativa
 * têm que bater nas duas telas. Um sorteio de verdade daria uma ordem por
 * aparelho; um sorteio por semente dá uma ordem por pergunta, e a resposta
 * certa deixa de cair sempre na mesma posição.
 *
 * Com 4 alternativas, uma semente em cada 24 cai na permutação identidade e
 * devolve a lista **na ordem em que o autor escreveu** — foi o que acontecia
 * com uma das perguntas. Numa lista escrita com a resposta certa em primeiro
 * lugar isso entrega o gabarito, então quando o sorteio não muda nada a gente
 * sorteia de novo, com a semente alterada, até sair diferente.
 */
export function embaralhar<T>(lista: readonly T[], semente: string): T[] {
  // 0 ou 1 item só tem uma ordem possível: não há o que re-sortear
  if (lista.length < 2) return [...lista];
  let ordem = sortear(lista, semente);
  // o teto evita laço infinito na lista de itens todos iguais, onde nenhuma
  // ordem é "diferente" — aí qualquer uma serve mesmo
  for (let tentativa = 1; tentativa <= 8; tentativa++) {
    if (ordem.some((item, i) => item !== lista[i])) break;
    ordem = sortear(lista, `${semente}#${tentativa}`);
  }
  return ordem;
}

function sortear<T>(lista: readonly T[], semente: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < semente.length; i++) h = Math.imul(h ^ semente.charCodeAt(i), 16777619);
  const proximo = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(proximo() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
