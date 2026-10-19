'use client';

import { useMemo, useState } from 'react';
import { Icone } from './Icone';

export interface PessoaDaSala {
  id: string; nick: string; emoji: string; xp: number; nivel?: number;
  presenca: string; grupo: string | null; papel?: string | null;
  feitos: string[]; travado: boolean; codigo?: string; conta?: string; silenciado?: boolean;
}

/**
 * A tela de Pessoas: quem está na sala e o que o apresentador pode fazer com
 * cada uma.
 *
 * Existe separada do slide e da grade porque as três perguntas são diferentes:
 * "o que estou mostrando", "quem está travado no exercício" e "quem é essa
 * pessoa e o que eu faço com ela". Durante o workshop a terceira aparece do
 * nada (nome repetido, alguém de brincadeira no chat, dois crachás da mesma
 * pessoa) e precisa estar a um clique.
 */
export function PainelPessoas({
  pessoas, onResetar, onSilenciar, onExpulsar,
}: {
  pessoas: PessoaDaSala[];
  onResetar: (p: PessoaDaSala) => void;
  onSilenciar: (p: PessoaDaSala) => void;
  onExpulsar: (p: PessoaDaSala) => void;
}) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todas' | 'ativas' | 'travadas' | 'ociosas' | 'fora'>('todas');
  const [confirmar, setConfirmar] = useState<string | null>(null);

  const lista = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    return pessoas
      .filter((p) => {
        if (texto && !`${p.nick} ${p.grupo ?? ''} ${p.codigo ?? ''}`.toLowerCase().includes(texto)) return false;
        if (filtro === 'ativas') return p.presenca === 'ativo';
        if (filtro === 'ociosas') return p.presenca === 'ocioso';
        if (filtro === 'fora') return p.presenca === 'desconectado';
        if (filtro === 'travadas') return p.travado;
        return true;
      })
      .sort((a, b) => b.xp - a.xp);
  }, [pessoas, busca, filtro]);

  const contagem = {
    ativas: pessoas.filter((p) => p.presenca === 'ativo').length,
    ociosas: pessoas.filter((p) => p.presenca === 'ocioso').length,
    fora: pessoas.filter((p) => p.presenca === 'desconectado').length,
    travadas: pessoas.filter((p) => p.travado).length,
  };

  const cor = (p: PessoaDaSala) =>
    p.presenca === 'ativo' ? 'var(--ok)' : p.presenca === 'ocioso' ? 'var(--atencao)' : 'var(--borda)';

  return (
    <div className="cena" style={{ gap: 'var(--e2)', justifyContent: 'flex-start' }}>
      <div style={{ display: 'flex', gap: 'var(--e2)', alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 className="titulo" style={{ fontSize: 'clamp(20px, 2.2vw, 32px)', display: 'flex', gap: 'var(--e1)', alignItems: 'center' }}>
          <Icone nome="pessoas" tamanho={28} /> Pessoas na sala
        </h2>
        <span className="chip">{pessoas.length} no total</span>
        <input className="btn" style={{ textAlign: 'left', width: 220 }} placeholder="buscar por nome, equipe ou código"
          value={busca} onChange={(e) => setBusca(e.target.value)} />
        <div className="bloco-controle">
          {([['todas', `todas`], ['ativas', `ativas ${contagem.ativas}`], ['travadas', `travadas ${contagem.travadas}`], ['ociosas', `ociosas ${contagem.ociosas}`], ['fora', `fora ${contagem.fora}`]] as const).map(([k, rotulo]) => (
            <button key={k} className="btn-icone" onClick={() => setFiltro(k)}
              style={{ background: filtro === k ? 'var(--tinta)' : undefined, color: filtro === k ? 'var(--papel)' : undefined }}>
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="checklist" style={{ maxHeight: '64vh', overflowY: 'auto' }}>
        {lista.length === 0 && (
          <div className="item-check"><span className="marca">—</span><span>ninguém aqui com esse filtro</span><span /></div>
        )}

        {lista.map((p) => (
          <div key={p.id} className="item-check" style={{ alignItems: 'center', gridTemplateColumns: 'auto 1fr auto' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--e1)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: cor(p), flex: 'none' }}
                title={p.presenca} />
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
            </span>

            <span className="texto-item">
              <span>
                <strong>{p.nick}</strong>
                {p.travado && <span className="xp-item" style={{ marginLeft: 'var(--e1)', background: 'var(--atencao)', color: 'var(--papel)', borderColor: 'var(--atencao)' }}>travada</span>}
                {p.silenciado && <span className="xp-item" style={{ marginLeft: 'var(--e05)' }}>sem chat</span>}
              </span>
              <small style={{ color: 'var(--tinta-2)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                {p.xp} XP
                {' · '}{p.grupo ? `equipe ${p.grupo}` : 'sem equipe'}
                {p.papel ? ` · carta ${p.papel}` : ''}
                {' · '}{p.feitos.length} itens feitos
                {p.codigo ? ` · código ${p.codigo}` : ''}
                {p.conta ? ` · ${p.conta}` : ''}
              </small>
            </span>

            <span style={{ display: 'flex', gap: 'var(--e05)', alignItems: 'center' }}>
              <button className="btn-icone" title="devolver o ambiente limpo (não perde XP)" onClick={() => onResetar(p)}>
                <Icone nome="recomecar" tamanho={16} /><span className="texto">recomeçar</span>
              </button>
              <button className="btn-icone" title={p.silenciado ? 'devolver o chat' : 'silenciar o chat'} onClick={() => onSilenciar(p)}>
                <Icone nome={p.silenciado ? 'tocar' : 'pausar'} tamanho={16} />
                <span className="texto">{p.silenciado ? 'liberar' : 'silenciar'}</span>
              </button>

              {confirmar === p.id ? (
                <span style={{ display: 'flex', gap: 'var(--e05)', alignItems: 'center' }}>
                  <button className="btn-icone destaque" style={{ background: 'var(--erro)' }}
                    onClick={() => { onExpulsar(p); setConfirmar(null); }}>
                    confirmar
                  </button>
                  <button className="btn-icone" onClick={() => setConfirmar(null)}>não</button>
                </span>
              ) : (
                <button className="btn-icone" title="expulsar da sala" onClick={() => setConfirmar(p.id)}>
                  <Icone nome="sair" tamanho={16} cor="var(--erro)" /><span className="texto">expulsar</span>
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      <small style={{ color: 'var(--tinta-2)' }}>
        Expulsar tira a pessoa da sala na hora e encerra o terminal dela. O XP fica guardado: se foi engano,
        ela entra de novo com o mesmo nome e encontra tudo no lugar.
      </small>
    </div>
  );
}
