'use client';

import { useState } from 'react';
import { Icone } from './Icone';
import { Texto } from './Texto';
import { PACOTE, HABITOS, ARMADILHAS } from '@/deck/pacote';
import { GLOSSARIO } from '@/deck/glossario';
import { DECK } from '@/deck/content';
import type { Cena } from '@/deck/types';

/**
 * A gaveta de consulta. Existe porque, no meio de um lab, a pessoa precisa
 * rever a sintaxe de um comando ou lembrar o que é "PID" sem se perder no
 * deck. Três abas, nesta ordem de utilidade para quem está travado:
 *   1. o que já vimos neste módulo (comando + saída real)
 *   2. a lista de comandos por situação (o pacote de sobrevivência)
 *   3. o glossário das palavras difíceis
 */
export function Consulta({ moduloAtual, onFechar }: { moduloAtual: number; onFechar: () => void }) {
  const [aba, setAba] = useState<'visto' | 'pacote' | 'palavras'>('visto');

  const jaVistos = DECK.filter(
    (c) => c.modulo <= moduloAtual &&
      (c.tipo === 'CommandAnatomy' || c.tipo === 'TerminalDemo' || c.tipo === 'WillGoWrong'),
  ).reverse() as Cena[];

  return (
    <div
      onClick={onFechar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,11,12,.45)', zIndex: 55, display: 'grid', placeItems: 'center', padding: 'var(--e3)' }}
    >
      <div className="cartao" onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(960px, 100%)', maxHeight: '84vh', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 'var(--e2)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center', flexWrap: 'wrap' }}>
          <strong style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center' }}>
            <Icone nome="consultar" /> Consulta
          </strong>
          {([['visto', 'o que já vimos', 'historico'], ['pacote', 'comandos por situação', 'checklist'], ['palavras', 'palavras difíceis', 'duvida']] as const).map(([k, rotulo, icone]) => (
            <button key={k} className="btn" onClick={() => setAba(k)}
              style={{ padding: 'var(--e1) var(--e2)', borderColor: aba === k ? 'var(--acento)' : 'var(--borda)', color: aba === k ? 'var(--acento)' : undefined, display: 'flex', gap: 'var(--e1)', alignItems: 'center' }}>
              <Icone nome={icone} tamanho={15} /> {rotulo}
            </button>
          ))}
          <button className="btn" style={{ marginLeft: 'auto', padding: 'var(--e1) var(--e2)' }} onClick={onFechar}>fechar (Esc)</button>
        </div>

        <div style={{ overflow: 'auto', paddingRight: 6 }}>
          {aba === 'visto' && (
            <div className="grade">
              {jaVistos.length === 0 && <p className="corpo">Ainda não vimos nenhum comando. Volte depois do primeiro módulo.</p>}
              {jaVistos.map((c) => (
                <div key={c.id}>
                  <div className="olho">módulo {c.modulo} · {c.titulo}</div>
                  <div className="term" style={{ marginTop: 'var(--e1)', fontSize: 14 }}>
                    {c.tipo === 'TerminalDemo' && c.linhas.map((l, i) => (
                      <div key={i}>
                        <span className="cmd">{l.comando}</span>
                        {l.traducao && <span className="traducao"><Texto>{l.traducao}</Texto></span>}
                      </div>
                    ))}
                    {c.tipo === 'CommandAnatomy' && (
                      <>
                        <span className="cmd">{c.comando}</span>
                        <span className="traducao">{c.partes.map((p) => `${p.trecho} = ${p.rotulo}`).join('  ·  ')}</span>
                      </>
                    )}
                    {c.tipo === 'WillGoWrong' && c.erros.map((e) => (
                      <div key={e.mensagem}><span className="saida">{e.mensagem}</span><span className="traducao">{e.causa}</span></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {aba === 'pacote' && (
            <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {PACOTE.map((p) => (
                <div key={p.situacao} className="cartao" style={{ background: 'var(--papel-2)' }}>
                  <strong style={{ fontSize: 14 }}>{p.situacao}</strong>
                  <div style={{ display: 'grid', gap: 'var(--e1)', marginTop: 'var(--e1)' }}>
                    {p.itens.map((i) => <code key={i} style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{i}</code>)}
                  </div>
                </div>
              ))}
              <div className="cartao" style={{ background: 'var(--papel-2)' }}>
                <strong style={{ fontSize: 14 }}>Cuidados</strong>
                <div style={{ display: 'grid', gap: 'var(--e05)', marginTop: 'var(--e1)', fontSize: 13, color: 'var(--tinta-2)' }}>
                  {ARMADILHAS.map((a) => <span key={a.o}>{a.o}: {a.nem}</span>)}
                </div>
              </div>
              <div className="cartao" style={{ background: 'var(--papel-2)' }}>
                <strong style={{ fontSize: 14 }}>Hábitos</strong>
                <div style={{ display: 'grid', gap: 'var(--e05)', marginTop: 'var(--e1)', fontSize: 13, color: 'var(--tinta-2)' }}>
                  {HABITOS.map((h) => <span key={h.titulo}>{h.titulo}</span>)}
                </div>
              </div>
            </div>
          )}

          {aba === 'palavras' && (
            <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))' }}>
              {GLOSSARIO.map((g) => (
                <div key={g.palavra} className="cartao" style={{ background: 'var(--papel-2)' }}>
                  <strong style={{ fontFamily: 'var(--mono)' }}>{g.palavra}</strong>
                  <p style={{ marginTop: 'var(--e1)', fontSize: 14 }}>{g.oque}</p>
                  <p style={{ marginTop: 'var(--e1)', fontSize: 13, color: 'var(--tinta-2)' }}>
                    <Icone nome="ideia" tamanho={13} /> {g.exemplo}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
