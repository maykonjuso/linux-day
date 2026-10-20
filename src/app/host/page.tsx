'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useArena } from '@/deck/useArena';
import { SceneRouter } from '@/components/SceneRouter';
import { Encaixe } from '@/components/Encaixe';
import { useTema } from '@/deck/useTema';
import { DECK, INICIO_DOS_MODULOS, MINUTOS_TOTAIS, minutosAte } from '@/deck/content';
import { Icone } from '@/components/Icone';
import { MenuControles } from '@/components/MenuControles';
import { Roleta } from '@/components/Roleta';
import { PainelPessoas, type PessoaDaSala } from '@/components/PainelPessoas';

const ROTULO_DA_CENA: Record<string, string> = {
  ArenaScene: 'jogo de equipes',
  Apresentacao: 'apresentação', Controles: 'controles da tela',
  ModuleCover: 'capa de módulo', MentalModel: 'diagrama', CommandAnatomy: 'anatomia do comando',
  TerminalDemo: 'demonstração', WillGoWrong: 'erros comuns', QuizScene: 'pergunta',
  WidgetScene: 'exercício na tela', LabScene: 'laboratório', GroupScene: 'grupos',
  Scoreboard: 'placar', Recap: 'fecho do módulo',
};

/** o que o avançar faz numa cena interativa ainda fechada */
const LIBERAR: Record<string, string> = {
  QuizScene: 'liberar opções', WidgetScene: 'liberar exercício', LabScene: 'liberar terminal', ArenaScene: 'liberar jogo',
};

/** os mesmos de src/server/eventos.mjs (o servidor recusa o que não cabe no momento) */
const EVENTOS_DO_PAINEL: [string, string][] = [
  ['roleta', 'roleta: 1 pessoa a cada 20 gira e joga'],
  ['xp-dobrado', 'XP dobrado: todo XP vale 2× por 3 min'],
  ['relampago', 'relâmpago: XP triplo por 1 min'],
  ['chuva-de-tokens', 'chuva de tokens: +1 token para quem está na sala'],
  ['resgate', 'resgate: +80 XP para os 5 com menos XP'],
  ['resgate-de-equipe', 'resgate de equipe: +60 XP para a equipe com menos XP'],
  ['sabotagem', 'sabotagem: tira o x do deploy.sh de todos (depois do módulo 3)'],
];

/** as versões curtas, para a barra; as longas vão no title */
const ROTULO_CURTO: Record<string, string> = {
  ArenaScene: 'jogo', Apresentacao: 'apresentação', Controles: 'controles', ModuleCover: 'capa',
  MentalModel: 'diagrama', CommandAnatomy: 'comando', TerminalDemo: 'demo', WillGoWrong: 'erros',
  QuizScene: 'pergunta', WidgetScene: 'exercício', LabScene: 'lab', GroupScene: 'grupos', Scoreboard: 'placar', Recap: 'fecho',
};
const FASE_CURTA: Record<string, string> = { idle: 'enunciado', aberta: 'aberta', encerrada: 'esgotado', revelada: 'pódio' };

const FASE_EM_PORTUGUES: Record<string, string> = {
  idle: 'só o enunciado', aberta: 'aberta para a turma', encerrada: 'tempo esgotado', revelada: 'pódio / resposta',
};

interface Grade {
  labs: Record<string, { id: string; descricao: string; xp: number }[]>;
  pessoas: {
    id: string; nick: string; emoji: string; xp: number; presenca: string; grupo: string | null;
    feitos: string[]; travado: boolean; codigo?: string; silenciado?: boolean; conta?: string;
  }[];
  grupos: Record<string, string[]>;
  sessoes: number; fila: number; modo: string;
  travas?: { processos: number; memoriaKb: number; cpuSegundos: number; tetos: { processos: number; memoriaMb: number; cpuSegundos: number } };
}

/**
 * Painel do apresentador. Mesma cena, projeção `host`: você vê a resposta
 * certa, o progresso da sala e os controles.
 *
 * Atalhos: → avança (passo ou cena) · ← volta · A abre a cena (liga o timer)
 * R revela o quiz e pontua · P pausa global · V todos ao vivo · G a grade.
 */
export default function Host() {
  const arena = useArena('host');
  const { estado, cena, presenca, emit, placar } = arena;
  const [pin, setPin] = useState('');
  const [ok, setOk] = useState(false);
  const [recusado, setRecusado] = useState(false);
  const entrarNoPainel = () => emit('host:entrar', pin, (r: boolean) => { setOk(r); setRecusado(!r); });
  const [ajudas, setAjudas] = useState<{ nick: string; em: number }[]>([]);
  const [pulsos, setPulsos] = useState(0);
  const [grade, setGrade] = useState<Grade | null>(null);
  /** o que está na tela do apresentador: o slide, a grade ou a lista de pessoas */
  const [vista, setVista] = useState<'slide' | 'grade' | 'pessoas'>('slide');
  const [recado, setRecado] = useState('');
  const [nota, setNota] = useState<string | null>(null);
  const { tema, trocar } = useTema('claro');

  const segundos = 'segundos' in cena ? (cena as unknown as { segundos: number }).segundos : null;
  const taskSlug = cena.tipo === 'LabScene' ? cena.taskSlug : null;

  /**
   * Um timeout por aviso, cancelando o anterior. Sem o cancelamento, o timer
   * de um aviso antigo apagava o aviso novo antes da hora — o bug clássico de
   * toast que "pisca e desaparece".
   */
  const timerNota = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avisar = useCallback((t: string) => {
    if (timerNota.current) clearTimeout(timerNota.current);
    setNota(t);
    timerNota.current = setTimeout(() => setNota(null), 6000);
  }, []);

  /**
   * Ritmo do Kahoot: toda cena chega FECHADA. Nas cenas em que a turma age
   * (quiz, exercício, lab, jogo) a sala vê só o enunciado, e quem apresenta
   * explica; o avançar seguinte libera as opções e só aí o tempo começa.
   * Enquanto está fechada, o participante não vê opção nenhuma para clicar
   * (ver src/deck/liberada.ts), então não existe o "cliquei e nada aconteceu".
   */
  const ir = useCallback((i: number) => {
    const alvo = Math.min(Math.max(0, i), DECK.length - 1);
    const c = DECK[alvo];
    emit('host:ir', { cenaIndex: alvo, cenaId: c.id, passo: 0, fase: 'idle', segundos: null, arena: null, premios: null });
  }, [emit]);

  /**
   * Relógio do workshop: começa quando o apresentador sai da abertura e fica
   * guardado no navegador, para sobreviver a um recarregar da página. O painel
   * compara com os minutos planejados de cada cena (content.ts).
   */
  const [inicio, setInicio] = useState<number | null>(null);
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    try { const v = Number(localStorage.getItem('linuxday:inicio')); if (v) setInicio(v); } catch { /* aba privada */ }
    const t = setInterval(() => setAgora(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (inicio || estado.cenaIndex === 0) return;
    const v = Date.now();
    setInicio(v);
    try { localStorage.setItem('linuxday:inicio', String(v)); } catch { /* aba privada */ }
  }, [estado.cenaIndex, inicio]);
  const zerarRelogio = () => {
    setInicio(null);
    try { localStorage.removeItem('linuxday:inicio'); } catch { /* aba privada */ }
  };
  const decorrido = inicio ? Math.round((agora - inicio) / 60000) : 0;
  const planejado = Math.round(minutosAte(estado.cenaIndex));
  const atraso = decorrido - planejado;

  const abrir = useCallback(
    () => emit('host:fase', {
      fase: 'aberta', segundos, cenaId: cena.id,
      arena: cena.tipo === 'ArenaScene' ? cena.jogo : null,
      premios: cena.tipo === 'ArenaScene' ? cena.premios ?? null : null,
    }),
    [emit, segundos, cena],
  );

  /**
   * Um botão só, que faz a coisa certa para cada tipo de cena:
   *  - quiz:   enunciado → opções → revela (com o pódio) → próxima cena
   *  - widget/lab/jogo: enunciado → liberado → pódio → próxima cena
   *  - resto:  anda os passos internos e depois vai para a próxima cena
   */
  const avancar = useCallback(() => {
    if (cena.tipo === 'QuizScene') {
      // já revelou: primeiro o pódio (passo 1), depois a próxima cena
      if (estado.fase === 'revelada' && estado.passo < 1) return emit('host:passo', 1);
      if (estado.fase === 'revelada') return ir(estado.cenaIndex + 1);
      // nunca abriu: abre
      if (estado.fase === 'idle') return abrir();
      // aberta OU com o tempo esgotado: revela.
      // (antes, "encerrada" caía no abrir() e o avançar ficava reabrindo a
      //  pergunta para sempre, que era o "não passa de pergunta")
      return emit('host:revelar', { cenaId: cena.id });
    }
    if (cena.tipo === 'WidgetScene' || cena.tipo === 'LabScene' || cena.tipo === 'ArenaScene') {
      if (estado.fase === 'idle') return abrir();
      // como no Kahoot: antes de seguir, o pódio com o XP que cada um ganhou
      if (estado.fase !== 'revelada') return emit('host:fase', { fase: 'revelada', cenaId: cena.id });
      return ir(estado.cenaIndex + 1);
    }
    if (estado.passo + 1 < cena.passos) return emit('host:passo', 1);
    return ir(estado.cenaIndex + 1);
  }, [cena, estado.fase, estado.passo, estado.cenaIndex, emit, ir, abrir]);

  const puxarGrade = useCallback(() => emit('host:grade', null, (g: Grade) => setGrade(g)), [emit]);

  /**
   * Avisos que chegam da turma (pedido de ajuda e "me perdi").
   *
   * A limpeza com `off` é obrigatória: sem ela cada re-render registrava mais
   * um ouvinte no mesmo socket, e um único clique em Ajuda aparecia três vezes
   * na tela. Efeito separado do polling da grade, para não re-registrar
   * ouvintes a cada troca de função.
   */
  useEffect(() => {
    const s = arena.socket;
    if (!ok || !s) return;

    const aoPedirAjuda = ({ nick }: { nick: string }) => setAjudas((fila) => {
      // a mesma pessoa clicando de novo atualiza o horário, não duplica a fila
      const sem = fila.filter((p) => p.nick !== nick);
      return [...sem, { nick, em: Date.now() }].slice(-10);
    });
    const aoSePerder = () => setPulsos((n) => n + 1);

    s.on('ajuda', aoPedirAjuda);
    s.on('pulso', aoSePerder);

    // o vigia encerrou a sessão de alguém: o apresentador precisa saber, porque
    // a pessoa vai perguntar o que aconteceu
    const aoVigiar = ({ nick, motivo }: { nick: string; motivo: string }) => avisar(`terminal de ${nick} reiniciado: ${motivo}`);
    s.on('vigia', aoVigiar);

    // o servidor recusou o avanço: alguém ativo ainda está sem equipe
    const aoBloquear = ({ pendentes }: { pendentes: { nick: string }[] }) => avisar(
      `${pendentes.length === 1 ? '1 pessoa está' : `${pendentes.length} pessoas estão`} sem equipe (${pendentes.slice(0, 4).map((p) => p.nick).join(', ')}${pendentes.length > 4 ? '…' : ''}). Peça para escolherem ou use "completar equipes".`,
    );
    s.on('host:bloqueado', aoBloquear);

    return () => { s.off('ajuda', aoPedirAjuda); s.off('pulso', aoSePerder); s.off('vigia', aoVigiar); s.off('host:bloqueado', aoBloquear); };
  }, [ok, arena.socket, avisar]);

  /** a grade é atualizada por tempo, e isso não deve mexer nos ouvintes */
  useEffect(() => {
    if (!ok) return;
    puxarGrade();
    const t = setInterval(puxarGrade, 5000);
    return () => clearInterval(t);
  }, [ok, puxarGrade]);

  useEffect(() => {
    if (!ok) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); avancar(); }
      else if (e.key === 'ArrowLeft') {
        // volta o passo interno; se já está no primeiro, volta uma cena
        if (estado.passo > 0) emit('host:passo', -1);
        else ir(estado.cenaIndex - 1);
      }
      else if (k === 'a') abrir();
      else if (k === 'r' && cena.tipo === 'QuizScene') emit('host:revelar', { cenaId: cena.id });
      else if (k === 'p') emit('host:pausar', !estado.pausado);
      else if (k === 'v') emit('host:aovivo');
      else if (k === 'g') setVista((v) => (v === 'grade' ? 'slide' : 'grade'));
      else if (k === 's') setVista((v) => (v === 'pessoas' ? 'slide' : 'pessoas'));
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [ok, avancar, abrir, emit, cena, estado.pausado, estado.passo, estado.cenaIndex, ir]);

  if (!ok) {
    return (
      <div className="centro">
        <div className="cartao" style={{ display: 'grid', gap: 'var(--e2)', width: 'min(360px, 100%)' }}>
          <div className="olho">painel do apresentador</div>
          <input className="btn" style={{ textAlign: 'left' }} placeholder="PIN" value={pin} type="password"
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') entrarNoPainel(); }} />
          <button className="btn primario" onClick={entrarNoPainel}>entrar</button>
          {recusado && (
            <small role="alert" style={{ color: 'var(--erro)' }}>
              PIN errado, ou este computador não pode abrir o painel. O painel abre no computador que roda o
              servidor; pela rede, só com ARENA_HOST_REMOTO=1 e um PIN_HOST próprio.
            </small>
          )}
        </div>
      </div>
    );
  }

  const ativos = presenca.filter((p) => p.presenca === 'ativo').length;
  const semEquipe = presenca.filter((p) => p.presenca === 'ativo' && !p.grupo).length;
  const travados = grade?.pessoas.filter((p) => p.travado) ?? [];
  const criteriosDaCena = taskSlug ? grade?.labs?.[taskSlug] ?? [] : [];
  const concluiramPrincipal = taskSlug && criteriosDaCena.length
    ? Math.round(100 * (grade?.pessoas.filter((p) => p.feitos.includes(criteriosDaCena[0].id)).length ?? 0) / Math.max(1, presenca.length))
    : null;

  return (
    <div className="palco" data-papel="host">
      {vista === 'pessoas' && grade ? (
        <PainelPessoas
          pessoas={grade.pessoas as PessoaDaSala[]}
          onResetar={(p) => emit('host:reset', { id: p.id }, () => avisar(`ambiente de ${p.nick} recomeçado`))}
          onSilenciar={(p) => emit('host:silenciar', { id: p.id, silenciado: !p.silenciado },
            (r: { nick: string; silenciado: boolean }) => avisar(`${r?.nick}: chat ${r?.silenciado ? 'silenciado' : 'liberado'}`))}
          onExpulsar={(p) => emit('host:expulsar', { id: p.id }, (r: { nick: string }) => avisar(`${r?.nick ?? p.nick} saiu da sala`))}
        />
      ) : vista === 'grade' && grade ? (
        <div className="cena" style={{ paddingTop: '2vh', overflow: 'auto' }}>
          <div className="olho">grade pessoas × critérios · G volta para o slide</div>
          <div style={{ overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 'var(--e1)' }}>pessoa</th>
                  {Object.entries(grade.labs).map(([slug, cs]) =>
                    cs.map((c) => <th key={c.id} title={`${slug} · ${c.descricao}`} style={{ padding: 'var(--e05)', writingMode: 'vertical-rl', fontWeight: 500, color: 'var(--tinta-2)' }}>{c.id}</th>))}
                  <th style={{ padding: 'var(--e1)' }}>XP</th>
                </tr>
              </thead>
              <tbody>
                {grade.pessoas.sort((a, b) => b.xp - a.xp).map((p) => (
                  <tr key={p.id} style={{ background: p.travado ? 'var(--erro-suave)' : undefined }}>
                    <td style={{ padding: 'var(--e1)', whiteSpace: 'nowrap' }}>
                      {p.emoji} {p.nick}
                      <span style={{ color: 'var(--tinta-2)' }}>{p.presenca === 'ativo' ? '' : p.presenca === 'ocioso' ? ' ·ocioso' : ' ·off'}</span>
                    </td>
                    {Object.values(grade.labs).flat().map((c) => (
                      <td key={c.id} style={{ textAlign: 'center', padding: 'var(--e1)', color: p.feitos.includes(c.id) ? 'var(--ok)' : 'var(--borda)' }}>
                        {p.feitos.includes(c.id) ? '■' : '·'}
                      </td>
                    ))}
                    <td style={{ padding: 'var(--e1)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.xp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {grade.travas && (
            <small style={{ color: 'var(--tinta-2)' }}>
              travas por terminal: {grade.travas.processos} processos, {Math.round(grade.travas.memoriaKb / 1024)} MB e{' '}
              {grade.travas.cpuSegundos}s de CPU por processo · o vigia encerra a sessão que passar de{' '}
              {grade.travas.tetos.processos} processos, {grade.travas.tetos.memoriaMb} MB ou {grade.travas.tetos.cpuSegundos}s somados
            </small>
          )}
        </div>
      ) : (
        <Encaixe modo="rolagem" chave={`${cena.id}:${estado.passo}:${estado.fase}`}>
          <SceneRouter arena={arena} papel="host" />
        </Encaixe>
      )}

      {/*
        Controles em grupos por função, com ícone e rótulo. Antes eram doze
        botões numa fila única: no meio de uma apresentação ninguém acha o que
        precisa, e no notebook os últimos saíam da tela.
      */}
      <div className="controles">
        <div className="bloco-controle">
          <span className="rotulo">slides</span>
          <button className="btn-icone" onClick={() => ir(estado.cenaIndex - 1)} title="cena anterior (←)">
            <Icone nome="anterior" tamanho={17} /><span className="texto">voltar</span>
          </button>
          <button className="btn-icone destaque" onClick={avancar} title="avançar (→ ou espaço)">
            <Icone nome={cena.tipo === 'QuizScene' && (estado.fase === 'aberta' || estado.fase === 'encerrada') ? 'olho' : estado.fase === 'idle' && LIBERAR[cena.tipo] ? 'tocar' : 'proximo'} tamanho={17} />
            <span className="texto">
              {estado.fase === 'idle' && LIBERAR[cena.tipo] ? LIBERAR[cena.tipo]
                : cena.tipo === 'QuizScene' && (estado.fase === 'aberta' || estado.fase === 'encerrada') ? 'revelar resposta'
                : cena.tipo === 'QuizScene' && estado.fase === 'revelada' && estado.passo < 1 ? 'mostrar pódio'
                : LIBERAR[cena.tipo] && cena.tipo !== 'QuizScene' && estado.fase !== 'revelada' ? 'mostrar pódio'
                : cena.passos > 1 && estado.passo + 1 < cena.passos ? `avançar (${estado.passo + 1}/${cena.passos})`
                : 'próxima cena'}
            </span>
          </button>
          <select className="btn-icone" value="" title="ir direto para um módulo"
            onChange={(e) => { if (e.target.value) { ir(Number(e.target.value)); e.currentTarget.blur(); } }}>
            <option value="">ir para…</option>
            {Object.entries(INICIO_DOS_MODULOS).map(([m, i]) => <option key={m} value={i}>módulo {m}</option>)}
          </select>
        </div>

        <MenuControles rotulo="cena" icone="tocar">
          <button className="btn-icone" onClick={abrir} title="libera as opções / o exercício / o terminal e começa o tempo (A)">
            <Icone nome="tocar" tamanho={17} /><span className="texto">liberar</span>
          </button>
          {taskSlug && (
            <button className="btn-icone" title="aplica a solução no ambiente de todos, para ninguém ficar atrás"
              onClick={() => emit('host:gabarito', { taskSlug }, (r: { aplicados: number }) => avisar(`gabarito aplicado em ${r.aplicados} pessoas`))}>
              <Icone nome="ideia" tamanho={17} /><span className="texto">gabarito</span>
            </button>
          )}
          {cena.tipo === 'ArenaScene' && (cena.jogo === 'montagem' || cena.jogo === 'caca-erro') && (
            <button className="btn-icone" title="mostra a resposta do jogo para a sala"
              onClick={() => emit('host:arena:revelar', null, () => avisar('resposta mostrada para a sala'))}>
              <Icone nome="olho" tamanho={17} /><span className="texto">mostrar resposta</span>
            </button>
          )}
          {cena.tipo === 'LabScene' && cena.escopo === 'grupo' && (
            <button className="btn-icone" title="prepara os quatro defeitos no diretório de cada grupo"
              onClick={() => emit('host:boss:semear', null, (r: { semeados: number }) => avisar(`boss preparado em ${r.semeados} grupos`))}>
              <Icone nome="ferramenta" tamanho={17} /><span className="texto">preparar boss</span>
            </button>
          )}
        </MenuControles>

        <MenuControles rotulo="sala" icone="pessoas" destaque={semEquipe || null}>
          <button className="btn-icone" onClick={() => emit('host:pausar', !estado.pausado)} title="congela os cronômetros (P)">
            <Icone nome={estado.pausado ? 'tocar' : 'pausar'} tamanho={17} />
            <span className="texto">{estado.pausado ? 'retomar' : 'pausar'}</span>
          </button>
          <button className="btn-icone" onClick={() => emit('host:aovivo')} title="traz de volta quem navegou sozinho (V)">
            <Icone nome="pessoas" tamanho={17} /><span className="texto">todos ao vivo</span>
          </button>
          <button className="btn-icone" onClick={() => setVista((v) => (v === 'grade' ? 'slide' : 'grade'))}
            title="grade pessoas × critérios (G)"
            style={{ background: vista === 'grade' ? 'var(--tinta)' : undefined, color: vista === 'grade' ? 'var(--papel)' : undefined }}>
            <Icone nome="checklist" tamanho={17} /><span className="texto">grade</span>
          </button>
          <button className="btn-icone" onClick={() => setVista((v) => (v === 'pessoas' ? 'slide' : 'pessoas'))}
            title="pessoas na sala: recomeçar ambiente, silenciar e expulsar (S)"
            style={{ background: vista === 'pessoas' ? 'var(--tinta)' : undefined, color: vista === 'pessoas' ? 'var(--papel)' : undefined }}>
            <Icone nome="pessoas" tamanho={17} /><span className="texto">pessoas</span>
          </button>
          {vista !== 'slide' && (
            <button className="btn-icone" onClick={() => setVista('slide')} title="voltar para o slide">
              <Icone nome="olho" tamanho={17} /><span className="texto">ver slide</span>
            </button>
          )}
          <button className="btn-icone" onClick={() => { emit('host:grupo:sortear'); avisar('grupos sorteados'); }} title="distribui todos em grupos">
            <Icone nome="caixa" tamanho={17} /><span className="texto">sortear grupos</span>
          </button>
          <button className="btn-icone" title="põe nas equipes com menos gente só quem ainda está sem; quem já escolheu fica onde está"
            onClick={() => emit('host:grupo:completar', null, (r: { colocados: number; sobraram: number }) =>
              avisar(r.sobraram ? `${r.colocados} colocados, ${r.sobraram} sem vaga` : `${r.colocados} ${r.colocados === 1 ? 'pessoa colocada' : 'pessoas colocadas'} numa equipe`))}>
            <Icone nome="pessoas" tamanho={17} /><span className="texto">completar equipes{semEquipe ? ` (${semEquipe})` : ''}</span>
          </button>
        </MenuControles>

        <MenuControles rotulo="jogo" icone="premio">
          <select className="btn-icone" value="" title="eventos para mexer com a energia da sala"
            onChange={(e) => {
              const tipo = e.target.value;
              if (!tipo) return;
              emit('host:evento', { tipo }, (r: { erro?: string }) => avisar(r?.erro ? `evento recusado: ${r.erro}` : `evento: ${tipo.replace(/-/g, ' ')}`));
              e.currentTarget.blur();
            }}>
            <option value="">disparar evento…</option>
            {EVENTOS_DO_PAINEL.map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
          </select>
          <button className="btn-icone" title="sorteia um evento sozinho a cada 6 a 10 minutos, só nos momentos em que ele cabe"
            onClick={() => emit('host:eventos:auto', !estado.eventosAuto, (r: { ligado: boolean }) => avisar(r.ligado ? 'eventos automáticos ligados' : 'eventos automáticos desligados'))}>
            <Icone nome={estado.eventosAuto ? 'pausar' : 'tocar'} tamanho={17} />
            <span className="texto">eventos automáticos: {estado.eventosAuto ? 'ligados' : 'desligados'}</span>
          </button>
          <button className="btn-icone" onClick={() => trocar()} title="alternar claro e escuro nesta tela">
            <Icone nome="olho" tamanho={17} /><span className="texto">{tema === 'claro' ? 'claro' : 'escuro'}</span>
          </button>
          <input className="btn-icone" style={{ width: 150, border: '1px solid var(--borda)' }} placeholder="recado para a sala" value={recado}
            onChange={(e) => setRecado(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && recado.trim()) { emit('host:aviso', recado.trim()); setRecado(''); avisar('recado enviado'); } }} />
        </MenuControles>

        <div className="estado-faixa">
          {/*
            Chips curtos, com o texto inteiro no title. Por extenso ("pergunta ·
            pódio / resposta", "0/2 responderam · faltam 2") eles esticavam a
            barra e apertavam a área do slide onde ficam as opções do quiz.
          */}
          <span className="chip" data-chip="fase"
            title={`${ROTULO_DA_CENA[cena.tipo] ?? cena.tipo}${cena.passos > 1 ? ` · passo ${estado.passo + 1} de ${cena.passos}` : ''} · ${FASE_EM_PORTUGUES[estado.fase] ?? estado.fase}`}>
            {ROTULO_CURTO[cena.tipo] ?? cena.tipo}{cena.passos > 1 ? ` ${estado.passo + 1}/${cena.passos}` : ''}
            {LIBERAR[cena.tipo] || cena.tipo === 'GroupScene' ? ` · ${FASE_CURTA[estado.fase] ?? estado.fase}` : ''}
          </span>
          {estado.restante !== null && <span className="chip forte" title="tempo que falta"><Icone nome="relogio" tamanho={14} /> {estado.restante}s</span>}
          {cena.tipo === 'QuizScene' && arena.respostas?.cenaId === cena.id && (
            <span className="chip forte" data-chip="respostas"
              title={`${arena.respostas.total} de ${arena.respostas.esperados} responderam${arena.respostas.total < arena.respostas.esperados ? `, faltam ${arena.respostas.esperados - arena.respostas.total}` : ''}`}>
              <Icone nome="pessoas" tamanho={14} /> {arena.respostas.total}/{arena.respostas.esperados}
            </span>
          )}
          {concluiramPrincipal !== null && (
            <span className="chip forte" title="regra dos 70%: quantos já fecharam o 1º critério. Só avance quando passar disso">{concluiramPrincipal}%</span>
          )}
          {travados.length > 0 && <span className="chip forte" title={`${travados.length} pessoas travadas`}>🚩 {travados.length}</span>}
          {ajudas.length > 0 && (
            <button className="chip forte" title={`pediram ajuda: ${ajudas.map((p) => p.nick).join(', ')}. Clique para limpar`}
              onClick={() => setAjudas([])}
              style={{ cursor: 'pointer', border: '1px solid var(--acento)' }}>
              <Icone nome="ajuda" tamanho={14} /> {ajudas[ajudas.length - 1].nick}{ajudas.length > 1 && ` +${ajudas.length - 1}`}
            </button>
          )}
          {pulsos > 0 && (
            <button className="chip" title="quem clicou em 'me perdi'. Clique para zerar"
              onClick={() => setPulsos(0)} style={{ cursor: 'pointer' }}>
              😵 {pulsos}
            </button>
          )}
        </div>

        {/* o que se consulta de vez em quando: cena, relógio, quantos ativos, terminais */}
        <MenuControles rotulo={`${estado.cenaIndex + 1}/${DECK.length}`} icone="tempo" lado="direita"
          titulo="cena, relógio do plano, pessoas ativas e terminais" destaque={atraso > 3 ? `+${atraso}` : null}>
          <span className="chip">cena {estado.cenaIndex + 1}/{DECK.length}</span>
          <button className="chip" title={`planejado até esta cena: ${planejado} min de ${Math.round(MINUTOS_TOTAIS)}. Clique para zerar o relógio.`}
            onClick={zerarRelogio}
            style={{ cursor: 'pointer', borderColor: atraso > 3 ? 'var(--erro)' : undefined, color: atraso > 3 ? 'var(--erro)' : undefined }}>
            <Icone nome="tempo" tamanho={14} />
            {inicio ? `${decorrido} min · plano ${planejado}${atraso > 1 ? ` · ${atraso} atrasado` : atraso < -1 ? ` · ${-atraso} adiantado` : ''}` : `plano: ${Math.round(MINUTOS_TOTAIS)} min`}
          </button>
          <span className="chip"><Icone nome="pessoas" tamanho={14} /> {ativos}/{presenca.length} ativos</span>
          {grade && <span className="chip" title="terminais abertos · fila de verificações · modo do lab">{grade.sessoes}🖥 {grade.fila}⏳ {grade.modo}</span>}
        </MenuControles>
      </div>

      <Roleta arena={arena} papel="host" />
      {nota && <div className="toast">{nota}</div>}
    </div>
  );
}
