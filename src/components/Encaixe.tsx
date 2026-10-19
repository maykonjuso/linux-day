'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Faz a cena CABER na tela.
 *
 * Rolar não serve: numa apresentação ninguém rola o projetor, e o que ficou
 * embaixo simplesmente não existe para a turma. Então medimos a altura real do
 * conteúdo e reduzimos a escala até caber, com um piso (abaixo disso a letra
 * fica ilegível e aí sim liberamos a rolagem, avisando).
 *
 * Usamos `transform: scale`, e não font-size, porque escala leva tudo junto:
 * texto, caixas, diagramas e espaçamentos continuam proporcionais.
 */
const PISO = 0.62;

export function Encaixe({ children, chave }: { children: React.ReactNode; chave: string }) {
  const fora = useRef<HTMLDivElement>(null);
  const dentro = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [rolar, setRolar] = useState(false);

  const medir = useCallback(() => {
    const caixa = fora.current;
    const conteudo = dentro.current;
    if (!caixa || !conteudo) return;

    // mede sem escala e sem altura fixa para saber o tamanho natural
    conteudo.style.transform = 'none';
    conteudo.style.height = 'auto';
    const alturaDisponivel = caixa.clientHeight;
    const alturaNatural = conteudo.scrollHeight;
    if (!alturaDisponivel || !alturaNatural) return;

    const bruta = alturaDisponivel / alturaNatural;
    const nova = Math.min(1, Math.max(PISO, Number(bruta.toFixed(3))));
    setEscala(nova);
    setRolar(bruta < PISO);

    /*
     * Zoom proporcional, sem mexer na largura.
     *
     * A versão anterior compensava a largura (`width: 100/escala%`) para a cena
     * continuar preenchendo a tela. Isso criava duas coisas ruins: a proporção
     * ficava esticada (letra menor numa caixa mais larga) e, pior, o texto
     * refluía e a altura CRESCIA, então a conta da escala nunca fechava e a
     * cena continuava estourando.
     *
     * Reduzir tudo junto é o que uma pessoa faria com o zoom do navegador: o
     * slide fica menor e sobra margem, mas nada distorce e nada é cortado.
     */
    conteudo.style.transform = `scale(${nova})`;

    /*
     * `transform` não muda o layout: o navegador continua reservando a altura
     * original, e o contêiner acha que precisa de rolagem mesmo com o conteúdo
     * desenhado menor. Fixar a altura no tamanho PINTADO faz o layout
     * concordar com o que a pessoa vê, e a barra de rolagem desaparece.
     */
    conteudo.style.height = `${Math.ceil(alturaNatural * nova)}px`;
  }, []);

  useEffect(() => {
    // duas medições: uma agora e outra depois da animação de entrada da cena
    medir();
    const t1 = setTimeout(medir, 60);
    const t2 = setTimeout(medir, 260);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [chave, medir]);

  useEffect(() => {
    const ro = new ResizeObserver(() => medir());
    if (dentro.current) ro.observe(dentro.current);
    if (fora.current) ro.observe(fora.current);
    window.addEventListener('resize', medir);
    document.fonts?.ready?.then(() => medir()).catch(() => {});
    return () => { ro.disconnect(); window.removeEventListener('resize', medir); };
  }, [medir]);

  return (
    <div
      ref={fora}
      data-encaixe={escala < 1 ? 'reduzido' : 'inteiro'}
      style={{ position: 'relative', minHeight: 0, overflowY: rolar ? 'auto' : 'hidden', overflowX: 'hidden' }}
    >
      <div ref={dentro} style={{ transformOrigin: 'top center', willChange: 'transform', width: '100%' }}>
        {children}
      </div>
      {rolar && (
        <div className="chip forte" style={{ position: 'sticky', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 'fit-content' }}>
          role para ver o resto
        </div>
      )}
    </div>
  );
}
