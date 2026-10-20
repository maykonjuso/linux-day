'use client';

import { useArena } from '@/deck/useArena';
import { SceneRouter } from '@/components/SceneRouter';
import { Encaixe } from '@/components/Encaixe';
import { useTema } from '@/deck/useTema';
import { CartaoEvento } from '@/components/Celebracao';
import { Roleta } from '@/components/Roleta';

/**
 * A tela do projetor: só conteúdo.
 *
 * Nada de número de cena, contagem de gente na sala ou barra de status. Isso é
 * informação de operação, serve para QUEM APRESENTA (está no /host) e na parede
 * só rouba atenção e espaço do conteúdo. O cronômetro e o "quantos já
 * responderam" continuam aparecendo, mas dentro da própria cena de pergunta,
 * onde a turma está olhando.
 *
 * As duas únicas coisas que aparecem por cima são transitórias e deliberadas:
 * um recado que o apresentador manda para a sala, e o aviso de pausa.
 */
export default function Screen() {
  const arena = useArena('screen');
  const { estado, cena, aviso } = arena;
  const { tema, trocar } = useTema('claro');

  return (
    <div className="palco palco-limpo" data-papel="screen">
      <Encaixe chave={`${cena.id}:${estado.passo}:${estado.fase}`}>
        <SceneRouter arena={arena} papel="screen" />
      </Encaixe>

      {/* o único controle do projetor: claro ou escuro. Fica discreto no canto,
          porque a tela é para a turma, não para operar. */}
      <button onClick={() => trocar()} title="alternar claro e escuro"
        style={{
          position: 'fixed', bottom: 'var(--e2)', right: 'var(--e2)', zIndex: 50,
          width: 32, height: 32, borderRadius: 999, cursor: 'pointer',
          border: '1px solid var(--borda)', background: 'var(--papel-2)', color: 'var(--tinta-2)',
          opacity: 0.35,
        }}>
        {tema === 'claro' ? '◐' : '◑'}
      </button>

      {aviso && <div className="toast">📣 {aviso}</div>}
      <CartaoEvento arena={arena} />
      <Roleta arena={arena} papel="screen" />

      {estado.pausado && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          padding: 'var(--e1) var(--e3)', borderRadius: 999, background: 'var(--tinta)', color: 'var(--papel)',
          fontWeight: 650, fontSize: 'clamp(16px, 1.6vw, 24px)',
        }}>
          pausado
        </div>
      )}
    </div>
  );
}
