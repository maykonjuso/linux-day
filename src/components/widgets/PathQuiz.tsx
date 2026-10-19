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
      <div className="term">
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
        <div className="olho">clique na pasta onde você vai parar</div>
        {/* cores do quiz; o recuo de cada pasta mostra a árvore */}
        <div className="alternativas kahoot arvore-pastas" key={i}>
          {ARVORE.map((p, j) => {
            const estado = escolha ? (p === r.alvo ? 'certa' : p === escolha ? 'errada' : undefined) : undefined;
            return (
              <button
                key={p}
                className="alt"
                data-cor={j % 4}
                data-estado={estado}
                disabled={!!escolha}
                style={{ ['--ordem' as string]: j, ['--nivel' as string]: p.split('/').filter(Boolean).length, fontFamily: 'var(--mono)' }}
                onClick={() => !escolha && setEscolha(p)}
              >
                <span className="letra">{['▲', '◆', '●', '■'][j % 4]}</span>
                {p}
              </button>
            );
          })}
        </div>
        {escolha && (
          <div className="veredito-widget" data-certo={certo}>
            <strong>{certo ? 'Isso!' : 'Quase.'}</strong>&nbsp;
            <code className="kbd">{r.comando}</code> leva para <code className="kbd">{r.alvo}</code>.
            <button
              className="btn primario"
              style={{ marginLeft: 'auto' }}
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
