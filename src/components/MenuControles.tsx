'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icone } from './Icone';

/**
 * Um grupo da barra de baixo que vira um botão só, e abre para cima.
 *
 * A barra tinha todos os botões à mostra numa fila com rolagem horizontal
 * escondida: no notebook metade dos grupos ficava fora da tela, e ninguém
 * desconfiava que dava para rolar. Agora cada grupo ocupa um botão e a barra
 * inteira cabe numa linha; as ações de todo minuto (avançar, voltar) ficam
 * fora dos menus.
 */
export function MenuControles({
  rotulo, icone, children, destaque, lado = 'esquerda', titulo,
}: {
  rotulo: string; icone: string; children: ReactNode;
  /** número pequeno sobre o botão, para o que pede atenção sem abrir o menu */
  destaque?: number | string | null;
  /** para que lado o painel cresce (os menus da direita abrem para a esquerda) */
  lado?: 'esquerda' | 'direita';
  titulo?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => { if (!raiz.current?.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('pointerdown', fora);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  return (
    <div className="menu-controles" ref={raiz} data-aberto={aberto}>
      <button type="button" className="btn-icone" aria-haspopup="true" aria-expanded={aberto}
        title={titulo ?? rotulo} data-menu={rotulo} onClick={() => setAberto((v) => !v)}>
        <Icone nome={icone as never} tamanho={16} />
        <span className="texto">{rotulo}</span>
        <span aria-hidden className="seta">▾</span>
        {destaque ? <span className="destaque-menu">{destaque}</span> : null}
      </button>
      {aberto && (
        // um clique num botão do menu fecha o menu; campo e seletor não
        <div className="painel-controles" role="group" aria-label={rotulo} data-lado={lado}
          onClick={(e) => { if ((e.target as HTMLElement).closest('button')) setAberto(false); }}>
          {children}
        </div>
      )}
    </div>
  );
}
