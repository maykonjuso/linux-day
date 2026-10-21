'use client';

import { useState, useEffect } from 'react';
import { Texto } from './Texto';

const EXTENSOES = ['.png', '.jpeg', '.jpg', '.webp', '.svg'];

export function SlideFigura({
  src,
  legenda,
  alt,
  maxAltura,
}: {
  src?: string;
  legenda?: string;
  alt?: string;
  maxAltura?: string | number;
}) {
  const [extIndex, setExtIndex] = useState(0);
  const [falhouTudo, setFalhouTudo] = useState(false);

  const baseSemExt = src ? src.replace(/\.(png|jpe?g|webp|svg)$/i, '') : '';
  const extOriginal = src ? (src.match(/\.(png|jpe?g|webp|svg)$/i)?.[0]?.toLowerCase() ?? '') : '';

  const listaExtensoes = extOriginal
    ? [extOriginal, ...EXTENSOES.filter((e) => e !== extOriginal)]
    : EXTENSOES;

  useEffect(() => {
    setExtIndex(0);
    setFalhouTudo(false);
  }, [src]);

  if (!src || falhouTudo) return null;

  const currentSrc = baseSemExt ? `${baseSemExt}${listaExtensoes[extIndex]}` : src;

  function lidarComErro() {
    if (extIndex + 1 < listaExtensoes.length) {
      setExtIndex((prev) => prev + 1);
    } else {
      setFalhouTudo(true);
    }
  }

  return (
    <figure className="slide-figura">
      {/* sem key na <img>: com key o React desmonta e remonta a cada troca de
          extensão/passo, forçando reload e a animação de entrada de novo.
          Sem key o browser reutiliza o elemento DOM e o cache da imagem — sem
          piscada quando a mesma imagem já está carregada. */}
      <img
        src={currentSrc}
        alt={alt ?? legenda ?? ''}
        onError={lidarComErro}
        style={maxAltura ? { maxHeight: typeof maxAltura === 'number' ? `${maxAltura}px` : maxAltura } : undefined}
      />
      {legenda && (
        <figcaption>
          <Texto>{legenda}</Texto>
        </figcaption>
      )}
    </figure>
  );
}
