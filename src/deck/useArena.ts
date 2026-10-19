'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { DECK } from './content';
import type { EstadoEvento, Papel, Participante } from './types';

export interface GrupoPublico {
  nome: string; cor: string; capacidade: number; media: number;
  papeis: Record<string, string>; membros: Participante[];
}
export interface Placar { individual: Participante[]; grupos: GrupoPublico[] }
export interface ResultadoCriterio {
  id: string; passou: boolean; mensagem?: string; adesivo?: boolean; xp?: number; papel?: string | null;
}

const CHAVE = 'arena:eu';

/**
 * Conexão única com o servidor.
 * O estado da apresentação NUNCA é calculado aqui: o cliente só desenha o que
 * o servidor manda. É isso que faz uma aba recarregada no minuto 70 voltar
 * exatamente para onde estava — cena, passo, tempo, XP e critérios.
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
  const [badge, setBadge] = useState<{ nick: string; badge: string; descricao: string } | null>(null);
  const [subiuNivel, setSubiuNivel] = useState<{ nick: string; patente: string } | null>(null);
  const [ganho, setGanho] = useState<{ xp: number; mult: number; em: number } | null>(null);
  const [evento, setEvento] = useState<string | null>(null);
  const [ambientePronto, setAmbientePronto] = useState(false);
  const [chat, setChat] = useState<{ nick: string; emoji: string; texto: string; em: number }[]>([]);

  useEffect(() => {
    const s = io({ path: '/rt', transports: ['websocket', 'polling'] });
    socketRef.current = s;

    s.on('connect', () => {
      setConectado(true);
      if (papel !== 'player') return;
      const salvo = typeof localStorage !== 'undefined' ? localStorage.getItem(CHAVE) : null;
      if (salvo) {
        const { id, nick, emoji } = JSON.parse(salvo);
        s.emit('entrar', { id, nick, emoji }, (r: { eu: Participante }) => setEu(r.eu));
      }
    });
    s.on('disconnect', () => setConectado(false));
    s.on('estado', (e: EstadoEvento) => { setEstado(e); setRevelacao(null); });
    s.on('tempo', (restante: number) => setEstado((e) => ({ ...e, restante })));
    s.on('placar', setPlacar);
    s.on('presenca', setPresenca);
    s.on('revelacao', setRevelacao);
    s.on('aviso', (t: string) => { setAviso(t); setTimeout(() => setAviso(null), 10_000); });
    s.on('ambiente', ({ pronto }: { pronto: boolean }) => setAmbientePronto(pronto));
    s.on('xp', ({ total, xp, mult }: { total: number; xp: number; mult: number }) => {
      setEu((p) => (p ? { ...p, xp: total } : p));
      setGanho({ xp, mult, em: Date.now() });
      setTimeout(() => setGanho(null), 2200);
    });
    s.on('tokens', ({ saldo }: { saldo: number }) => setEu((p) => (p ? { ...p, tokens: saldo } : p)));
    s.on('combo', ({ mult }: { mult: number }) => setEu((p) => (p ? { ...p, combo: mult } : p)));
    s.on('nivel', ({ nick, patente, id }: { nick: string; patente: string; id: string }) => {
      setEu((p) => (p && p.id === id ? { ...p, nivel: p.nivel + 1 } : p));
      setSubiuNivel({ nick, patente });
      setTimeout(() => setSubiuNivel(null), 2600);
    });
    s.on('badge', (b: { nick: string; badge: string; descricao: string }) => {
      setBadge(b); setTimeout(() => setBadge(null), 4000);
    });
    s.on('evento', ({ tipo }: { tipo: string }) => { setEvento(tipo); setTimeout(() => setEvento(null), 8000); });
    s.on('evento:fim', () => setEvento(null));
    s.on('grupo', (nome: string) => setEu((p) => (p ? { ...p, grupo: nome } : p)));
    s.on('grupo:chat', (m: { nick: string; emoji: string; texto: string; em: number }) =>
      setChat((c) => [...c.slice(-40), m]));

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

  const verificar = useCallback((taskSlug: string, resposta = '') =>
    new Promise<{ resultados: ResultadoCriterio[]; ganho: number; todos: boolean; erro?: string }>((ok) => {
      socketRef.current?.emit('lab:verificar', { taskSlug, resposta }, ok);
    }), []);

  const pedirDica = useCallback((taskSlug: string, indice: number) =>
    new Promise<{ dica?: string; custo?: number; erro?: string }>((ok) => {
      socketRef.current?.emit('lab:dica', { taskSlug, indice }, ok);
    }), []);

  const resetarAmbiente = useCallback(() =>
    new Promise<{ ok?: boolean; erro?: string }>((ok) => {
      socketRef.current?.emit('lab:reset', null, ok);
    }), []);

  const cena = useMemo(() => DECK[Math.min(estado.cenaIndex, DECK.length - 1)], [estado.cenaIndex]);
  const meuGrupo = useMemo(() => placar.grupos.find((g) => g.nome === eu?.grupo) ?? null, [placar.grupos, eu?.grupo]);

  return {
    socket: socketRef.current, conectado, estado, cena, eu, placar, presenca, revelacao,
    aviso, badge, subiuNivel, ganho, evento, ambientePronto, chat, meuGrupo,
    entrar, verificar, pedirDica, resetarAmbiente,
    emit: (ev: string, ...args: unknown[]) => socketRef.current?.emit(ev, ...args),
  };
}

export type Arena = ReturnType<typeof useArena>;
