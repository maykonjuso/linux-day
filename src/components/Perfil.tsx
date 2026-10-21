'use client';

import { useState } from 'react';
import { AVATARES, usuarioDoNick } from '@/deck/avatares';
import { Icone } from './Icone';
import { Avatar } from './Avatar';
import type { Arena } from '@/deck/useArena';
import { prepararFoto } from '@/deck/foto';

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
  const [fotoMsg, setFotoMsg] = useState<string | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  if (!eu) return null;
  const mudou = nick.trim() !== eu.nick || emoji !== eu.emoji;

  async function escolherFoto(arquivo: File | undefined) {
    if (!arquivo) return;
    setFotoMsg(null);
    const p = await prepararFoto(arquivo);
    if ('erro' in p) { setFotoMsg(p.erro); return; }
    setEnviandoFoto(true);
    const r = await arena.enviarFoto(p.dataUrl);
    setEnviandoFoto(false);
    setFotoMsg(r.ok ? 'foto atualizada' : r.erro ?? 'não deu para enviar a foto');
  }

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

        <label className="olho">sua foto</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--e2)', flexWrap: 'wrap' }}>
          <Avatar pessoa={{ emoji, foto: eu.foto, nick: eu.nick }} tamanho={56} />
          <label className="btn" style={{ padding: 'var(--e1) var(--e2)', cursor: 'pointer' }}>
            {enviandoFoto ? 'enviando…' : eu.foto ? 'trocar a foto' : 'enviar uma foto'}
            <input type="file" accept="image/png,image/jpeg,image/webp" data-acao="enviar-foto" hidden
              onChange={(e) => { escolherFoto(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          {eu.foto && (
            <button className="btn" style={{ padding: 'var(--e1) var(--e2)' }}
              onClick={async () => { const r = await arena.enviarFoto(null); setFotoMsg(r.ok ? 'voltou para o bicho' : r.erro ?? 'falhou'); }}>
              usar o bicho
            </button>
          )}
        </div>
        <small style={{ color: fotoMsg && !/atualizada|voltou/.test(fotoMsg) ? 'var(--erro)' : 'var(--tinta-2)' }} role="status">
          {fotoMsg ?? 'PNG, JPG ou WebP de até 2 MB. A foto é cortada em quadrado e reduzida antes de ir para a tela da sala.'}
        </small>

        <label className="olho">{eu.foto ? 'ou um bicho (aparece quando você tira a foto)' : 'seu bicho'}</label>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 'var(--e05)',
          maxHeight: 160, overflowY: 'auto', padding: 'var(--e05)',
          border: '1px solid var(--borda)', borderRadius: 'var(--r)', background: 'var(--papel-2)',
        }}>
          {AVATARES.map((e) => (
            <button key={e} onClick={() => setEmoji(e)} aria-label={`avatar ${e}`}
              style={{
                fontSize: 22, lineHeight: 1, padding: 'var(--e1) 0', cursor: 'pointer',
                borderRadius: 'var(--r-p)', background: emoji === e ? 'var(--acento-suave)' : 'var(--papel)',
                border: `1.5px solid ${emoji === e ? 'var(--acento)' : 'transparent'}`,
              }}>
              {e}
            </button>
          ))}
        </div>

        <button className="btn primario" disabled={!mudou || !nick.trim() || salvando} onClick={salvar}>
          {salvando ? 'salvando…' : 'salvar'}
        </button>

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
