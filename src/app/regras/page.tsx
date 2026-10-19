'use client';

import { ECONOMIA } from '@/deck/pacote';
import { NIVEIS } from '@/deck/types';

/** Jogo com regra escondida gera reclamação no fim. Esta página fica aberta. */
export default function Regras() {
  return (
    <main style={{ padding: '40px 6vw', maxHeight: '100vh', overflow: 'auto' }}>
      <div className="olho">Linux Day Arena</div>
      <h1 className="titulo" style={{ fontSize: 40, marginBottom: 20 }}>As regras, todas</h1>

      <div className="grade" style={{ maxWidth: 880 }}>
        <div className="cartao">
          <h2 style={{ fontSize: 22 }}>Duas moedas</h2>
          <p style={{ color: 'var(--tinta-2)', marginTop: 8 }}>
            <strong>XP</strong> é a sua pontuação: <strong>nunca diminui</strong>. Dica, erro, reset e
            desconexão não tiram XP de ninguém.<br />
            <strong>Tokens 🪙</strong> são recurso: começam em 3, você ganha em acertos e gasta em dicas.
            Por que separado? Porque se a dica custasse pontuação, quem mais precisa de ajuda seria quem
            mais afunda no ranking — o contrário do que um workshop quer.
          </p>
        </div>

        <div className="cartao">
          <h2 style={{ fontSize: 22 }}>De onde vem o XP</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
            <tbody>
              {ECONOMIA.map((e) => (
                <tr key={e.fonte} style={{ borderTop: '1px solid var(--borda)' }}>
                  <td style={{ padding: '8px 0' }}><strong>{e.fonte}</strong><br /><small style={{ color: 'var(--tinta-2)' }}>{e.detalhe}</small></td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{e.total} XP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cartao">
          <h2 style={{ fontSize: 22 }}>Níveis</h2>
          <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
            {NIVEIS.map((n) => (
              <div key={n.nivel} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="chip">{n.xp} XP</span>
                <strong style={{ width: 110 }}>{n.patente}</strong>
                <code className="kbd">{n.prompt}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="cartao">
          <h2 style={{ fontSize: 22 }}>Justiça</h2>
          <ul style={{ color: 'var(--tinta-2)', lineHeight: 1.7 }}>
            <li>Nenhum último lugar é exibido: o placar mostra o top 10 e a sua posição.</li>
            <li>Pontos parciais em todo lab com mais de um critério — ninguém sai com zero.</li>
            <li>Flags e respostas são sorteadas por pessoa: copiar resposta não funciona, copiar o comando funciona (e é aprendizado).</li>
            <li>Verificar é ilimitado (10s de intervalo). Tentar de novo é o método, não trapaça.</li>
            <li>Desconexão é neutra: o tempo de bônus conta de quando a tarefa abriu <em>para você</em>.</li>
            <li>Resetar o ambiente é sempre de graça e mantém todo o XP.</li>
            <li>Quem chega atrasado entra jogando e pontua integralmente dali para frente.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
