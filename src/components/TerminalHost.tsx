'use client';

import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { temaTerminalPadrao, type TemaTerminal } from '@/deck/temas';

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
export function TerminalHost({
  socket, ativo, gaveta, tema = temaTerminalPadrao, onFechar,
}: { socket: Socket | null; ativo: boolean; gaveta: boolean; tema?: TemaTerminal; onFechar?: () => void }) {
  const [focado, setFocado] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const termRef = useRef<{
    term: unknown; fit: { fit: () => void }; write: (d: string) => void;
    cols: () => number; rows: () => number; blurir: () => void;
    aplicarTema: (t: TemaTerminal) => void;
  } | null>(null);
  const abriu = useRef(false);
  /** o tema atual num ref: o xterm é montado uma vez, e trocamos depois */
  const temaRef = useRef(tema);
  temaRef.current = tema;

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
        /**
         * Fonte como string literal: o xterm mede o caractere para calcular a
         * grade, e `var(--mono)` não é resolvido por ele. Com variável CSS as
         * métricas saem erradas e o texto fica torto e feio.
         */
        fontFamily: '"SF Mono", SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas, "DejaVu Sans Mono", monospace',
        fontSize: 15,
        fontWeight: 400,
        fontWeightBold: 600,
        lineHeight: 1.3,
        letterSpacing: 0,
        cursorBlink: true,
        cursorStyle: 'bar',
        convertEol: true,
        drawBoldTextInBrightColors: true,
        minimumContrastRatio: 4.5,
        // "escuro = é aqui que se digita": o único bloco escuro da tela
        theme: temaRef.current.cores,
        scrollback: 2000,
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(caixa.current);
      fit.fit();

      /**
       * Esc Esc devolve o teclado ao slide. Precisa ser aqui dentro: o xterm
       * captura as teclas antes da janela, então um listener global nunca veria
       * o Escape (era o "Esc Esc não funciona").
       */
      let ultimoEsc = 0;
      term.attachCustomKeyEventHandler((ev: KeyboardEvent) => {
        if (ev.type !== 'keydown') return true;
        if (ev.key !== 'Escape') { ultimoEsc = 0; return true; }
        const agora = Date.now();
        if (agora - ultimoEsc < 600) {
          ultimoEsc = 0;
          term.blur();
          (document.activeElement as HTMLElement | null)?.blur();
          return false;          // não manda o segundo Esc para o shell
        }
        ultimoEsc = agora;
        return true;             // o primeiro Esc é do programa (vim, por ex.)
      });
      term.textarea?.addEventListener('focus', () => setFocado(true));
      term.textarea?.addEventListener('blur', () => setFocado(false));

      term.onData((d: string) => socket?.emit('term:entrada', d));
      term.onResize(({ cols, rows }: { cols: number; rows: number }) => socket?.emit('term:resize', { cols, rows }));

      termRef.current = {
        term, fit, write: (d: string) => term.write(d),
        cols: () => term.cols, rows: () => term.rows,
        blurir: () => { term.blur(); (document.activeElement as HTMLElement | null)?.blur(); },
        aplicarTema: (t: TemaTerminal) => { term.options.theme = t.cores; },
      };

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

  /** troca de tema no terminal já aberto, sem recriar nada */
  useEffect(() => {
    const t = termRef.current;
    if (!t) return;
    t.aplicarTema(tema);
  }, [tema]);

  // recebe a saída do PTY
  useEffect(() => {
    if (!socket) return;
    const aoReceber = (d: string) => termRef.current?.write(d);
    socket.on('term:dados', aoReceber);
    return () => { socket.off('term:dados', aoReceber); };
  }, [socket]);

  /**
   * Abre a sessão quando o socket E o xterm estiverem prontos — os dois ficam
   * prontos em ordens diferentes, então tentamos até conseguir. Antes isso
   * acontecia dentro da montagem do xterm, com o socket ainda null: o terminal
   * aparecia na tela e nunca recebia nada.
   */
  useEffect(() => {
    if (!socket) return;
    abriu.current = false;
    const tentar = () => {
      if (abriu.current) return true;
      const t = termRef.current;
      if (!t) return false;
      socket.emit('term:abrir', { cols: t.cols(), rows: t.rows() });
      abriu.current = true;
      return true;
    };
    if (tentar()) return;
    const i = setInterval(() => { if (tentar()) clearInterval(i); }, 200);
    const aoReconectar = () => { abriu.current = false; tentar(); };
    socket.on('connect', aoReconectar);
    return () => { clearInterval(i); socket.off('connect', aoReconectar); };
  }, [socket]);

  /**
   * Posiciona a caixa em cima do slot da cena. Antes isto rodava num
   * requestAnimationFrame infinito (gastando bateria do notebook de 30 pessoas
   * por duas horas); agora reage a mudança de tamanho, rolagem e troca de cena.
   */
  useEffect(() => {
    const el = caixa.current?.parentElement;
    if (!el) return;

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
    };

    posicionar();
    const ro = new ResizeObserver(posicionar);
    const slot = document.getElementById('slot-terminal');
    if (slot) ro.observe(slot);
    ro.observe(document.body);
    window.addEventListener('resize', posicionar);
    window.addEventListener('scroll', posicionar, true);
    // a cena entra com uma animação de 380ms: reposiciona quando ela terminar
    const t = setTimeout(posicionar, 420);
    const i = setInterval(posicionar, 1000);   // rede de segurança, barata
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', posicionar);
      window.removeEventListener('scroll', posicionar, true);
      clearTimeout(t); clearInterval(i);
    };
  }, [ativo, gaveta]);

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, zIndex: 40,
        borderRadius: 'var(--r)', overflow: 'hidden', background: tema.cores.background,
        padding: 'var(--e1)', boxShadow: '0 10px 40px rgba(0,0,0,.18)',
        transition: 'opacity 200ms var(--ease)',
      }}
    >
      {/* Botão de fechar no canto superior direito: só aparece no terminal aberto pela barra (gaveta) depois que a pessoa clica nele */}
      {gaveta && !ativo && focado && onFechar && (
        <button
          type="button"
          aria-label="fechar terminal"
          title="Fechar terminal"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            termRef.current?.blurir();
            onFechar();
          }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 45,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--e1)',
            background: 'rgba(22, 22, 26, 0.88)',
            border: '1px solid #3a3a42',
            color: '#e8e8ea',
            borderRadius: 'var(--r-p)',
            padding: '0 var(--e1)',
            fontSize: 12,
            fontFamily: 'var(--sans)',
            cursor: 'pointer',
          }}
        >
          ✕ fechar
        </button>
      )}
      <div ref={caixa} style={{ width: '100%', height: 'calc(100% - 26px)' }} />
      {/* rodapé do terminal: diz onde está o teclado e como sair dele */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--e1)', height: 22, color: focado ? tema.cores.green : tema.cores.brightBlack, fontSize: 11, fontFamily: 'var(--sans)' }}>
        {focado ? 'o teclado está no terminal' : 'clique aqui para digitar'}
        <button
          onClick={() => { termRef.current?.blurir(); }}
          style={{ marginLeft: 'auto', background: 'none', border: '1px solid #3a3a42', color: '#a7a7b0', borderRadius: 'var(--r-p)', padding: '2px var(--e1)', fontSize: 11, cursor: 'pointer' }}
        >
          devolver teclado ao slide (Esc Esc)
        </button>
      </div>
    </div>
  );
}
