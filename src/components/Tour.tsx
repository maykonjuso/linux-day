'use client';

import { Icone, type NomeIcone } from './Icone';

/**
 * "O que é cada coisa desta tela."
 * Um workshop de duas horas não tem tempo para explicar a interface; esta
 * janela explica sozinha, e fica a um clique durante o evento inteiro.
 */
export const ITENS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: 'xp', titulo: 'XP', texto: 'Seus pontos. Nunca diminuem: você ganha respondendo, nos exercícios e nos laboratórios.' },
  { icone: 'token', titulo: 'Tokens', texto: 'Moedas para comprar dicas nos laboratórios. Você começa com 3 e ganha mais acertando.' },
  { icone: 'troféu', titulo: 'Pódio', texto: 'Depois de cada atividade, a gente mostra o pódio das pessoas e das equipes, com quanto cada um ganhou.' },
  { icone: 'anterior', titulo: 'Voltar slides', texto: 'Reveja os slides que já passaram, só para ler. O botão "ao vivo" traz você de volta.' },
  { icone: 'consultar', titulo: 'Consultar', texto: 'Comandos que já vimos e glossário das palavras difíceis. Use à vontade.' },
  { icone: 'duvida', titulo: 'Me perdi', texto: 'Chama a gente para ajudar. Não custa nada e a turma não vê.' },
  { icone: 'terminal', titulo: 'Terminal', texto: 'A janela preta onde você digita. Nos laboratórios ela aparece sozinha.' },
  { icone: 'verificar', titulo: 'Itens que acendem', texto: 'Nos laboratórios, cada item fica verde sozinho assim que você acerta. Não precisa clicar em nada.' },
  { icone: 'recomecar', titulo: 'Começar de novo', texto: 'Bagunçou tudo? Devolve o ambiente limpo, sem perder XP. Pode quebrar sem medo.' },
];

export function Tour({ onFechar }: { onFechar: () => void }) {
  return (
    <div onClick={onFechar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,11,12,.5)', zIndex: 58, display: 'grid', placeItems: 'center', padding: 'var(--e3)' }}>
      <div className="cartao" onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(760px, 100%)', maxHeight: '82vh', overflow: 'auto', display: 'grid', gap: 'var(--e2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--e1)' }}>
          <Icone nome="info" />
          <strong style={{ fontSize: 20 }}>O que é cada coisa desta tela</strong>
          <button className="btn" style={{ marginLeft: 'auto', padding: 'var(--e1) var(--e2)' }} onClick={onFechar}>fechar</button>
        </div>
        <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {ITENS.map((i) => (
            <div key={i.titulo} style={{ display: 'flex', gap: 'var(--e2)', alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--r-p)', display: 'grid', placeItems: 'center', background: 'var(--papel-2)', flex: 'none' }}>
                <Icone nome={i.icone} tamanho={19} cor="var(--acento)" />
              </div>
              <div>
                <strong style={{ fontSize: 15 }}>{i.titulo}</strong>
                <p style={{ fontSize: 14, color: 'var(--tinta-2)', marginTop: 'var(--e1)' }}>{i.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
