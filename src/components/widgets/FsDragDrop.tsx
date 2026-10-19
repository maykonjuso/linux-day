'use client';

import { useState } from 'react';

/**
 * Widget `fs-dragdrop`. Arrumar a bagunça com o dedo antes de arrumar com o
 * teclado: ao terminar, mostramos os comandos `mv` equivalentes — e aí o lab
 * no terminal deixa de ser um salto no escuro.
 */
const ARQUIVOS = [
  { nome: 'foto1.png', pasta: 'imagens' }, { nome: 'logo.jpg', pasta: 'imagens' },
  { nome: 'grafico.png', pasta: 'imagens' }, { nome: 'notas.txt', pasta: 'docs' },
  { nome: 'guia.md', pasta: 'docs' }, { nome: 'contatos.txt', pasta: 'docs' },
  { nome: 'deploy.sh', pasta: 'scripts' }, { nome: 'backup.sh', pasta: 'scripts' },
  { nome: 'tmp_1.log', pasta: 'lixeira' },
];
const PASTAS = ['imagens', 'docs', 'scripts', 'lixeira'] as const;

export default function FsDragDrop({ onConcluir }: { onConcluir?: () => void }) {
  const [onde, setOnde] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<string | null>(null);
  const soltos = ARQUIVOS.filter((a) => !onde[a.nome]);
  const errados = Object.entries(onde).filter(([n, p]) => ARQUIVOS.find((a) => a.nome === n)?.pasta !== p);
  const pronto = soltos.length === 0 && errados.length === 0;

  const comandos = PASTAS.filter((p) => p !== 'lixeira')
    .map((p) => {
      const exts = [...new Set(ARQUIVOS.filter((a) => a.pasta === p).map((a) => a.nome.split('.').pop()))];
      return `mv ${exts.map((e) => `*.${e}`).join(' ')} ${p}/`;
    })
    .concat('rm tmp_*');

  return (
    <div className="grade" style={{ gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 44 }}>
        {soltos.map((a) => (
          <button key={a.nome} className="btn" onClick={() => setSel(a.nome === sel ? null : a.nome)}
            style={{ fontFamily: 'var(--mono)', borderColor: sel === a.nome ? 'var(--acento)' : 'var(--borda)' }}>
            {a.nome}
          </button>
        ))}
        {soltos.length === 0 && <span style={{ color: 'var(--tinta-2)' }}>bagunça resolvida 🎉</span>}
      </div>

      <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {PASTAS.map((p) => {
          const dentro = Object.entries(onde).filter(([, v]) => v === p).map(([n]) => n);
          return (
            <button key={p} className="cartao" onClick={() => { if (sel) { setOnde({ ...onde, [sel]: p }); setSel(null); } }}
              style={{ textAlign: 'left', cursor: sel ? 'pointer' : 'default', borderColor: sel ? 'var(--acento)' : 'var(--borda)', borderStyle: sel ? 'dashed' : 'solid' }}>
              <strong style={{ fontFamily: 'var(--mono)' }}>{p === 'lixeira' ? '🗑 lixeira' : `${p}/`}</strong>
              <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
                {dentro.map((n) => {
                  const ok = ARQUIVOS.find((a) => a.nome === n)?.pasta === p;
                  return (
                    <span key={n} onClick={(e) => { e.stopPropagation(); const o = { ...onde }; delete o[n]; setOnde(o); }}
                      style={{ fontFamily: 'var(--mono)', fontSize: 14, color: ok ? 'var(--ok)' : 'var(--erro)' }}>
                      {ok ? '✓' : '✗'} {n}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {pronto && (
        <div className="cartao" style={{ borderColor: 'var(--ok)' }}>
          <div className="olho">você acabou de executar isto, com o mouse</div>
          <div className="term" style={{ marginTop: 10 }}>
            {comandos.map((c) => <div key={c}><span className="cmd">{c}</span></div>)}
          </div>
          <button className="btn primario" style={{ marginTop: 12 }} onClick={() => onConcluir?.()}>agora no teclado</button>
        </div>
      )}
    </div>
  );
}
