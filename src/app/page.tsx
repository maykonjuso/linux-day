'use client';

import { useEffect, useState } from 'react';
import { useArena } from '@/deck/useArena';
import { SceneRouter } from '@/components/SceneRouter';
import { TerminalHost } from '@/components/TerminalHost';
import { nivelDe } from '@/deck/types';
import { DECK } from '@/deck/content';

const EMOJIS = ['🐧', '🦊', '🐙', '🦉', '🐢', '🦝', '🐝', '🦈', '🐼', '🦅'];

/**
 * A tela do participante: é o deck, e é a única URL dele nas 2 horas.
 * O terminal e o quiz acontecem DENTRO do slide — ele nunca troca de contexto.
 */
export default function Player() {
  const arena = useArena('player');
  const { eu, estado, cena, conectado, aviso, entrar } = arena;
  const [nick, setNick] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [gaveta, setGaveta] = useState(false);
  const [consulta, setConsulta] = useState(false);

  // Ctrl+` abre/fecha a gaveta do terminal; ? abre a consulta aos slides já vistos.
  // O participante NÃO navega o deck por teclado: ele segue o apresentador, e
  // isso elimina quase todo o conflito com as teclas do terminal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const digitando = alvo?.tagName === 'INPUT' || alvo?.closest('.xterm');
      if (e.ctrlKey && e.key === '`') { e.preventDefault(); setGaveta((g) => !g); }
      if (e.key === '?' && !digitando) setConsulta((c) => !c);
      if (e.key === 'Escape') setConsulta(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!eu) {
    return (
      <div className="centro">
        <div className="cartao" style={{ width: 'min(460px, 100%)', display: 'grid', gap: 16 }}>
          <div className="olho">Linux Day</div>
          <h1 className="titulo" style={{ fontSize: 34 }}>Escolha seu nome de guerra</h1>
          <input className="btn" style={{ textAlign: 'left' }} placeholder="seu nick" value={nick} maxLength={20}
            onChange={(e) => setNick(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && nick.trim()) entrar(nick.trim(), emoji); }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EMOJIS.map((e) => (
              <button key={e} className="btn" onClick={() => setEmoji(e)}
                style={{ fontSize: 24, borderColor: emoji === e ? 'var(--acento)' : 'var(--borda)' }}>{e}</button>
            ))}
          </div>
          <button className="btn primario" disabled={!nick.trim()} onClick={() => entrar(nick.trim(), emoji)}>
            entrar na arena
          </button>
          <small style={{ color: 'var(--tinta-2)' }}>
            Guardamos só o nick e o emoji, e tudo é apagado depois do evento.
          </small>
        </div>
      </div>
    );
  }

  const nivel = nivelDe(eu.xp);
  const posicao = arena.placar.individual.findIndex((p) => p.id === eu.id) + 1;
  const emLab = cena.tipo === 'LabScene';
  const jaVistos = DECK.slice(0, estado.cenaIndex).filter(
    (c) => (c.tipo === 'CommandAnatomy' || c.tipo === 'TerminalDemo' || c.tipo === 'WillGoWrong') && c.modulo === cena.modulo,
  );

  return (
    <div className="palco">
      <SceneRouter arena={arena} papel="player" />

      {/* o terminal é montado UMA vez e segue vivo o workshop inteiro */}
      <TerminalHost socket={arena.socket} ativo={emLab} gaveta={gaveta && !emLab} />

      <div className="barra">
        <span className="chip">{eu.emoji} {eu.nick}</span>
        <span className="chip forte">{eu.xp} XP</span>
        <span className="chip" title="tokens sudo: gastos em dicas">{eu.tokens} 🪙</span>
        {(eu.combo ?? 1) > 1 && <span className="chip forte">combo ×{eu.combo}</span>}
        {posicao > 0 && <span className="chip">{posicao}º</span>}
        <span className="chip" style={{ fontFamily: 'var(--mono)' }}>{nivel.prompt.replace('{nick}', eu.nick)}</span>
        <span className="cresce" />
        <button className="btn" style={{ padding: '4px 10px' }} onClick={() => setConsulta((c) => !c)}>? consultar</button>
        {!emLab && <button className="btn" style={{ padding: '4px 10px' }} onClick={() => setGaveta((g) => !g)}>terminal</button>}
        <button className="btn" style={{ padding: '4px 10px' }} onClick={() => arena.emit('pulso', 'perdi')}>me perdi</button>
        {estado.pausado && <span className="chip forte">⏸ pausado</span>}
        <span className="chip">{conectado ? '🟢 ao vivo' : '🔴 reconectando'}</span>
      </div>

      {/* consulta: traz os slides de comando já vistos sem sair da cena */}
      {consulta && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,11,12,.45)', zIndex: 55, display: 'grid', placeItems: 'center', padding: 24 }}
          onClick={() => setConsulta(false)}>
          <div className="cartao" style={{ maxWidth: 820, width: '100%', maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="olho">consulta · módulo {cena.modulo} · Esc fecha</div>
            {jaVistos.length === 0 && <p className="corpo">nada visto neste módulo ainda.</p>}
            {jaVistos.map((c) => (
              <div key={c.id} style={{ marginTop: 16 }}>
                <strong>{c.titulo}</strong>
                <div className="term" style={{ marginTop: 8, fontSize: 14 }}>
                  {c.tipo === 'TerminalDemo' && c.linhas.map((l, i) => <div key={i}><span className="cmd">{l.comando}</span></div>)}
                  {c.tipo === 'CommandAnatomy' && <span className="cmd">{c.comando}</span>}
                  {c.tipo === 'WillGoWrong' && c.erros.map((e) => <div key={e.mensagem}><span className="saida">{e.mensagem} → {e.causa}</span></div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* avisos: XP ganho, badge, nível, evento, broadcast */}
      {arena.ganho && (
        <div className="flutuante" style={{ right: 28, bottom: 90, fontSize: 30, fontWeight: 800, color: 'var(--ok)' }}>
          +{arena.ganho.xp} XP{arena.ganho.mult > 1 ? ` ×${arena.ganho.mult}` : ''}
        </div>
      )}
      {arena.badge && <div className="toast">🏅 {arena.badge.nick}: {arena.badge.badge} — {arena.badge.descricao}</div>}
      {aviso && <div className="toast">📣 {aviso}</div>}
      {arena.evento && <div className="toast">⚡ {arena.evento.replace('-', ' ')}</div>}
      {arena.subiuNivel && (
        <div className="nivel-cheio">
          <div style={{ textAlign: 'center' }}>
            <div className="olho">subiu de nível</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(26px, 4vw, 56px)', fontWeight: 700 }}>
              {nivelDe(eu.xp).prompt.replace('{nick}', eu.nick)}
            </div>
            <div className="chip forte" style={{ marginTop: 12 }}>{arena.subiuNivel.patente}</div>
          </div>
        </div>
      )}
    </div>
  );
}
