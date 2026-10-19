'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Arena, ResultadoCriterio } from '@/deck/useArena';
import type { Cena, Papel } from '@/deck/types';
import { Icone } from '../Icone';
import { Ilustra } from '../Ilustra';
import { usuarioDoNick } from '@/deck/avatares';
import { Texto } from '../Texto';
import { Cabecalho } from '../Cabecalho';

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

  const totalDicas = arena.labs[cena.taskSlug]?.dicas ?? 0;
  const semDicas = dicaIndice >= totalDicas;
  const custoDaDica = dicaIndice === 0 ? 1 : 2;
  const feitos = cena.criterios.filter((c) => resultados[c.id]?.passou || arena.eu?.criterios?.includes(c.id)).length;
  const tempo = arena.estado.restante;
  const papeis = arena.meuGrupo?.papeis ?? {};

  return (
    <div className="cena" data-modulo={cena.modulo} data-denso="true">
      <Cabecalho
        ilustra={cena.escopo === 'grupo' ? 'ferramenta' : 'terminal'}
        titulo={cena.titulo}
        olho={[
          cena.escopo === 'grupo' ? `chamado em equipe${arena.eu?.grupo ? ` · ${arena.eu.grupo}` : ''}` : 'mão na massa',
          tempo !== null ? `${Math.floor(tempo / 60)}:${String(tempo % 60).padStart(2, '0')}` : null,
          `${feitos} de ${cena.criterios.length} prontos`,
        ].filter(Boolean).join(' · ')}
      />
      <p className="corpo-p"><Texto>{cena.objetivo}</Texto></p>

      <div className="duas duas-lab" style={{ alignItems: 'start', gap: 'var(--e3)' }}>
        {/* coluna da esquerda: o que fazer */}
        <div className="grade" style={{ gap: 'var(--e2)' }}>
          <div className="progresso">
            <div className="olho" style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <Icone nome="checklist" tamanho={15} /> {feitos} de {cena.criterios.length} prontos
            </div>
            <div className="trilha">
              <div className="cheio" style={{ width: `${(feitos / cena.criterios.length) * 100}%` }} />
            </div>
          </div>

          <div className="checklist" style={{ maxHeight: 'min(26vh, 250px)', overflowY: 'auto' }}>
            {cena.criterios.map((c, i) => {
              const r = resultados[c.id];
              const ok = r?.passou || arena.eu?.criterios?.includes(c.id);
              const meuPapel = arena.eu?.id ? papeis[arena.eu.id] : null;
              const bloqueado = !!(r?.papel && meuPapel && r.papel !== meuPapel);
              return (
                <div key={c.id} className="item-check" data-ok={!!ok}>
                  <span className="marca">
                    {String(i + 1).padStart(2, '0')} {ok ? '[✓]' : '[ ]'}
                  </span>

                  <span className="texto-item">
                    <span><Texto>{c.descricao}</Texto></span>
                    {!ok && r?.mensagem && (
                      <span className="pista">
                        <Icone nome="ideia" tamanho={14} cor="var(--atencao)" />
                        <span>{r.mensagem}</span>
                      </span>
                    )}
                    {bloqueado && (
                      <span style={{ fontSize: '0.84em', color: 'var(--tinta-2)' }}>
                        quem fecha este item é a carta <strong>{r?.papel}</strong>
                      </span>
                    )}
                  </span>

                  <span className="xp-item">{c.xp} XP</span>
                </div>
              );
            })}
          </div>

          <div>
            <div className="olho" style={{ marginBottom: 'var(--e05)' }}>comandos deste módulo</div>
            <div style={{ display: 'flex', gap: 'var(--e05)', flexWrap: 'wrap' }}>
              {cena.comandosDoModulo.slice(0, 8).map((c) => <code key={c} className="kbd" style={{ fontSize: 'var(--t6)' }}>{c}</code>)}
              {cena.comandosDoModulo.length > 8 && <span className="apoio">+{cena.comandosDoModulo.length - 8} na consulta (?)</span>}
            </div>
          </div>

          {dica && (
            <div className="cartao" style={{ borderColor: 'var(--acento)', display: 'flex', gap: 'var(--e1)', padding: 'var(--e2)' }}>
              <Icone nome="ideia" cor="var(--acento)" tamanho={18} />
              <span style={{ fontSize: 14 }}><Texto>{dica}</Texto></span>
            </div>
          )}
        </div>

        {/* coluna da direita: onde as mãos estão. Terminal, campo de resposta e
            ações ficam juntos e na mesma ordem em todos os laboratórios, para a
            pessoa não precisar procurar o botão em cada módulo. */}
        <div className="grade" style={{ gap: 'var(--e1)' }}>
          <div id={souJogador ? 'slot-terminal' : undefined} className="term"
            style={{ minHeight: 'min(44vh, 400px)', display: souJogador ? 'block' : 'grid', placeItems: 'center', color: '#8e8e99' }}>
            {!souJogador && 'o terminal está na tela de cada participante'}
          </div>

          {/*
            O campo de resposta precisa gritar.
            Nos laboratórios de achar algo (a flag escondida, a contagem do log)
            a pessoa descobre a resposta no terminal e fica procurando onde
            entregar. Antes era um input discreto entre dois blocos: agora é um
            bloco com rótulo, borda de destaque e botão próprio.
          */}
          {/*
            O campo de resposta precisa gritar.
            Nos laboratórios de achar algo (a flag escondida, a contagem do log)
            a pessoa descobre a resposta no terminal e fica procurando onde
            entregar. Então é um bloco com rótulo, borda de destaque e botão.
          */}
          {precisaResposta && souJogador && (
            <div className="caixa-resposta" data-preenchida={!!resposta.trim()}>
              <div className="linha">
                <Ilustra nome="bandeira" tamanho={20} />
                <strong style={{ fontSize: 'var(--t5)' }}>Achou a resposta? Cole aqui</strong>
              </div>
              <div className="linha">
                <input
                  autoComplete="off" spellCheck={false} size={8}
                  placeholder="cole ou digite aqui"
                  value={resposta} onChange={(e) => setResposta(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') verificar(); }} />
                <button className="btn-icone destaque" data-acao="enviar-resposta"
                  style={{ padding: 'var(--e1) var(--e2)' }}
                  disabled={!resposta.trim() || ocupado || cooldown > 0}
                  onClick={() => verificar()}>
                  <Icone nome="proximo" tamanho={18} /> enviar
                </button>
              </div>
              <small className="apoio">Pode tentar quantas vezes quiser: errar não tira XP.</small>
            </div>
          )}

          {souJogador && (
          <div className="controles" style={{ border: '1px solid var(--borda)', borderRadius: 'var(--r)', padding: 'var(--e1)' }}>
            <button className="btn-icone destaque" data-acao="verificar"
              style={{ flex: 1, justifyContent: 'center', padding: 'var(--e2)' }}
              disabled={!souJogador || ocupado || cooldown > 0 || !arena.ambienteOk}
              onClick={() => verificar()}>
              <Icone nome="verificar" tamanho={18} />
              {ocupado ? 'verificando…' : cooldown > 0 ? `Verificar (${cooldown}s)` : 'Verificar'}
            </button>

            <div className="bloco-controle">
              <button className="btn-icone" data-acao="dica" data-sem-dicas={semDicas}
                disabled={!souJogador || semDicas || (arena.eu?.tokens ?? 0) < custoDaDica}
                title={semDicas ? 'as dicas deste laboratório acabaram' : `custa ${custoDaDica} token`}
                onClick={async () => {
                  const r = await arena.pedirDica(cena.taskSlug, dicaIndice);
                  if (r.dica) { setDica(r.dica); setDicaIndice((i) => i + 1); setMsg(null); }
                  else setMsg(r.erro ?? 'sem dica');
                }}>
                <Icone nome="ideia" tamanho={16} />
                <span className="texto">{semDicas ? 'sem dicas' : `dica (${custoDaDica})`}</span>
              </button>

              <button className="btn-icone" data-acao="recomecar" disabled={!souJogador}
                title="devolve o ambiente limpo. É de graça e você não perde XP"
                onClick={async () => { setMsg('recomeçando…'); const r = await arena.resetarAmbiente(); setMsg(r.ok ? 'ambiente novo, XP mantido' : 'falhou'); }}>
                <Icone nome="recomecar" tamanho={16} /><span className="texto">recomeçar</span>
              </button>

              <button className="btn-icone" data-acao="ajuda" disabled={!souJogador}
                title="chama um monitor, sem custo nenhum"
                onClick={() => { arena.emit('ajuda'); setMsg('monitor avisado'); }}>
                <Icone nome="ajuda" tamanho={16} /><span className="texto">ajuda</span>
              </button>
            </div>
          </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center', flexWrap: 'wrap', minHeight: 22 }}>
            {msg && <span className="chip forte">{msg}</span>}
            {souJogador && !arena.ambienteOk && <span className="chip">preparando o seu Linux…</span>}
            {souJogador && arena.ambienteOk && !msg && (
              <small style={{ color: 'var(--tinta-2)', display: 'flex', gap: 'var(--e05)', alignItems: 'center' }}>
                <Icone nome="teclado" tamanho={14} />
                clique no terminal para digitar. <code className="kbd">Esc</code> duas vezes devolve o teclado ao slide.
                {arena.eu?.nick && <>Você é <code className="kbd">{usuarioDoNick(arena.eu.nick)}</code>.</>}
              </small>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
