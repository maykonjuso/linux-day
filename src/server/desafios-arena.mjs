/**
 * Os desafios dos jogos de equipe, com as respostas.
 *
 * Fica no servidor pelo mesmo motivo dos gabaritos do quiz: no pacote do
 * navegador, qualquer pessoa leria a ordem certa do pipeline nas ferramentas de
 * desenvolvedor. O cliente recebe só as peças (embaralhadas) e manda a
 * tentativa; quem julga é o servidor.
 */

export const DESAFIOS = {
  // ── montagem: montar a linha de comando na ordem certa ──
  'arena-pipeline': {
    jogo: 'montagem',
    enunciado: 'Montem a linha que mostra os 3 erros mais frequentes do log.',
    pecas: [
      { id: 'cat', rotulo: 'cat app.log' },
      { id: 'grep', rotulo: 'grep ERROR' },
      { id: 'cut', rotulo: 'cut -d" " -f4' },
      { id: 'sort', rotulo: 'sort' },
      { id: 'uniq', rotulo: 'uniq -c' },
      { id: 'sortrn', rotulo: 'sort -rn' },
      { id: 'head', rotulo: 'head -3' },
    ],
    ordem: ['cat', 'grep', 'cut', 'sort', 'uniq', 'sortrn', 'head'],
  },

  'arena-permissao': {
    jogo: 'montagem',
    enunciado: 'Montem o comando que instala o htop como administrador, sem perguntas.',
    pecas: [
      { id: 'sudo', rotulo: 'sudo' },
      { id: 'apt', rotulo: 'apt' },
      { id: 'install', rotulo: 'install' },
      { id: 'y', rotulo: '-y' },
      { id: 'htop', rotulo: 'htop' },
      { id: 'remove', rotulo: 'remove' },
      { id: 'help', rotulo: '--help' },
    ],
    ordem: ['sudo', 'apt', 'install', 'y', 'htop'],
  },

  // ── caça ao erro: achar as linhas erradas ──
  'arena-caca-erro': {
    jogo: 'caca-erro',
    enunciado: 'Três destas linhas não vão funcionar. Achem as três.',
    linhas: [
      { id: 'l1', texto: 'cd ~/projeto' },
      { id: 'l2', texto: 'mkdir -p src/app' },
      { id: 'l3', texto: 'cat Notas.txt', erro: 'o arquivo é notas.txt: maiúscula importa' },
      { id: 'l4', texto: 'chmod +x deploy.sh' },
      { id: 'l5', texto: 'rm pasta', erro: 'é uma pasta: falta o -r' },
      { id: 'l6', texto: 'grep -c ERROR app.log' },
      { id: 'l7', texto: 'node app.js &' },
      { id: 'l8', texto: 'kill node', erro: 'kill precisa do PID, não do nome' },
    ],
  },
};

export const desafioDe = (cenaId) => DESAFIOS[cenaId] ?? null;

/** a parte do desafio que pode ir para o navegador (sem as respostas) */
export function desafioPublico(cenaId, embaralhar = true) {
  const d = DESAFIOS[cenaId];
  if (!d) return null;
  if (d.jogo === 'montagem') {
    const pecas = [...d.pecas];
    if (embaralhar) pecas.sort(() => Math.random() - 0.5);
    return { jogo: d.jogo, enunciado: d.enunciado, pecas, tamanho: d.ordem.length };
  }
  return {
    jogo: d.jogo, enunciado: d.enunciado,
    // sem o campo `erro`: é exatamente o que a equipe tem de descobrir
    linhas: d.linhas.map(({ id, texto }) => ({ id, texto })),
    quantos: d.linhas.filter((l) => l.erro).length,
  };
}

/**
 * Confere a tentativa de uma equipe.
 *
 * Quando erra, a resposta diz **quanto** está certo, sem dizer o quê: quantas
 * peças estão na posição certa, ou quantas das linhas marcadas realmente têm
 * erro. É o retorno de jogo de adivinhação clássico, e serve ao workshop por
 * dois motivos: a equipe descobre sozinha em vez de esperar o gabarito, e
 * ninguém consegue extrair a resposta inteira de uma tentativa só.
 */
export function conferir(cenaId, resposta) {
  const d = DESAFIOS[cenaId];
  if (!d) return { certo: false, detalhe: 'desafio desconhecido' };

  if (d.jogo === 'montagem') {
    const tentativa = Array.isArray(resposta) ? resposta : [];
    const certo = tentativa.length === d.ordem.length && tentativa.every((p, i) => p === d.ordem[i]);
    if (certo) return { certo: true, detalhe: 'ordem certa', explicacoes: explicarMontagem(d) };

    const noLugar = tentativa.filter((p, i) => p === d.ordem[i]).length;
    const sobrando = tentativa.filter((p) => !d.ordem.includes(p));
    const detalhe = tentativa.length !== d.ordem.length
      ? `a linha certa tem ${d.ordem.length} peças, e vocês usaram ${tentativa.length}`
      : sobrando.length
        ? `${sobrando.length} peça${sobrando.length > 1 ? 's' : ''} não entra${sobrando.length > 1 ? 'm' : ''} nesta linha`
        : `${noLugar} de ${d.ordem.length} peças estão na posição certa`;
    return { certo: false, detalhe, noLugar };
  }

  const escolhidas = new Set(Array.isArray(resposta) ? resposta : []);
  const comErro = d.linhas.filter((l) => l.erro).map((l) => l.id);
  const acertou = [...escolhidas].filter((id) => comErro.includes(id)).length;
  const certo = escolhidas.size === comErro.length && comErro.every((id) => escolhidas.has(id));

  if (certo) return { certo: true, detalhe: `as ${comErro.length}`, explicacoes: explicarCaca(d) };
  return {
    certo: false,
    noLugar: acertou,
    detalhe: escolhidas.size !== comErro.length
      ? `são ${comErro.length} linhas com erro, e vocês marcaram ${escolhidas.size}`
      : `${acertou} das ${comErro.length} que vocês marcaram realmente têm erro`,
  };
}

/** a explicação que aparece quando a equipe acerta (e para a turma, no fim) */
export function explicarMontagem(d) {
  return d.ordem.map((id, i) => {
    const peca = d.pecas.find((p) => p.id === id);
    return { texto: peca?.rotulo ?? id, erro: `${i + 1}ª peça da linha` };
  });
}

export function explicarCaca(d) {
  return d.linhas.filter((l) => l.erro).map((l) => ({ texto: l.texto, erro: l.erro }));
}

/** o apresentador pode mostrar a resposta para a sala quando o tempo acaba */
export function explicacaoDe(cenaId) {
  const d = DESAFIOS[cenaId];
  if (!d) return null;
  return d.jogo === 'montagem' ? explicarMontagem(d) : explicarCaca(d);
}
