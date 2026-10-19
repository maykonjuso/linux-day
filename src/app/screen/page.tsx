'use client';

import { useArena } from '@/deck/useArena';
import { SceneRouter } from '@/components/SceneRouter';
import { Encaixe } from '@/components/Encaixe';

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

  return (
    <div className="palco palco-limpo" data-papel="screen">
      <Encaixe chave={`${cena.id}:${estado.passo}:${estado.fase}`}>
        <SceneRouter arena={arena} papel="screen" />
      </Encaixe>

      {aviso && <div className="toast">📣 {aviso}</div>}

      {estado.pausado && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 26px', borderRadius: 999, background: 'var(--tinta)', color: 'var(--papel)',
          fontWeight: 650, fontSize: 'clamp(16px, 1.6vw, 24px)',
        }}>
          pausado
        </div>
      )}
    </div>
  );
}
