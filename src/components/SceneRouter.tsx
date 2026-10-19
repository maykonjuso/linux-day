'use client';

import { useEffect, useState } from 'react';
import type { Arena } from '@/deck/useArena';
import type { Cena, Papel } from '@/deck/types';
import { Diagrama } from './Diagramas';
import { Icone } from './Icone';
import { Ilustra, IlustraDestaque, type NomeIlustra } from './Ilustra';
import { Texto } from './Texto';
import { Cabecalho } from './Cabecalho';
import PermissionToggles from './widgets/PermissionToggles';
import PathQuiz from './widgets/PathQuiz';
import PipeBuilder from './widgets/PipeBuilder';
import FsDragDrop from './widgets/FsDragDrop';
import CommandBuilder from './widgets/CommandBuilder';
import { Escolhas, ESCAPE, PERIGO, PREVER, ERROS } from './widgets/Escolhas';
import { LabScene } from './scenes/LabScene';
import { GroupScene } from './scenes/GroupScene';
import { ArenaScene } from './scenes/ArenaScene';
import { ReferenciasConteudo } from './ReferenciasConteudo';

/**
 * Uma cena, três projeções. O conteúdo é o mesmo objeto; quem muda é o papel:
 *  - screen  → projetor (gigante, sem interação)
 *  - player  → notebook do participante (é onde ele age)
 *  - host    → sua tela (resposta certa, progresso, controles)
 * Nunca duplique conteúdo entre papéis: é assim que deck e lab saem de sincronia.
 */
export function SceneRouter({
  arena, papel, cenaForcada, onIrParaSlide,
}: {
  arena: Arena; papel: Papel; cenaForcada?: Cena; onIrParaSlide?: (id: string) => void;
}) {
  // no modo livre o participante olha outra cena sem tirar a sala do lugar
  const cena = cenaForcada ?? arena.cena;
  switch (cena.tipo) {
    case 'ModuleCover': return <Capa cena={cena} />;
    case 'MentalModel': return <Modelo cena={cena} />;
    case 'CommandAnatomy': return <Anatomia cena={cena} />;
    case 'TerminalDemo': return <Demo cena={cena} passo={cenaForcada ? cena.passos - 1 : arena.estado.passo} />;
    case 'WillGoWrong': return <Erros cena={cena} />;
    case 'QuizScene': return <Quiz cena={cena} arena={arena} papel={papel} />;
    case 'WidgetScene': return <Widget cena={cena} arena={arena} papel={papel} onIrParaSlide={onIrParaSlide} />;
    case 'LabScene': return <LabScene cena={cena} arena={arena} papel={papel} onIrParaSlide={onIrParaSlide} />;
    case 'GroupScene': return <GroupScene cena={cena} arena={arena} papel={papel} />;
    case 'ArenaScene': return <ArenaScene cena={cena} arena={arena} papel={papel} onIrParaSlide={onIrParaSlide} />;
    case 'Scoreboard': return <Placar cena={cena} arena={arena} />;
    case 'Recap': return <Recap cena={cena} passo={cenaForcada ? cena.passos - 1 : arena.estado.passo} />;
  }
}

type C<T extends Cena['tipo']> = Extract<Cena, { tipo: T }>;

/** ilustração padrão de cada módulo, quando a cena não escolhe a sua */
const ILUSTRA_DO_MODULO: NomeIlustra[] = ['pinguim', 'bussola', 'pasta', 'cadeado', 'elo', 'engrenagem', 'ferramenta'];

const ilustraDa = (cena: { ilustra?: string; modulo: number }): NomeIlustra =>
  (cena.ilustra as NomeIlustra) ?? ILUSTRA_DO_MODULO[cena.modulo] ?? 'pinguim';

function Capa({ cena }: { cena: C<'ModuleCover'> }) {
  return (
    <div className="cena" data-modulo={cena.modulo}>
      <div style={{ display: 'flex', gap: 'var(--e4)', alignItems: 'center', flexWrap: 'wrap' }}>
        <IlustraDestaque nome={ilustraDa(cena)} />
        <div className="grade" style={{ gap: 'var(--e2)' }}>
          <div className="olho">módulo {cena.modulo}</div>
          <h1 className="titulo">{cena.titulo}</h1>
          <p className="corpo"><Texto>{cena.pergunta}</Texto></p>
          <div className="chip forte" style={{ justifySelf: 'start' }}>
            <Icone nome="xp" tamanho={15} /> {cena.xpDoModulo} XP em jogo
          </div>
        </div>
      </div>
    </div>
  );
}

const ICONE_DO_DIAGRAMA = { arvore: 'arvore', processo: 'processo', cadeados: 'cadeado', encanamento: 'juntar' } as const;

function Modelo({ cena }: { cena: C<'MentalModel'> }) {
  return (
    <div className="cena" data-modulo={cena.modulo}>
      <Cabecalho ilustra={ilustraDa(cena)} olho="como isso funciona" titulo={cena.titulo} />
      <Diagrama nome={cena.diagrama} />
      <div className="cartao" style={{ display: 'flex', gap: 'var(--e2)', alignItems: 'flex-start', maxWidth: '58em' }}>
        <Ilustra nome="ideia" tamanho={26} />
        <p className="corpo-p" style={{ maxWidth: 'none' }}><Texto>{cena.legenda}</Texto></p>
      </div>
    </div>
  );
}

function Anatomia({ cena }: { cena: C<'CommandAnatomy'> }) {
  return (
    <div className="cena" data-modulo={cena.modulo}>
      <Cabecalho ilustra={ilustraDa(cena)} olho="anatomia do comando" titulo={cena.titulo} />
      <div className="term" style={{ fontSize: 'var(--t2)' }}>{cena.comando}</div>
      <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        {cena.partes.map((p) => (
          <div key={p.trecho} className="cartao">
            <code className="kbd" style={{ fontSize: '1.1em' }}>{p.trecho}</code>
            <p style={{ marginTop: 'var(--e1)', color: 'var(--tinta-2)', display: 'flex', gap: 'var(--e1)', alignItems: 'center' }}>
              <Icone nome="proximo" tamanho={15} /> {p.rotulo}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Demo({ cena, passo }: { cena: C<'TerminalDemo'>; passo: number }) {
  const atual = Math.min(passo, cena.linhas.length - 1);

  /**
   * As linhas anteriores encolhem para uma linha só (o comando), e apenas a
   * linha da vez mostra saída e explicação. Com seis ou sete linhas completas
   * empilhadas, o começo saía da tela, e reduzir a letra de tudo deixava o
   * slide ilegível no projetor. Assim o foco fica onde você está falando e o
   * histórico continua visível.
   */
  return (
    <div className="cena" data-modulo={cena.modulo}>
      <Cabecalho ilustra={ilustraDa(cena)} olho="demonstração" titulo={cena.titulo} />

      <div className="term">
        {cena.linhas.slice(0, atual + 1).map((l, i) => {
          const eAtual = i === atual;
          return (
            <div key={i} style={{ opacity: eAtual ? 1 : 0.42, marginBottom: eAtual ? 0 : 2 }}>
              <span style={{ color: '#4b4b55', userSelect: 'none' }}>{i + 1}. </span>
              <span className="cmd">{l.comando}</span>
              {eAtual && l.saida && (
                <div className="saida">
                  {l.destaque
                    ? l.saida.split(l.destaque).flatMap((parte, j, arr) =>
                        j < arr.length - 1 ? [parte, <b key={j}>{l.destaque}</b>] : [parte],
                      )
                    : l.saida}
                </div>
              )}
              {eAtual && l.traducao && <span className="traducao"><Texto>{l.traducao}</Texto></span>}
            </div>
          );
        })}
      </div>

      <div className="olho" style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center' }}>
        <span>passo {atual + 1} de {cena.linhas.length}</span>
        <span style={{ display: 'flex', gap: 4 }}>
          {cena.linhas.map((_, i) => (
            <span key={i} style={{
              width: 22, height: 4, borderRadius: 99,
              background: i <= atual ? 'var(--acento)' : 'var(--borda)',
            }} />
          ))}
        </span>
      </div>
    </div>
  );
}

function Erros({ cena }: { cena: C<'WillGoWrong'> }) {
  /**
   * Duas colunas e linhas compactas. Em cartões de três linhas cada, cinco
   * erros não cabiam na tela do notebook, e encolher tudo deixava a mensagem
   * de erro (que é o conteúdo principal) pequena demais para ler.
   */
  return (
    <div className="cena" data-modulo={cena.modulo}>
      <Cabecalho ilustra="extintor" olho="o que vai dar errado" titulo={cena.titulo} />
      <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 12 }}>
        {cena.erros.map((e) => (
          <div key={e.mensagem} className="cartao" style={{ padding: 'var(--e2)', display: 'grid', gap: 4 }}>
            <code style={{ fontFamily: 'var(--mono)', color: 'var(--erro)', fontSize: 'clamp(13px, 1.25vw, 18px)' }}>
              {e.mensagem}
            </code>
            <span style={{ fontSize: 'clamp(13px, 1.2vw, 17px)' }}><Texto>{e.significa}</Texto></span>
            <span style={{ color: 'var(--ok)', fontSize: 'clamp(13px, 1.2vw, 17px)', display: 'flex', gap: 'var(--e05)', alignItems: 'center' }}>
              <Icone nome="ideia" tamanho={14} cor="var(--ok)" /> {e.causa}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Quiz({ cena, arena, papel }: { cena: C<'QuizScene'>; arena: Arena; papel: Papel }) {
  const [escolha, setEscolha] = useState<string | null>(null);
  const [recusa, setRecusa] = useState<string | null>(null);
  const { estado, revelacao, emit } = arena;
  useEffect(() => { setEscolha(null); setRecusa(null); }, [cena.id]);

  const revelado = revelacao?.cenaId === cena.id;
  const total = Object.values(revelacao?.distribuicao ?? {}).reduce((s, n) => s + n, 0) || 1;
  const aberta = estado.fase === 'aberta' || estado.fase === 'encerrada';
  const daVez = !estado.cenaId || estado.cenaId === cena.id;
  const podeResponder = papel === 'player' && !escolha && aberta && daVez && !revelado;
  const tempoEsgotado = estado.fase === 'encerrada' && !revelado;

  const contagem = arena.respostas?.cenaId === cena.id ? arena.respostas : null;
  const faltam = contagem ? Math.max(0, contagem.esperados - contagem.total) : null;

  return (
    <div className="cena" data-modulo={cena.modulo}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--e2)', flexWrap: 'wrap' }}>
        <div className="olho"><Ilustra nome={ilustraDa(cena)} tamanho={18} /> {cena.titulo}</div>
        {estado.restante !== null && !revelado && (
          <span className="chip forte" style={{ fontSize: 'clamp(16px, 1.8vw, 26px)', padding: 'var(--e1) var(--e2)' }}>
            <Icone nome="relogio" tamanho={18} /> {estado.restante}s
          </span>
        )}
        {contagem && !revelado && (
          <span className="chip" style={{ fontSize: 'clamp(14px, 1.5vw, 22px)', padding: 'var(--e1) var(--e2)' }}>
            <Icone nome="pessoas" tamanho={18} /> {contagem.total} de {contagem.esperados} responderam
            {faltam ? ` · faltam ${faltam}` : ' · todos!'}
          </span>
        )}
      </div>
      <h2 className="titulo" style={{ fontSize: 'var(--t2)' }}><Texto>{cena.pergunta}</Texto></h2>

      <div className="alternativas">
        {cena.alternativas.map((a, i) => {
          const votos = revelacao?.distribuicao?.[a.id] ?? 0;
          return (
            <button
              key={a.id}
              className="alt"
              data-escolhida={escolha === a.id}
              data-estado={revelado ? (a.id === revelacao?.correta ? 'certa' : 'errada') : undefined}
              disabled={!podeResponder}
              onClick={() => {
                setEscolha(a.id);
                arena.socket?.emit('responder', { cenaId: cena.id, alternativa: a.id },
                  (r: { ok: boolean; motivo?: string }) => {
                    if (!r?.ok) { setEscolha(null); setRecusa(r?.motivo === 'já respondeu' ? 'você já respondeu esta pergunta' : 'a pergunta não está aberta'); }
                  });
              }}
            >
              <span className="letra">{String.fromCharCode(65 + i)}</span>
              <span style={{ flex: 1 }}>{a.texto}</span>
              {revelado && (
                <span style={{ display: 'grid', gap: 'var(--e05)', minWidth: 90 }}>
                  <span className="barra-votos" style={{ width: `${(votos / total) * 90}px` }} />
                  <small style={{ color: 'var(--tinta-2)' }}>{votos}</small>
                </span>
              )}
              {papel === 'host' && a.id === arena.gabaritos[cena.id]?.correta && (
                <strong style={{ color: 'var(--ok)' }} title="resposta certa (só você vê)">✓</strong>
              )}
            </button>
          );
        })}
      </div>

      {revelado && (
        <div className="cartao" style={{ display: 'flex', gap: 'var(--e2)', alignItems: 'flex-start', maxWidth: '46em' }}>
          <Ilustra nome="ideia" tamanho={30} />
          <p className="corpo-p" style={{ maxWidth: 'none' }}><Texto>{cena.explicacao}</Texto></p>
        </div>
      )}
      {papel === 'player' && escolha && !revelado && <div className="chip forte">resposta enviada · segure a ansiedade</div>}
      {papel === 'player' && !escolha && !revelado && !aberta && (
        <div className="chip"><Icone nome="relogio" tamanho={15} /> aguardando o apresentador abrir a pergunta</div>
      )}
      {papel === 'player' && !escolha && tempoEsgotado && (
        <div className="chip"><Icone nome="tempo" tamanho={15} /> o tempo acabou, mas você ainda pode responder (sem o bônus de velocidade)</div>
      )}
      {papel === 'player' && !daVez && (
        <div className="chip"><Icone nome="olho" tamanho={15} /> você está olhando outra cena. Volte ao vivo para responder.</div>
      )}
      {recusa && <div className="chip forte">{recusa}</div>}
    </div>
  );
}

function Widget({
  cena, arena, papel, onIrParaSlide,
}: {
  cena: C<'WidgetScene'>; arena: Arena; papel: Papel; onIrParaSlide?: (id: string) => void;
}) {
  const [feito, setFeito] = useState(false);
  useEffect(() => setFeito(false), [cena.id]);

  const concluir = () => {
    setFeito(true);
    if (papel === 'player') arena.emit('widget:concluido', { cenaId: cena.id, xp: 60 });
  };

  // no projetor o widget não é jogável: o exercício está na tela de cada um
  const interativo = papel !== 'screen';

  const qual = () => {
    switch (cena.widget) {
      case 'permission-toggles': return <PermissionToggles onConcluir={concluir} />;
      case 'path-quiz': return <PathQuiz onConcluir={concluir} />;
      case 'pipe-builder': return <PipeBuilder onConcluir={concluir} />;
      case 'fs-dragdrop': return <FsDragDrop onConcluir={concluir} />;
      case 'command-builder': return <CommandBuilder onConcluir={concluir} />;
      case 'escape-room': return <Escolhas rodadas={ESCAPE} onConcluir={concluir} />;
      case 'spot-the-danger': return <Escolhas rodadas={PERIGO} onConcluir={concluir} />;
      case 'predict-output': return <Escolhas rodadas={PREVER} onConcluir={concluir} />;
      case 'error-match': return <Escolhas rodadas={ERROS} onConcluir={concluir} />;
      default: return null;
    }
  };

  return (
    <div className="cena" data-modulo={cena.modulo}>
      <Cabecalho ilustra={ilustraDa(cena)} titulo={cena.titulo}
        olho={`exercício na tela${arena.estado.restante !== null ? ` · ${arena.estado.restante}s` : ''}`} />
      <p className="corpo-p"><Texto>{cena.enunciado}</Texto></p>
      {papel === 'player' && <ReferenciasConteudo referencias={cena.referencias} onIrParaSlide={onIrParaSlide} />}

      {interativo ? qual() : (
        <div className="cartao" style={{ fontSize: 'clamp(18px, 2vw, 30px)' }}>
          👉 o exercício está na tela de vocês. Mãos no mouse.
        </div>
      )}

      {feito && cena.pontePara && (
        <div className="cartao" style={{ borderColor: 'var(--ok)' }}>
          <div className="olho">o que você acabou de fazer, em comando</div>
          <code className="kbd" style={{ fontSize: '1.25em' }}>{cena.pontePara}</code>
        </div>
      )}
    </div>
  );
}

function Placar({ cena, arena }: { cena: C<'Scoreboard'>; arena: Arena }) {
  const { individual, grupos } = arena.placar;
  const linhas = cena.escopo === 'grupo'
    ? grupos.filter((g) => g.membros.length).map((g) => ({ chave: g.nome, nome: `grupo ${g.nome}`, cor: g.cor, xp: g.media, extra: `${g.membros.length} pessoa${g.membros.length > 1 ? 's' : ''}` }))
    : individual.slice(0, 10).map((p) => ({ chave: p.id, nome: `${p.emoji} ${p.nick}`, cor: undefined, xp: p.xp, extra: `nível ${p.nivel}` }));

  /**
   * Pódio em destaque e o resto numa lista que rola dentro da própria caixa.
   * Com dez grupos, a lista inteira em cartões do mesmo tamanho não caberia na
   * tela, e encolher tudo deixaria o primeiro lugar do tamanho do oitavo.
   */
  const podio = linhas.slice(0, 3);
  const resto = linhas.slice(3);

  return (
    <div className="cena" data-modulo={cena.modulo}>
      <Cabecalho ilustra="trofeu" olho={cena.escopo === 'grupo' ? 'placar das equipes' : 'placar individual'} titulo={cena.titulo} />

      {linhas.length === 0 && <p className="corpo-p">ninguém pontuou ainda.</p>}

      {podio.length > 0 && (
        <div className="grade" style={{ gridTemplateColumns: `repeat(${podio.length}, 1fr)`, gap: 'var(--e2)' }}>
          {podio.map((l, i) => (
            <div key={l.chave} className="cartao"
              style={{
                display: 'grid', gap: 'var(--e05)', textAlign: 'center',
                borderColor: i === 0 ? 'var(--atencao)' : l.cor ?? 'var(--borda)',
                borderWidth: i === 0 ? 2 : 1,
                transform: i === 0 ? 'scale(1.03)' : undefined,
              }}>
              <div style={{ display: 'grid', placeItems: 'center' }}>
                <Ilustra nome={i === 0 ? 'trofeu' : 'medalha'} tamanho={i === 0 ? 40 : 30} />
              </div>
              <strong className="titulo-secao" style={{ textTransform: 'capitalize' }}>{l.nome}</strong>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t3)', fontWeight: 700 }}>{l.xp}</span>
              <small className="apoio">XP · {l.extra}</small>
            </div>
          ))}
        </div>
      )}

      {resto.length > 0 && (
        <div className="checklist" style={{ maxHeight: 'min(30vh, 260px)', overflowY: 'auto' }}>
          {resto.map((l, i) => (
            <div key={l.chave} className="item-check" style={{ alignItems: 'center' }}>
              <span className="marca">{String(i + 4).padStart(2, '0')}º</span>
              <span style={{ textTransform: 'capitalize' }}>{l.nome}</span>
              <span className="xp-item">{l.xp} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Recap({ cena, passo }: { cena: C<'Recap'>; passo: number }) {
  return (
    <div className="cena" data-modulo={cena.modulo}>
      <Cabecalho ilustra="bandeira" olho="fecho do módulo" titulo={cena.titulo} />
      <h2 className="titulo" style={{ fontSize: 'var(--t2)' }}><Texto>{cena.perguntaDeRecuperacao}</Texto></h2>
      {passo > 0 ? (
        <div style={{ display: 'flex', gap: 'var(--e1)', flexWrap: 'wrap' }}>
          {cena.resumo.map((c) => <code key={c} className="kbd" style={{ fontSize: 'var(--t4)' }}>{c}</code>)}
        </div>
      ) : (
        <p className="corpo-p">Tente lembrar antes de ver a resposta. O resumo aparece no próximo passo. Lembrar sozinho é o que faz o conteúdo ficar.</p>
      )}
    </div>
  );
}
