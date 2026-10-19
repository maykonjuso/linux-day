'use client';

import { useCallback, useEffect, useState } from 'react';
import { useArena } from '@/deck/useArena';
import { SceneRouter } from '@/components/SceneRouter';
import { DECK } from '@/deck/content';

/**
 * Painel do apresentador. Mesma cena, projeção `host`: você vê a resposta
 * certa, o progresso e os controles. Atalhos: → ← avançar, A abrir, R revelar,
 * P pausar, V trazer todos ao vivo.
 */
export default function Host() {
  const arena = useArena('host');
  const { estado, cena, presenca, emit, placar } = arena;
  const [pin, setPin] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [ajudas, setAjudas] = useState<string[]>([]);

  useEffect(() => {
    arena.socket?.on('ajuda', (p: { nick: string }) => setAjudas((a) => [...a, p.nick]));
  }, [arena.socket]);

  const segundosDaCena = 'segundos' in cena ? (cena as unknown as { segundos: number }).segundos : null;

  const ir = useCallback((delta: number) => {
    const i = Math.min(Math.max(0, estado.cenaIndex + delta), DECK.length - 1);
    emit('host:ir', { cenaIndex: i, passo: 0, fase: 'idle' });
  }, [estado.cenaIndex, emit]);

  const avancar = useCallback(() => {
    if (estado.passo + 1 < cena.passos) emit('host:passo', 1);
    else ir(1);
  }, [estado.passo, cena.passos, emit, ir]);

  useEffect(() => {
    if (!autenticado) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); avancar(); }
      if (e.key === 'ArrowLeft') emit('host:passo', -1);
      if (e.key.toLowerCase() === 'a') emit('host:fase', { fase: 'aberta', segundos: segundosDaCena });
      if (e.key.toLowerCase() === 'r' && cena.tipo === 'QuizScene')
        emit('host:revelar', { cenaId: cena.id, correta: cena.correta, xpBase: 40, segundos: cena.segundos });
      if (e.key.toLowerCase() === 'p') emit('host:pausar', !estado.pausado);
      if (e.key.toLowerCase() === 'v') emit('host:aovivo');
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [autenticado, avancar, emit, cena, estado.pausado, segundosDaCena]);

  if (!autenticado) {
    return (
      <div className="centro">
        <div className="cartao" style={{ display: 'grid', gap: 12, width: 'min(360px, 100%)' }}>
          <div className="olho">painel do apresentador</div>
          <input className="btn" style={{ textAlign: 'left' }} placeholder="PIN" value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { emit('host:entrar', pin); setAutenticado(true); } }} />
          <button className="btn primario" onClick={() => { emit('host:entrar', pin); setAutenticado(true); }}>entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="palco">
      <SceneRouter arena={arena} papel="host" />
      <div className="barra" style={{ flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => ir(-1)}>◀ cena</button>
        <button className="btn primario" onClick={avancar}>avançar ▶</button>
        <button className="btn" onClick={() => emit('host:fase', { fase: 'aberta', segundos: segundosDaCena })}>abrir (A)</button>
        {cena.tipo === 'QuizScene' && (
          <button className="btn" onClick={() => emit('host:revelar', { cenaId: cena.id, correta: cena.correta, xpBase: 40, segundos: cena.segundos })}>
            revelar (R)
          </button>
        )}
        <button className="btn" onClick={() => emit('host:pausar', !estado.pausado)}>{estado.pausado ? '▶ retomar' : '⏸ pausar'}</button>
        <button className="btn" onClick={() => emit('host:aovivo')}>todos ao vivo (V)</button>
        <span className="chip">{cena.tipo} · passo {estado.passo + 1}/{cena.passos} · {estado.fase}</span>
        <span className="chip">cena {estado.cenaIndex + 1}/{DECK.length}</span>
        <span className="chip">{presenca.filter((p) => p.presenca === 'ativo').length} ativos / {presenca.length}</span>
        {ajudas.length > 0 && <span className="chip forte">🙋 {ajudas.slice(-3).join(', ')}</span>}
        <span className="cresce" />
        <span className="chip">líder: {placar.individual[0]?.nick ?? '—'}</span>
      </div>
    </div>
  );
}
