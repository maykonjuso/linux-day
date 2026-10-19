'use client';

import { useCallback, useEffect, useState } from 'react';
import { useArena } from '@/deck/useArena';
import { SceneRouter } from '@/components/SceneRouter';
import { DECK, INICIO_DOS_MODULOS } from '@/deck/content';

interface Grade {
  labs: Record<string, { id: string; descricao: string; xp: number }[]>;
  pessoas: { id: string; nick: string; emoji: string; xp: number; presenca: string; grupo: string | null; feitos: string[]; travado: boolean }[];
  grupos: Record<string, string[]>;
  sessoes: number; fila: number; modo: string;
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
  const [ajudas, setAjudas] = useState<string[]>([]);
  const [pulsos, setPulsos] = useState(0);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [verGrade, setVerGrade] = useState(false);
  const [recado, setRecado] = useState('');
  const [nota, setNota] = useState<string | null>(null);

  const segundos = 'segundos' in cena ? (cena as unknown as { segundos: number }).segundos : null;
  const taskSlug = cena.tipo === 'LabScene' ? cena.taskSlug : null;

  const avisar = (t: string) => { setNota(t); setTimeout(() => setNota(null), 4000); };

  const ir = useCallback((i: number) => {
    emit('host:ir', { cenaIndex: Math.min(Math.max(0, i), DECK.length - 1), cenaId: DECK[Math.min(Math.max(0, i), DECK.length - 1)].id, passo: 0, fase: 'idle' });
  }, [emit]);

  const avancar = useCallback(() => {
    if (estado.passo + 1 < cena.passos) emit('host:passo', 1);
    else ir(estado.cenaIndex + 1);
  }, [estado.passo, estado.cenaIndex, cena.passos, emit, ir]);

  const abrir = useCallback(() => emit('host:fase', { fase: 'aberta', segundos, cenaId: cena.id }), [emit, segundos, cena.id]);

  const puxarGrade = useCallback(() => emit('host:grade', null, (g: Grade) => setGrade(g)), [emit]);

  useEffect(() => {
    if (!ok) return;
    const s = arena.socket;
    s?.on('ajuda', (p: { nick: string }) => setAjudas((a) => [...a.slice(-9), p.nick]));
    s?.on('pulso', () => setPulsos((p) => p + 1));
    const t = setInterval(puxarGrade, 5000);
    puxarGrade();
    return () => clearInterval(t);
  }, [ok, arena.socket, puxarGrade]);

  useEffect(() => {
    if (!ok) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); avancar(); }
      else if (e.key === 'ArrowLeft') emit('host:passo', -1);
      else if (k === 'a') abrir();
      else if (k === 'r' && cena.tipo === 'QuizScene') emit('host:revelar', { cenaId: cena.id, correta: cena.correta, xpBase: 40, segundos: cena.segundos });
      else if (k === 'p') emit('host:pausar', !estado.pausado);
      else if (k === 'v') emit('host:aovivo');
      else if (k === 'g') setVerGrade((v) => !v);
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [ok, avancar, abrir, emit, cena, estado.pausado]);

  if (!ok) {
    return (
      <div className="centro">
        <div className="cartao" style={{ display: 'grid', gap: 12, width: 'min(360px, 100%)' }}>
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
    <div className="palco">
      {verGrade && grade ? (
        <div className="cena" style={{ paddingTop: '2vh', overflow: 'auto' }}>
          <div className="olho">grade pessoas × critérios · G volta para o slide</div>
          <div style={{ overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 6 }}>pessoa</th>
                  {Object.entries(grade.labs).map(([slug, cs]) =>
                    cs.map((c) => <th key={c.id} title={`${slug} · ${c.descricao}`} style={{ padding: 4, writingMode: 'vertical-rl', fontWeight: 500, color: 'var(--tinta-2)' }}>{c.id}</th>))}
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
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {grade.pessoas.map((p) => (
              <button key={p.id} className="btn" onClick={() => emit('host:reset', { id: p.id }, () => avisar(`ambiente de ${p.nick} resetado`))}>
                resetar {p.nick}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <SceneRouter arena={arena} papel="host" />
      )}

      <div className="barra" style={{ flexWrap: 'wrap', gap: 8 }}>
        <button className="btn" onClick={() => ir(estado.cenaIndex - 1)}>◀</button>
        <button className="btn primario" onClick={avancar}>avançar ▶</button>
        <button className="btn" onClick={abrir}>abrir (A)</button>
        {cena.tipo === 'QuizScene' && (
          <button className="btn" onClick={() => emit('host:revelar', { cenaId: cena.id, correta: cena.correta, xpBase: 40, segundos: cena.segundos })}>revelar (R)</button>
        )}
        {taskSlug && (
          <button className="btn" onClick={() => emit('host:gabarito', { taskSlug }, (r: { aplicados: number }) => avisar(`gabarito aplicado em ${r.aplicados}`))}>
            gabarito
          </button>
        )}
        {cena.tipo === 'LabScene' && cena.escopo === 'grupo' && (
          <button className="btn" onClick={() => emit('host:boss:semear', null, (r: { semeados: number }) => avisar(`boss semeado em ${r.semeados} grupos`))}>semear boss</button>
        )}
        <button className="btn" onClick={() => emit('host:pausar', !estado.pausado)}>{estado.pausado ? '▶' : '⏸'}</button>
        <button className="btn" onClick={() => emit('host:aovivo')}>ao vivo (V)</button>
        <button className="btn" onClick={() => setVerGrade((v) => !v)}>grade (G)</button>

        <select className="btn" value="" onChange={(e) => { if (e.target.value) ir(Number(e.target.value)); }}>
          <option value="">ir para…</option>
          {Object.entries(INICIO_DOS_MODULOS).map(([m, i]) => <option key={m} value={i}>módulo {m}</option>)}
        </select>
        <select className="btn" value="" onChange={(e) => { if (e.target.value) { emit('host:evento', { tipo: e.target.value }); avisar(`evento: ${e.target.value}`); } }}>
          <option value="">evento ao vivo…</option>
          <option value="xp-dobrado">XP dobrado (3 min)</option>
          <option value="sabotagem">sabotagem</option>
          <option value="resgate">resgate dos 5 últimos</option>
        </select>
        <button className="btn" onClick={() => emit('host:grupo:sortear')}>sortear grupos</button>

        <input className="btn" style={{ textAlign: 'left', width: 180 }} placeholder="recado para a sala" value={recado}
          onChange={(e) => setRecado(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && recado.trim()) { emit('host:aviso', recado.trim()); setRecado(''); } }} />

        <span className="cresce" />
        <span className="chip">{cena.tipo} · {estado.passo + 1}/{cena.passos} · {estado.fase}</span>
        <span className="chip">cena {estado.cenaIndex + 1}/{DECK.length}</span>
        {estado.restante !== null && <span className="chip forte">⏱ {estado.restante}s</span>}
        <span className="chip">{ativos}/{presenca.length} ativos</span>
        {concluiramPrincipal !== null && (
          <span className="chip forte" title="regra dos 70%: só avance quando passar disso">{concluiramPrincipal}% no 1º critério</span>
        )}
        {travados.length > 0 && <span className="chip forte">🚩 {travados.length} travados</span>}
        {pulsos > 0 && <span className="chip">😵 {pulsos} se perderam</span>}
        {ajudas.length > 0 && <span className="chip forte">🙋 {ajudas.slice(-3).join(', ')}</span>}
        <span className="chip">{placar.individual[0]?.nick ?? '—'} lidera</span>
        {grade && <span className="chip" title="sessões de terminal · fila de checkers · modo">{grade.sessoes}🖥 {grade.fila}⏳ {grade.modo}</span>}
      </div>

      {nota && <div className="toast">{nota}</div>}
    </div>
  );
}
