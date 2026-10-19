/**
 * Mesma regra do cliente (src/deck/avatares.ts): o nome que vai no prompt do
 * terminal sai do nick, sem acento, espaço nem símbolo. A conta real continua
 * sendo alunoNN, e é ela que aparece no painel do apresentador para suporte.
 */
export function usuarioDoNick(nick = '') {
  const limpo = String(nick)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 16);
  return limpo || 'aluno';
}
