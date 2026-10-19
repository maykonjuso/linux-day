'use client';

import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';

/**
 * O terminal.
 *
 * Montado UMA vez e mantido vivo do começo ao fim do workshop. Se ele fosse
 * filho da cena, cada navegação remontaria o xterm.js e a pessoa perderia
 * histórico, scroll e sessão — e, pior, o estado do sistema de arquivos dela
 * precisa acompanhá-la do M1 até o boss.
 *
 * Como aparece "dentro" do slide: a cena de lab declara um slot vazio
 * (#slot-terminal) e este componente se posiciona em cima dele, seguindo
 * mudanças de tamanho com ResizeObserver. Fora das cenas de lab ele recolhe
 * para uma gaveta — ainda vivo, porque alguém sempre vai querer testar um
 * comando no meio de um slide de teoria, e deixar isso acontecer é ótimo.
 */
export function TerminalHost({ socket, ativo, gaveta }: { socket: Socket | null; ativo: boolean; gaveta: boolean }) {
  const caixa = useRef<HTMLDivElement>(null);
  const termRef = useRef<{ term: unknown; fit: { fit: () => void }; write: (d: string) => void } | null>(null);

  // monta o xterm.js uma única vez
  useEffect(() => {
    if (!caixa.current || termRef.current) return;
    let vivo = true;

    (async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import('@xterm/xterm'),
        import('@xterm/addon-fit'),
      ]);
      if (!vivo || !caixa.current) return;

      const term = new Terminal({
        fontFamily: 'var(--mono), monospace',
        fontSize: 15,
        cursorBlink: true,
        convertEol: true,
        // "escuro = é aqui que se digita": o único bloco escuro da tela
        theme: { background: '#16161a', foreground: '#e8e8ea', cursor: '#7dd3a0', selectionBackground: '#334155' },
        scrollback: 2000,
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(caixa.current);
      fit.fit();

      term.onData((d: string) => socket?.emit('term:entrada', d));
      term.onResize(({ cols, rows }: { cols: number; rows: number }) => socket?.emit('term:resize', { cols, rows }));

      termRef.current = { term, fit, write: (d: string) => term.write(d) };
      socket?.emit('term:abrir', { cols: term.cols, rows: term.rows });

      const ro = new ResizeObserver(() => {
        // o fit() só depois da animação da cena: redimensionar PTY no meio de
        // uma transição embaralha a saída
        clearTimeout((window as unknown as { __fitT?: number }).__fitT);
        (window as unknown as { __fitT?: number }).__fitT = window.setTimeout(() => {
          try { fit.fit(); } catch { /* caixa some durante troca de cena */ }
        }, 150) as unknown as number;
      });
      ro.observe(caixa.current);
    })();

    return () => { vivo = false; };
  }, [socket]);

  // recebe a saída do PTY
  useEffect(() => {
    if (!socket) return;
    const aoReceber = (d: string) => termRef.current?.write(d);
    socket.on('term:dados', aoReceber);
    return () => { socket.off('term:dados', aoReceber); };
  }, [socket]);

  // posiciona em cima do slot da cena de lab (ou na gaveta)
  useEffect(() => {
    const el = caixa.current?.parentElement;
    if (!el) return;
    let raf = 0;

    const posicionar = () => {
      const slot = document.getElementById('slot-terminal');
      if (ativo && slot) {
        const r = slot.getBoundingClientRect();
        el.style.transform = `translate(${r.left}px, ${r.top}px)`;
        el.style.width = `${r.width}px`;
        el.style.height = `${r.height}px`;
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      } else if (gaveta) {
        el.style.transform = `translate(2vw, ${window.innerHeight - 280}px)`;
        el.style.width = '46vw';
        el.style.height = '220px';
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      } else {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      }
      raf = requestAnimationFrame(posicionar);
    };
    raf = requestAnimationFrame(posicionar);
    return () => cancelAnimationFrame(raf);
  }, [ativo, gaveta]);

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, zIndex: 40,
        borderRadius: 'var(--r)', overflow: 'hidden', background: '#16161a',
        padding: 10, boxShadow: '0 10px 40px rgba(0,0,0,.18)',
        transition: 'opacity 200ms var(--ease)',
      }}
    >
      <div ref={caixa} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
