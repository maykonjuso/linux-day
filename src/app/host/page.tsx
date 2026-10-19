'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useArena } from '@/deck/useArena';
import { SceneRouter } from '@/components/SceneRouter';
import { Encaixe } from '@/components/Encaixe';
import { DECK, INICIO_DOS_MODULOS } from '@/deck/content';
import { Icone } from '@/components/Icone';

const ROTULO_DA_CENA: Record<string, string> = {
  ModuleCover: 'capa de módulo', MentalModel: 'diagrama', CommandAnatomy: 'anatomia do comando',
  TerminalDemo: 'demonstração', WillGoWrong: 'erros comuns', QuizScene: 'pergunta',
  WidgetScene: 'exercício na tela', LabScene: 'laboratório', GroupScene: 'grupos',
  Scoreboard: 'placar', Recap: 'fecho do módulo',
};

const FASE_EM_PORTUGUES: Record<string, string> = {
  idle: 'fechada', aberta: 'aberta para a turma', encerrada: 'tempo esgotado', revelada: 'resposta revelada',
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
  const [ajudas, setAjudas] = useState<{ nick: string; em: number }[]>([]);
  const [pulsos, setPulsos] = useState(0);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [verGrade, setVerGrade] = useState(false);
  const [recado, setRecado] = useState('');
  const [nota, setNota] = useState<string | null>(null);

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
   * Cenas em que a pessoa AGE (quiz, widget, lab) abrem sozinhas ao chegar.
   * Antes era preciso lembrar de apertar "abrir": sem isso o participante
   * clicava nas alternativas e nada acontecia, sem nenhuma explicação na tela.
   */
  /** o gabarito vai junto para o servidor poder revelar sozinho (Kahoot) */
  const quizDe = (c: typeof cena) =>
    c.tipo === 'QuizScene' ? { cenaId: c.id, correta: c.correta, xpBase: 40, segundos: c.segundos } : null;

  const ir = useCallback((i: number) => {
    const alvo = Math.min(Math.max(0, i), DECK.length - 1);
    const c = DECK[alvo];
    const interativa = c.tipo === 'QuizScene' || c.tipo === 'WidgetScene' || c.tipo === 'LabScene';
    const segs = 'segundos' in c ? (c as unknown as { segundos: number }).segundos : null;
    emit('host:ir', {
      cenaIndex: alvo, cenaId: c.id, passo: 0,
      fase: interativa ? 'aberta' : 'idle',
      segundos: interativa ? segs : null,
      quiz: quizDe(c),
    });
  }, [emit]);

  const abrir = useCallback(
    () => emit('host:fase', { fase: 'aberta', segundos, cenaId: cena.id, quiz: quizDe(cena) }),
    [emit, segundos, cena],
  );

  /**
   * Um botão só, que faz a coisa certa para cada tipo de cena:
   *  - quiz:   aberta → revela (e pontua) → próxima cena
   *  - widget/lab: aberta → próxima cena
   *  - resto:  anda os passos internos e depois vai para a próxima cena
   */
  const avancar = useCallback(() => {
    if (cena.tipo === 'QuizScene') {
      // já revelou: segue para a próxima cena
      if (estado.fase === 'revelada') return ir(estado.cenaIndex + 1);
      // nunca abriu: abre
      if (estado.fase === 'idle') return abrir();
      // aberta OU com o tempo esgotado: revela.
      // (antes, "encerrada" caía no abrir() e o avançar ficava reabrindo a
      //  pergunta para sempre, que era o "não passa de pergunta")
      return emit('host:revelar', { cenaId: cena.id, correta: cena.correta, xpBase: 40, segundos: cena.segundos });
    }
    if (cena.tipo === 'WidgetScene' || cena.tipo === 'LabScene') {
      if (estado.fase === 'idle') return abrir();
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

    return () => { s.off('ajuda', aoPedirAjuda); s.off('pulso', aoSePerder); s.off('vigia', aoVigiar); };
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
      else if (k === 'r' && cena.tipo === 'QuizScene') emit('host:revelar', { cenaId: cena.id, correta: cena.correta, xpBase: 40, segundos: cena.segundos });
      else if (k === 'p') emit('host:pausar', !estado.pausado);
      else if (k === 'v') emit('host:aovivo');
      else if (k === 'g') setVerGrade((v) => !v);
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
            onKeyDown={(e) => { if (e.key === 'Enter') emit('host:entrar', pin, (r: boolean) => setOk(r)); }} />
          <button className="btn primario" onClick={() => emit('host:entrar', pin, (r: boolean) => setOk(r))}>entrar</button>
        </div>
      </div>
    );
  }

  const ativos = presenca.filter((p) => p.presenca === 'ativo').length;
  const travados = grade?.pessoas.filter((p) => p.travado) ?? [];
  const criteriosDaCena = taskSlug ? grade?.labs?.[taskSlug] ?? [] : [];
  const concluiramPrincipal = taskSlug && criteriosDaCena.length
    ? Math.round(100 * (grade?.pessoas.filter((p) => p.feitos.includes(criteriosDaCena[0].id)).length ?? 0) / Math.max(1, presenca.length))
    : null;

  return (
    <div className="palco" data-papel="host">
      {verGrade && grade ? (
        <div className="cena" style={{ paddingTop: '2vh', overflow: 'auto' }}>
          <div className="olho">grade pessoas × critérios · G volta para o slide</div>
          <div style={{ overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 6 }}>pessoa</th>
                  {Object.entries(grade.labs).map(([slug, cs]) =>
                    cs.map((c) => <th key={c.id} title={`${slug} · ${c.descricao}`} style={{ padding: 'var(--e05)', writingMode: 'vertical-rl', fontWeight: 500, color: 'var(--tinta-2)' }}>{c.id}</th>))}
                  <th style={{ padding: 6 }}>XP</th>
                </tr>
              </thead>
              <tbody>
                {grade.pessoas.sort((a, b) => b.xp - a.xp).map((p) => (
                  <tr key={p.id} style={{ background: p.travado ? '#fff4f4' : undefined }}>
                    <td style={{ padding: 6, whiteSpace: 'nowrap' }}>
                      {p.emoji} {p.nick}
                      <span style={{ color: 'var(--tinta-2)' }}>{p.presenca === 'ativo' ? '' : p.presenca === 'ocioso' ? ' ·ocioso' : ' ·off'}</span>
                    </td>
                    {Object.values(grade.labs).flat().map((c) => (
                      <td key={c.id} style={{ textAlign: 'center', padding: 2, color: p.feitos.includes(c.id) ? 'var(--ok)' : 'var(--borda)' }}>
                        {p.feitos.includes(c.id) ? '■' : '·'}
                      </td>
                    ))}
                    <td style={{ padding: 6, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.xp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* ações por pessoa: o apresentador precisa resolver caso a caso sem
              sair do painel */}
          <div className="checklist" style={{ maxHeight: '34vh', overflowY: 'auto' }}>
            {grade.pessoas.map((p) => (
              <div key={p.id} className="item-check" style={{ alignItems: 'center', gridTemplateColumns: 'auto 1fr auto' }}>
                <span className="marca">{p.emoji}</span>
                <span className="texto-item">
                  <span>
                    <strong>{p.nick}</strong>
                    <small style={{ color: 'var(--tinta-2)' }}>
                      {' '}· {p.xp} XP · {p.grupo ?? 'sem equipe'} · código {p.codigo ?? '—'}
                      {p.conta ? ` · ${p.conta}` : ''}
                      {p.silenciado ? ' · silenciado' : ''}
                    </small>
                  </span>
                </span>
                <span style={{ display: 'flex', gap: 'var(--e05)' }}>
                  <button className="btn-icone" title="devolve o ambiente limpo para esta pessoa"
                    onClick={() => emit('host:reset', { id: p.id }, () => avisar(`ambiente de ${p.nick} recomeçado`))}>
                    <Icone nome="recomecar" tamanho={15} />
                  </button>
                  <button className="btn-icone" title={p.silenciado ? 'devolver o chat' : 'silenciar o chat desta pessoa'}
                    onClick={() => emit('host:silenciar', { id: p.id, silenciado: !p.silenciado }, (r: { nick: string; silenciado: boolean }) => avisar(`${r?.nick}: chat ${r?.silenciado ? 'silenciado' : 'liberado'}`))}>
                    <Icone nome={p.silenciado ? 'tocar' : 'pausar'} tamanho={15} />
                  </button>
                  <button className="btn-icone" title="expulsar da sala"
                    onClick={() => {
                      if (!confirm(`Expulsar ${p.nick}? O XP fica guardado e ela pode entrar de novo.`)) return;
                      emit('host:expulsar', { id: p.id }, (r: { nick: string }) => avisar(`${r?.nick} saiu da sala`));
                    }}>
                    <Icone nome="sair" tamanho={15} cor="var(--erro)" />
                  </button>
                </span>
              </div>
            ))}
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
        <Encaixe chave={`${cena.id}:${estado.passo}:${estado.fase}`}>
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
            <Icone nome={cena.tipo === 'QuizScene' && (estado.fase === 'aberta' || estado.fase === 'encerrada') ? 'olho' : 'proximo'} tamanho={17} />
            <span className="texto">
              {cena.tipo === 'QuizScene' && (estado.fase === 'aberta' || estado.fase === 'encerrada') ? 'revelar resposta'
                : cena.tipo === 'QuizScene' && estado.fase === 'revelada' ? 'próxima'
                : cena.passos > 1 && estado.passo + 1 < cena.passos ? `avançar (${estado.passo + 1}/${cena.passos})`
                : 'avançar'}
            </span>
          </button>
          <select className="btn-icone" value="" title="ir direto para um módulo"
            onChange={(e) => { if (e.target.value) { ir(Number(e.target.value)); e.currentTarget.blur(); } }}>
            <option value="">ir para…</option>
            {Object.entries(INICIO_DOS_MODULOS).map(([m, i]) => <option key={m} value={i}>módulo {m}</option>)}
          </select>
        </div>

        <div className="bloco-controle">
          <span className="rotulo">cena</span>
          <button className="btn-icone" onClick={abrir} title="abrir para a turma responder / fazer (A)">
            <Icone nome="tocar" tamanho={17} /><span className="texto">abrir</span>
          </button>
          {taskSlug && (
            <button className="btn-icone" title="aplica a solução no ambiente de todos, para ninguém ficar atrás"
              onClick={() => emit('host:gabarito', { taskSlug }, (r: { aplicados: number }) => avisar(`gabarito aplicado em ${r.aplicados} pessoas`))}>
              <Icone nome="ideia" tamanho={17} /><span className="texto">gabarito</span>
            </button>
          )}
          {cena.tipo === 'LabScene' && cena.escopo === 'grupo' && (
            <button className="btn-icone" title="prepara os quatro defeitos no diretório de cada grupo"
              onClick={() => emit('host:boss:semear', null, (r: { semeados: number }) => avisar(`boss preparado em ${r.semeados} grupos`))}>
              <Icone nome="ferramenta" tamanho={17} /><span className="texto">preparar boss</span>
            </button>
          )}
        </div>

        <div className="bloco-controle">
          <span className="rotulo">sala</span>
          <button className="btn-icone" onClick={() => emit('host:pausar', !estado.pausado)} title="congela os cronômetros (P)">
            <Icone nome={estado.pausado ? 'tocar' : 'pausar'} tamanho={17} />
            <span className="texto">{estado.pausado ? 'retomar' : 'pausar'}</span>
          </button>
          <button className="btn-icone" onClick={() => emit('host:aovivo')} title="traz de volta quem navegou sozinho (V)">
            <Icone nome="pessoas" tamanho={17} /><span className="texto">todos ao vivo</span>
          </button>
          <button className="btn-icone" onClick={() => setVerGrade((v) => !v)} title="grade pessoas × critérios (G)">
            <Icone nome="checklist" tamanho={17} /><span className="texto">{verGrade ? 'ver slide' : 'grade'}</span>
          </button>
          <button className="btn-icone" onClick={() => { emit('host:grupo:sortear'); avisar('grupos sorteados'); }} title="distribui todos em grupos">
            <Icone nome="caixa" tamanho={17} /><span className="texto">sortear grupos</span>
          </button>
        </div>

        <div className="bloco-controle">
          <span className="rotulo">jogo</span>
          <select className="btn-icone" value="" title="eventos para mexer com a energia da sala"
            onChange={(e) => { if (e.target.value) { emit('host:evento', { tipo: e.target.value }); avisar(`evento: ${e.target.value.replace(/-/g, ' ')}`); e.currentTarget.blur(); } }}>
            <option value="">evento…</option>
            <option value="xp-dobrado">XP dobrado (3 min)</option>
            <option value="sabotagem">sabotagem</option>
            <option value="resgate">resgate dos 5 últimos</option>
          </select>
          <input className="btn-icone" style={{ width: 150, border: '1px solid var(--borda)' }} placeholder="recado para a sala" value={recado}
            onChange={(e) => setRecado(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && recado.trim()) { emit('host:aviso', recado.trim()); setRecado(''); avisar('recado enviado'); } }} />
        </div>

        <div className="estado-faixa">
          <span className="chip">cena {estado.cenaIndex + 1}/{DECK.length}</span>
          <span className="chip" title="o que está na tela e em que estado">
            {ROTULO_DA_CENA[cena.tipo] ?? cena.tipo}
            {cena.passos > 1 && ` · passo ${estado.passo + 1} de ${cena.passos}`}
            {FASE_EM_PORTUGUES[estado.fase] ? ` · ${FASE_EM_PORTUGUES[estado.fase]}` : ''}
          </span>
          {estado.restante !== null && <span className="chip forte"><Icone nome="relogio" tamanho={14} /> {estado.restante}s</span>}
          {cena.tipo === 'QuizScene' && arena.respostas?.cenaId === cena.id && (
            <span className="chip forte">
              {arena.respostas.total}/{arena.respostas.esperados} responderam
              {arena.respostas.total < arena.respostas.esperados ? ` · faltam ${arena.respostas.esperados - arena.respostas.total}` : ' · todos!'}
            </span>
          )}
          <span className="chip"><Icone nome="pessoas" tamanho={14} /> {ativos}/{presenca.length} ativos</span>
          {concluiramPrincipal !== null && (
            <span className="chip forte" title="regra dos 70%: só avance quando passar disso">{concluiramPrincipal}% no 1º critério</span>
          )}
          {travados.length > 0 && <span className="chip forte">🚩 {travados.length} travados</span>}
          {ajudas.length > 0 && (
            <button className="chip forte" title="clique para limpar a fila de ajuda"
              onClick={() => setAjudas([])}
              style={{ cursor: 'pointer', border: '1px solid var(--acento)' }}>
              <Icone nome="ajuda" tamanho={14} />
              {ajudas.slice(-3).map((p) => p.nick).join(', ')}
              {ajudas.length > 3 && ` +${ajudas.length - 3}`}
            </button>
          )}
          {pulsos > 0 && (
            <button className="chip" title="quem clicou em 'me perdi'. Clique para zerar"
              onClick={() => setPulsos(0)} style={{ cursor: 'pointer' }}>
              😵 {pulsos}
            </button>
          )}
          {grade && <span className="chip" title="terminais abertos · fila de verificações · modo do lab">{grade.sessoes}🖥 {grade.fila}⏳ {grade.modo}</span>}
        </div>
      </div>

      {nota && <div className="toast">{nota}</div>}
    </div>
  );
}
