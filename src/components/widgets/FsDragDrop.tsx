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
      <div className="olho">clique num arquivo e depois na área da pasta certa</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 44 }}>
        {soltos.map((a) => (
          <button key={a.nome} className="btn" data-arquivo={a.nome} onClick={() => setSel(a.nome === sel ? null : a.nome)}
            style={{ fontFamily: 'var(--mono)', borderColor: sel === a.nome ? 'var(--acento)' : 'var(--borda)' }}>
            {a.nome}
          </button>
        ))}
        {soltos.length === 0 && <span style={{ color: 'var(--tinta-2)' }}>bagunça resolvida 🎉</span>}
      </div>

      <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        {PASTAS.map((p) => {
          const dentro = Object.entries(onde).filter(([, v]) => v === p).map(([n]) => n);
          return (
            <div key={p} className="cartao" style={{ display: 'grid', gap: 10 }}>
              <strong style={{ fontFamily: 'var(--mono)' }}>{p === 'lixeira' ? '🗑 lixeira' : `${p}/`}</strong>

              {/* a área de soltar é um alvo próprio: antes, com os arquivos
                  empilhados, o centro do card caía sobre um nome de arquivo e o
                  clique REMOVIA em vez de soltar */}
              <button
                data-pasta={p}
                onClick={() => { if (sel) { setOnde({ ...onde, [sel]: p }); setSel(null); } }}
                disabled={!sel}
                style={{
                  minHeight: 54, borderRadius: 10, cursor: sel ? 'pointer' : 'default',
                  border: `1.5px ${sel ? 'dashed var(--acento)' : 'solid var(--borda)'}`,
                  background: sel ? '#eff4ff' : 'var(--papel-2)',
                  color: 'var(--tinta-2)', fontSize: 14,
                }}
              >
                {sel ? `soltar ${sel} aqui` : 'solte aqui'}
              </button>

              <div style={{ display: 'grid', gap: 4 }}>
                {dentro.map((n) => {
                  const certo = ARQUIVOS.find((a) => a.nome === n)?.pasta === p;
                  return (
                    <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 14, color: certo ? 'var(--ok)' : 'var(--erro)' }}>
                      {certo ? '✓' : '✗'} {n}
                      <button
                        aria-label={`tirar ${n} de ${p}`}
                        onClick={() => { const o = { ...onde }; delete o[n]; setOnde(o); }}
                        style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--tinta-2)', padding: '0 4px' }}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
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
