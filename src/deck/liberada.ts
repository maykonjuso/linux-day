import type { Arena } from './useArena';
import type { Cena, Papel } from './types';
import { DECK } from './content';

/**
 * A parte interativa da cena já foi liberada para a turma?
 *
 * É o ritmo do Kahoot: ao chegar numa pergunta, exercício ou laboratório, a
 * sala vê só o enunciado, e quem apresenta explica. O próximo avanço abre a
 * fase, e só aí aparecem as opções (ou o exercício, ou o terminal) e o tempo
 * começa. Quem já passou da cena (olhando para trás no modo livre) continua
 * vendo o conteúdo, para poder revisar.
 *
 * O apresentador sempre vê tudo: ele precisa da prévia para explicar.
 */
export function liberada(arena: Arena, cena: Cena, papel: Papel): boolean {
  if (papel === 'host') return true;
  const indice = DECK.findIndex((c) => c.id === cena.id);
  if (indice < arena.estado.cenaIndex) return true;
  return indice === arena.estado.cenaIndex && arena.estado.fase !== 'idle';
}

/**
 * A cena já passou (a sala está mais à frente)? Quem volta para revê-la vê o
 * que foi feito, mas tudo fica travado: não responde, não edita, não joga.
 */
export function encerrada(arena: Arena, cena: Cena, papel: Papel): boolean {
  if (papel === 'host') return false;
  return DECK.findIndex((c) => c.id === cena.id) < arena.estado.cenaIndex;
}
