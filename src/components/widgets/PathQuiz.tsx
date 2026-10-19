'use client';

import { useState } from 'react';

const ARVORE = ['/', '/home', '/home/aluno', '/home/aluno/docs', '/home/aluno/docs/2024'];

const RODADAS = [
  { de: '/home/aluno/docs/2024', comando: 'cd ..', alvo: '/home/aluno/docs' },
  { de: '/home/aluno/docs/2024', comando: 'cd ../..', alvo: '/home/aluno' },
  { de: '/home/aluno/docs', comando: 'cd ~', alvo: '/home/aluno' },
];

/** Widget `path-quiz`: caminho relativo deixa de ser abstrato antes de digitar `cd`. */
export default function PathQuiz({ onConcluir }: { onConcluir?: () => void }) {
  const [i, setI] = useState(0);
  const [escolha, setEscolha] = useState<string | null>(null);
  const r = RODADAS[i];
  const certo = escolha === r?.alvo;

  if (!r) return <div className="cartao" style={{ color: 'var(--ok)' }}>✅ três de três. Caminho relativo destravado.</div>;

  return (
    <div className="duas">
      <div className="term" style={{ fontSize: 'clamp(16px, 1.8vw, 26px)' }}>
        <span className="saida">você está em</span>
        <br />
        <span className="cmd">{r.de}</span>
        <br />
        <br />
        <span className="saida">e digita</span>
        <br />
        <span className="cmd">{r.comando}</span>
      </div>

      <div className="grade">
        <div className="olho">clique onde você cai</div>
        {ARVORE.map((p) => {
          const estado = escolha ? (p === r.alvo ? 'certa' : p === escolha ? 'errada' : undefined) : undefined;
          return (
            <button
              key={p}
              className="alt"
              data-estado={estado}
              style={{ paddingLeft: 16 + p.split('/').filter(Boolean).length * 22, fontFamily: 'var(--mono)' }}
              onClick={() => !escolha && setEscolha(p)}
            >
              {p}
            </button>
          );
        })}
        {escolha && (
          <div className="cartao" style={{ borderColor: certo ? 'var(--ok)' : 'var(--atencao)' }}>
            {certo ? '✅ isso. ' : '↩︎ quase. '}
            <code className="kbd">{r.comando}</code> leva para <code className="kbd">{r.alvo}</code>.
            <button
              className="btn primario"
              style={{ marginLeft: 12 }}
              onClick={() => {
                setEscolha(null);
                if (i + 1 < RODADAS.length) setI(i + 1);
                else { setI(RODADAS.length); onConcluir?.(); }
              }}
            >
              continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
