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

/**
 * `modo`:
 *  - 'escala'  (projetor): a cena é reduzida até caber, porque ninguém rola a
 *    parede da sala;
 *  - 'rolagem' (participante e apresentador): a página se comporta como um site
 *    normal. Letra em tamanho de leitura e, se não couber, rola. Encolher no
 *    notebook deixava o texto borrado (o navegador reduz a imagem já desenhada)
 *    e cortava quando o conteúdo crescia depois (exercício liberado).
 */
export function Encaixe({ children, chave, modo = 'escala' }: { children: React.ReactNode; chave: string; modo?: 'escala' | 'rolagem' }) {
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
    conteudo.style.minHeight = '0px';
    const alturaDisponivel = caixa.clientHeight;

    if (modo === 'rolagem') {
      // sem escala: só garante a altura mínima (para centralizar o que é
      // pequeno) e, nas cenas de altura fixa, a altura exata da tela
      const fixa = conteudo.querySelector('[data-altura-fixa]') && window.innerWidth > 900;
      conteudo.style.height = fixa ? `${alturaDisponivel}px` : 'auto';
      conteudo.style.minHeight = fixa ? '0px' : `${alturaDisponivel}px`;
      setEscala(1);
      setRolar(false);
      return;
    }

    /*
     * Cenas de altura fixa (laboratório, jogos com terminal): nada de escala.
     * Elas ocupam exatamente a tela e quem rola é a coluna de dentro. Reduzir
     * a cena inteira deixava a letra do checklist e do terminal pequena demais
     * só porque a lista de comandos era comprida. No celular (uma coluna só)
     * volta ao comportamento normal, porque lá rolar a página é o natural.
     */
    if (conteudo.querySelector('[data-altura-fixa]') && window.innerWidth > 900) {
      conteudo.style.height = `${alturaDisponivel}px`;
      conteudo.style.minHeight = '0px';
      setEscala(1);
      setRolar(false);
      return;
    }

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

    /*
     * Quando o conteúdo é MENOR que a tela, a cena ocupa a altura inteira
     * mesmo assim. Sem isso ela ficava com a altura natural, grudada no topo,
     * e a metade de baixo da tela sobrava vazia em quase todo slide; com a
     * altura cheia, a própria cena distribui o conteúdo (centraliza, ou deixa
     * o terminal crescer no laboratório).
     */
    if (nova === 1) {
      conteudo.style.height = 'auto';
      conteudo.style.minHeight = `${alturaDisponivel}px`;
    }
  }, [modo]);

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
    /*
     * Observa também a CENA (o filho), não só a caixa de fora: depois de
     * medida, a caixa tem altura fixada por nós, então quando o conteúdo cresce
     * (o exercício aparece ao ser liberado) só a cena muda de tamanho. Sem isto
     * o conteúdo novo ficava cortado até alguém recarregar a página.
     */
    const observarCena = () => {
      const cena = dentro.current?.firstElementChild;
      if (cena) ro.observe(cena);
    };
    observarCena();
    const mo = new MutationObserver(() => { observarCena(); medir(); });
    if (dentro.current) mo.observe(dentro.current, { childList: true });
    window.addEventListener('resize', medir);
    document.fonts?.ready?.then(() => medir()).catch(() => {});
    return () => { ro.disconnect(); mo.disconnect(); window.removeEventListener('resize', medir); };
  }, [medir]);

  return (
    <div
      ref={fora}
      data-encaixe={escala < 1 ? 'reduzido' : 'inteiro'}
      style={{ position: 'relative', minHeight: 0, overflowY: rolar || modo === 'rolagem' ? 'auto' : 'hidden', overflowX: 'hidden' }}
    >
      {/* sem will-change: com ele o navegador rasteriza a cena em tamanho cheio
          e reduz a imagem, e o texto fica borrado */}
      <div ref={dentro} style={{ transformOrigin: 'top center', width: '100%', display: 'flex', flexDirection: 'column' }}>
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
