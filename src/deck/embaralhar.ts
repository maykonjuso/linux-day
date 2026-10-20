/**
 * Embaralha de forma determinística: a mesma semente dá sempre a mesma ordem.
 *
 * Precisa ser assim porque projetor e participante desenham a mesma pergunta
 * em aparelhos diferentes, e a cor e a forma (▲ ◆ ● ■) de cada alternativa
 * têm que bater nas duas telas. Um sorteio de verdade daria uma ordem por
 * aparelho; um sorteio por semente dá uma ordem por pergunta, e a resposta
 * certa deixa de cair sempre na mesma posição.
 */
export function embaralhar<T>(lista: readonly T[], semente: string): T[] {
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
