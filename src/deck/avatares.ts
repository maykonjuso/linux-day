/**
 * Os avatares. São 64 para que ninguém precise repetir o do colega numa turma
 * de 30, e todos são bichos ou criaturas: nada de bandeiras, comidas ou
 * símbolos que possam virar piada interna.
 */
export const AVATARES = [
  '🐧', '🦊', '🐙', '🦉', '🐢', '🦝', '🐝', '🦈',
  '🐼', '🦅', '🐨', '🐯', '🦁', '🐸', '🐵', '🐴',
  '🦄', '🐮', '🐷', '🐭', '🐹', '🐰', '🐻', '🐻‍❄️',
  '🐔', '🐤', '🦆', '🦇', '🦋', '🐌', '🐞', '🦗',
  '🕷️', '🦂', '🐍', '🦎', '🦖', '🦕', '🐊', '🐬',
  '🐳', '🐋', '🦐', '🦀', '🐡', '🐠', '🐟', '🦑',
  '🦦', '🦥', '🦔', '🐿️', '🦫', '🦨', '🦡', '🐘',
  '🦏', '🦛', '🐪', '🦙', '🦘', '🦌', '🐗', '🦃',
] as const;

export const AVATAR_PADRAO = AVATARES[0];

/**
 * O nome que aparece no prompt do terminal.
 *
 * O Linux não aceita qualquer coisa como nome de usuário, então tiramos acento,
 * espaço e símbolo. A conta de verdade continua sendo alunoNN (o apresentador
 * vê essa no painel, para dar suporte); o que a pessoa lê na tela é o nome dela.
 */
export function usuarioDoNick(nick: string): string {
  const limpo = nick
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 16);
  return limpo || 'aluno';
}
