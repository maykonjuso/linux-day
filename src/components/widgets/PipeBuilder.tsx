'use client';

import { useMemo, useState } from 'react';

/**
 * Widget `pipe-builder` — o melhor widget do workshop.
 * A pessoa monta o encanamento peça por peça e **vê a saída se transformando**:
 * 50.652 linhas → 1.281 → cortadas → ordenadas → contadas → top 3.
 * O pipe é abstrato demais para ser só explicado; aqui ele acontece.
 *
 * Toque, não arrastar: clicar para encaixar funciona com o dedo, e metade da
 * sala vai estar no celular.
 */
const PECAS = [
  { id: 'grep', rotulo: 'grep ERROR', explica: 'só as linhas que têm ERROR' },
  { id: 'cut', rotulo: 'cut -d" " -f3', explica: 'só a 3ª coluna (o IP)' },
  { id: 'sort', rotulo: 'sort', explica: 'põe em ordem' },
  { id: 'uniq', rotulo: 'uniq -c', explica: 'conta as repetições vizinhas' },
  { id: 'sortrn', rotulo: 'sort -rn', explica: 'maior primeiro' },
  { id: 'head', rotulo: 'head -3', explica: 'só as 3 primeiras' },
];

const ORDEM = ['grep', 'cut', 'sort', 'uniq', 'sortrn', 'head'];

// saídas reais do ~/app.log semeado por infra/seed/m4.sh (confira lá se mudar o seed)
const SAIDAS: Record<string, string[]> = {
  '': ['2026-10-19T08:01:00 INFO 10.0.0.9 requisicao atendida', '2026-10-19T08:02:00 INFO 192.168.0.14 requisicao atendida', '2026-10-19T08:03:00 INFO 172.16.0.3 requisicao atendida', '… 50.652 linhas'],
  grep: ['2026-10-19T08:13:00 ERROR 10.0.0.9 conexao recusada', '2026-10-19T08:37:00 ERROR 10.0.0.9 timeout ao gravar no banco', '2026-10-19T08:50:00 ERROR 192.168.0.14 conexao recusada', '… 1.281 linhas'],
  'grep|cut': ['10.0.0.9', '10.0.0.9', '192.168.0.14', '… 1.281 linhas, só o IP'],
  'grep|cut|sort': ['10.0.0.7', '10.0.0.7', '10.0.0.7', '… 1.281 linhas, em ordem'],
  'grep|cut|sort|uniq': ['    257 10.0.0.7', '    258 10.0.0.9', '    508 172.16.0.3', '    258 192.168.0.14'],
  'grep|cut|sort|uniq|sortrn': ['    508 172.16.0.3', '    258 192.168.0.14', '    258 10.0.0.9', '    257 10.0.0.7'],
  'grep|cut|sort|uniq|sortrn|head': ['    508 172.16.0.3', '    258 192.168.0.14', '    258 10.0.0.9'],
};

export default function PipeBuilder({ onConcluir }: { onConcluir?: () => void }) {
  const [tubo, setTubo] = useState<string[]>([]);
  const chave = tubo.join('|');
  const saida = useMemo(() => SAIDAS[chave] ?? ['(nesta ordem a saída fica estranha, e ver isso também ensina)'], [chave]);
  const certo = chave === ORDEM.join('|');
  const errou = !SAIDAS[chave];

  return (
    <div className="grade" style={{ gap: 'var(--e2)' }}>
      <div style={{ display: 'flex', gap: 'var(--e1)', flexWrap: 'wrap', alignItems: 'center' }}>
        <code className="kbd" style={{ fontSize: '1.05em' }}>cat app.log</code>
        {tubo.map((id, i) => (
          <span key={`${id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--e1)' }}>
            <strong style={{ color: 'var(--acento)' }}>|</strong>
            <button className="btn" data-tubo={id} onClick={() => setTubo(tubo.slice(0, i))}
              title="clique para remover esta peça e as seguintes"
              style={{ borderColor: 'var(--acento)', color: 'var(--acento)', fontFamily: 'var(--mono)', display: 'flex', gap: 'var(--e05)', alignItems: 'center' }}>
              {PECAS.find((p) => p.id === id)?.rotulo}
              <span aria-hidden style={{ opacity: 0.55 }}>×</span>
            </button>
          </span>
        ))}
        {tubo.length > 0 && <button className="btn" data-limpar onClick={() => setTubo([])}>limpar</button>}
      </div>

      <div className="olho">peças disponíveis. Clique para encaixar no fim do encanamento</div>
      <div style={{ display: 'flex', gap: 'var(--e1)', flexWrap: 'wrap' }}>
        {/* peças nas cores do quiz: são as "opções" deste exercício */}
        {PECAS.filter((p) => !tubo.includes(p.id)).map((p) => (
          <button key={p.id} className="peca-colorida" data-peca={p.id} data-cor={PECAS.indexOf(p) % 4}
            onClick={() => setTubo([...tubo, p.id])}>
            {p.rotulo}
            <small>{p.explica}</small>
          </button>
        ))}
      </div>

      <div className="term" style={{ minHeight: '22vh' }}>
        <span className="saida">{saida.join('\n')}</span>
      </div>

      {errou && <div className="cartao" style={{ borderColor: 'var(--atencao)' }}>
        Nesta ordem o encanamento não faz sentido. Tente outra. Tentar de novo é de graça.
      </div>}
      {certo && (
        <div className="cartao" style={{ borderColor: 'var(--ok)', display: 'flex', gap: 'var(--e2)', alignItems: 'center', flexWrap: 'wrap' }}>
          <strong style={{ color: 'var(--ok)' }}>✅ é esse o top 3</strong>
          <code className="kbd">cat app.log | grep ERROR | cut -d&quot; &quot; -f3 | sort | uniq -c | sort -rn | head -3</code>
          <button className="btn primario" style={{ marginLeft: 'auto' }} onClick={() => onConcluir?.()}>concluir</button>
        </div>
      )}
    </div>
  );
}
