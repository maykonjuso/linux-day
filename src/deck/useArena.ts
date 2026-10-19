'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { DECK } from './content';
import type { EstadoEvento, Papel, Participante } from './types';

export interface Placar {
  individual: Participante[];
  grupos: { nome: string; cor: string; capacidade: number; media: number; membros: Participante[] }[];
}

const CHAVE = 'arena:eu';

/**
 * Conexão única com o servidor. O estado da apresentação NUNCA é calculado
 * aqui: o cliente só desenha o que o servidor manda. É isso que faz uma aba
 * recarregada no meio do workshop voltar exatamente para onde estava.
 */
export function useArena(papel: Papel) {
  const socketRef = useRef<Socket | null>(null);
  const [conectado, setConectado] = useState(false);
  const [estado, setEstado] = useState<EstadoEvento>({ cenaIndex: 0, passo: 0, fase: 'idle', pausado: false, restante: null });
  const [eu, setEu] = useState<Participante | null>(null);
  const [placar, setPlacar] = useState<Placar>({ individual: [], grupos: [] });
  const [presenca, setPresenca] = useState<Participante[]>([]);
  const [revelacao, setRevelacao] = useState<{ cenaId: string; correta: string; distribuicao: Record<string, number> } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const s = io({ path: '/rt', transports: ['websocket', 'polling'] });
    socketRef.current = s;

    s.on('connect', () => {
      setConectado(true);
      if (papel === 'player') {
        const salvo = localStorage.getItem(CHAVE);
        if (salvo) {
          const { id, nick, emoji } = JSON.parse(salvo);
          s.emit('entrar', { id, nick, emoji }, (r: { eu: Participante }) => setEu(r.eu));
        }
      }
    });
    s.on('disconnect', () => setConectado(false));
    s.on('estado', (e: EstadoEvento) => { setEstado(e); setRevelacao(null); });
    s.on('tempo', (restante: number) => setEstado((e) => ({ ...e, restante })));
    s.on('placar', setPlacar);
    s.on('presenca', setPresenca);
    s.on('revelacao', setRevelacao);
    s.on('aviso', (t: string) => { setAviso(t); setTimeout(() => setAviso(null), 8000); });
    s.on('xp', ({ total }: { total: number }) => setEu((p) => (p ? { ...p, xp: total } : p)));

    const batida = setInterval(() => s.emit('batida'), 20_000);
    return () => { clearInterval(batida); s.close(); };
  }, [papel]);

  const entrar = useCallback((nick: string, emoji: string) => {
    const s = socketRef.current;
    if (!s) return;
    const salvo = localStorage.getItem(CHAVE);
    const id = salvo ? JSON.parse(salvo).id : undefined;
    s.emit('entrar', { id, nick, emoji }, (r: { eu: Participante }) => {
      setEu(r.eu);
      localStorage.setItem(CHAVE, JSON.stringify({ id: r.eu.id, nick: r.eu.nick, emoji: r.eu.emoji }));
    });
  }, []);

  const cena = useMemo(() => DECK[Math.min(estado.cenaIndex, DECK.length - 1)], [estado.cenaIndex]);

  return {
    socket: socketRef.current,
    conectado, estado, cena, eu, placar, presenca, revelacao, aviso,
    entrar,
    emit: (evento: string, ...args: unknown[]) => socketRef.current?.emit(evento, ...args),
  };
}

export type Arena = ReturnType<typeof useArena>;
