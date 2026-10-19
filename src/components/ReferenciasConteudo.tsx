'use client';

import type { ReferenciaSlide } from '@/deck/types';
import { Icone } from './Icone';

export function ReferenciasConteudo({
  referencias,
  onIrParaSlide,
}: {
  referencias?: ReferenciaSlide[];
  onIrParaSlide?: (id: string) => void;
}) {
  if (!referencias || referencias.length === 0 || !onIrParaSlide) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--e1)', flexWrap: 'wrap' }}>
      <span className="olho" style={{ fontSize: '11px', color: 'var(--tinta-2)' }}>
        <Icone nome="consultar" tamanho={14} /> rever conteúdo:
      </span>
      {referencias.map((ref) => (
        <button
          key={ref.id}
          type="button"
          className="chip"
          onClick={() => onIrParaSlide(ref.id)}
          title={`Abrir o slide "${ref.titulo}" para revisar`}
          style={{
            cursor: 'pointer',
            fontSize: '12px',
            padding: '3px 10px',
            borderColor: 'var(--acento)',
            color: 'var(--acento)',
            background: 'color-mix(in srgb, var(--acento) 8%, var(--papel))',
            fontWeight: 600,
          }}
        >
          <Icone nome="olho" tamanho={13} />
          <span>{ref.titulo}</span>
        </button>
      ))}
    </div>
  );
}

