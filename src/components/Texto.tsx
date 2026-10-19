'use client';

import type { ReactNode } from 'react';

/**
 * Texto do deck com ênfase.
 *
 * O conteúdo é escrito com uma marcação mínima e legível no próprio arquivo:
 *   **negrito**  para a palavra que a pessoa precisa levar embora
 *   `código`     para comando, caminho ou tecla
 *
 * Negrito existe para guiar o olho de quem está lendo a dez metros do
 * projetor: sem destaque, a frase inteira tem o mesmo peso e ninguém sabe onde
 * olhar. Por isso a regra de escrita é uma só ênfase por frase.
 */
export function Texto({ children, className, style }: { children: string; className?: string; style?: React.CSSProperties }) {
  return <span className={className} style={style}>{formatar(children)}</span>;
}

export function formatar(texto: string): ReactNode[] {
  const partes: ReactNode[] = [];
  // quebra em trechos: **negrito**, `código` e o resto
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const pedacos = texto.split(regex);

  pedacos.forEach((p, i) => {
    if (!p) return;
    if (p.startsWith('**') && p.endsWith('**')) {
      partes.push(<strong key={i} style={{ color: 'var(--tinta)', fontWeight: 680 }}>{p.slice(2, -2)}</strong>);
      return;
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      partes.push(<code key={i} className="kbd">{p.slice(1, -1)}</code>);
      return;
    }
    partes.push(p);
  });

  return partes;
}
