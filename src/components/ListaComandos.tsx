'use client';

import { COMANDOS } from '@/deck/comandos';

/**
 * Os comandos de um módulo com o que cada um faz e um exemplo pronto.
 *
 * Antes era só uma fileira de nomes (`grep -c`, `uniq -c`…): para quem viu o
 * comando uma vez, o nome sozinho não diz como usar. Aqui cada linha responde
 * as duas perguntas da hora do aperto: "o que isso faz?" e "como eu escrevo?".
 */
export function ListaComandos({ comandos, alturaMax, compacta, resumo }: { comandos: string[]; alturaMax?: string; compacta?: boolean; resumo?: boolean }) {
  return (
    <div className={`lista-comandos${compacta ? ' compacta' : ''}${resumo ? ' resumo' : ''}`} style={alturaMax ? { maxHeight: alturaMax, overflowY: 'auto' } : undefined}>
      {comandos.map((c) => {
        const info = COMANDOS[c];
        return (
          <div key={c} className="linha-comando">
            <code className="kbd">{c}</code>
            <span className="faz">{info?.faz ?? ''}</span>
            {/* sempre três células, para a grade não desalinhar: sem exemplo útil
                (o exemplo é o próprio comando), a célula fica vazia */}
            <code className="exemplo">{info?.exemplo && info.exemplo !== c ? info.exemplo : ''}</code>
          </div>
        );
      })}
    </div>
  );
}
