'use client';

import { useState } from 'react';
import type { Arena } from '@/deck/useArena';
import type { Cena, Papel } from '@/deck/types';

type CenaGrupos = Extract<Cena, { tipo: 'GroupScene' }>;

/**
 * Escolha de grupo, como canal de Discord: card por grupo, vagas visíveis,
 * entra e sai com um clique. É cena do deck (não tela separada) porque formar
 * grupos acontece *durante* a apresentação.
 *
 * As cartas de função existem por um motivo concreto: sem elas, no boss o
 * aluno mais rápido faz tudo sozinho e quatro pessoas assistem.
 */
export function GroupScene({ cena, arena, papel }: { cena: CenaGrupos; arena: Arena; papel: Papel }) {
  const [texto, setTexto] = useState('');
  const souJogador = papel === 'player';
  const meu = arena.eu?.grupo ?? null;

  return (
    <div className="cena" style={{ gap: 18 }}>
      <h2 className="titulo" style={{ fontSize: 'clamp(24px, 2.8vw, 44px)' }}>{cena.titulo}</h2>
      <p className="corpo" style={{ maxWidth: '44em' }}>{cena.enunciado}</p>

      <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {arena.placar.grupos.map((g) => {
          const cheio = g.membros.length >= g.capacidade && meu !== g.nome;
          return (
            <button key={g.nome} className="cartao" disabled={!souJogador || cheio}
              onClick={() => arena.emit('grupo:entrar', g.nome)}
              style={{ textAlign: 'left', borderColor: meu === g.nome ? g.cor : 'var(--borda)', borderWidth: meu === g.nome ? 2 : 1, cursor: souJogador && !cheio ? 'pointer' : 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 12, height: 12, borderRadius: 99, background: g.cor }} />
                <strong style={{ textTransform: 'capitalize' }}>{g.nome}</strong>
                <span className="chip" style={{ marginLeft: 'auto' }}>{g.membros.length}/{g.capacidade}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, minHeight: 28 }}>
                {g.membros.map((m) => (
                  <span key={m.id} title={m.nick} style={{ fontSize: 20 }}>{m.emoji}</span>
                ))}
              </div>
              <small style={{ color: 'var(--tinta-2)' }}>média {g.media} XP</small>
            </button>
          );
        })}
      </div>

      {cena.papeis && meu && (
        <>
          <div className="olho">cartas de função · cada critério do boss só é fechado por quem tem a carta</div>
          <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
            {cena.papeis.map((p) => {
              const dono = Object.entries(arena.meuGrupo?.papeis ?? {}).find(([, v]) => v === p.id)?.[0];
              const membro = arena.meuGrupo?.membros.find((m) => m.id === dono);
              const meuPapel = arena.eu?.papel === p.id;
              return (
                <button key={p.id} className="cartao" disabled={!souJogador || (!!dono && !meuPapel)}
                  onClick={() => arena.emit('grupo:papel', p.id)}
                  style={{ textAlign: 'left', borderColor: meuPapel ? 'var(--acento)' : 'var(--borda)' }}>
                  <strong>{p.nome}</strong>
                  <p style={{ color: 'var(--tinta-2)', marginTop: 6, fontSize: 15 }}>{p.faz}</p>
                  <small style={{ color: membro ? 'var(--acento)' : 'var(--tinta-2)' }}>
                    {membro ? `${membro.emoji} ${membro.nick}` : 'livre'}
                  </small>
                </button>
              );
            })}
          </div>
        </>
      )}

      {souJogador && meu && (
        <div className="cartao" style={{ display: 'grid', gap: 8 }}>
          <div className="olho">chat do grupo {meu}</div>
          <div style={{ maxHeight: 120, overflow: 'auto', display: 'grid', gap: 4 }}>
            {arena.chat.map((m, i) => (
              <div key={i} style={{ fontSize: 15 }}>
                <strong>{m.emoji} {m.nick}</strong>{' '}
                <span style={{ fontFamily: m.texto.trim().startsWith('$') ? 'var(--mono)' : 'var(--sans)' }}>{m.texto}</span>
              </div>
            ))}
            {arena.chat.length === 0 && <small style={{ color: 'var(--tinta-2)' }}>combine o plano aqui. Cole comandos começando com $ — mas o colega digita, não copia.</small>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="btn" style={{ flex: 1, textAlign: 'left' }} value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && texto.trim()) { arena.emit('grupo:chat', texto.trim()); setTexto(''); } }}
              placeholder="mensagem para o grupo" />
            <button className="btn" onClick={() => { if (texto.trim()) { arena.emit('grupo:chat', texto.trim()); setTexto(''); } }}>enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}
