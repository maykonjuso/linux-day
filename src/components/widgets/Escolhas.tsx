'use client';

import { useMemo, useState } from 'react';
import { embaralhar } from '@/deck/embaralhar';
import type { Rodada } from '@/deck/rodadas';

export type { Rodada } from '@/deck/rodadas';
export { ESCAPE, PERIGO, PREVER, ERROS } from '@/deck/rodadas';

/**
 * Quatro widgets que compartilham a mesma mecânica (escolher entre opções com
 * feedback imediato) e por isso compartilham um componente:
 *   escape-room      → qual tecla te salva desta tela
 *   spot-the-danger  → qual destes comandos destrói algo
 *   predict-output   → o que este comando vai fazer
 *   error-match      → qual é a causa desta mensagem de erro
 *
 * Contrato: errar não dói (dá para tentar de novo na hora), feedback no mesmo
 * lugar da ação, e a explicação aparece sempre — inclusive quando acerta.
 */

export function Escolhas({ rodadas, onConcluir }: { rodadas: Rodada[]; onConcluir?: () => void }) {
  const [i, setI] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const r = rodadas[i];
  // a certa vinha sempre em primeiro: quem percebia acertava tudo sem ler
  const opcoes = useMemo(() => (r ? embaralhar(r.opcoes, r.contexto + r.pergunta) : []), [r]);

  if (!r) return <div className="cartao" style={{ color: 'var(--ok)' }}>✅ {rodadas.length} de {rodadas.length}. Próximo.</div>;

  const op = escolha !== null ? opcoes[escolha] : null;

  return (
    <div className="grade" style={{ gap: 'var(--e2)' }}>
      <div className="olho">rodada {i + 1} de {rodadas.length}</div>
      {r.mono
        ? <div className="term">{r.contexto}</div>
        : <p className="corpo-p">{r.contexto}</p>}
      <strong style={{ fontSize: 'var(--t3)' }}>{r.pergunta}</strong>

      {/* mesmas cores e formas do quiz (o formato Kahoot que a turma já conhece);
          a key reinicia a animação de entrada a cada rodada */}
      <div className="alternativas kahoot" key={i}>
        {opcoes.map((o, j) => (
          <button key={o.texto} className="alt" data-cor={j % 4}
            data-estado={escolha === null ? undefined : o.certo ? 'certa' : j === escolha ? 'errada' : undefined}
            disabled={escolha !== null}
            onClick={() => setEscolha(j)}
            style={{ ['--ordem' as string]: j, fontFamily: o.texto.length < 22 ? 'var(--mono)' : 'var(--sans)' }}>
            <span className="letra">{['▲', '◆', '●', '■'][j % 4]}</span>
            <span style={{ flex: 1 }}>{o.texto}</span>
          </button>
        ))}
      </div>

      {op && (
        <div className="veredito-widget" data-certo={!!op.certo}>
          <span><strong>{op.certo ? 'Isso!' : 'Ainda não.'}</strong> {op.porque}</span>
          {op.certo ? (
            <button className="btn primario" style={{ marginLeft: 'auto' }}
              onClick={() => { setEscolha(null); if (i + 1 < rodadas.length) setI(i + 1); else { setI(rodadas.length); onConcluir?.(); } }}>
              {i + 1 < rodadas.length ? 'próxima' : 'concluir'}
            </button>
          ) : (
            <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => setEscolha(null)}>tentar de novo</button>
          )}
        </div>
      )}
    </div>
  );
}
