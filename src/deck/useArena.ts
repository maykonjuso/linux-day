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

/** estado de um jogo de equipe em andamento (vem do servidor) */
export interface EstadoArena {
  cenaId: string;
  jogo: 'corrida' | 'buzzer' | 'montagem' | 'caca-erro';
  premios?: number[];
  chegadas?: { equipe: string; nick: string; xp: number; posicao: number }[];
  tentativas?: Record<string, number>;
  fila?: { equipe: string; nick: string }[];
  erradas?: string[];
  resolvido?: boolean;
  desafio?: {
    jogo: string; enunciado: string;
    pecas?: { id: string; rotulo: string }[]; tamanho?: number;
    linhas?: { id: string; texto: string }[]; quantos?: number;
  } | null;
  /** a resposta, quando o apresentador decide mostrar para a sala */
  explicacao?: { texto: string; erro: string }[] | null;
}
export interface ResultadoCriterio {
  id: string; passou: boolean; mensagem?: string; adesivo?: boolean; xp?: number; papel?: string | null;
}

const CHAVE = 'arena:eu';
const ULTIMO = 'arena:ultimo';
/** 4 minutos sem tocar em nada = provavelmente saiu da frente do computador */
const LIMITE_OCIOSO = 4 * 60_000;

/**
 * Conexão única com o servidor.
 * O estado da apresentação NUNCA é calculado aqui: o cliente só desenha o que
 * o servidor manda. É isso que faz uma aba recarregada no minuto 70 voltar
 * exatamente para onde estava — cena, passo, tempo, XP e critérios.
 */
export function useArena(papel: Papel) {
  const socketRef = useRef<Socket | null>(null);
  // o socket TAMBÉM em state: num ref, trocar o valor não re-renderiza, e
  // quem depende dele (o TerminalHost) montava com null e nunca abria o PTY
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conectado, setConectado] = useState(false);
  const [estado, setEstado] = useState<EstadoEvento>({ cenaIndex: 0, passo: 0, fase: 'idle', pausado: false, restante: null });
  const [eu, setEu] = useState<Participante | null>(null);
  const [placar, setPlacar] = useState<Placar>({ individual: [], grupos: [] });
  const [presenca, setPresenca] = useState<Participante[]>([]);
  const [revelacao, setRevelacao] = useState<{ cenaId: string; correta: string; distribuicao: Record<string, number> } | null>(null);
  /** quantas pessoas já responderam a cena da vez (estilo Kahoot) */
  const [respostas, setRespostas] = useState<{ cenaId: string; total: number; esperados: number } | null>(null);
  /** jogo de equipe em andamento */
  const [arenaEstado, setArenaEstado] = useState<EstadoArena | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [badge, setBadge] = useState<{ nick: string; badge: string; descricao: string } | null>(null);
  const [subiuNivel, setSubiuNivel] = useState<{ nick: string; patente: string } | null>(null);
  const [ganho, setGanho] = useState<{ xp: number; mult: number; em: number } | null>(null);
  const [evento, setEvento] = useState<string | null>(null);
  /** o ambiente Linux da pessoa já foi semeado? (começa pronto para quem volta) */
  const [ambienteOk, setAmbienteOk] = useState(true);
  const [chat, setChat] = useState<{ nick: string; emoji: string; texto: string; em: number }[]>([]);
  /** gabaritos do quiz: o servidor só manda para o apresentador autenticado */
  const [gabaritos, setGabaritos] = useState<Record<string, { correta: string; segundos: number; xpBase: number }>>({});
  /** quantas dicas cada lab tem (vem do servidor) */
  const [labs, setLabs] = useState<Record<string, { dicas: number }>>({});
  /** ninguém mexeu há muito tempo: a tela pergunta se a pessoa ainda está aí */
  const [ocioso, setOcioso] = useState(false);
  const ultimaInteracao = useRef(Date.now());

  /**
   * Um timeout por tipo de aviso, sempre cancelando o anterior. Sem isso o
   * timer de um aviso antigo apagava o seguinte antes da hora.
   */
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const efemero = useCallback(<T,>(chave: string, set: (v: T | null) => void, valor: T, ms: number) => {
    clearTimeout(timers.current[chave]);
    set(valor);
    timers.current[chave] = setTimeout(() => set(null), ms);
  }, []);

  useEffect(() => {
    const s = io({ path: '/rt', transports: ['websocket', 'polling'] });
    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      setConectado(true);
      if (papel !== 'player') return;
      const salvo = typeof localStorage !== 'undefined' ? localStorage.getItem(CHAVE) : null;
      if (salvo) {
        const { id, nick, emoji } = JSON.parse(salvo);
        s.emit('entrar', { id, nick, emoji }, (r: { eu: Participante; codigo?: string; ambientePronto?: boolean }) => {
          setEu(r.eu);
          if (r.codigo) setCodigo(r.codigo);
          setAmbienteOk(r.ambientePronto !== false);
        });
      }
    });
    s.on('disconnect', () => setConectado(false));
    s.on('estado', (e: EstadoEvento) => { setEstado(e); setRevelacao(null); });
    s.on('tempo', (restante: number) => setEstado((e) => ({ ...e, restante })));
    s.on('placar', setPlacar);
    s.on('presenca', setPresenca);
    s.on('revelacao', setRevelacao);
    s.on('respostas', setRespostas);
    s.on('gabaritos', setGabaritos);
    s.on('arena', setArenaEstado);
    s.on('aviso', (t: string) => efemero('aviso', setAviso, t, 10_000));
    s.on('ambiente', ({ pronto }: { pronto: boolean }) => setAmbienteOk(pronto));
    s.on('xp', ({ total, xp, mult }: { total: number; xp: number; mult: number }) => {
      setEu((p) => (p ? { ...p, xp: total } : p));
      efemero('ganho', setGanho, { xp, mult, em: Date.now() }, 2200);
    });
    s.on('tokens', ({ saldo }: { saldo: number }) => setEu((p) => (p ? { ...p, tokens: saldo } : p)));
    s.on('combo', ({ mult }: { mult: number }) => setEu((p) => (p ? { ...p, combo: mult } : p)));
    s.on('nivel', ({ nick, patente, id }: { nick: string; patente: string; id: string }) => {
      setEu((p) => (p && p.id === id ? { ...p, nivel: p.nivel + 1 } : p));
      efemero('nivel', setSubiuNivel, { nick, patente }, 2600);
    });
    s.on('badge', (b: { nick: string; badge: string; descricao: string }) => efemero('badge', setBadge, b, 5000));
    s.on('evento', ({ tipo }: { tipo: string }) => efemero('evento', setEvento, tipo, 8000));
    s.on('evento:fim', () => setEvento(null));
    // eco do servidor para a própria pessoa: sem isso o card do grupo não
    // acendia e o chat não aparecia para quem acabou de entrar
    s.on('grupo', (nome: string | null) => setEu((p) => (p ? { ...p, grupo: nome, papel: null } : p)));
    s.on('papel', (papelCarta: string | null) => setEu((p) => (p ? { ...p, papel: papelCarta } : p)));
    s.on('criterios', (lista: string[]) => setEu((p) => (p ? { ...p, criterios: lista } : p)));
    s.on('badges', (lista: string[]) => setEu((p) => (p ? { ...p, badges: lista } : p)));
    s.on('labs', (info: Record<string, { dicas: number }>) => setLabs(info));
    s.on('expulso', ({ motivo }: { motivo: string }) => {
      localStorage.removeItem(CHAVE);
      setEu(null);
      setExpulso(motivo || 'o apresentador encerrou a sua participação');
    });
    s.on('silenciado', (v: boolean) => setEu((p) => (p ? { ...p, silenciado: v } : p)));
    s.on('terminal:encerrado', ({ motivo }: { motivo: string }) =>
      efemero('terminal', setAvisoTerminal, motivo, 12_000));
    s.on('grupo:chat', (m: { nick: string; emoji: string; texto: string; em: number }) =>
      setChat((c) => [...c.slice(-40), m]));

    /**
     * Presença por interação de verdade. A batida leva há quanto tempo a
     * pessoa não toca em nada: assim quem deixou a aba aberta e saiu para o
     * café sai da contagem e não trava a revelação do quiz para a sala.
     */
    const marcar = () => {
      const antes = Date.now() - ultimaInteracao.current > LIMITE_OCIOSO;
      ultimaInteracao.current = Date.now();
      if (antes) { setOcioso(false); s.emit('voltei'); }
    };
    for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
      window.addEventListener(ev, marcar, { passive: true });
    }

    const batida = setInterval(() => {
      const inativoMs = Date.now() - ultimaInteracao.current;
      s.emit('batida', { inativoMs });
      setOcioso(inativoMs > LIMITE_OCIOSO);
    }, 15_000);
    return () => {
      clearInterval(batida);
      for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
        window.removeEventListener(ev, marcar);
      }
      Object.values(timers.current).forEach(clearTimeout);
      s.close();
      setSocket(null);
    };
  }, [papel, efemero]);

  /** nome recusado por já estar em uso, com sugestões livres */
  const [nomeRecusado, setNomeRecusado] = useState<{ nome: string; sugestoes: string[] } | null>(null);
  /** código de retorno: recupera a conta em outro computador */
  const [codigo, setCodigo] = useState<string | null>(null);
  /** o apresentador removeu esta pessoa da sala */
  const [expulso, setExpulso] = useState<string | null>(null);
  /** o vigia encerrou a sessão de terminal por consumo excessivo */
  const [avisoTerminal, setAvisoTerminal] = useState<string | null>(null);

  const entrar = useCallback((nick: string, emoji: string, idExplicito?: string, codigoDigitado?: string) => {
    const s = socketRef.current;
    if (!s) return;
    const salvo = localStorage.getItem(CHAVE);
    const id = idExplicito ?? (salvo ? JSON.parse(salvo).id : undefined);
    s.emit('entrar', { id, nick, emoji, codigo: codigoDigitado }, (r: { eu?: Participante; codigo?: string; ambientePronto?: boolean; erro?: string; nome?: string; sugestoes?: string[] }) => {
      if (r?.erro === 'nome-em-uso') {
        setNomeRecusado({ nome: r.nome ?? nick, sugestoes: r.sugestoes ?? [] });
        return;
      }
      if (!r?.eu) return;
      setNomeRecusado(null);
      setEu(r.eu);
      if (r.codigo) setCodigo(r.codigo);
      setAmbienteOk(r.ambientePronto !== false);
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

  /** troca o próprio nome (e o avatar), mantendo XP, critérios e grupo */
  const renomear = useCallback((nick: string, emoji?: string) =>
    new Promise<{ ok: boolean; erro?: string }>((resolver) => {
      socketRef.current?.emit('renomear', { nick, emoji }, (r: { eu?: Participante; codigo?: string; erro?: string; nome?: string; sugestoes?: string[] }) => {
        if (r?.erro === 'nome-em-uso') {
          setNomeRecusado({ nome: r.nome ?? nick, sugestoes: r.sugestoes ?? [] });
          return resolver({ ok: false, erro: 'nome-em-uso' });
        }
        if (r?.eu) {
          setEu(r.eu);
          if (r.codigo) setCodigo(r.codigo);
          setNomeRecusado(null);
          localStorage.setItem(CHAVE, JSON.stringify({ id: r.eu.id, nick: r.eu.nick, emoji: r.eu.emoji }));
        }
        resolver({ ok: !!r?.eu, erro: r?.erro });
      });
    }), []);

  /**
   * Sair. Guardamos quem era numa chave separada para a tela de entrada poder
   * oferecer "voltar como ana": o XP continua gravado no servidor, e voltar
   * com o mesmo nome reencontra tudo.
   */
  const sair = useCallback(() => {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) localStorage.setItem(ULTIMO, salvo);
    localStorage.removeItem(CHAVE);
    socketRef.current?.emit('sair');
    setEu(null);
    setNomeRecusado(null);
  }, []);

  /** quem estava usando este navegador antes de sair */
  const ultimaPessoa = useMemo(() => {
    if (typeof localStorage === 'undefined') return null;
    const bruto = localStorage.getItem(ULTIMO);
    if (!bruto) return null;
    try { return JSON.parse(bruto) as { id: string; nick: string; emoji: string }; } catch { return null; }
  }, [eu]);

  /** a pessoa confirma que está aí e volta para a contagem da sala */
  const estouAqui = useCallback(() => {
    ultimaInteracao.current = Date.now();
    setOcioso(false);
    socketRef.current?.emit('voltei');
  }, []);

  const cena = useMemo(() => DECK[Math.min(estado.cenaIndex, DECK.length - 1)], [estado.cenaIndex]);
  const meuGrupo = useMemo(() => placar.grupos.find((g) => g.nome === eu?.grupo) ?? null, [placar.grupos, eu?.grupo]);

  return {
    socket, conectado, estado, cena, eu, placar, presenca, revelacao, respostas,
    aviso, badge, subiuNivel, ganho, evento, ambienteOk, chat, meuGrupo, labs, ocioso, gabaritos,
    nomeRecusado, ultimaPessoa, codigo, expulso, avisoTerminal,
    arena: arenaEstado,
    tentarArena: (resposta: unknown) => new Promise<{
      certo?: boolean; posicao?: number; xp?: number; detalhe?: string; erro?: string;
      noLugar?: number; explicacoes?: { texto: string; erro: string }[];
    }>((r) => {
      socketRef.current?.emit('arena:tentar', { resposta }, r);
    }),
    entrar, renomear, sair, verificar, pedirDica, resetarAmbiente, estouAqui,
    emit: (ev: string, ...args: unknown[]) => socketRef.current?.emit(ev, ...args),
  };
}

export type Arena = ReturnType<typeof useArena>;
