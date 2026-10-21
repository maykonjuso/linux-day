/**
 * A roleta: nivela o jogo entre quem tem mais e quem tem menos XP.
 *
 * Uma pessoa a cada 20 da sala é sorteada para girar. As fatias que ela vê
 * dependem da faixa de XP dela: quem está embaixo tem fatias que pagam mais,
 * quem está em cima tem fatias que pagam menos. Duas regras do jogo continuam
 * valendo aqui:
 *   - XP nunca vai abaixo de zero. "Perder XP" é um desconto que para no zero.
 *   - Quem decide é o servidor: os duelos (par ou ímpar, pedra-papel-tesoura)
 *     são resolvidos aqui com os lances dos dois, que só aparecem no fim.
 *     Só as dinâmicas faladas em voz alta pedem o apresentador.
 *
 * Uma pessoa gira por vez: a próxima espera a dinâmica da anterior terminar.
 *
 * Este módulo não conhece socket nem banco. Ele recebe o sorteio (`rng`) e
 * devolve o que premiar, e quem aplica é o servidor; é o que deixa as regras
 * serem testadas com um sorteio fixo.
 */

export const PESSOAS_POR_GIRO = 20;

/** quanto vale cada fatia, por faixa: quem tem menos XP ganha mais */
export const VALOR = { baixo: 300, medio: 200, alto: 120 };

export const FATIAS = {
  'bonus-direto': { rotulo: 'XP de presente', icone: 'premio' },
  'par-impar': { rotulo: 'par ou ímpar', icone: 'binario' },   // duelo: quem gira escolhe o adversário
  // pedra, papel e tesoura é sempre um duelo: quem gira escolhe o adversário
  ppt: { rotulo: 'pedra, papel, tesoura', icone: 'pessoas' },
  'perde-xp': { rotulo: 'alguém perde XP', icone: 'xp' },
  'fala-comando': { rotulo: 'explique um comando', icone: 'terminal' },
  'equipe-desafio': { rotulo: 'desafio da equipe', icone: 'pessoas' },
};

/** peso de cada fatia por faixa (0 = não aparece na roleta daquela faixa) */
const PESOS = {
  baixo: { 'bonus-direto': 3, 'par-impar': 2, ppt: 3, 'perde-xp': 1, 'fala-comando': 1, 'equipe-desafio': 1 },
  medio: { 'bonus-direto': 1, 'par-impar': 2, ppt: 4, 'perde-xp': 1, 'fala-comando': 1, 'equipe-desafio': 1 },
  alto: { 'bonus-direto': 0, 'par-impar': 2, ppt: 4, 'perde-xp': 0, 'fala-comando': 2, 'equipe-desafio': 1 },
};

export const DINAMICAS_FALADAS = {
  'fala-comando': 'Em voz alta: escolha um comando que você aprendeu hoje e diga o que ele faz, com um exemplo.',
  'equipe-desafio': 'A equipe tem 60 segundos para falar, em voz alta, três comandos que mexem com arquivos.',
};

const PPT = ['pedra', 'papel', 'tesoura'];
const ganhaDe = { pedra: 'tesoura', papel: 'pedra', tesoura: 'papel' };

/** terço de baixo, do meio ou de cima no XP de quem está na sala */
export function faixaDe(id, participantes) {
  const ordenados = [...participantes].sort((a, b) => a.xp - b.xp);
  const i = ordenados.findIndex((p) => p.id === id);
  if (i < 0 || ordenados.length < 3) return 'medio';
  const pos = i / (ordenados.length - 1);
  return pos < 1 / 3 ? 'baixo' : pos > 2 / 3 ? 'alto' : 'medio';
}

export function fatiasDa(faixa) {
  return Object.entries(PESOS[faixa]).filter(([, p]) => p > 0).map(([id]) => ({ id, ...FATIAS[id] }));
}

function sortearPeso(faixa, rng) {
  const lista = Object.entries(PESOS[faixa]).filter(([, p]) => p > 0);
  let alvo = rng() * lista.reduce((s, [, p]) => s + p, 0);
  for (const [id, p] of lista) { alvo -= p; if (alvo < 0) return id; }
  return lista[lista.length - 1][0];
}

/** quantas pessoas giram: uma a cada 20, no mínimo uma */
export const quantosGiram = (n) => (n > 0 ? Math.ceil(n / PESSOAS_POR_GIRO) : 0);

export function criarRoleta({ rng = Math.random } = {}) {
  let fila = [];      // ids que ainda vão girar
  let atual = null;   // a vez de agora

  const publico = () => ({ fila: [...fila], atual: atual ? { ...atual } : null });

  /** sorteia quem gira entre quem está ativo; não começa por cima de outra roleta */
  function iniciar(ativos) {
    if (atual || fila.length) return { erro: 'já tem uma roleta acontecendo' };
    const ids = ativos.map((p) => p.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    fila = ids.slice(0, quantosGiram(ids.length));
    return { sorteados: [...fila] };
  }

  /** chama a próxima pessoa, só quando a anterior terminou */
  function proximo(participantes) {
    if (atual && atual.fase !== 'fim') return { erro: 'a dinâmica anterior ainda não terminou' };
    atual = null;
    const id = fila.shift();
    if (!id) return { acabou: true };
    const faixa = faixaDe(id, participantes);
    atual = { id, faixa, valor: VALOR[faixa], fatias: fatiasDa(faixa), fase: 'girar', fatia: null };
    return { atual };
  }

  /** só a pessoa da vez gira (o servidor também gira por ela, se ela sumir) */
  function girar(quem) {
    if (!atual || atual.fase !== 'girar') return { erro: 'não é hora de girar' };
    if (quem !== atual.id) return { erro: 'não é a sua vez' };
    atual.fatia = sortearPeso(atual.faixa, rng);
    if (atual.fatia === 'bonus-direto') {
      atual.fase = 'fim';
      atual.resultado = { texto: `+${atual.valor} XP de presente` };
      return { premios: [{ id: atual.id, xp: atual.valor }] };
    }
    // par ou ímpar e pedra-papel-tesoura são duelos: quem gira escolhe o adversário
    atual.fase = ['par-impar', 'ppt', 'perde-xp'].includes(atual.fatia) ? 'indicar' : 'julgar';
    if (atual.fase === 'julgar') atual.dinamica = DINAMICAS_FALADAS[atual.fatia];
    return {};
  }

  /** os dois duelos: cada lado escolhe na própria tela, e a regra do jogo decide */
  function escolher(quem, escolha) {
    if (!atual || atual.fase !== 'escolher') return { erro: 'não é hora de escolher' };
    // par ou ímpar: quem gira manda "par:3" (o lado e os dedos), o adversário
    // fica com o outro lado e manda só os dedos ("2"); a soma decide
    if (atual.fatia === 'par-impar') {
      if (![atual.id, atual.alvo].includes(quem)) return { erro: 'você não está neste duelo' };
      if (atual.escolhas?.[quem]) return { erro: 'você já escolheu' };
      const valido = quem === atual.id ? /^(par|impar):[0-5]$/.test(escolha) : /^[0-5]$/.test(escolha);
      if (!valido) return { erro: quem === atual.id ? 'escolha par ou ímpar e quantos dedos (0 a 5)' : 'escolha quantos dedos (0 a 5)' };
      atual.escolhas = { ...(atual.escolhas ?? {}), [quem]: escolha };
      const a = atual.escolhas[atual.id];
      const b = atual.escolhas[atual.alvo];
      if (!a || !b) return { esperando: true };
      const [lado, dedos] = a.split(':');
      const soma = Number(dedos) + Number(b);
      const deu = soma % 2 === 0 ? 'par' : 'impar';
      const vencedor = deu === lado ? atual.id : atual.alvo;
      atual.fase = 'fim';
      atual.resultado = { vencedor, soma, texto: `${dedos} + ${b} = ${soma}, deu ${deu === 'par' ? 'par' : 'ímpar'} · +${atual.valor} XP` };
      return { premios: [{ id: vencedor, xp: atual.valor }] };
    }
    if (!PPT.includes(escolha)) return { erro: 'escolha pedra, papel ou tesoura' };
    // duelo: os dois escolhem, e quem decide é a regra do jogo
    if (atual.fatia === 'ppt') {
      if (![atual.id, atual.alvo].includes(quem)) return { erro: 'você não está neste duelo' };
      if (atual.escolhas?.[quem]) return { erro: 'você já escolheu' };
      atual.escolhas = { ...(atual.escolhas ?? {}), [quem]: escolha };
      const a = atual.escolhas[atual.id];
      const b = atual.escolhas[atual.alvo];
      if (!a || !b) return { esperando: true };
      atual.fase = 'fim';
      if (a === b) {
        const xp = Math.round(atual.valor / 3);
        atual.resultado = { texto: `empate: +${xp} XP para os dois`, empate: true };
        return { premios: [{ id: atual.id, xp }, { id: atual.alvo, xp }] };
      }
      const vencedor = ganhaDe[a] === b ? atual.id : atual.alvo;
      atual.resultado = { vencedor, texto: `+${atual.valor} XP` };
      return { premios: [{ id: vencedor, xp: atual.valor }] };
    }
    return { erro: 'não é hora de escolher' };
  }

  /** a pessoa da vez indica alguém: o adversário do duelo, ou quem perde XP */
  function indicar(quem, alvo, participantes) {
    if (!atual || atual.fase !== 'indicar') return { erro: 'não é hora de indicar' };
    if (quem !== atual.id) return { erro: 'não é a sua vez' };
    if (alvo === atual.id || !participantes.some((p) => p.id === alvo)) return { erro: 'indique outra pessoa da sala' };
    atual.alvo = alvo;
    if (atual.fatia === 'perde-xp') {
      atual.fase = 'fim';
      atual.resultado = { texto: `perdeu ${atual.valor} XP` };
      return { perdas: [{ id: alvo, xp: atual.valor }] };
    }
    atual.fase = 'escolher';
    return {};
  }

  /** dinâmica falada: o apresentador diz se cumpriu */
  function julgar(cumpriu, equipeDe) {
    if (!atual || atual.fase !== 'julgar') return { erro: 'não há dinâmica para julgar' };
    atual.fase = 'fim';
    atual.resultado = { texto: cumpriu ? `cumpriu: +${atual.valor} XP` : 'não foi dessa vez' };
    if (!cumpriu) return { premios: [] };
    if (atual.fatia === 'equipe-desafio') {
      const membros = equipeDe(atual.id);
      return { premios: (membros.length ? membros : [atual.id]).map((id) => ({ id, xp: atual.valor })) };
    }
    return { premios: [{ id: atual.id, xp: atual.valor }] };
  }

  /**
   * A pessoa da vez sumiu ou travou: o servidor age por ela, com uma escolha
   * sorteada. Sem isso a fila parava, e a próxima pessoa nunca girava.
   */
  function agirPorEla(participantes) {
    if (!atual) return {};
    if (atual.fase === 'girar') return girar(atual.id);
    if (atual.fase === 'escolher') {
      const falta = [atual.id, atual.alvo].find((x) => !atual.escolhas?.[x]);
      if (atual.fatia === 'par-impar') {
        const dedos = Math.floor(rng() * 6);
        return escolher(falta, falta === atual.id ? `${rng() < 0.5 ? 'par' : 'impar'}:${dedos}` : String(dedos));
      }
      return escolher(falta, PPT[Math.floor(rng() * 3)]);
    }
    if (atual.fase === 'indicar') {
      const outros = participantes.filter((p) => p.id !== atual.id);
      if (!outros.length) { atual.fase = 'fim'; atual.resultado = { texto: 'ninguém para indicar' }; return {}; }
      return indicar(atual.id, outros[Math.floor(rng() * outros.length)].id, participantes);
    }
    return {};   // julgar: só o apresentador
  }

  function cancelar() { fila = []; atual = null; }

  return { iniciar, proximo, girar, escolher, indicar, julgar, agirPorEla, cancelar, publico, get atual() { return atual; }, get fila() { return fila; } };
}
