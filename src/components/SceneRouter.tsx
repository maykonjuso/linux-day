'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { ITENS as CONTROLES } from './Tour';
import { ListaComandos } from './ListaComandos';
import { liberada, encerrada } from '@/deck/liberada';
import { embaralhar } from '@/deck/embaralhar';
import { QrCode } from './QrCode';
import { PodioDaCena } from './Celebracao';
import { SlideFigura } from './SlideFigura';

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

  /*
   * Pódio: depois de exercício, laboratório e jogo de equipe, o avançar do
   * apresentador passa pela fase "revelada", que mostra o placar animado com o
   * XP que cada um ganhou naquela rodada (o quiz mostra o dele junto da
   * resposta). Quem está revendo a cena no modo livre vê a cena, não o pódio.
   */
  if (!cenaForcada && arena.estado.fase === 'revelada' && arena.estado.cenaId === cena.id
      && (cena.tipo === 'WidgetScene' || cena.tipo === 'LabScene' || cena.tipo === 'ArenaScene'
        // no quiz o pódio é o passo depois da resposta, como no Kahoot
        || (cena.tipo === 'QuizScene' && arena.estado.passo >= 1))) {
    return <PodioDaCena arena={arena} titulo={cena.titulo} />;
  }

  // atividade que já passou: aparece para rever, mas travada
  const interativa = ['QuizScene', 'WidgetScene', 'LabScene', 'ArenaScene', 'GroupScene'].includes(cena.tipo);
  if (interativa && encerrada(arena, cena, papel)) {
    return (
      <div className="so-leitura">
        <div className="faixa-leitura"><Icone nome="cadeado" tamanho={15} /> atividade encerrada: só para rever, não dá para mudar nada</div>
        {/* inert: nada aqui dentro recebe clique, foco ou digitação */}
        <div inert style={{ display: 'contents' }}>{desenhar(cena)}</div>
      </div>
    );
  }
  return desenhar(cena);

  function desenhar(cena: Cena) {
  switch (cena.tipo) {
    case 'ModuleCover': return <Capa cena={cena} />;
    case 'Apresentacao': return <Apresentacao cena={cena} passo={cena.id === arena.cena.id ? arena.estado.passo : 0} papel={papel} />;
    case 'Controles': return <Controles cena={cena} />;
    case 'MentalModel': return <Modelo cena={cena} passo={cenaForcada ? cena.passos - 1 : arena.estado.passo} />;
    case 'CommandAnatomy': return <Anatomia cena={cena} />;
    case 'TerminalDemo': return <Demo cena={cena} passo={cenaForcada ? cena.passos - 1 : arena.estado.passo} />;
    case 'WillGoWrong': return <Erros cena={cena} />;
    case 'QuizScene': return <Quiz cena={cena} arena={arena} papel={papel} />;
    case 'WidgetScene': return <Widget cena={cena} arena={arena} papel={papel} onIrParaSlide={onIrParaSlide} />;
    case 'LabScene': return <LabScene cena={cena} arena={arena} papel={papel} onIrParaSlide={onIrParaSlide} />;
    case 'GroupScene': return <GroupScene cena={cena} arena={arena} papel={papel} />;
    case 'ArenaScene': return <ArenaScene cena={cena} arena={arena} papel={papel} onIrParaSlide={onIrParaSlide} />;
    // o placar final é o mesmo slide de pódio duplo (pessoas e equipes)
    case 'Scoreboard': return <PodioDaCena arena={arena} titulo={cena.titulo} olho="resultado final" final />;
    case 'Recap': return <Recap cena={cena} passo={cenaForcada ? cena.passos - 1 : arena.estado.passo} />;
  }
  }
}

type C<T extends Cena['tipo']> = Extract<Cena, { tipo: T }>;

/** ilustração padrão de cada módulo, quando a cena não escolhe a sua */
const ILUSTRA_DO_MODULO: NomeIlustra[] = ['pinguim', 'bussola', 'pasta', 'cadeado', 'elo', 'engrenagem', 'ferramenta'];

const ilustraDa = (cena: { ilustra?: string; modulo: number }): NomeIlustra =>
  (cena.ilustra as NomeIlustra) ?? ILUSTRA_DO_MODULO[cena.modulo] ?? 'pinguim';

/**
 * O que a turma vê enquanto a cena ainda não foi liberada. Para quem
 * apresenta aparece o contrário: um aviso de que aquilo é só prévia.
 */
export function Aguardando({ papel, oque }: { papel: Papel; oque: string }) {
  if (papel === 'host') {
    return (
      <div className="chip" style={{ justifySelf: 'start' }}>
        <Icone nome="olho" tamanho={15} /> prévia: a turma ainda não vê {oque}. Avance para liberar.
      </div>
    );
  }
  return (
    <div className="cartao aguardando" style={{ display: 'flex', gap: 'var(--e2)', alignItems: 'center' }}>
      <Icone nome="relogio" tamanho={26} cor="var(--acento)" />
      <span className="corpo-p">
        Leia o enunciado com calma. {oque[0].toUpperCase() + oque.slice(1)} {/^(as|os) /.test(oque) ? 'aparecem' : 'aparece'} quando a gente liberar, e só aí o tempo começa.
      </span>
    </div>
  );
}

/** o ícone do GitHub, desenhado aqui: nada vem da internet no dia */
function MarcaGithub({ tamanho = 18 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 16 16" aria-hidden style={{ flex: 'none' }}>
      <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function Apresentacao({ cena, passo, papel }: { cena: C<'Apresentacao'>; passo: number; papel: Papel }) {
  // passo 0: todo mundo junto; passo N: a pessoa N sozinha
  const pessoa = passo > 0 ? cena.pessoas[passo - 1] : null;
  if (pessoa) {
    return (
      <div className="cena apresentacao-pessoa" data-modulo={cena.modulo} key={pessoa.github}
        style={{ justifyContent: 'center' }}>
        <Cabecalho ilustra={ilustraDa(cena)} olho={`apresentação · ${passo} de ${cena.pessoas.length}`} titulo={pessoa.nome} />
        <div className="cartao perfil-apresentacao" style={{
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gap: 'var(--e4)',
          alignItems: 'center',
          padding: 'var(--e4) var(--e5)',
          borderRadius: 'var(--r-g)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pessoa.foto} alt={`foto de ${pessoa.nome}`} width={280} height={280} className="foto-apresentacao"
            style={{
              width: 'clamp(200px, 22vw, 290px)',
              height: 'clamp(200px, 22vw, 290px)',
              aspectRatio: '1',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '4px solid var(--tinta)',
              flexShrink: 0,
            }}
          />
          <div className="texto-apresentacao" style={{ display: 'grid', gap: 'var(--e2)' }}>
            <strong className="cargo-apresentacao" style={{ fontSize: 'clamp(18px, 1.6vw, 24px)', color: 'var(--acento)' }}>{pessoa.cargo}</strong>
            {pessoa.historia.map((h) => <p key={h} className="corpo-p" style={{ margin: 0, fontSize: 'clamp(15px, 1.25vw, 19px)' }}><Texto>{h}</Texto></p>)}
            <span style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center', fontFamily: 'var(--mono)', fontSize: 'var(--t5)', color: 'var(--tinta-2)', marginTop: 'var(--e1)' }}>
              <MarcaGithub /> @{pessoa.github}
            </span>
          </div>
          <div className="linkedin-apresentacao" style={{
            display: 'grid',
            justifyItems: 'center',
            gap: 'var(--e1)',
            flexShrink: 0,
            background: 'var(--papel-2)',
            padding: 'var(--e3)',
            borderRadius: 'var(--r-m)',
            border: '1px solid var(--borda)',
          }}>
            <QrCode texto={pessoa.linkedin} tamanho={220} rotulo={`QR code do LinkedIn de ${pessoa.nome}`} />
            {/* no celular o QR não serve para nada: o link é clicável */}
            {papel === 'player'
              ? <a href={pessoa.linkedin} target="_blank" rel="noreferrer" className="btn" style={{ width: '100%', textAlign: 'center' }}>abrir o LinkedIn</a>
              : <small style={{ color: 'var(--tinta-2)', fontWeight: 600, fontSize: 13 }}>LinkedIn</small>}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="cena" data-modulo={cena.modulo} style={{ justifyContent: 'center' }}>
      <Cabecalho ilustra={ilustraDa(cena)} olho="apresentação" titulo={cena.titulo} />
      <div className="grade" style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        maxWidth: 1040,
        margin: '0 auto',
        width: '100%',
        gap: 'var(--e4)',
      }}>
        {cena.pessoas.map((p) => (
          <div key={p.github} className="cartao" style={{
            display: 'grid',
            justifyItems: 'center',
            gap: 'var(--e2)',
            padding: 'var(--e5) var(--e4)',
            textAlign: 'center',
            borderRadius: 'var(--r-g)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.foto} alt={`foto de ${p.nome}`} width={200} height={200}
              style={{ width: 'clamp(140px, 16vw, 200px)', height: 'clamp(140px, 16vw, 200px)', aspectRatio: '1', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--tinta)' }} />
            <strong className="titulo" style={{ fontSize: 'clamp(22px, 2.2vw, 30px)' }}>{p.nome}</strong>
            <span style={{ color: 'var(--tinta-2)', fontSize: 'clamp(14px, 1.2vw, 17px)' }}>{p.cargo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** os atalhos de teclado do participante, os mesmos de src/app/page.tsx */
const TECLAS: { tecla: string; faz: string }[] = [
  { tecla: '←', faz: 'rever os slides que já passaram' },
  { tecla: 'Esc', faz: 'voltar ao vivo, para o slide da turma' },
  { tecla: 'Esc Esc', faz: 'tirar o teclado do terminal e devolver ao slide' },
  { tecla: '?', faz: 'abrir a consulta de comandos' },
];

function Controles({ cena }: { cena: C<'Controles'> }) {
  return (
    <div className="cena" data-modulo={cena.modulo}>
      <Cabecalho ilustra={ilustraDa(cena)} olho="antes de começar" titulo={cena.titulo} />
      <div className="cartao" style={{ display: 'flex', gap: 'var(--e2)', alignItems: 'flex-start' }}>
        <Ilustra nome="ideia" tamanho={26} />
        <p className="corpo-p"><Texto>{cena.legenda}</Texto></p>
      </div>
      <div className="grade-controles">
        {CONTROLES.map((i) => (
          <div key={i.titulo} className="item-controle">
            <span className="icone"><Icone nome={i.icone} tamanho={20} cor="var(--acento)" /></span>
            <span><strong>{i.titulo}</strong>{i.texto}</span>
          </div>
        ))}
      </div>
      <div className="grade-teclas">
        {TECLAS.map((t) => (
          <span key={t.tecla} style={{ display: 'flex', gap: 'var(--e2)', alignItems: 'center' }}>
            <code className="kbd">{t.tecla}</code><span className="apoio">{t.faz}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

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

const ICONE_DO_DIAGRAMA = { arvore: 'arvore', distros: 'arvore', processo: 'processo', cadeados: 'cadeado', encanamento: 'juntar' } as const;

function Modelo({ cena, passo = 0 }: { cena: C<'MentalModel'>; passo?: number }) {
  const cartoes = cena.cartoesPasso;
  const atual = cartoes ? Math.min(passo, cartoes.length - 1) : 0;
  const noUltimoPasso = !cartoes || atual >= cartoes.length - 1;

  return (
    <div className="cena" data-modulo={cena.modulo} style={{ justifyContent: 'center' }}>
      <Cabecalho ilustra={ilustraDa(cena)} olho="como isso funciona" titulo={cena.titulo} />

      {cartoes ? (
        <div className="grade-cartoes-passo">
          {cartoes.map((item, i) => {
            const ativo = i <= atual;
            const eAtual = i === atual;
            return (
              <div
                key={item.titulo}
                className="cartao cartao-passo"
                data-ativo={ativo ? 'true' : 'false'}
                data-atual={eAtual ? 'true' : undefined}
              >
                <div className="cartao-passo-topo">
                  <div className="cartao-passo-icone">
                    <Ilustra nome={item.ilustra as NomeIlustra} tamanho={34} />
                  </div>
                  <span className="olho" style={{ color: eAtual ? 'var(--acento)' : 'var(--tinta-2)' }}>
                    {item.etiqueta}
                  </span>
                </div>
                <strong className="titulo cartao-passo-titulo">{item.titulo}</strong>
                {ativo ? (
                  <>
                    <p className="corpo-p cartao-passo-texto">
                      <Texto>{item.texto}</Texto>
                    </p>
                    {item.destaque && (
                      <span className={`chip${eAtual ? ' forte' : ''}`} style={{ justifySelf: 'start', marginTop: 'auto' }}>
                        {item.destaque}
                      </span>
                    )}
                  </>
                ) : (
                  <p className="corpo-p cartao-passo-aguardando">
                    Avance para revelar este passo…
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : cena.diagrama ? (
        <Diagrama nome={cena.diagrama} />
      ) : null}

      <div
        className="cartao"
        style={{
          maxWidth: cartoes ? 1160 : undefined,
          margin: cartoes ? '0 auto' : undefined,
          width: '100%',
          display: 'flex',
          gap: 'var(--e2)',
          alignItems: 'center',
          opacity: noUltimoPasso ? 1 : 0.55,
          borderColor: cartoes && noUltimoPasso ? 'var(--acento)' : undefined,
          transition: 'opacity 260ms var(--ease), border-color 260ms var(--ease)',
        }}
      >
        <Ilustra nome="ideia" tamanho={26} />
        <p className="corpo-p" style={{ margin: 0 }}><Texto>{cena.legenda}</Texto></p>
      </div>

      {cartoes && cartoes.length > 1 && (
        <div className="olho" style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center', justifyContent: 'center' }}>
          <span>passo {atual + 1} de {cartoes.length}</span>
          <span style={{ display: 'flex', gap: 'var(--e1)' }}>
            {cartoes.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 24,
                  height: 4,
                  borderRadius: 99,
                  background: i <= atual ? 'var(--acento)' : 'var(--borda)',
                  transition: 'background 240ms var(--ease)',
                }}
              />
            ))}
          </span>
        </div>
      )}
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
  const linhaAtual = cena.linhas[atual];

  const imagensPasso = linhaAtual?.imagens;
  const imagemPasso = linhaAtual?.imagem;
  const legendaPasso = linhaAtual?.legendaImagem;
  const noUltimoPasso = atual === cena.linhas.length - 1;
  const imagemCena = (!cena.imagemSoNoFinal || noUltimoPasso) ? cena.imagem : undefined;
  const legendaCena = (!cena.imagemSoNoFinal || noUltimoPasso) ? cena.legendaImagem : undefined;

  const imagensAtivas = imagensPasso;
  const imagemAtiva = imagemPasso ?? imagemCena;
  const legendaAtiva = imagemPasso ? legendaPasso : legendaCena;

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

      {imagensAtivas && imagensAtivas.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'var(--e1) 0' }}>
          <div style={{ display: 'flex', gap: 'var(--e3)', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            {imagensAtivas.map((img) => (
              <SlideFigura key={img} src={img} alt={cena.titulo} maxAltura={220} />
            ))}
          </div>
          {legendaAtiva && (
            <figcaption style={{ fontSize: 'var(--t6)', color: 'var(--tinta-2)', marginTop: 'var(--e05)', textAlign: 'center', maxWidth: 640 }}>
              <Texto>{legendaAtiva}</Texto>
            </figcaption>
          )}
        </div>
      ) : imagemAtiva ? (
        <SlideFigura src={imagemAtiva} legenda={legendaAtiva} alt={cena.titulo} maxAltura={220} />
      ) : null}

      <div className="olho" style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center' }}>
        <span>passo {atual + 1} de {cena.linhas.length}</span>
        <span style={{ display: 'flex', gap: 'var(--e1)' }}>
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
      <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 'var(--e2)' }}>
        {cena.erros.map((e) => (
          <div key={e.mensagem} className="cartao" style={{ padding: 'var(--e2)', display: 'grid', gap: 'var(--e1)' }}>
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
  const respostas = Object.values(revelacao?.distribuicao ?? {}).reduce((s, n) => s + n, 0);
  const acertos = revelacao?.correta ? revelacao.distribuicao?.[revelacao.correta] ?? 0 : 0;
  // a mesma ordem em todas as telas (a semente é a cena), mas não a do autor
  const alternativas = useMemo(() => embaralhar(cena.alternativas, cena.id), [cena.alternativas, cena.id]);
  const aberta = estado.fase === 'aberta' || estado.fase === 'encerrada';
  const daVez = !estado.cenaId || estado.cenaId === cena.id;
  const podeResponder = papel === 'player' && !escolha && aberta && daVez && !revelado;
  const tempoEsgotado = estado.fase === 'encerrada' && !revelado;

  const contagem = arena.respostas?.cenaId === cena.id ? arena.respostas : null;
  const faltam = contagem ? Math.max(0, contagem.esperados - contagem.total) : null;
  // Kahoot: primeiro só o enunciado; as opções aparecem quando o apresentador libera
  const mostrarOpcoes = liberada(arena, cena, papel);
  const passou = encerrada(arena, cena, papel);

  return (
    <div className="cena" data-modulo={cena.modulo}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--e2)', flexWrap: 'wrap' }}>
        <div className="olho"><Ilustra nome={ilustraDa(cena)} tamanho={18} /> {cena.titulo}</div>
        {estado.restante !== null && !revelado && (
          <span className="chip forte grande">
            <Icone nome="relogio" tamanho={18} /> {estado.restante}s
          </span>
        )}
        {contagem && !revelado && (
          // curto de propósito: o texto longo quebrava a linha e empurrava as opções
          <span className="chip grande" title={`${contagem.total} de ${contagem.esperados} responderam${faltam ? `, faltam ${faltam}` : ''}`}>
            <Icone nome="pessoas" tamanho={18} /> {contagem.total}/{contagem.esperados}
          </span>
        )}
      </div>
      <h2 className="titulo pergunta-quiz" key={`p-${cena.id}`} style={{ fontSize: 'var(--t2)' }}><Texto>{cena.pergunta}</Texto></h2>
      {/* a barra de tempo encolhendo, como no Kahoot */}
      {estado.restante !== null && !revelado && mostrarOpcoes && (
        <div className="barra-tempo" aria-hidden>
          <span style={{ width: `${(estado.restante / cena.segundos) * 100}%` }} data-pouco={estado.restante <= 5} />
        </div>
      )}

      {!mostrarOpcoes && <Aguardando papel={papel} oque="as opções" />}
      {papel === 'host' && estado.fase === 'idle' && <Aguardando papel={papel} oque="as opções" />}

      {mostrarOpcoes && <div className="alternativas kahoot">
        {alternativas.map((a, i) => {
          const votos = revelacao?.distribuicao?.[a.id] ?? 0;
          return (
            <button
              key={a.id}
              className="alt"
              data-cor={i % 4}
              style={{ ['--ordem' as string]: i }}
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
              {/* forma + letra: a cor ajuda, mas quem não distingue cores se guia pela forma */}
              <span className="letra" aria-label={`alternativa ${String.fromCharCode(65 + i)}`}>{['▲', '◆', '●', '■'][i % 4]}</span>
              <span style={{ flex: 1 }}>{a.texto}</span>
              {revelado && (
                <span className="votos-alt">
                  <strong className="numero-votos">{votos}</strong>
                  <span className="barra-votos" style={{ width: `${(votos / total) * 90}px` }} />
                </span>
              )}
              {papel === 'host' && a.id === arena.gabaritos[cena.id]?.correta && (
                <strong style={{ color: 'var(--ok)' }} title="resposta certa (só você vê)">✓</strong>
              )}
            </button>
          );
        })}
      </div>}

      {revelado && (
        <div className="acertos-quiz" data-acao="acertos">
          <strong>{acertos}</strong>
          <span>de {respostas} {respostas === 1 ? 'pessoa acertou' : 'pessoas acertaram'}</span>
        </div>
      )}

      {/* o momento Kahoot de quem respondeu: acertou ou não, em letras grandes */}
      {revelado && papel === 'player' && (
        <div className="veredito" data-certo={escolha === revelacao?.correta} key={`v-${cena.id}`}>
          {escolha === revelacao?.correta
            ? <><Icone nome="feito" tamanho={28} /> Acertou!{arena.ganho ? ` +${arena.ganho.xp} XP` : ''}</>
            : escolha
              ? (() => {
                  // a forma sozinha ("a certa era a ■") não dizia nada: vai a forma
                  // na cor do botão e o texto da alternativa certa
                  const i = alternativas.findIndex((a) => a.id === revelacao?.correta);
                  return (
                    <>
                      <Icone nome="erro" tamanho={26} />
                      <span>Não foi dessa vez. A certa era</span>
                      <span className="certa-veredito">
                        <span className="forma" data-cor={i % 4} aria-hidden>{['▲', '◆', '●', '■'][i % 4]}</span>
                        <span>{alternativas[i]?.texto}</span>
                      </span>
                    </>
                  );
                })()
              : <><Icone nome="relogio" tamanho={28} /> Você não respondeu a tempo</>}
        </div>
      )}
      {(revelado || passou) && (
        <div className="cartao" style={{ display: 'flex', gap: 'var(--e2)', alignItems: 'flex-start' }}>
          <Ilustra nome="ideia" tamanho={30} />
          <p className="corpo-p"><Texto>{cena.explicacao}</Texto></p>
        </div>
      )}
      {papel === 'player' && escolha && !revelado && <div className="chip forte">resposta enviada · segure a ansiedade</div>}
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
    if (papel === 'player') arena.emit('widget:concluido', { cenaId: cena.id });
  };

  // no projetor o widget não é jogável: o exercício está na tela de cada um
  const interativo = papel !== 'screen';
  const solto = liberada(arena, cena, papel);

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

      {papel === 'host' && arena.estado.fase === 'idle' && <Aguardando papel={papel} oque="o exercício" />}
      {!solto ? <Aguardando papel={papel} oque="o exercício" /> : interativo ? qual() : (
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

function Recap({ cena, passo }: { cena: C<'Recap'>; passo: number }) {
  return (
    <div className="cena" data-modulo={cena.modulo}>
      <Cabecalho ilustra="bandeira" olho="fecho do módulo" titulo={cena.titulo} />
      <h2 className="titulo" style={{ fontSize: 'var(--t2)' }}><Texto>{cena.perguntaDeRecuperacao}</Texto></h2>
      {passo > 0 ? (
        cena.resumo.length > 12 ? (
          // lista longa (o fecho final): três colunas, só "o que faz", senão a
          // tabela sai da tela; os exemplos já apareceram no fecho de cada módulo
          <div className="grade-resumo">
            {[0, 1, 2].map((k) => {
              const n = Math.ceil(cena.resumo.length / 3);
              return <ListaComandos key={k} resumo comandos={cena.resumo.slice(k * n, (k + 1) * n)} />;
            })}
          </div>
        ) : <ListaComandos comandos={cena.resumo} />
      ) : (
        <p className="corpo-p">Tente lembrar antes de ver a resposta. O resumo aparece no próximo passo. Lembrar sozinho é o que faz o conteúdo ficar.</p>
      )}
    </div>
  );
}
