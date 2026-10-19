'use client';

import { useState } from 'react';
import { AVATARES, usuarioDoNick } from '@/deck/avatares';
import { Icone } from './Icone';
import type { Arena } from '@/deck/useArena';

/**
 * Trocar o nome, trocar o avatar ou sair.
 *
 * Existe porque nome é identidade: a pessoa digitou errado, dois colegas
 * combinaram apelido, ou alguém pegou o notebook de outra. Trocar o nome
 * mantém XP, critérios e grupo. Sair libera o nome para a sala e guarda a
 * identidade neste navegador, então a tela de entrada oferece voltar.
 */
export function Perfil({ arena, onFechar }: { arena: Arena; onFechar: () => void }) {
  const { eu } = arena;
  const [nick, setNick] = useState(eu?.nick ?? '');
  const [emoji, setEmoji] = useState(eu?.emoji ?? AVATARES[0]);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);

  if (!eu) return null;
  const mudou = nick.trim() !== eu.nick || emoji !== eu.emoji;

  async function salvar() {
    if (!nick.trim() || salvando) return;
    setSalvando(true);
    const r = await arena.renomear(nick.trim(), emoji);
    setSalvando(false);
    if (r.ok) onFechar();
  }

  return (
    <div onClick={onFechar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,11,12,.5)', zIndex: 59, display: 'grid', placeItems: 'center', padding: 'var(--e3)' }}>
      <div className="cartao" onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(480px, 100%)', display: 'grid', gap: 'var(--e2)', maxHeight: '86vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--e1)' }}>
          <Icone nome="pessoas" />
          <strong style={{ fontSize: 19 }}>Sua identidade</strong>
          <button className="btn" style={{ marginLeft: 'auto', padding: 'var(--e1) var(--e2)' }} onClick={onFechar}>fechar</button>
        </div>

        <label className="olho">seu nome</label>
        <input className="btn" style={{ textAlign: 'left' }} value={nick} maxLength={20}
          onChange={(e) => setNick(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') salvar(); }} />

        {arena.nomeRecusado && (
          <div className="cartao" style={{ borderColor: 'var(--erro)', display: 'grid', gap: 'var(--e1)', background: 'var(--papel-2)' }}>
            <span style={{ fontSize: 14 }}>Já tem alguém chamado <strong>{arena.nomeRecusado.nome}</strong> na sala.</span>
            <div style={{ display: 'flex', gap: 'var(--e1)', flexWrap: 'wrap' }}>
              {arena.nomeRecusado.sugestoes.map((su) => (
                <button key={su} className="btn" style={{ padding: 'var(--e1) var(--e2)' }} onClick={() => setNick(su)}>{su}</button>
              ))}
            </div>
          </div>
        )}

        <div className="cartao" style={{ background: 'var(--papel-2)', display: 'flex', gap: 'var(--e1)', alignItems: 'center' }}>
          <Icone nome="terminal" tamanho={16} />
          <span style={{ fontSize: 13, color: 'var(--tinta-2)' }}>no terminal você aparece como</span>
          <code className="kbd">{usuarioDoNick(nick || eu.nick)}@linuxday:~$</code>
        </div>

        <label className="olho">seu bicho</label>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 'var(--e05)',
          maxHeight: 160, overflowY: 'auto', padding: 'var(--e05)',
          border: '1px solid var(--borda)', borderRadius: 'var(--r)', background: 'var(--papel-2)',
        }}>
          {AVATARES.map((e) => (
            <button key={e} onClick={() => setEmoji(e)} aria-label={`avatar ${e}`}
              style={{
                fontSize: 22, lineHeight: 1, padding: 'var(--e1) 0', cursor: 'pointer',
                borderRadius: 'var(--r-p)', background: emoji === e ? '#eff4ff' : 'var(--papel)',
                border: `1.5px solid ${emoji === e ? 'var(--acento)' : 'transparent'}`,
              }}>
              {e}
            </button>
          ))}
        </div>

        <button className="btn primario" disabled={!mudou || !nick.trim() || salvando} onClick={salvar}>
          {salvando ? 'salvando…' : 'salvar'}
        </button>

        {arena.codigo && (
          <div className="cartao" style={{ background: 'var(--papel-2)', display: 'grid', gap: 'var(--e05)' }}>
            <span className="olho">seu código de retorno</span>
            <code className="kbd" style={{ fontSize: 22, letterSpacing: 2, justifySelf: 'start' }}>{arena.codigo}</code>
            <small style={{ color: 'var(--tinta-2)' }}>
              Guarde. Serve para recuperar a sua conta se você trocar de computador. É ele que prova quem
              você é: por isso digitar o nome de outra pessoa não dá acesso aos pontos dela.
            </small>
          </div>
        )}

        <hr style={{ border: 0, borderTop: '1px solid var(--borda)', margin: 0 }} />

        {!confirmandoSaida ? (
          <button className="btn" onClick={() => setConfirmandoSaida(true)}
            style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center', justifyContent: 'center' }}>
            <Icone nome="sair" tamanho={16} /> sair desta sessão
          </button>
        ) : (
          <div className="cartao" style={{ background: 'var(--papel-2)', display: 'grid', gap: 'var(--e1)' }}>
            <span style={{ fontSize: 14 }}>
              Seus <strong>{eu.xp} XP</strong> ficam guardados. Para voltar, entre com o mesmo nome:
              este navegador vai oferecer isso na tela de entrada.
            </span>
            <div style={{ display: 'flex', gap: 'var(--e1)' }}>
              <button className="btn primario" onClick={() => { arena.sair(); onFechar(); }}>sair agora</button>
              <button className="btn" onClick={() => setConfirmandoSaida(false)}>cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
