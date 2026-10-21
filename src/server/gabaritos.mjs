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
  // M0
  'm0-q1': { correta: 'b', segundos: 20, xpBase: 40 },
  'm0-q3': { correta: 'b', segundos: 20, xpBase: 40 },
  'm0-q4': { correta: 'b', segundos: 20, xpBase: 40 },
  'm0-q7': { correta: 'c', segundos: 20, xpBase: 40 },
  // M1 · kit de fuga (escape-room → 3 QuizScenes individuais)
  'm1-fuga-q1': { correta: 'a', segundos: 20, xpBase: 40 },  // q
  'm1-fuga-q2': { correta: 'a', segundos: 20, xpBase: 40 },  // Esc depois :q!
  'm1-fuga-q3': { correta: 'a', segundos: 20, xpBase: 40 },  // Ctrl+C interrompe
  // M5 · predict-output → 3 QuizScenes individuais
  'm5-prever-q1': { correta: 'a', segundos: 20, xpBase: 40 },  // prompt não volta
  'm5-prever-q2': { correta: 'a', segundos: 20, xpBase: 40 },  // prompt volta + PID
  'm5-prever-q3': { correta: 'a', segundos: 20, xpBase: 40 },  // processo encerrado
};

export const gabaritoDe = (cenaId) => GABARITOS[cenaId] ?? null;
