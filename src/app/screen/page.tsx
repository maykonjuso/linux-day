'use client';

import { useArena } from '@/deck/useArena';
import { SceneRouter } from '@/components/SceneRouter';
import { DECK } from '@/deck/content';

/** A tela do projetor. Sem interação: é para ser olhada por 30 pessoas. */
export default function Screen() {
  const arena = useArena('screen');
  const { estado, presenca, aviso } = arena;
  const ativos = presenca.filter((p) => p.presenca !== 'desconectado').length;

  return (
    <div className="palco">
      <SceneRouter arena={arena} papel="screen" />
      <div className="barra">
        <span className="chip">cena {estado.cenaIndex + 1}/{DECK.length}</span>
        <span className="chip">{ativos} na sala</span>
        {estado.restante !== null && <span className="chip forte">⏱ {estado.restante}s</span>}
        {aviso && <span className="chip forte">📣 {aviso}</span>}
        <span className="cresce" />
        {estado.pausado && <span className="chip forte">⏸ pausado</span>}
      </div>
    </div>
  );
}
