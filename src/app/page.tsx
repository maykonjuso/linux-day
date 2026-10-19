'use client';

import { useState } from 'react';
import { useArena } from '@/deck/useArena';
import { SceneRouter } from '@/components/SceneRouter';
import { nivelDe } from '@/deck/types';

const EMOJIS = ['🐧', '🦊', '🐙', '🦉', '🐢', '🦝', '🐝', '🦈'];

/** A tela do participante: é o deck, e é a única URL dele nas 2 horas. */
export default function Player() {
  const arena = useArena('player');
  const { eu, estado, conectado, aviso, entrar } = arena;
  const [nick, setNick] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  if (!eu) {
    return (
      <div className="centro">
        <div className="cartao" style={{ width: 'min(460px, 100%)', display: 'grid', gap: 16 }}>
          <div className="olho">Linux Day</div>
          <h1 className="titulo" style={{ fontSize: 34 }}>Escolha seu nome de guerra</h1>
          <input
            className="btn"
            style={{ textAlign: 'left' }}
            placeholder="seu nick"
            value={nick}
            maxLength={20}
            onChange={(e) => setNick(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && nick.trim() && entrar(nick.trim(), emoji)}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EMOJIS.map((e) => (
              <button key={e} className="btn" onClick={() => setEmoji(e)}
                style={{ fontSize: 24, borderColor: emoji === e ? 'var(--acento)' : 'var(--borda)' }}>
                {e}
              </button>
            ))}
          </div>
          <button className="btn primario" disabled={!nick.trim()} onClick={() => entrar(nick.trim(), emoji)}>
            entrar na arena
          </button>
          <small style={{ color: 'var(--tinta-2)' }}>
            Só o nick e o emoji são guardados, e tudo é apagado depois do evento.
          </small>
        </div>
      </div>
    );
  }

  const nivel = nivelDe(eu.xp);

  return (
    <div className="palco">
      <SceneRouter arena={arena} papel="player" />
      <div className="barra">
        <span className="chip">{eu.emoji} {eu.nick}</span>
        <span className="chip forte">{eu.xp} XP</span>
        <span className="chip">{eu.tokens} 🪙</span>
        <span className="chip" style={{ fontFamily: 'var(--mono)' }}>{nivel.prompt.replace('{nick}', eu.nick)}</span>
        {aviso && <span className="chip forte">📣 {aviso}</span>}
        <span className="cresce" />
        {estado.pausado && <span className="chip forte">⏸ pausado</span>}
        <span className="chip" title={conectado ? 'ao vivo' : 'reconectando'}>{conectado ? '🟢 ao vivo' : '🔴 reconectando'}</span>
      </div>
    </div>
  );
}
