/**
 * As respostas certas do quiz. Só aqui, só no servidor.
 *
 * Enquanto elas viviam no mesmo arquivo de conteúdo que desenha a tela, iam
 * dentro do pacote JavaScript que o navegador baixa: qualquer pessoa abria as
 * ferramentas de desenvolvedor e lia o gabarito da próxima pergunta. Num
 * workshop com placar, isso é o fim da graça.
 *
 * Agora o cliente conhece só as alternativas. Quem decide quem acertou é o
 * servidor, e o apresentador recebe o gabarito por um canal que só ele escuta.
 */
export const GABARITOS = {
  'm0-q1': { correta: 'b', segundos: 20, xpBase: 40 },
  'm0-q2': { correta: 'a', segundos: 20, xpBase: 40 },
  'm0-q3': { correta: 'b', segundos: 20, xpBase: 40 },
  'm0-q4': { correta: 'b', segundos: 20, xpBase: 40 },
  'm0-q5': { correta: 'c', segundos: 20, xpBase: 40 },
  'm0-q6': { correta: 'b', segundos: 20, xpBase: 40 },
  'm0-q7': { correta: 'c', segundos: 20, xpBase: 40 },
  'm0-q8': { correta: 'd', segundos: 20, xpBase: 40 },
  'm0-q9': { correta: 'b', segundos: 20, xpBase: 40 },
  'kr-1': { correta: 'b', segundos: 20, xpBase: 40 },
  'kr-2': { correta: 'a', segundos: 20, xpBase: 40 },
  'kr-3': { correta: 'b', segundos: 20, xpBase: 40 },
  'kr-4': { correta: 'b', segundos: 20, xpBase: 40 },
};

export const gabaritoDe = (cenaId) => GABARITOS[cenaId] ?? null;
