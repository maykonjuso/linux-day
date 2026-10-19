'use client';

import { useMemo, useState } from 'react';

const QUEM = ['dono', 'grupo', 'outros'] as const;
const BITS = [
  { k: 'r', peso: 4, label: 'ler' },
  { k: 'w', peso: 2, label: 'escrever' },
  { k: 'x', peso: 1, label: 'executar' },
] as const;

const DESAFIOS = [
  { alvo: '700', texto: 'Deixe que só o dono faça tudo, e mais ninguém entre.' },
  { alvo: '644', texto: 'Todos podem ler, só o dono pode editar. (o padrão de um arquivo de texto)' },
  { alvo: '755', texto: 'Todos podem executar, só o dono pode editar. (o padrão de um script)' },
];

/**
 * Widget `permission-toggles`.
 * Contrato (docs/plano-slides-ux.md T5b): errar não dói, feedback < 300ms,
 * estado sempre visível ao lado da ação, e ponte explícita para o comando.
 */
export default function PermissionToggles({ onConcluir }: { onConcluir?: () => void }) {
  const [grade, setGrade] = useState<boolean[][]>([
    [true, true, false],
    [true, false, false],
    [true, false, false],
  ]);
  const [i, setI] = useState(0);
  const [feitos, setFeitos] = useState<number[]>([]);

  const numero = useMemo(
    () => grade.map((linha) => linha.reduce((s, on, j) => s + (on ? BITS[j].peso : 0), 0)).join(''),
    [grade],
  );
  const simbolico = useMemo(
    () => '-' + grade.map((linha) => linha.map((on, j) => (on ? BITS[j].k : '-')).join('')).join(''),
    [grade],
  );

  const desafio = DESAFIOS[i];
  const acertou = desafio && numero === desafio.alvo;

  function alternar(q: number, b: number) {
    setGrade((g) => g.map((linha, qi) => (qi === q ? linha.map((on, bi) => (bi === b ? !on : on)) : linha)));
  }

  function proximo() {
    const novosFeitos = [...feitos, i];
    setFeitos(novosFeitos);
    if (i + 1 < DESAFIOS.length) setI(i + 1);
    else onConcluir?.();
  }

  return (
    <div className="duas">
      <div className="grade">
        {QUEM.map((quem, q) => (
          <div key={quem} className="cartao" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <strong style={{ width: 74, fontSize: 15 }}>{quem}</strong>
            {BITS.map((bit, b) => (
              <button
                key={bit.k}
                onClick={() => alternar(q, b)}
                aria-pressed={grade[q][b]}
                className="btn"
                style={{
                  flex: '1 1 52px', minWidth: 48, maxWidth: 90, padding: '10px 0',
                  fontFamily: 'var(--mono)', fontWeight: 700,
                  background: grade[q][b] ? 'var(--acento)' : 'var(--papel)',
                  color: grade[q][b] ? '#fff' : 'var(--tinta-2)',
                  borderColor: grade[q][b] ? 'var(--acento)' : 'var(--borda)',
                }}
              >
                {bit.k}
              </button>
            ))}
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--tinta-2)' }}>
              {grade[q].reduce((s, on, j) => s + (on ? BITS[j].peso : 0), 0)}
            </span>
          </div>
        ))}
      </div>

      <div className="grade">
        <div className="term" style={{ fontSize: 'clamp(20px, 2.6vw, 40px)', textAlign: 'center' }}>
          {simbolico}
          <div style={{ color: '#ffd479', marginTop: 8 }}>{numero}</div>
        </div>

        {desafio && (
          <div className="cartao" style={{ borderColor: acertou ? 'var(--ok)' : 'var(--borda)' }}>
            <div className="olho">desafio {i + 1} de {DESAFIOS.length}</div>
            <p style={{ marginTop: 6 }}>{desafio.texto}</p>
            {acertou && (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <strong style={{ color: 'var(--ok)' }}>✅ é isso</strong>
                <code className="kbd">chmod {numero} arquivo</code>
                <button className="btn primario" onClick={proximo} style={{ marginLeft: 'auto' }}>
                  {i + 1 < DESAFIOS.length ? 'próximo' : 'concluir'}
                </button>
              </div>
            )}
          </div>
        )}
        {!desafio && <div className="cartao" style={{ color: 'var(--ok)' }}>✅ três de três. Agora no terminal.</div>}
      </div>
    </div>
  );
}
