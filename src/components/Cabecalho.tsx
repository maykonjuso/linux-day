'use client';

import { Ilustra, type NomeIlustra } from './Ilustra';

/**
 * O cabeçalho de toda cena.
 *
 * Um só componente para que a posição, o tamanho e a cor sejam idênticos em
 * todas as telas. Quando cada cena montava o próprio título, os tamanhos
 * variavam sem motivo e o conteúdo parecia pular de lugar a cada avanço.
 */
export function Cabecalho({
  ilustra, olho, titulo, direita,
}: {
  ilustra: NomeIlustra;
  olho?: string;
  titulo: string;
  direita?: React.ReactNode;
}) {
  return (
    <header className="cabecalho">
      <div className="moldura">
        <Ilustra nome={ilustra} tamanho="100%" />
      </div>
      <div className="textos">
        {olho && <div className="olho">{olho}</div>}
        <h2 className="titulo-cena">{titulo}</h2>
      </div>
      {direita && <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--e1)', flexWrap: 'wrap' }}>{direita}</div>}
    </header>
  );
}
