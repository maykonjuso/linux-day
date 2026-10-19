/**
 * O deck é uma máquina de estados de cenas e passos.
 * Uma cena = um slide. Um passo = um avanço dentro dela (revelação do quiz,
 * abertura do terminal, etc). O apresentador só aperta "próximo"; quem sabe
 * o que isso significa é a cena.
 */

export type Papel = 'screen' | 'player' | 'host';

export type FaseCena = 'idle' | 'aberta' | 'encerrada' | 'revelada';

export type TipoWidget =
  | 'permission-toggles'
  | 'pipe-builder'
  | 'fs-dragdrop'
  | 'path-quiz'
  | 'escape-room'
  | 'spot-the-danger'
  | 'predict-output'
  | 'error-match'
  | 'command-builder';

/** Uma linha de terminal demonstrada no slide: entrada + saída reais. */
export interface LinhaTerminal {
  comando: string;
  saida?: string;
  /** trecho da saída que fica aceso (o resto esmaece) */
  destaque?: string;
  /** "o que acabou de acontecer", em linguagem humana */
  traducao?: string;
}

export interface Alternativa {
  id: string;
  texto: string;
}

interface CenaBase {
  id: string;
  modulo: number;
  titulo: string;
  /**
   * Ilustração da cena (arquivo em public/ilustra, ver src/components/Ilustra).
   * Opcional: sem ela a cena usa a ilustração padrão do módulo. Serve para dar
   * uma imagem ao conceito, que é o que a memória guarda quando o texto já
   * escorreu.
   */
  ilustra?: string;
  /**
   * Quantos avanços esta cena consome antes de passar para a próxima.
   *
   * Vale só para cenas de CONTEÚDO (as linhas do terminal demonstrado, o
   * resumo do fecho). Cenas em que a turma AGE (quiz, widget, lab) são
   * guiadas por FASE: abrir, revelar, encerrar. Nelas `passos` é sempre 1,
   * senão o painel pede cliques que não mudam nada na tela.
   */
  passos: number;
}

export interface CenaCapa extends CenaBase {
  tipo: 'ModuleCover';
  pergunta: string;
  xpDoModulo: number;
}

export interface CenaModeloMental extends CenaBase {
  tipo: 'MentalModel';
  legenda: string;
  /** nome do diagrama inline (um componente SVG por nome) */
  diagrama: 'arvore' | 'processo' | 'cadeados' | 'encanamento';
}

export interface CenaAnatomia extends CenaBase {
  tipo: 'CommandAnatomy';
  comando: string;
  partes: { trecho: string; rotulo: string }[];
}

export interface CenaTerminalDemo extends CenaBase {
  tipo: 'TerminalDemo';
  /** um passo por linha: você avança, a próxima linha aparece */
  linhas: LinhaTerminal[];
}

export interface CenaErros extends CenaBase {
  tipo: 'WillGoWrong';
  erros: { mensagem: string; significa: string; causa: string }[];
}

export interface CenaQuiz extends CenaBase {
  tipo: 'QuizScene';
  pergunta: string;
  alternativas: Alternativa[];
  correta: string;
  segundos: number;
  explicacao: string;
}

export interface CenaWidget extends CenaBase {
  tipo: 'WidgetScene';
  widget: TipoWidget;
  enunciado: string;
  segundos: number;
  /** comando equivalente ao que a pessoa fez com o mouse — a ponte para o terminal */
  pontePara?: string;
}

export interface CenaLab extends CenaBase {
  tipo: 'LabScene';
  /** casa com a chave em src/server/labs.mjs (os checkers) */
  taskSlug: string;
  objetivo: string;
  criterios: { id: string; descricao: string; xp: number }[];
  comandosDoModulo: string[];
  segundos: number;
  escopo: 'individual' | 'grupo';
}

export interface CenaGrupos extends CenaBase {
  tipo: 'GroupScene';
  enunciado: string;
  /**
   * Duas telas separadas, de propósito: escolher a equipe é uma decisão, e
   * escolher a carta de função é outra. Juntas na mesma cena, os cartões
   * ficavam pequenos e a informação vazava deles.
   */
  modo: 'equipes' | 'papeis';
  /** no chamado, as cartas de função que cada membro assume (modo papeis) */
  papeis?: { id: string; nome: string; faz: string }[];
}

export interface CenaPlacar extends CenaBase {
  tipo: 'Scoreboard';
  escopo: 'individual' | 'grupo';
}

export interface CenaRecap extends CenaBase {
  tipo: 'Recap';
  perguntaDeRecuperacao: string;
  resumo: string[];
}

export type Cena =
  | CenaCapa
  | CenaModeloMental
  | CenaAnatomia
  | CenaTerminalDemo
  | CenaErros
  | CenaQuiz
  | CenaWidget
  | CenaLab
  | CenaGrupos
  | CenaPlacar
  | CenaRecap;

/** Estado sincronizado do evento — a única fonte de verdade, no servidor. */
export interface EstadoEvento {
  cenaIndex: number;
  /** id da cena da vez: usado para validar resposta de quiz no servidor */
  cenaId?: string | null;
  passo: number;
  fase: FaseCena;
  pausado: boolean;
  /** segundos restantes quando a cena tem timer, ou null */
  restante: number | null;
}

export interface Participante {
  id: string;
  nick: string;
  emoji: string;
  xp: number;
  tokens: number;
  nivel: number;
  grupo: string | null;
  presenca: 'ativo' | 'ocioso' | 'desconectado';
  /** se navegou sozinho: saiu do "ao vivo" */
  livre: boolean;
  /** conta Linux (aluno01…) que o terminal dele usa */
  conta?: string;
  /** carta de função no boss */
  papel?: string | null;
  /** critérios já premiados (adesivos: uma vez verdes, verdes para sempre) */
  criterios?: string[];
  badges?: string[];
  combo?: number;
  /** o apresentador silenciou o chat desta pessoa */
  silenciado?: boolean;
}

/** Mesma tabela do servidor (src/server/jogo.mjs) — mantenha as duas em sincronia. */
export const NIVEIS = [
  { nivel: 1, xp: 0, patente: 'Visitante', prompt: 'visitante@linuxday:~$' },
  { nivel: 2, xp: 300, patente: 'Usuário', prompt: '{nick}@linuxday:~$' },
  { nivel: 3, xp: 700, patente: 'Operador', prompt: '{nick}@servidor:~$' },
  { nivel: 4, xp: 1300, patente: 'Sysadmin', prompt: '{nick}@servidor:/etc$' },
  { nivel: 5, xp: 1900, patente: 'Root', prompt: 'root@servidor:/#' },
] as const;

/**
 * `prompt` traz `{nick}`, que é trocado pelo nome tratado da pessoa
 * (`usuarioDoNick`), o mesmo que aparece no terminal dela.
 */
export function nivelDe(xp: number): (typeof NIVEIS)[number] {
  let atual: (typeof NIVEIS)[number] = NIVEIS[0];
  for (const n of NIVEIS) if (xp >= n.xp) atual = n;
  return atual;
}
