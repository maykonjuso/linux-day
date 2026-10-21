'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Arena, ResultadoCriterio } from '@/deck/useArena';
import type { Cena, Papel } from '@/deck/types';
import { Icone } from '../Icone';
import { Ilustra } from '../Ilustra';
import { usuarioDoNick } from '@/deck/avatares';
import { Texto } from '../Texto';
import { Cabecalho } from '../Cabecalho';
import { ReferenciasConteudo } from '../ReferenciasConteudo';
import { Aguardando } from '../SceneRouter';
import { ListaComandos } from '../ListaComandos';
import { liberada, encerrada } from '@/deck/liberada';
import { DECK } from '@/deck/content';
import { CartoesDoChamado } from './CartoesDoChamado';

type CenaLab = Extract<Cena, { tipo: 'LabScene' }>;

/** nome de cada carta de função, como aparece na cena das cartas */
const NOME_DA_CARTA: Record<string, string> = Object.fromEntries(
  DECK.flatMap((c) => (c.tipo === 'GroupScene' ? c.papeis ?? [] : [])).map((p) => [p.id, p.nome]),
);

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
export function LabScene({
  cena, arena, papel, onIrParaSlide,
}: {
  cena: CenaLab; arena: Arena; papel: Papel; onIrParaSlide?: (id: string) => void;
}) {
  const [resultados, setResultados] = useState<Record<string, ResultadoCriterio>>({});
  /**
   * Mensagens que aparecem embaixo do item. Só quando a pessoa ENVIA uma
   * resposta no campo, e só nos itens de resposta ("não é esse número").
   * A conferência automática nunca mostra mensagem: as mensagens dos checkers
   * apontam o comando, e mostrá-las sozinhas entregava a solução no instante
   * em que o terminal abria. Ajuda de verdade é o botão de dica.
   */
  const [avisos, setAvisos] = useState<Record<string, string>>({});
  const [resposta, setResposta] = useState('');
  const [dica, setDica] = useState<string | null>(null);
  const [dicaIndice, setDicaIndice] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const ultimaResposta = useRef('');

  const souJogador = papel === 'player';
  // Kahoot: primeiro a turma lê o que fazer; o terminal abre quando o apresentador libera
  const passou = encerrada(arena, cena, papel);
  // laboratório que já passou: sem terminal, sem resposta, só o que foi feito
  const solto = liberada(arena, cena, papel) && !passou;
  /** no chamado, o caminho da pasta da equipe (o servidor sabe onde ela fica) */
  const pastaDaEquipe = cena.escopo === 'grupo' && arena.eu?.grupo && arena.labs[cena.taskSlug]?.pasta
    ? `${arena.labs[cena.taskSlug].pasta}${arena.eu.grupo}` : null;
  // no chamado, o campo de resposta é do Investigador (ou de todos, se a carta estiver livre)
  const investigadorLivre = !Object.values(arena.meuGrupo?.papeis ?? {}).includes('investigador');
  const souInvestigador = arena.eu?.id ? arena.meuGrupo?.papeis?.[arena.eu.id] === 'investigador' : false;
  const precisaResposta = cena.criterios.length === 1 || cena.taskSlug === 'm4-pipes'
    || (cena.taskSlug === 'boss-chamado' && (!cena.cartoes || souInvestigador || investigadorLivre));

  useEffect(() => { setResultados({}); setAvisos({}); setResposta(''); setDica(null); setDicaIndice(0); }, [cena.id]);
  // sincroniza o ref apenas para a verificação MANUAL (Enter / botão enviar).
  // O check automático sempre passa '' para não usar o que está sendo digitado.
  useEffect(() => { ultimaResposta.current = resposta; }, [resposta]);
  const ultimaRespostaManual = useRef('');

  /** itens que acabaram de ficar prontos: ganham a animação de conquista */
  const [recentes, setRecentes] = useState<string[]>([]);
  const [ganhoVisivel, setGanhoVisivel] = useState<{ xp: number; chave: number } | null>(null);
  const prontosAntes = useRef<Set<string>>(new Set());

  const verificar = useCallback(async (silencioso = false) => {
    if (!souJogador || ocupado) return;
    setOcupado(true);
    // automático: passa '' (não usa o campo). Manual: usa o que o usuário digitou.
    const respostaParaEnviar = silencioso ? '' : ultimaRespostaManual.current;
    const r = await arena.verificar(cena.taskSlug, respostaParaEnviar, silencioso);
    setOcupado(false);
    if (r.erro) { if (!silencioso) setMsg(r.erro); return; }
    setResultados(Object.fromEntries(r.resultados.map((x) => [x.id, x])));
    if (!silencioso) {
      setAvisos(Object.fromEntries(r.resultados
        .filter((x) => !x.passou && x.tipo === 'resposta' && x.mensagem)
        .map((x) => [x.id, x.mensagem as string])));
      // limpa o campo depois de enviar: a resposta já foi registrada
      setResposta('');
      ultimaResposta.current = '';
      ultimaRespostaManual.current = '';
    } else {
      // o que ficou certo perde o aviso antigo
      setAvisos((a) => Object.fromEntries(Object.entries(a).filter(([id]) => !r.resultados.find((x) => x.id === id)?.passou)));
    }

    // o que ficou verde AGORA: anima o item e sobe o "+XP" na tela
    const novos = r.resultados.filter((x) => x.passou && !prontosAntes.current.has(x.id) && !x.adesivo).map((x) => x.id);
    r.resultados.forEach((x) => { if (x.passou) prontosAntes.current.add(x.id); });
    if (novos.length) {
      setRecentes(novos);
      setTimeout(() => setRecentes([]), 1800);
    }
    if (r.ganho > 0) setGanhoVisivel({ xp: r.ganho, chave: Date.now() });
    if (r.todos && r.ganho > 0) setMsg('🎉 laboratório completo!');
    else if (!silencioso) setMsg(r.ganho > 0 ? null : 'resposta não confere, tente de novo');
  }, [arena, cena.taskSlug, ocupado, souJogador]);

  useEffect(() => { prontosAntes.current = new Set(arena.eu?.criterios ?? []); }, [cena.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /*
   * Conferência automática. Ninguém precisa clicar em Verificar: a cada 5
   * segundos o laboratório olha o terminal da pessoa e acende o que já está
   * certo. O retorno chega enquanto ela ainda está pensando no comando, que é
   * quando ele ensina; e some o "esqueci de verificar" do fim do tempo.
   */
  useEffect(() => {
    if (!souJogador || !solto || arena.estado.fase !== 'aberta') return;
    verificar(true);
    const t = setInterval(() => verificar(true), 5_000);
    return () => clearInterval(t);
  }, [souJogador, solto, arena.estado.fase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ganhoVisivel) return;
    const t = setTimeout(() => setGanhoVisivel(null), 2200);
    return () => clearTimeout(t);
  }, [ganhoVisivel]);


  const totalDicas = arena.labs[cena.taskSlug]?.dicas ?? 0;
  const semDicas = dicaIndice >= totalDicas;
  const custoDaDica = dicaIndice === 0 ? 1 : 2;
  const feitos = cena.criterios.filter((c) => resultados[c.id]?.passou || arena.eu?.criterios?.includes(c.id)).length;
  const tempo = arena.estado.restante;
  const papeis = arena.meuGrupo?.papeis ?? {};

  /**
   * No chamado, cada item é de uma carta. A carta sai do deck (e não da
   * resposta do servidor, como antes), então o dono aparece desde o primeiro
   * segundo e para todo mundo, inclusive para quem está sem carta.
   */
  const cartaDe = (papelId?: string) => {
    if (!papelId) return null;
    const donoId = Object.entries(papeis).find(([, p]) => p === papelId)?.[0];
    const dono = arena.meuGrupo?.membros.find((m) => m.id === donoId) ?? null;
    return { nome: NOME_DA_CARTA[papelId] ?? papelId, dono, minha: !!donoId && donoId === arena.eu?.id };
  };

  return (
    <div className="cena" data-modulo={cena.modulo} data-denso="true" data-altura-fixa="true">
      <Cabecalho
        ilustra={cena.escopo === 'grupo' ? 'ferramenta' : 'terminal'}
        titulo={cena.titulo}
        olho={[
          cena.escopo === 'grupo' ? `chamado em equipe${arena.eu?.grupo ? ` · ${arena.eu.grupo}` : ''}` : 'mão na massa',
          tempo !== null ? `${Math.floor(tempo / 60)}:${String(tempo % 60).padStart(2, '0')}` : null,
        ].filter(Boolean).join(' · ')}
      />
      {ganhoVisivel && <div key={ganhoVisivel.chave} className="ganho-xp">+{ganhoVisivel.xp} XP</div>}
      <p className="corpo-p"><Texto>{cena.objetivo}</Texto></p>
      {cena.escopo === 'grupo' && souJogador && !cena.cartoes && (
        <div className="chip forte" style={{ justifySelf: 'start', fontSize: 'var(--t5)', flexWrap: 'wrap', maxWidth: '100%' }}>
          <Icone nome="pasta" tamanho={16} />
          {/* o caminho completo passa de 500px: no celular ele quebra em vez de cortar a tela */}
          {pastaDaEquipe
            ? <>pasta da equipe: <code className="kbd" style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>cd {pastaDaEquipe}</code></>
            : 'entre numa equipe para ver a pasta de vocês'}
        </div>
      )}

      <div className="duas duas-lab" style={{ gap: 'var(--e3)' }}>
        {/* coluna da esquerda: o que fazer */}
        <div className="coluna">
          <div className="progresso">
            <div className="olho" style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <Icone nome="checklist" tamanho={15} /> {feitos} de {cena.criterios.length} prontos
            </div>
            <div className="trilha">
              <div className="cheio" style={{ width: `${(feitos / cena.criterios.length) * 100}%` }} />
            </div>
          </div>

          <div className="checklist">
            {cena.criterios.map((c, i) => {
              const r = resultados[c.id];
              const ok = r?.passou || arena.eu?.criterios?.includes(c.id);
              const carta = cena.escopo === 'grupo' ? cartaDe(c.papel) : null;
              // só fecha quem tem a carta; carta sem dono fica aberta para a equipe
              const deOutro = !!(carta?.dono && !carta.minha);
              return (
                <div key={c.id} className="item-check" data-ok={!!ok} data-novo={recentes.includes(c.id)}
                  data-carta={c.papel} data-minha={carta?.minha || undefined}
                  style={carta?.minha && !ok ? { borderColor: 'var(--acento)', borderWidth: 2 } : undefined}>
                  <span className="marca">
                    {String(i + 1).padStart(2, '0')} <span className="caixa-marca">{ok ? '✓' : ''}</span>
                  </span>

                  <span className="texto-item">
                    {carta && (
                      <span className="carta-do-item" style={{ fontSize: '0.84em', color: carta.minha ? 'var(--acento)' : 'var(--tinta-2)' }}>
                        <strong>{carta.nome}</strong>
                        {' · '}
                        {carta.minha ? 'sua carta' : carta.dono ? `${carta.dono.emoji} ${carta.dono.nick}` : 'carta livre: qualquer um da equipe entrega'}
                      </span>
                    )}
                    <span><Texto>{c.descricao}</Texto></span>
                    {!ok && avisos[c.id] && (
                      <span className="pista">
                        <Icone nome="ideia" tamanho={14} cor="var(--atencao)" />
                        <span>{avisos[c.id]}</span>
                      </span>
                    )}
                    {deOutro && !ok && souJogador && (
                      <span style={{ fontSize: '0.84em', color: 'var(--tinta-2)' }}>
                        você pode ajudar, mas quem entrega este item é {carta?.dono?.nick}
                      </span>
                    )}
                  </span>

                  <span className="xp-item">{c.xp} XP</span>
                </div>
              );
            })}
          </div>

          {/* recolhido por padrão: a lista é consulta, não precisa roubar a tela */}
          <details className="gaveta-comandos">
            <summary>
              <Icone nome="consultar" tamanho={16} />
              <span>Comandos deste módulo <span className="apoio">({cena.comandosDoModulo.length}) · o que fazem e como usar</span></span>
            </summary>
            <ListaComandos comandos={cena.comandosDoModulo} compacta />
          </details>

          {souJogador && <ReferenciasConteudo referencias={cena.referencias} onIrParaSlide={onIrParaSlide} />}

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
        <div className="coluna">
          {passou ? (
            <div className="cartao"><Icone nome="cadeado" tamanho={18} /> Laboratório encerrado. Os itens que você fez continuam marcados ao lado.</div>
          ) : !solto ? <Aguardando papel={papel} oque={cena.cartoes ? 'os cartões' : 'o terminal'} /> : cena.cartoes ? (
            souJogador
              ? <CartoesDoChamado arena={arena} nomeDaCarta={NOME_DA_CARTA} aberto={arena.estado.fase === 'aberta'} />
              : <div className="cartao">Os cartões de comando estão na tela de cada participante.</div>
          ) : (
          <div id={souJogador ? 'slot-terminal' : undefined} className="term term-lab"
            style={{ display: souJogador ? 'block' : 'grid', placeItems: 'center', color: '#a7a7b0' }}>
            {!souJogador && 'o terminal está na tela de cada participante'}
          </div>
          )}
          {papel === 'host' && arena.estado.fase === 'idle' && <Aguardando papel={papel} oque="o terminal" />}

          {/*
            O campo de resposta precisa gritar.
            Nos laboratórios de achar algo (a flag escondida, a contagem do log)
            a pessoa descobre a resposta no terminal e fica procurando onde
            entregar. Então é um bloco com rótulo, borda de destaque e botão.
          */}
          {precisaResposta && souJogador && solto && (
            <div className="caixa-resposta" data-preenchida={!!resposta.trim()}>
              <div className="linha">
                <Ilustra nome="bandeira" tamanho={20} />
                <strong style={{ fontSize: 'var(--t5)' }}>Achou a resposta? Cole aqui</strong>
              </div>
              <div className="linha">
                <input
                    autoComplete="off" spellCheck={false} size={8}
                    placeholder="cole ou digite aqui"
                    value={resposta}
                    onChange={(e) => {
                      setResposta(e.target.value);
                      ultimaRespostaManual.current = e.target.value;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && resposta.trim()) {
                        ultimaRespostaManual.current = resposta;
                        verificar();
                      }
                    }} />
                  <button className="btn primario" data-acao="enviar-resposta"
                    disabled={!resposta.trim() || ocupado}
                    onClick={() => { ultimaRespostaManual.current = resposta; verificar(); }}>
                    <Icone nome="proximo" tamanho={18} /> enviar
                  </button>
              </div>
              <small className="apoio">Pode tentar quantas vezes quiser: errar não tira XP.</small>
            </div>
          )}

          {souJogador && solto && (
          <div className="acoes-lab">
            {/* sem botão de Verificar: a conferência é automática, e este
                indicador mostra que ela está acontecendo */}
            <span className="conferindo" data-ativo={ocupado}>
              <span className="ponto" /> conferindo sozinho a cada 5 segundos
            </span>

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
