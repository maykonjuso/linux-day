'use client';

import { useState } from 'react';

/**
 * Widget `command-builder`: montar o comando encaixando as peças, com cada
 * peça rotulada pelo seu papel (programa, subcomando, flag, argumento).
 * Depois da terceira vez, a pessoa começa a decompor comandos novos sozinha —
 * que é o objetivo real do workshop.
 */
const DESAFIO = {
  objetivo: 'Instale o programa htop, como administrador, sem o apt ficar perguntando nada.',
  alvo: ['sudo', 'apt', 'install', '-y', 'htop'],
  pecas: [
    { t: 'sudo', papel: 'como administrador' },
    { t: 'apt', papel: 'o programa' },
    { t: 'install', papel: 'a ação' },
    { t: '-y', papel: 'flag: não me pergunte nada' },
    { t: 'htop', papel: 'argumento: o quê' },
    { t: 'remove', papel: 'a ação (outra)' },
    { t: '--help', papel: 'flag: mostra a ajuda' },
  ],
};

export default function CommandBuilder({ onConcluir }: { onConcluir?: () => void }) {
  const [linha, setLinha] = useState<string[]>([]);
  const certo = linha.join(' ') === DESAFIO.alvo.join(' ');

  return (
    <div className="grade" style={{ gap: 16 }}>
      <p className="corpo" style={{ maxWidth: '44em' }}>{DESAFIO.objetivo}</p>

      <div className="term" style={{ fontSize: 'clamp(18px, 2.2vw, 34px)', minHeight: 72 }}>
        <span className="cmd">{linha.join(' ') || '…'}</span>
      </div>

      <div style={{ display: 'flex', gap: 'var(--e1)', flexWrap: 'wrap' }}>
        {DESAFIO.pecas.filter((p) => !linha.includes(p.t)).map((p) => (
          <button key={p.t} className="btn" onClick={() => setLinha([...linha, p.t])}
            style={{ display: 'grid', gap: '2px', textAlign: 'left' }}>
            <code style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{p.t}</code>
            <small style={{ color: 'var(--tinta-2)' }}>{p.papel}</small>
          </button>
        ))}
        {linha.length > 0 && <button className="btn" onClick={() => setLinha([])}>limpar</button>}
      </div>

      {linha.length >= DESAFIO.alvo.length && !certo && (
        <div className="cartao" style={{ borderColor: 'var(--atencao)' }}>
          Quase. A ordem importa: quem manda primeiro, depois o programa, depois a ação, depois as flags, e por último o quê.
        </div>
      )}
      {certo && (
        <div className="cartao" style={{ borderColor: 'var(--ok)', display: 'flex', gap: 'var(--e2)', alignItems: 'center', flexWrap: 'wrap' }}>
          <strong style={{ color: 'var(--ok)' }}>✅ é exatamente isso</strong>
          <span style={{ color: 'var(--tinta-2)' }}>e todo comando do Linux tem essa mesma anatomia.</span>
          <button className="btn primario" style={{ marginLeft: 'auto' }} onClick={() => onConcluir?.()}>concluir</button>
        </div>
      )}
    </div>
  );
}
