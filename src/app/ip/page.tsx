'use client';

import { useEffect, useState } from 'react';
import { QrCode } from '@/components/QrCode';

interface Rede {
  porta: number;
  principal: string | null;
  enderecos: { interface: string; ip: string; url: string; virtual: boolean }[];
  wsl: boolean;
}

/**
 * O endereço da aplicação, grande e com QR code, para projetar enquanto a turma
 * chega. Quem sabe o IP é o servidor (o navegador do projetor abre por
 * localhost e não tem como saber), então a página pergunta a ele.
 */
export default function Ip() {
  const [rede, setRede] = useState<Rede | null>(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    fetch('/api/rede').then((r) => r.json()).then(setRede).catch(() => setErro(true));
  }, []);

  const principal = rede?.principal;
  return (
    <main style={{ minHeight: '100dvh', overflow: 'auto', padding: 'var(--e5) var(--e4)', display: 'grid', placeItems: 'center' }}>
      <div style={{ display: 'grid', gap: 'var(--e3)', justifyItems: 'center', textAlign: 'center', maxWidth: 960 }}>
        <div className="olho">Linux Day Arena · entre por aqui</div>

        {!rede && !erro && (
          // esqueleto do QR e do endereço, no tamanho que eles vão ocupar
          <div role="status" aria-label="buscando o endereço do servidor" style={{ display: 'grid', gap: 'var(--e3)', justifyItems: 'center' }}>
            <div style={{ width: 320, height: 320, borderRadius: 'var(--r)', background: 'var(--papel-2)' }} />
            <div style={{ width: 420, maxWidth: '80vw', height: 56, borderRadius: 'var(--r)', background: 'var(--papel-2)' }} />
          </div>
        )}
        {erro && <p className="corpo-p">Não consegui perguntar o endereço ao servidor. Ele está no ar?</p>}

        {principal && (
          <>
            <QrCode texto={principal} tamanho={320} rotulo={`QR code do endereço ${principal}`} />
            <code className="kbd" data-endereco style={{ fontSize: 'clamp(28px, 5vw, 64px)', padding: 'var(--e1) var(--e3)', wordBreak: 'break-all' }}>
              {principal}
            </code>
            <p className="corpo-p">Aponte a câmera do celular para o QR code, ou digite o endereço no navegador do notebook.</p>
          </>
        )}

        {rede && !principal && (
          <p className="corpo-p">Este computador não está em nenhuma rede. Conecte o Wi-Fi ou o cabo e recarregue a página.</p>
        )}

        {rede?.wsl && (
          <div className="cartao" style={{ borderColor: 'var(--atencao)', textAlign: 'left', maxWidth: 720 }}>
            <strong>O servidor está rodando no WSL.</strong> Esse endereço é de uma rede interna do Windows, e os outros
            computadores não chegam nele. Use o IP do Windows e encaminhe a porta {rede.porta}
            (<code>netsh interface portproxy</code>), ou ative a rede espelhada do WSL.
          </div>
        )}

        {rede && rede.enderecos.length > 1 && (
          <details style={{ color: 'var(--tinta-2)' }}>
            <summary>outros endereços deste computador ({rede.enderecos.length - 1})</summary>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'var(--e1)', display: 'grid', gap: 'var(--e05)' }}>
              {rede.enderecos.slice(1).map((e) => (
                <li key={e.url}><code>{e.url}</code> <small>({e.interface}{e.virtual ? ', virtual' : ''})</small></li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </main>
  );
}
