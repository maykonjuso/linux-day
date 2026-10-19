'use client';

import { ARMADILHAS, HABITOS, PACOTE } from '@/deck/pacote';

/**
 * O cheatsheet — o artefato de maior valor percebido, e o que eles levam para
 * casa. Organizado por SITUAÇÃO, nunca em ordem alfabética de comando.
 * Imprima esta página em A4 (o CSS de impressão já está pronto) e entregue na
 * ENTRADA, não no fim.
 */
export default function Cheatsheet() {
  return (
    <main className="folha">
      <style>{`
        body { overflow: auto; }
        .folha { padding: 28px 5vw 60px; }
        .colunas { columns: 2; column-gap: 26px; }
        .bloco { break-inside: avoid; margin-bottom: 16px; }
        .bloco h3 { font-size: 14px; margin: 0 0 6px; }
        .bloco code { display: block; font-family: var(--mono); font-size: 12.5px; color: var(--tinta); padding: 1px 0; }
        @media print {
          @page { size: A4; margin: 10mm; }
          .naoimprime { display: none; }
          .folha { padding: 0; }
          .colunas { columns: 3; column-gap: 8mm; }
          .bloco h3 { font-size: 10pt; }
          .bloco code { font-size: 8.5pt; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
        <h1 style={{ fontSize: 26 }}>Pacote de sobrevivência do Linux</h1>
        <small style={{ color: 'var(--tinta-2)' }}>~40 comandos, por situação</small>
        <button className="btn naoimprime" style={{ marginLeft: 'auto' }} onClick={() => window.print()}>imprimir</button>
      </div>

      <div className="colunas">
        {PACOTE.map((p) => (
          <div key={p.situacao} className="bloco">
            <h3>{p.situacao}</h3>
            {p.itens.map((i) => <code key={i}>{i}</code>)}
          </div>
        ))}

        <div className="bloco">
          <h3>Três armadilhas que parecem defeito do computador</h3>
          {ARMADILHAS.map((a) => <code key={a.o}>{a.o} — {a.nem}</code>)}
        </div>

        <div className="bloco">
          <h3>Seis hábitos (valem mais que os comandos)</h3>
          {HABITOS.map((h, i) => <code key={h.titulo}>{i + 1}. {h.titulo} — {h.porque}</code>)}
        </div>

        <div className="bloco">
          <h3>Meus aliases</h3>
          <code>________________________________</code>
          <code>________________________________</code>
          <code>________________________________</code>
        </div>
      </div>
    </main>
  );
}
