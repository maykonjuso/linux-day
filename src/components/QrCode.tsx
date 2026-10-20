'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * QR code gerado aqui mesmo, sem serviço externo: no dia não há internet.
 * Sempre escuro sobre branco, nos dois temas: leitor de câmera tropeça em QR
 * invertido, e o projetor lava o contraste.
 */
export function QrCode({ texto, tamanho = 220, rotulo }: { texto: string; tamanho?: number; rotulo?: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    QRCode.toString(texto, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0b0b0c', light: '#ffffff' } })
      .then((s) => { if (vivo) setSvg(s); })
      .catch(() => { if (vivo) setSvg(null); });
    return () => { vivo = false; };
  }, [texto]);

  return (
    <div role="img" aria-label={rotulo ?? `QR code para ${texto}`} data-qr={texto}
      style={{ width: tamanho, height: tamanho, background: '#ffffff', borderRadius: 'var(--r)', padding: 8, flex: 'none' }}
      // o SVG sai da biblioteca a partir de um texto nosso, não de entrada de usuário
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined} />
  );
}
