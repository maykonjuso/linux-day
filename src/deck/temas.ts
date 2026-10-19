/**
 * Temas: o do slide e o do terminal.
 *
 * O do slide tem um padrão deliberado por papel: CLARO no projetor, porque sala
 * com luz acesa come o preto e o dark theme bonito no monitor vira sopa cinza
 * na parede. No notebook de cada pessoa a escolha é dela, e fica guardada.
 *
 * Os temas do terminal são recompensa: dois abertos desde o começo e os outros
 * desbloqueiam por nível. É a única recompensa do jogo que a pessoa leva para a
 * tela onde ela está trabalhando.
 */
export type NomeTema = 'claro' | 'escuro';

export interface TemaTerminal {
  id: string;
  nome: string;
  nivelMinimo: number;
  cores: {
    background: string; foreground: string; cursor: string; cursorAccent: string;
    selectionBackground: string;
    black: string; red: string; green: string; yellow: string; blue: string;
    magenta: string; cyan: string; white: string;
    brightBlack: string; brightRed: string; brightGreen: string; brightYellow: string;
    brightBlue: string; brightMagenta: string; brightCyan: string; brightWhite: string;
  };
}

const comuns = {
  cursorAccent: '#16161a',
  black: '#16161a', white: '#e8e8ea',
  brightBlack: '#6b6b76', brightWhite: '#ffffff',
};

export const TEMAS_TERMINAL: TemaTerminal[] = [
  {
    id: 'noite', nome: 'Noite', nivelMinimo: 1,
    cores: {
      ...comuns, background: '#16161a', foreground: '#e8e8ea', cursor: '#7dd3a0',
      selectionBackground: '#33415588',
      red: '#ff7b72', green: '#7dd3a0', yellow: '#ffd479', blue: '#79b8ff',
      magenta: '#d2a8ff', cyan: '#76e3ea',
      brightRed: '#ffa198', brightGreen: '#a2f0c1', brightYellow: '#ffe3a3',
      brightBlue: '#a5d6ff', brightMagenta: '#e2c5ff', brightCyan: '#a5f3f6',
    },
  },
  {
    id: 'papel', nome: 'Papel', nivelMinimo: 1,
    cores: {
      ...comuns, background: '#faf8f3', foreground: '#2b2b2f', cursor: '#1d4ed8',
      cursorAccent: '#faf8f3', selectionBackground: '#1d4ed822',
      black: '#2b2b2f', white: '#4b5563',
      red: '#b91c1c', green: '#15803d', yellow: '#a16207', blue: '#1d4ed8',
      magenta: '#7c3aed', cyan: '#0891b2',
      brightBlack: '#8a8a94', brightRed: '#dc2626', brightGreen: '#16a34a',
      brightYellow: '#ca8a04', brightBlue: '#2563eb', brightMagenta: '#9333ea',
      brightCyan: '#0e7490', brightWhite: '#111113',
    },
  },
  {
    id: 'matrix', nome: 'Matrix', nivelMinimo: 2,
    cores: {
      ...comuns, background: '#06120a', foreground: '#7dffa3', cursor: '#7dffa3',
      cursorAccent: '#06120a', selectionBackground: '#1f7a4433',
      red: '#ff6b6b', green: '#7dffa3', yellow: '#d6ff7d', blue: '#59d9a4',
      magenta: '#9affc9', cyan: '#5ff0c0',
      brightRed: '#ff9c9c', brightGreen: '#b6ffcd', brightYellow: '#eaffb0',
      brightBlue: '#8af0c8', brightMagenta: '#c8ffe4', brightCyan: '#b4ffe8',
      brightBlack: '#2f6b47',
    },
  },
  {
    id: 'oceano', nome: 'Oceano', nivelMinimo: 3,
    cores: {
      ...comuns, background: '#0b1726', foreground: '#dbeafe', cursor: '#79b8ff',
      cursorAccent: '#0b1726', selectionBackground: '#1d4ed844',
      red: '#ff8a8a', green: '#8ae9c1', yellow: '#ffe08a', blue: '#8ab6ff',
      magenta: '#c4a7ff', cyan: '#8ae8f5',
      brightRed: '#ffb3b3', brightGreen: '#b6f5d8', brightYellow: '#ffeec0',
      brightBlue: '#bcd6ff', brightMagenta: '#dcc8ff', brightCyan: '#c0f4fa',
      brightBlack: '#3d5a80',
    },
  },
  {
    id: 'contraste', nome: 'Alto contraste', nivelMinimo: 4,
    cores: {
      ...comuns, background: '#000000', foreground: '#ffffff', cursor: '#ffff00',
      cursorAccent: '#000000', selectionBackground: '#ffffff44',
      red: '#ff5f5f', green: '#5fff5f', yellow: '#ffff5f', blue: '#5f9fff',
      magenta: '#ff5fff', cyan: '#5fffff',
      brightRed: '#ff8787', brightGreen: '#87ff87', brightYellow: '#ffff87',
      brightBlue: '#87c3ff', brightMagenta: '#ff87ff', brightCyan: '#87ffff',
      brightBlack: '#9a9a9a',
    },
  },
  {
    id: 'ambar', nome: 'Âmbar', nivelMinimo: 5,
    cores: {
      ...comuns, background: '#1a1206', foreground: '#ffc66d', cursor: '#ffb000',
      cursorAccent: '#1a1206', selectionBackground: '#ffb00033',
      red: '#ff8f6b', green: '#d6c26d', yellow: '#ffd479', blue: '#e0b85c',
      magenta: '#ffb37a', cyan: '#ffd9a0',
      brightRed: '#ffb49b', brightGreen: '#e8dc9a', brightYellow: '#ffe3a3',
      brightBlue: '#f0d79a', brightMagenta: '#ffd0b0', brightCyan: '#ffeccd',
      brightBlack: '#6b5530',
    },
  },
];

export const temaTerminalPadrao = TEMAS_TERMINAL[0];

export function temaTerminalPorId(id: string | null | undefined): TemaTerminal {
  return TEMAS_TERMINAL.find((t) => t.id === id) ?? temaTerminalPadrao;
}

/** quais temas o nível atual da pessoa já abriu */
export function temasLiberados(nivel: number) {
  return TEMAS_TERMINAL.filter((t) => t.nivelMinimo <= nivel);
}
