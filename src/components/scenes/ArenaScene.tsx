'use client';

import { useEffect, useState } from 'react';
import type { Arena } from '@/deck/useArena';
import type { Cena, Papel } from '@/deck/types';
import { Cabecalho } from '../Cabecalho';
import { Ilustra } from '../Ilustra';
import { Icone } from '../Icone';
import { Texto } from '../Texto';
import { ReferenciasConteudo } from '../ReferenciasConteudo';
import { Aguardando } from '../SceneRouter';
import { liberada, encerrada } from '@/deck/liberada';
import { SlideFigura } from '../SlideFigura';

type CenaArena = Extract<Cena, { tipo: 'ArenaScene' }>;

/**
 * Jogos de equipe contra equipe.
 *
 * Corrida: a mesma tarefa curta no terminal para todas as equipes, e o que
 * vale é a ordem de chegada. Com dez equipes isso funciona, enquanto duelo
 * direto só rende com duas a quatro.
 *
 * Buzzer: uma pergunta e a primeira equipe que aperta responde. Errou, passa a
 * vez para a próxima da fila.
 */
export function ArenaScene({
  cena, arena, papel, onIrParaSlide,
}: {
  cena: CenaArena; arena: Arena; papel: Papel; onIrParaSlide?: (id: string) => void;
}) {
  if (cena.jogo === 'corrida') return <Corrida cena={cena} arena={arena} papel={papel} onIrParaSlide={onIrParaSlide} />;
  if (cena.jogo === 'buzzer') return <Buzzer cena={cena} arena={arena} papel={papel} onIrParaSlide={onIrParaSlide} />;
  if (cena.jogo === 'montagem') return <Montagem cena={cena} arena={arena} papel={papel} onIrParaSlide={onIrParaSlide} />;
  return <CacaAoErro cena={cena} arena={arena} papel={papel} onIrParaSlide={onIrParaSlide} />;
}

/** a pista compartilhada: quem chegou, em que posição e quanto levou */
function Pista({ cena, arena }: { cena: CenaArena; arena: Arena }) {
  const rodada = arena.arena?.cenaId === cena.id ? arena.arena : null;
  const chegadas = rodada?.chegadas ?? [];
  const tentativas = rodada?.tentativas ?? {};
  const minhaEquipe = arena.eu?.grupo ?? null;
  const equipes = arena.placar.grupos.filter((g) => g.membros.length);

  return (
    <div className="checklist" style={{ maxHeight: 'min(32vh, 280px)', overflowY: 'auto' }}>
      {equipes.length === 0 && (
        <div className="item-check"><span className="marca">—</span><span>ninguém escolheu equipe ainda</span><span /></div>
      )}
      {equipes.map((g) => {
        const chegada = chegadas.find((c) => c.equipe === g.nome);
        const souEu = g.nome === minhaEquipe;
        return (
          <div key={g.nome} className="item-check" data-ok={!!chegada}
            style={{ alignItems: 'center', background: souEu ? 'color-mix(in srgb, var(--acento) 8%, var(--papel))' : undefined }}>
            <span className="marca" style={{ display: 'flex', alignItems: 'center', gap: 'var(--e05)' }}>
              {chegada ? <Ilustra nome={MEDALHA[chegada.posicao - 1] ?? 'bandeira'} tamanho={18} /> : <span style={{ width: 18 }} />}
              {chegada ? `${chegada.posicao}º` : '—'}
            </span>
            <span className="texto-item">
              <span style={{ textTransform: 'capitalize' }}>
                <strong>{g.nome}</strong>{souEu && <span className="apoio"> (sua equipe)</span>}
              </span>
              <span className="apoio">
                {chegada ? `${chegada.nick} fechou` : `${tentativas[g.nome] ?? 0} tentativa${(tentativas[g.nome] ?? 0) === 1 ? '' : 's'}`}
              </span>
            </span>
            <span className="xp-item">{chegada ? `+${chegada.xp} XP` : '—'}</span>
          </div>
        );
      })}
    </div>
  );
}

/** faixa de prêmios por posição, igual em todos os jogos de equipe */
function Premios({ premios }: { premios: number[] }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--e1)', flexWrap: 'wrap' }}>
      {premios.map((xp, i) => (
        <span key={i} className="chip">
          {i < 3 ? <Ilustra nome={MEDALHA[i]} tamanho={16} /> : null}
          {i < 3 ? `${i + 1}º` : 'demais'} · {xp} XP
        </span>
      ))}
    </div>
  );
}

/**
 * Montagem relâmpago: as peças chegam embaralhadas pelo servidor e a equipe
 * monta a linha. A ordem certa não está no navegador, então não dá para ler o
 * gabarito nas ferramentas de desenvolvedor.
 */
function Montagem({
  cena, arena, papel, onIrParaSlide,
}: {
  cena: CenaArena; arena: Arena; papel: Papel; onIrParaSlide?: (id: string) => void;
}) {
  const rodada = arena.arena?.cenaId === cena.id ? arena.arena : null;
  const desafio = rodada?.desafio;
  const [linha, setLinha] = useState<string[]>([]);
  const [recado, setRecado] = useState<string | null>(null);
  useEffect(() => { setLinha([]); setRecado(null); }, [cena.id]);

  const minhaEquipe = arena.eu?.grupo ?? null;
  const jaAcertou = rodada?.chegadas?.some((c) => c.equipe === minhaEquipe);
  const pecas = desafio?.pecas ?? [];
  const alvo = desafio?.tamanho ?? 0;

  const [noLugar, setNoLugar] = useState<number | null>(null);

  async function enviar() {
    const r = await arena.tentarArena(linha);
    if (r?.certo) { setRecado(`acertou em ${r.posicao}º lugar, +${r.xp} XP`); setNoLugar(alvo); }
    else { setRecado(r?.detalhe ?? r?.erro ?? 'ainda não'); setNoLugar(r?.noLugar ?? null); }
  }

  return (
    <div className="cena cena-buzzer" data-modulo={cena.modulo} data-denso="true">
      <Cabecalho ilustra="elo" titulo={cena.titulo}
        olho={`montagem em equipe${arena.estado.restante !== null ? ` · ${arena.estado.restante}s` : ''}`} />
      <p className="corpo-p"><Texto>{desafio?.enunciado ?? cena.enunciado}</Texto></p>
      <div style={{ display: 'flex', gap: 'var(--e2)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Premios premios={rodada?.premios ?? cena.premios ?? [300, 200, 140, 90]} />
        {papel === 'player' && <ReferenciasConteudo referencias={cena.referencias} onIrParaSlide={onIrParaSlide} />}
      </div>

      {papel === 'player' && !jaAcertou && (
        <>
          <div className="term" style={{ display: 'flex', gap: 'var(--e1)', flexWrap: 'wrap', minHeight: 64, alignItems: 'center' }}>
            {linha.length === 0 && <span className="apoio" style={{ color: '#8e8e99' }}>clique nas peças, na ordem</span>}
            {linha.map((id, i) => (
              <span key={`${id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--e05)' }}>
                {i > 0 && <span style={{ color: '#7dd3a0' }}>|</span>}
                <button onClick={() => setLinha(linha.slice(0, i))}
                  title="remover daqui para frente"
                  style={{ fontFamily: 'var(--mono)', background: 'none', border: '1px solid #3a3a42', color: '#e8e8ea', borderRadius: 'var(--r-p)', padding: '2px var(--e1)', cursor: 'pointer' }}>
                  {pecas.find((p) => p.id === id)?.rotulo ?? id} ×
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'var(--e1)', flexWrap: 'wrap' }}>
            {pecas.filter((p) => !linha.includes(p.id)).map((p) => (
              <button key={p.id} className="btn" data-peca={p.id}
                style={{ display: 'grid', gap: 'var(--e1)', textAlign: 'left', fontFamily: 'var(--mono)' }}
                onClick={() => setLinha([...linha, p.id])}>
                {p.rotulo}
                <small className="apoio" style={{ fontFamily: 'var(--sans)' }}>{explicaPeca(p.rotulo)}</small>
              </button>
            ))}
            {linha.length > 0 && <button className="btn" onClick={() => setLinha([])}>limpar</button>}
          </div>

          <div style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn-icone destaque" data-acao="enviar-arena"
              disabled={!minhaEquipe || linha.length !== alvo} onClick={enviar}>
              <Icone nome="verificar" tamanho={16} /> enviar ({linha.length}/{alvo})
            </button>
            {!minhaEquipe && <span className="chip">entre numa equipe para jogar</span>}
            {recado && <span className="chip forte">{recado}</span>}
            <span className="apoio">errar não custa nada, pode tentar de novo</span>
          </div>

          {/*
            Retorno progressivo: quantas peças estão no lugar certo, sem dizer
            quais. A equipe descobre por eliminação, como num jogo de
            adivinhação, e ninguém extrai a resposta inteira de uma tentativa.
          */}
          {noLugar !== null && (
            <div className="cartao" style={{ display: 'grid', gap: 'var(--e1)' }}>
              <div style={{ display: 'flex', gap: 'var(--e05)', alignItems: 'center' }}>
                {Array.from({ length: alvo }).map((_, i) => (
                  <span key={i} style={{
                    width: 26, height: 10, borderRadius: 999,
                    background: i < noLugar ? 'var(--ok)' : 'var(--borda)',
                  }} />
                ))}
                <strong style={{ marginLeft: 'var(--e1)', fontSize: 'var(--t5)' }}>
                  {noLugar} de {alvo} no lugar
                </strong>
              </div>
              <span className="apoio">
                As peças certas podem estar em qualquer posição da sua linha. Mude uma e envie de novo.
              </span>
            </div>
          )}
        </>
      )}

      {jaAcertou && (
        <div className="cartao" style={{ borderColor: 'var(--ok)', display: 'flex', gap: 'var(--e2)', alignItems: 'center' }}>
          <Ilustra nome="festa" tamanho={28} />
          <strong>sua equipe acertou. Ajudem quem ainda está tentando.</strong>
        </div>
      )}

      {rodada?.explicacao && (
        <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
          {rodada.explicacao.map((e, i) => (
            <div key={`${e.texto}-${i}`} className="cartao" style={{ borderColor: 'var(--ok)' }}>
              <code className="kbd">{e.texto}</code>
              <p className="apoio" style={{ marginTop: 'var(--e05)' }}>{e.erro}</p>
            </div>
          ))}
        </div>
      )}

      <Pista cena={cena} arena={arena} />
    </div>
  );
}

/**
 * Caça ao erro: três linhas de comando não funcionam, e a equipe precisa achar
 * as três. Treina o hábito que mais importa no workshop, que é ler o comando
 * antes de apertar Enter.
 */
function CacaAoErro({
  cena, arena, papel, onIrParaSlide,
}: {
  cena: CenaArena; arena: Arena; papel: Papel; onIrParaSlide?: (id: string) => void;
}) {
  const rodada = arena.arena?.cenaId === cena.id ? arena.arena : null;
  const desafio = rodada?.desafio;
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const [recado, setRecado] = useState<string | null>(null);
  const [explicacoes, setExplicacoes] = useState<{ texto: string; erro: string }[] | null>(null);
  useEffect(() => { setMarcadas([]); setRecado(null); setExplicacoes(null); }, [cena.id]);

  const minhaEquipe = arena.eu?.grupo ?? null;
  const jaAcertou = rodada?.chegadas?.some((c) => c.equipe === minhaEquipe);
  const linhas = desafio?.linhas ?? [];
  const quantos = desafio?.quantos ?? 3;

  const [acertos, setAcertos] = useState<number | null>(null);

  async function enviar() {
    const r = await arena.tentarArena(marcadas);
    if (r?.certo) {
      setRecado(`acharam as ${quantos} em ${r.posicao}º lugar, +${r.xp} XP`);
      setExplicacoes(r.explicacoes ?? null);
      setAcertos(quantos);
    } else {
      setRecado(r?.detalhe ?? r?.erro ?? 'ainda não');
      setAcertos(r?.noLugar ?? null);
    }
  }

  return (
    <div className="cena" data-modulo={cena.modulo} data-denso="true" data-altura-fixa="true">
      <Cabecalho ilustra="lupa" titulo={cena.titulo}
        olho={`caça ao erro em equipe${arena.estado.restante !== null ? ` · ${arena.estado.restante}s` : ''}`} />
      <p className="corpo-p"><Texto>{cena.enunciado}</Texto></p>
      <div style={{ display: 'flex', gap: 'var(--e2)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Premios premios={rodada?.premios ?? cena.premios ?? [300, 200, 140, 90]} />
        {papel === 'player' && <ReferenciasConteudo referencias={cena.referencias} onIrParaSlide={onIrParaSlide} />}
      </div>

      {/* duas colunas: à esquerda o que a equipe lê e marca, à direita a
          classificação. Empilhado, o jogo ficava mais alto que a tela e a
          cena inteira encolhia */}
      <div className="duas duas-lab">
        <div className="coluna">
          {!desafio && <Aguardando papel={papel === 'host' ? 'player' : papel} oque="os comandos" />}
          {desafio?.contexto && (
            <div className="cartao" style={{ display: 'flex', gap: 'var(--e2)', alignItems: 'flex-start' }}>
              <Icone nome="pasta" tamanho={20} cor="var(--acento)" />
              <p className="corpo-p"><Texto>{desafio.contexto}</Texto></p>
            </div>
          )}

          {desafio && <div className="term linhas-caca">
            {linhas.map((l) => {
              const marcada = marcadas.includes(l.id);
              return (
                <button key={l.id} className="linha-caca" data-marcada={marcada}
                  disabled={papel !== 'player' || !!jaAcertou}
                  onClick={() => setMarcadas(marcada ? marcadas.filter((m) => m !== l.id) : [...marcadas, l.id])}>
                  <span style={{ color: '#7dd3a0' }}>$ </span>{l.texto}{marcada ? '   ← erro' : ''}
                </button>
              );
            })}
          </div>}

          {papel === 'player' && !jaAcertou && desafio && (
            <div style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn primario" data-acao="enviar-arena"
                disabled={!minhaEquipe || marcadas.length === 0} onClick={enviar}>
                <Icone nome="verificar" tamanho={16} /> enviar ({marcadas.length} de {quantos})
              </button>
              {recado && <span className="chip forte">{recado}</span>}
              {acertos !== null && (
                <span className="chip" title="quantas das suas marcações realmente têm erro">
                  {acertos} de {quantos} certas
                </span>
              )}
            </div>
          )}
        </div>

        <div className="coluna">
          <div className="olho">classificação</div>
          <Pista cena={cena} arena={arena} />
          {/* a resposta da sala, quando o apresentador decide mostrar */}
          {(explicacoes ?? rodada?.explicacao) && (
            <div className="grade" style={{ gap: 'var(--e1)' }}>
              {(explicacoes ?? rodada?.explicacao ?? []).map((e) => (
                <div key={e.texto} className="cartao" style={{ borderColor: 'var(--ok)', padding: 'var(--e2)' }}>
                  <code className="kbd">{e.texto}</code>
                  <p className="apoio" style={{ marginTop: 'var(--e1)' }}>{e.erro}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MEDALHA = ['trofeu', 'medalha', 'medalha'] as const;

/**
 * O que cada peça faz, em uma linha.
 *
 * Sem isso, montar o comando é tentativa e erro cega: a pessoa clica em ordens
 * aleatórias e não aprende nada. Com a explicação ao lado, ela raciocina sobre
 * o encanamento, que é justamente o que o jogo deveria treinar.
 */
function explicaPeca(rotulo: string): string {
  const r = rotulo.toLowerCase();
  if (r.startsWith('cat')) return 'lê o arquivo inteiro';
  if (r.startsWith('grep')) return 'filtra só as linhas que combinam';
  if (r.startsWith('cut')) return 'recorta uma coluna de cada linha';
  if (r === 'sort') return 'põe em ordem';
  if (r.startsWith('uniq')) return 'conta repetições vizinhas';
  if (r.startsWith('sort -rn')) return 'ordena do maior para o menor';
  if (r.startsWith('head')) return 'mostra só as primeiras';
  if (r === 'sudo') return 'como administrador';
  if (r === 'apt') return 'o gerenciador de pacotes';
  if (r === 'install') return 'a ação de instalar';
  if (r === '-y') return 'não me pergunte nada';
  if (r === 'remove') return 'a ação de remover';
  if (r === '--help') return 'mostra a ajuda e sai';
  return 'faz parte do comando';
}

function Corrida({
  cena, arena, papel, onIrParaSlide,
}: {
  cena: CenaArena; arena: Arena; papel: Papel; onIrParaSlide?: (id: string) => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);
  const rodada = arena.arena?.cenaId === cena.id ? arena.arena : null;
  const chegadas = rodada?.chegadas ?? [];
  const minhaEquipe = arena.eu?.grupo ?? null;
  const minhaPosicao = chegadas.find((c) => c.equipe === minhaEquipe)?.posicao ?? null;
  const premios = rodada?.premios ?? cena.premios ?? [300, 200, 140, 90];
  const solto = liberada(arena, cena, papel) && !encerrada(arena, cena, papel);

  // conferência automática, igual ao laboratório: ninguém perde a corrida por
  // esquecer de clicar; quem terminou aparece na pista em até 4 segundos
  useEffect(() => {
    if (papel !== 'player' || !solto || arena.estado.fase !== 'aberta' || !minhaEquipe || minhaPosicao || !cena.taskSlug) return;
    const conferir = async () => {
      setOcupado(true);
      const r = await arena.verificar(cena.taskSlug!, '', true);
      setOcupado(false);
      // só avisa quando fecha: a mensagem do checker diz o comando, e mostrá-la
      // sozinha entregava a tarefa da corrida
      setRecado(r.todos ? 'tarefa fechada!' : null);
    };
    conferir();
    const t = setInterval(conferir, 4_000);
    return () => clearInterval(t);
  }, [papel, solto, arena.estado.fase, minhaEquipe, minhaPosicao, cena.taskSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="cena" data-modulo={cena.modulo} data-denso="true" data-altura-fixa="true">
      <Cabecalho ilustra="foguete" titulo={cena.titulo}
        olho={`corrida de equipes${arena.estado.restante !== null ? ` · ${arena.estado.restante}s` : ''}`} />
      <p className="corpo-p"><Texto>{cena.enunciado}</Texto></p>

      <div style={{ display: 'flex', gap: 'var(--e2)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Premios premios={premios} />
        {papel === 'player' && <ReferenciasConteudo referencias={cena.referencias} onIrParaSlide={onIrParaSlide} />}
      </div>
      <div className="duas duas-lab">
        <div className="coluna">
          {/* o nome exato do arquivo, já com a equipe da pessoa: é o detalhe em
              que todo mundo erra ("o nome da equipe" com maiúscula, sem .txt…) */}
          {papel === 'player' && (
            <div className="caixa-resposta">
              <div className="linha"><Icone nome="arquivo" tamanho={18} /><strong>O arquivo da sua equipe</strong></div>
              {minhaEquipe
                ? <code className="kbd" style={{ justifySelf: 'start', fontSize: 'var(--t4)' }}>~/corrida/{minhaEquipe}.txt</code>
                : <span className="apoio">entre numa equipe para correr</span>}
            </div>
          )}
          <div className="olho">classificação</div>
          <Pista cena={cena} arena={arena} />
        </div>

        <div className="coluna">
          {!solto && <Aguardando papel={papel} oque="o terminal" />}
          {papel === 'host' && arena.estado.fase === 'idle' && <Aguardando papel={papel} oque="o terminal" />}
          {/* o terminal entra aqui: a tarefa da corrida é digitada nele */}
          {papel === 'player' && solto && (
            <>
              <div id="slot-terminal" className="term term-lab" />
              <div style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center', flexWrap: 'wrap' }}>
                {!minhaPosicao && (
                  <span className="conferindo" data-ativo={ocupado}>
                    <span className="ponto" /> conferindo sozinho a cada 4 segundos
                  </span>
                )}
                {minhaPosicao && <span className="chip forte">sua equipe chegou em {minhaPosicao}º</span>}
                {recado && <span className="chip">{recado}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Buzzer({
  cena, arena, papel, onIrParaSlide,
}: {
  cena: CenaArena; arena: Arena; papel: Papel; onIrParaSlide?: (id: string) => void;
}) {
  const rodada = arena.arena?.cenaId === cena.id ? arena.arena : null;
  const fila = rodada?.fila ?? [];
  const erradas = rodada?.erradas ?? [];
  const minhaEquipe = arena.eu?.grupo ?? null;
  const [apertei, setApertei] = useState(false);
  useEffect(() => setApertei(false), [cena.id]);

  const solto = liberada(arena, cena, papel) && !encerrada(arena, cena, papel);
  const souAVez = fila[0]?.equipe === minhaEquipe;
  const jaErrei = minhaEquipe ? erradas.includes(minhaEquipe) : false;
  const naFila = fila.some((f) => f.equipe === minhaEquipe);

  // cena-buzzer aperta o respiro, a figura e o botão: sem ela a tela do
  // participante (1280x800) não fecha e o deck acusa corte de conteúdo
  return (
    <div className="cena cena-buzzer" data-modulo={cena.modulo} data-denso="true">
      <Cabecalho ilustra="alarme" titulo={cena.titulo} olho="quem aperta primeiro responde" />
      <h2 className="titulo" style={{ fontSize: 'var(--t2)' }}><Texto>{cena.pergunta ?? cena.enunciado}</Texto></h2>
      <p className="corpo-p"><Texto>{cena.enunciado}</Texto></p>
      {papel === 'player' && <ReferenciasConteudo referencias={cena.referencias} onIrParaSlide={onIrParaSlide} />}

      {/* Imagem de mistério/pergunta antes da resposta */}
      {cena.imagem && !rodada?.resolvido && (
        <SlideFigura src={cena.imagem} alt={cena.titulo} maxAltura={260} />
      )}
      {/* Imagem com a resposta revelada */}
      {cena.imagemResposta && rodada?.resolvido && (
        <SlideFigura src={cena.imagemResposta} alt="Resposta revelada" maxAltura={260} />
      )}

      {!solto && <Aguardando papel={papel} oque="o botão" />}
      {papel === 'host' && arena.estado.fase === 'idle' && <Aguardando papel={papel} oque="o botão" />}

      {papel === 'player' && solto && (
        <button
          onClick={() => { arena.emit('arena:buzz'); setApertei(true); }}
          disabled={!minhaEquipe || naFila || jaErrei || rodada?.resolvido}
          style={{
            justifySelf: 'center', alignSelf: 'center', width: 'min(360px, 80vw)', aspectRatio: '2.4',
            borderRadius: 'var(--r-g)', cursor: 'pointer', fontSize: 'var(--t2)', fontWeight: 800,
            // cores fixas de propósito: um botão de game show precisa ser o mesmo
            // vermelho/verde nos dois temas, e o texto sempre legível sobre ele
            border: 0, boxShadow: '0 8px 0 rgba(0,0,0,.25)',
            background: souAVez ? '#16a34a' : naFila ? '#64748b' : '#dc2626',
            color: '#ffffff',
            opacity: !minhaEquipe || jaErrei || rodada?.resolvido ? 0.4 : 1,
          }}>
          {!minhaEquipe ? 'entre numa equipe'
            : jaErrei ? 'sua equipe já tentou'
            : souAVez ? 'é a sua vez, responda!'
            : naFila ? `na fila (${fila.findIndex((f) => f.equipe === minhaEquipe) + 1}º)`
            : apertei ? 'enviando…' : 'APERTAR'}
        </button>
      )}

      <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="cartao">
          <div className="olho"><Icone nome="pessoas" tamanho={14} /> fila</div>
          <div style={{ display: 'grid', gap: 'var(--e05)', marginTop: 'var(--e1)' }}>
            {fila.length === 0 && <span className="apoio">ninguém apertou ainda</span>}
            {fila.map((f, i) => (
              <span key={f.equipe} style={{ textTransform: 'capitalize', fontWeight: i === 0 ? 700 : 400 }}>
                {i + 1}. {f.equipe} <span className="apoio">({f.nick})</span>
              </span>
            ))}
          </div>
        </div>

        {erradas.length > 0 && (
          <div className="cartao">
            <div className="olho"><Icone nome="erro" tamanho={14} /> já tentaram</div>
            <div style={{ display: 'grid', gap: 'var(--e05)', marginTop: 'var(--e1)' }}>
              {erradas.map((e) => <span key={e} style={{ textTransform: 'capitalize', color: 'var(--tinta-2)' }}>{e}</span>)}
            </div>
          </div>
        )}

        {papel === 'host' && (
          <div className="cartao" style={{ display: 'grid', gap: 'var(--e1)' }}>
            <div className="olho">julgar a resposta de {fila[0]?.equipe ?? '—'}</div>
            <div style={{ display: 'flex', gap: 'var(--e1)' }}>
              <button className="btn-icone destaque" disabled={!fila.length}
                onClick={() => arena.emit('host:arena:julgar', true)}>
                <Icone nome="feito" tamanho={16} /> acertou
              </button>
              <button className="btn-icone" disabled={!fila.length}
                onClick={() => arena.emit('host:arena:julgar', false)}>
                <Icone nome="erro" tamanho={16} /> errou, passa a vez
              </button>
            </div>
          </div>
        )}
      </div>

      {/* quem acertou, em letra grande em todas as telas: é o momento da rodada */}
      {rodada?.resolvido && rodada.vencedor && (
        <div className="vencedor-buzzer" data-eu={rodada.vencedor.equipe === minhaEquipe || undefined}>
          <Ilustra nome="festa" tamanho={48} />
          <strong className="nome-vencedor">{rodada.vencedor.nick}</strong>
          <span>acertou pela equipe <strong style={{ textTransform: 'capitalize' }}>{rodada.vencedor.equipe}</strong> · +{rodada.vencedor.xp} XP para a equipe toda</span>
        </div>
      )}
    </div>
  );
}
