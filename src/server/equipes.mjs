/**
 * Regras de equipe que não dependem de socket nem de banco, para poderem ser
 * testadas sozinhas (testes/equipes.mjs).
 */

/** Índices das cenas em que a turma escolhe algo da equipe (equipe ou carta). */
export function cenasDeEscolha(deck) {
  return deck.flatMap((c, i) => (c.tipo === 'GroupScene' ? [i] : []));
}

/**
 * Quem está na sala agora e não tem equipe.
 *
 * Só conta quem está ativo: uma aba esquecida ("ocioso") ou um notebook que
 * fechou ("desconectado") não pode segurar a apresentação inteira.
 */
export function semEquipe(participantes) {
  return [...participantes]
    .filter((p) => p.presenca === 'ativo' && !p.grupo)
    .map((p) => ({ id: p.id, nick: p.nick, emoji: p.emoji }));
}

/**
 * O apresentador pode ir da cena `de` para a cena `para`?
 *
 * Avançar passando por uma cena de escolha (sair dela ou pular por cima com o
 * "ir para…") exige que todo mundo ativo já esteja numa equipe. Sem isso a
 * pessoa chega nos jogos de equipe e no chamado sem time, e nada do que ela
 * faz conta. Voltar é sempre livre.
 *
 * Devolve `null` quando pode, ou o motivo quando não pode.
 */
export function bloqueioDoAvanco({ deck, de, para, participantes }) {
  if (!(para > de)) return null;
  const escolha = cenasDeEscolha(deck).find((i) => i >= de && i < para);
  if (escolha === undefined) return null;
  const pendentes = semEquipe(participantes);
  if (!pendentes.length) return null;
  return { cenaId: deck[escolha].id, titulo: deck[escolha].titulo, pendentes };
}

/**
 * Coloca cada pessoa sem equipe na equipe com menos gente que ainda tem vaga
 * (empate: a que vem primeiro na lista). Não mexe em quem já escolheu, ao
 * contrário do sortear, que redistribui a sala inteira.
 *
 * Devolve os pares [id, equipe]; quem não coube em lugar nenhum fica de fora.
 */
export function distribuirSemEquipe(grupos, ids) {
  // pode chegar um iterador (Map.values()), que só dá para percorrer uma vez
  const lista = [...grupos];
  const tamanhos = new Map(lista.map((g) => [g.nome, g.membros.size ?? g.membros.length]));
  const pares = [];
  for (const id of ids) {
    const alvo = lista
      .filter((g) => tamanhos.get(g.nome) < g.capacidade)
      .sort((a, b) => tamanhos.get(a.nome) - tamanhos.get(b.nome))[0];
    if (!alvo) break;
    tamanhos.set(alvo.nome, tamanhos.get(alvo.nome) + 1);
    pares.push([id, alvo.nome]);
  }
  return pares;
}

/** As cartas de função válidas, lidas da cena de cartas do deck. */
export function cartasDoDeck(deck) {
  return deck.flatMap((c) => (c.tipo === 'GroupScene' && c.modo === 'papeis' ? c.papeis ?? [] : []));
}

/**
 * Remonta o mapa de cartas de cada equipe a partir do que está gravado em cada
 * pessoa.
 *
 * O banco guarda a carta na pessoa, não na equipe. Sem remontar, depois de um
 * reinício do servidor a pessoa continuava vendo a própria carta, mas a equipe
 * ficava com o mapa vazio: as cartas apareciam livres, uma segunda pessoa
 * conseguia pegar a mesma, e a trava "só quem tem a carta entrega" sumia.
 *
 * Carta repetida na mesma equipe fica com quem aparece primeiro; dos outros
 * ela é tirada (e o id volta em `soltos`, para gravar a correção).
 */
export function remontarCartas(participantes, validas) {
  const porEquipe = new Map();
  const soltos = [];
  for (const p of participantes) {
    if (!p.grupo || !p.papel) continue;
    const mapa = porEquipe.get(p.grupo) ?? {};
    const repetida = Object.values(mapa).includes(p.papel);
    if (!validas.has(p.papel) || repetida) { soltos.push(p.id); continue; }
    mapa[p.id] = p.papel;
    porEquipe.set(p.grupo, mapa);
  }
  return { porEquipe, soltos };
}
