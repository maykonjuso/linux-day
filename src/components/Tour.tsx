'use client';

import { Icone, type NomeIcone } from './Icone';

/**
 * "O que é cada coisa desta tela."
 * Um workshop de duas horas não tem tempo para explicar a interface; esta
 * janela explica sozinha, e fica a um clique durante o evento inteiro.
 */
const ITENS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: 'xp', titulo: 'XP', texto: 'Seus pontos. Eles nunca diminuem. Você ganha respondendo, fazendo os exercícios e completando os laboratórios.' },
  { icone: 'token', titulo: 'Tokens', texto: 'Moedinhas para comprar dicas. Você começa com 3 e ganha mais acertando perguntas. Gastar token nunca tira XP.' },
  { icone: 'troféu', titulo: 'Posição', texto: 'Seu lugar no placar. Só aparecem os dez primeiros e você, então ninguém fica exposto em último.' },
  { icone: 'anterior', titulo: 'Voltar e avançar slide', texto: 'Você pode olhar os slides sozinho, no seu ritmo. Enquanto estiver olhando sozinho aparece o botão "voltar ao vivo".' },
  { icone: 'consultar', titulo: 'Consultar', texto: 'Abre os comandos que já vimos, a lista de comandos por situação e o glossário das palavras difíceis. Use à vontade, não custa nada.' },
  { icone: 'duvida', titulo: 'Me perdi', texto: 'Avisa um monitor que você precisa de ajuda. Não custa ponto nenhum e não aparece para a turma.' },
  { icone: 'terminal', titulo: 'Terminal', texto: 'A janela preta onde você digita os comandos. Nos laboratórios ela aparece sozinha. Para tirar o teclado dela, aperte Esc duas vezes.' },
  { icone: 'verificar', titulo: 'Verificar', texto: 'Nos laboratórios, confere o que você fez e acende os itens certos. Pode clicar quantas vezes quiser.' },
  { icone: 'recomecar', titulo: 'Começar de novo', texto: 'Se você bagunçar tudo, isso devolve o ambiente limpo. É de graça e você não perde XP. Pode quebrar sem medo.' },
];

export function Tour({ onFechar }: { onFechar: () => void }) {
  return (
    <div onClick={onFechar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,11,12,.5)', zIndex: 58, display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="cartao" onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(760px, 100%)', maxHeight: '82vh', overflow: 'auto', display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icone nome="info" />
          <strong style={{ fontSize: 20 }}>O que é cada coisa desta tela</strong>
          <button className="btn" style={{ marginLeft: 'auto', padding: '6px 12px' }} onClick={onFechar}>fechar</button>
        </div>
        <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {ITENS.map((i) => (
            <div key={i.titulo} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--papel-2)', flex: 'none' }}>
                <Icone nome={i.icone} tamanho={19} cor="var(--acento)" />
              </div>
              <div>
                <strong style={{ fontSize: 15 }}>{i.titulo}</strong>
                <p style={{ fontSize: 14, color: 'var(--tinta-2)', marginTop: 3 }}>{i.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
