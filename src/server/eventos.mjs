/**
 * Os eventos ao vivo e o sorteio automático deles.
 *
 * O apresentador dispara qualquer evento pelo painel. Com o automático ligado
 * o servidor sorteia um de tempos em tempos, mas só entre os que fazem
 * sentido naquele momento (`quando`): sabotar o deploy.sh antes de a turma
 * ter criado o deploy.sh, ou abrir uma roleta no meio de uma pergunta, só
 * atrapalha.
 */

export const EVENTOS = {
  'xp-dobrado': { rotulo: 'XP dobrado: todo XP vale 2× por 3 min', quando: (c) => c.multiplicador === 1 },
  relampago: { rotulo: 'relâmpago: XP triplo por 1 min', quando: (c) => c.multiplicador === 1 },
  sabotagem: { rotulo: 'sabotagem: tira o x do deploy.sh de todos', quando: (c) => c.passouDoM3 },
  resgate: { rotulo: 'resgate: +80 XP para os 5 com menos XP', quando: (c) => c.ativos >= 6 },
  'resgate-de-equipe': { rotulo: 'resgate de equipe: +60 XP para a equipe com menos XP', quando: (c) => c.equipesComGente >= 2 },
  'chuva-de-tokens': { rotulo: 'chuva de tokens: +1 token para quem está na sala', quando: () => true },
  roleta: { rotulo: 'roleta: 1 pessoa a cada 20 gira e joga', quando: (c) => !c.roletaAtiva && c.ativos >= 2 },
};

/**
 * Momentos em que nenhum evento automático entra: pergunta aberta (a sala
 * está decidindo contra o relógio), pódio na tela e sala pausada.
 */
export function momentoLivre(c) {
  if (c.pausado) return false;
  if (c.fase === 'aberta' && c.tipoDaCena === 'QuizScene') return false;
  if (c.fase === 'revelada') return false;
  return true;
}

export function eventosElegiveis(c) {
  if (!momentoLivre(c)) return [];
  return Object.entries(EVENTOS).filter(([, e]) => e.quando(c)).map(([id]) => id);
}

export function sortearEvento(c, rng = Math.random) {
  const lista = eventosElegiveis(c);
  return lista.length ? lista[Math.floor(rng() * lista.length)] : null;
}

/** de 6 a 10 minutos entre um evento automático e o próximo */
export function proximoIntervalo(rng = Math.random, { minMs = 6 * 60_000, maxMs = 10 * 60_000 } = {}) {
  return Math.round(minMs + rng() * (maxMs - minMs));
}
