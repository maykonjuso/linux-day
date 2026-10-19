'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Arena, ResultadoCriterio } from '@/deck/useArena';
import type { Cena, Papel } from '@/deck/types';

type CenaLab = Extract<Cena, { tipo: 'LabScene' }>;

/**
 * A cena de lab. Não é uma tela separada: é um slide, e o terminal vive dentro
 * dele (o TerminalHost se posiciona no #slot-terminal).
 *
 * Decisões que importam para quem nunca usou terminal:
 *  - os critérios acendem SOZINHOS: um check roda em segundo plano a cada 20s,
 *    então o retorno chega antes de a pessoa duvidar de si;
 *  - a mensagem de falha é sempre uma pergunta que aponta o próximo passo,
 *    nunca "errado";
 *  - resetar é de graça e não tira XP: medo de quebrar a máquina é o maior
 *    freio do iniciante;
 *  - a régua de comandos do módulo fica sempre visível (só os nomes).
 */
export function LabScene({ cena, arena, papel }: { cena: CenaLab; arena: Arena; papel: Papel }) {
  const [resultados, setResultados] = useState<Record<string, ResultadoCriterio>>({});
  const [resposta, setResposta] = useState('');
  const [dica, setDica] = useState<string | null>(null);
  const [dicaIndice, setDicaIndice] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const ultimaResposta = useRef('');

  const souJogador = papel === 'player';
  const precisaResposta = cena.criterios.length === 1 || cena.taskSlug === 'm4-pipes' || cena.taskSlug === 'boss-chamado';

  useEffect(() => { setResultados({}); setResposta(''); setDica(null); setDicaIndice(0); }, [cena.id]);
  useEffect(() => { ultimaResposta.current = resposta; }, [resposta]);

  const verificar = useCallback(async (silencioso = false) => {
    if (!souJogador || ocupado) return;
    setOcupado(true);
    const r = await arena.verificar(cena.taskSlug, ultimaResposta.current);
    setOcupado(false);
    if (r.erro) { if (!silencioso) setMsg(r.erro); return; }
    setResultados(Object.fromEntries(r.resultados.map((x) => [x.id, x])));
    if (!silencioso) {
      setCooldown(10);
      setMsg(r.todos ? '✅ tudo certo neste lab!' : r.ganho > 0 ? `+${r.ganho} XP` : null);
    }
  }, [arena, cena.taskSlug, ocupado, souJogador]);

  // check de fundo: o feedback chega antes de a pessoa pedir
  useEffect(() => {
    if (!souJogador || arena.estado.fase !== 'aberta') return;
    const t = setInterval(() => verificar(true), 20_000);
    return () => clearInterval(t);
  }, [souJogador, arena.estado.fase, verificar]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const feitos = cena.criterios.filter((c) => resultados[c.id]?.passou || arena.eu?.criterios?.includes(c.id)).length;
  const tempo = arena.estado.restante;
  const papeis = arena.meuGrupo?.papeis ?? {};

  return (
    <div className="cena" style={{ gap: 18, paddingTop: '3vh' }}>
      <div className="olho">
        {cena.escopo === 'grupo' ? `boss em grupo${arena.eu?.grupo ? ` · grupo ${arena.eu.grupo}` : ''}` : 'mão na massa'}
        {tempo !== null && ` · ⏱ ${Math.floor(tempo / 60)}:${String(tempo % 60).padStart(2, '0')}`}
        {` · ${feitos}/${cena.criterios.length} critérios`}
      </div>
      <h2 className="titulo" style={{ fontSize: 'clamp(20px, 2.2vw, 34px)' }}>{cena.titulo}</h2>
      <p className="corpo" style={{ maxWidth: '50em', fontSize: 'clamp(16px, 1.5vw, 22px)' }}>{cena.objetivo}</p>

      <div className="duas" style={{ alignItems: 'start', gap: 26 }}>
        <div className="grade" style={{ gap: 14 }}>
          <div className="criterios">
            {cena.criterios.map((c) => {
              const r = resultados[c.id];
              const ok = r?.passou || arena.eu?.criterios?.includes(c.id);
              const meuPapel = arena.eu?.id ? papeis[arena.eu.id] : null;
              const bloqueado = r?.papel && meuPapel && r.papel !== meuPapel;
              return (
                <div key={c.id} className="criterio" data-ok={!!ok}>
                  <span>{ok ? '✅' : '⬜'}</span>
                  <span style={{ flex: 1 }}>
                    {c.descricao}
                    {!ok && r?.mensagem && (
                      <small style={{ display: 'block', color: 'var(--atencao)', marginTop: 4 }}>→ {r.mensagem}</small>
                    )}
                    {bloqueado && <small style={{ display: 'block', color: 'var(--tinta-2)' }}>carta: {r.papel}</small>}
                  </span>
                  <span className="chip">{c.xp} XP</span>
                </div>
              );
            })}
          </div>

          {precisaResposta && souJogador && (
            <input className="btn" style={{ textAlign: 'left', fontFamily: 'var(--mono)' }}
              placeholder="sua resposta (quando o critério pedir um valor)"
              value={resposta} onChange={(e) => setResposta(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') verificar(); }} />
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn primario" disabled={!souJogador || ocupado || cooldown > 0} onClick={() => verificar()}>
              {ocupado ? 'verificando…' : cooldown > 0 ? `Verificar (${cooldown}s)` : 'Verificar'}
            </button>
            <button className="btn" disabled={!souJogador || (arena.eu?.tokens ?? 0) < 1}
              onClick={async () => {
                const r = await arena.pedirDica(cena.taskSlug, dicaIndice);
                if (r.dica) { setDica(r.dica); setDicaIndice((i) => i + 1); }
                else setMsg(r.erro ?? 'sem dica');
              }}>
              Dica ({dicaIndice === 0 ? 1 : 2} 🪙)
            </button>
            <button className="btn" disabled={!souJogador}
              onClick={async () => { setMsg('resetando…'); const r = await arena.resetarAmbiente(); setMsg(r.ok ? 'ambiente novo. XP mantido.' : 'falhou'); }}>
              Resetar (grátis)
            </button>
            <button className="btn" disabled={!souJogador} onClick={() => { arena.emit('ajuda'); setMsg('monitor avisado 🙋'); }}>
              🙋 Ajuda
            </button>
          </div>

          {dica && <div className="cartao" style={{ borderColor: 'var(--acento)' }}>💡 {dica}</div>}
          {msg && <div className="chip forte">{msg}</div>}

          <div className="olho">comandos do módulo</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {cena.comandosDoModulo.map((c) => <code key={c} className="kbd">{c}</code>)}
          </div>
        </div>

        <div className="grade" style={{ gap: 12 }}>
          {/* o TerminalHost se posiciona exatamente aqui */}
          <div id={souJogador ? 'slot-terminal' : undefined} className="term"
            style={{ minHeight: '34vh', display: souJogador ? 'block' : 'grid', placeItems: 'center', color: '#8e8e99' }}>
            {!souJogador && 'o terminal está na tela de cada participante'}
          </div>
          {souJogador && (
            <small style={{ color: 'var(--tinta-2)' }}>
              clique no terminal para digitar · <code className="kbd">Esc</code> <code className="kbd">Esc</code> devolve o teclado ao slide
              {arena.eu?.conta && <> · sua conta: <code className="kbd">{arena.eu.conta}</code></>}
            </small>
          )}
        </div>
      </div>
    </div>
  );
}
