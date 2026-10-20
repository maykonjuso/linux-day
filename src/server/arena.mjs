/**
 * Os jogos de equipe contra equipe.
 *
 * Toda a decisão fica aqui, no servidor: ordem de chegada da corrida, fila do
 * buzzer e quem já respondeu. No cliente isso seria adivinhável e disputável
 * por latência, e o que define a graça desses jogos é justamente a ordem.
 *
 * Premiação por posição, não por acerto: com dez equipes, dar o mesmo XP para
 * todas que terminam tira o sentido da corrida, e dar XP só para a primeira
 * desanima as outras oito no primeiro minuto.
 */
export const PREMIOS_PADRAO = [450, 300, 210, 140];

import { conferir, desafioPublico, explicacaoDe } from './desafios-arena.mjs';

export function criarArena({ emitir, premiarEquipe, premiarPessoa, membrosDaEquipe }) {
  /** rodada em andamento: { cenaId, jogo, ... } */
  let rodada = null;

  const estadoPublico = () => {
    if (!rodada) return null;
    const base = { cenaId: rodada.cenaId, jogo: rodada.jogo, premios: rodada.premios };
    if (rodada.jogo === 'buzzer') {
      return { ...base, fila: rodada.fila, vez: rodada.fila[0] ?? null, erradas: rodada.erradas, resolvido: rodada.resolvido, vencedor: rodada.vencedor ?? null };
    }
    // corrida, montagem e caça ao erro compartilham a ordem de chegada
    return {
      ...base,
      desafio: rodada.desafio ?? null,
      explicacao: rodada.explicacao ?? null,
      chegadas: rodada.chegadas.map((c, i) => ({ ...c, posicao: i + 1 })),
      tentativas: rodada.tentativas ?? {},
    };
  };

  const avisar = () => emitir('arena', estadoPublico());

  function abrir(cenaId, jogo, premios = PREMIOS_PADRAO) {
    if (jogo === 'buzzer') {
      rodada = { cenaId, jogo, premios, fila: [], erradas: [], resolvido: false };
    } else {
      rodada = {
        cenaId, jogo, premios, chegadas: [], tentativas: {},
        // montagem e caça ao erro recebem o desafio sem as respostas
        desafio: jogo === 'corrida' ? null : desafioPublico(cenaId),
      };
    }
    avisar();
  }

  function fechar() { rodada = null; avisar(); }

  /**
   * Mostra a resposta para a sala.
   * Serve para o fim da rodada: quem não chegou vê o porquê, que é mais útil
   * que ficar sem saber.
   */
  function revelarResposta() {
    if (!rodada) return null;
    rodada.explicacao = explicacaoDe(rodada.cenaId);
    avisar();
    return rodada.explicacao;
  }

  /**
   * A equipe terminou a tarefa da corrida. Só a primeira chegada de cada
   * equipe conta, e o XP sai da posição.
   */
  function registrarChegada(equipe, nick) {
    if (!rodada || rodada.jogo !== 'corrida' || !equipe) return null;
    if (rodada.chegadas.some((c) => c.equipe === equipe)) return null;

    const posicao = rodada.chegadas.length + 1;
    const xp = rodada.premios[posicao - 1] ?? rodada.premios[rodada.premios.length - 1] ?? 60;
    rodada.chegadas.push({ equipe, nick, em: Date.now(), xp });

    premiarEquipe(equipe, xp);
    for (const id of membrosDaEquipe(equipe)) premiarPessoa(id, xp, 'corrida', rodada.cenaId);
    avisar();
    return { posicao, xp };
  }

  /**
   * Tentativa de uma equipe nos jogos de montagem e caça ao erro.
   * Erro não custa nada além do tempo: a equipe tenta de novo, e quem acerta
   * primeiro leva mais. Punir erro aqui faria todo mundo esperar o vizinho.
   */
  function tentar(equipe, nick, resposta) {
    if (!rodada || !equipe) return { erro: 'sem rodada' };
    if (rodada.jogo === 'corrida' || rodada.jogo === 'buzzer') return { erro: 'jogo não aceita tentativa' };
    if (rodada.chegadas.some((c) => c.equipe === equipe)) return { erro: 'sua equipe já acertou' };

    rodada.tentativas[equipe] = (rodada.tentativas[equipe] ?? 0) + 1;
    const r = conferir(rodada.cenaId, resposta);
    if (!r.certo) { avisar(); return { certo: false, detalhe: r.detalhe, noLugar: r.noLugar }; }

    const posicao = rodada.chegadas.length + 1;
    const xp = rodada.premios[posicao - 1] ?? rodada.premios[rodada.premios.length - 1] ?? 60;
    rodada.chegadas.push({ equipe, nick, em: Date.now(), xp });
    premiarEquipe(equipe, xp);
    for (const id of membrosDaEquipe(equipe)) premiarPessoa(id, xp, rodada.jogo, rodada.cenaId);
    avisar();
    return { certo: true, posicao, xp, explicacoes: r.explicacoes };
  }

  /** a equipe apertou o botão: entra na fila na ordem em que chegou */
  function buzinar(equipe, nick) {
    if (!rodada || rodada.jogo !== 'buzzer' || rodada.resolvido) return false;
    if (rodada.fila.some((f) => f.equipe === equipe)) return false;
    if (rodada.erradas.includes(equipe)) return false;   // já errou, não volta
    rodada.fila.push({ equipe, nick, em: Date.now() });
    avisar();
    return true;
  }

  /** o apresentador julga a resposta de quem está na vez */
  function julgar(acertou) {
    if (!rodada || rodada.jogo !== 'buzzer') return null;
    const atual = rodada.fila.shift();
    if (!atual) return null;

    if (acertou) {
      const xp = rodada.premios[0] ?? 300;
      rodada.resolvido = true;
      rodada.vencedor = { equipe: atual.equipe, nick: atual.nick, xp };
      premiarEquipe(atual.equipe, xp);
      for (const id of membrosDaEquipe(atual.equipe)) premiarPessoa(id, xp, 'buzzer', rodada.cenaId);
      avisar();
      return { equipe: atual.equipe, xp };
    }

    // errou: perde a vez e não pode voltar na mesma pergunta
    rodada.erradas.push(atual.equipe);
    avisar();
    return { equipe: atual.equipe, xp: 0 };
  }

  return {
    abrir, fechar, registrarChegada, tentar, buzinar, julgar, revelarResposta,
    estadoPublico, get rodada() { return rodada; },
  };
}
