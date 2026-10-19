'use client';

import { useEffect, useState } from 'react';
import type { Arena } from '@/deck/useArena';
import type { Cena, Papel } from '@/deck/types';
import { Diagrama } from './Diagramas';
import PermissionToggles from './widgets/PermissionToggles';
import PathQuiz from './widgets/PathQuiz';
import PipeBuilder from './widgets/PipeBuilder';
import FsDragDrop from './widgets/FsDragDrop';
import CommandBuilder from './widgets/CommandBuilder';
import { Escolhas, ESCAPE, PERIGO, PREVER, ERROS } from './widgets/Escolhas';
import { LabScene } from './scenes/LabScene';
import { GroupScene } from './scenes/GroupScene';

/**
 * Uma cena, três projeções. O conteúdo é o mesmo objeto; quem muda é o papel:
 *  - screen  → projetor (gigante, sem interação)
 *  - player  → notebook do participante (é onde ele age)
 *  - host    → sua tela (resposta certa, progresso, controles)
 * Nunca duplique conteúdo entre papéis: é assim que deck e lab saem de sincronia.
 */
export function SceneRouter({ arena, papel }: { arena: Arena; papel: Papel }) {
  const { cena } = arena;
  switch (cena.tipo) {
    case 'ModuleCover': return <Capa cena={cena} />;
    case 'MentalModel': return <Modelo cena={cena} />;
    case 'CommandAnatomy': return <Anatomia cena={cena} />;
    case 'TerminalDemo': return <Demo cena={cena} passo={arena.estado.passo} />;
    case 'WillGoWrong': return <Erros cena={cena} />;
    case 'QuizScene': return <Quiz cena={cena} arena={arena} papel={papel} />;
    case 'WidgetScene': return <Widget cena={cena} arena={arena} papel={papel} />;
    case 'LabScene': return <LabScene cena={cena} arena={arena} papel={papel} />;
    case 'GroupScene': return <GroupScene cena={cena} arena={arena} papel={papel} />;
    case 'Scoreboard': return <Placar cena={cena} arena={arena} />;
    case 'Recap': return <Recap cena={cena} passo={arena.estado.passo} />;
  }
}

type C<T extends Cena['tipo']> = Extract<Cena, { tipo: T }>;

function Capa({ cena }: { cena: C<'ModuleCover'> }) {
  return (
    <div className="cena">
      <div className="olho">módulo {cena.modulo}</div>
      <h1 className="titulo">{cena.titulo}</h1>
      <p className="corpo">{cena.pergunta}</p>
      <div className="chip forte" style={{ justifySelf: 'start' }}>{cena.xpDoModulo} XP em jogo</div>
    </div>
  );
}

function Modelo({ cena }: { cena: C<'MentalModel'> }) {
  return (
    <div className="cena">
      <h2 className="titulo" style={{ fontSize: 'clamp(26px, 3vw, 48px)' }}>{cena.titulo}</h2>
      <Diagrama nome={cena.diagrama} />
      <p className="corpo">{cena.legenda}</p>
    </div>
  );
}

function Anatomia({ cena }: { cena: C<'CommandAnatomy'> }) {
  return (
    <div className="cena">
      <h2 className="titulo" style={{ fontSize: 'clamp(26px, 3vw, 48px)' }}>{cena.titulo}</h2>
      <div className="term" style={{ fontSize: 'clamp(22px, 3vw, 46px)' }}>{cena.comando}</div>
      <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        {cena.partes.map((p) => (
          <div key={p.trecho} className="cartao">
            <code className="kbd" style={{ fontSize: '1.1em' }}>{p.trecho}</code>
            <p style={{ marginTop: 8, color: 'var(--tinta-2)' }}>{p.rotulo}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Demo({ cena, passo }: { cena: C<'TerminalDemo'>; passo: number }) {
  const visiveis = cena.linhas.slice(0, Math.max(1, passo + 1));
  return (
    <div className="cena">
      <div className="olho">{cena.titulo}</div>
      <div className="term">
        {visiveis.map((l, i) => (
          <div key={i}>
            <span className="cmd">{l.comando}</span>
            {l.saida && (
              <div className="saida">
                {l.destaque
                  ? l.saida.split(l.destaque).flatMap((parte, j, arr) =>
                      j < arr.length - 1 ? [parte, <b key={j}>{l.destaque}</b>] : [parte],
                    )
                  : l.saida}
              </div>
            )}
            {l.traducao && <span className="traducao">{l.traducao}</span>}
          </div>
        ))}
      </div>
      <div className="olho">{visiveis.length} de {cena.linhas.length}</div>
    </div>
  );
}

function Erros({ cena }: { cena: C<'WillGoWrong'> }) {
  return (
    <div className="cena">
      <h2 className="titulo" style={{ fontSize: 'clamp(26px, 3vw, 48px)' }}>{cena.titulo}</h2>
      <div className="grade">
        {cena.erros.map((e) => (
          <div key={e.mensagem} className="cartao" style={{ display: 'grid', gap: 6 }}>
            <code style={{ fontFamily: 'var(--mono)', color: 'var(--erro)' }}>{e.mensagem}</code>
            <strong>{e.significa}</strong>
            <span style={{ color: 'var(--tinta-2)' }}>→ {e.causa}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Quiz({ cena, arena, papel }: { cena: C<'QuizScene'>; arena: Arena; papel: Papel }) {
  const [escolha, setEscolha] = useState<string | null>(null);
  const { estado, revelacao, emit } = arena;
  useEffect(() => setEscolha(null), [cena.id]);

  const revelado = revelacao?.cenaId === cena.id;
  const total = Object.values(revelacao?.distribuicao ?? {}).reduce((s, n) => s + n, 0) || 1;

  return (
    <div className="cena">
      <div className="olho">{cena.titulo}{estado.restante !== null && ` · ${estado.restante}s`}</div>
      <h2 className="titulo" style={{ fontSize: 'clamp(26px, 3.4vw, 56px)' }}>{cena.pergunta}</h2>

      <div className="alternativas">
        {cena.alternativas.map((a, i) => {
          const votos = revelacao?.distribuicao?.[a.id] ?? 0;
          return (
            <button
              key={a.id}
              className="alt"
              data-escolhida={escolha === a.id}
              data-estado={revelado ? (a.id === cena.correta ? 'certa' : 'errada') : undefined}
              disabled={papel !== 'player' || !!escolha || estado.fase !== 'aberta'}
              onClick={() => {
                setEscolha(a.id);
                emit('responder', { cenaId: cena.id, alternativa: a.id, xpBase: 40, segundos: cena.segundos });
              }}
            >
              <span className="letra">{String.fromCharCode(65 + i)}</span>
              <span style={{ flex: 1 }}>{a.texto}</span>
              {revelado && (
                <span style={{ display: 'grid', gap: 4, minWidth: 90 }}>
                  <span className="barra-votos" style={{ width: `${(votos / total) * 90}px` }} />
                  <small style={{ color: 'var(--tinta-2)' }}>{votos}</small>
                </span>
              )}
              {papel === 'host' && a.id === cena.correta && <strong style={{ color: 'var(--ok)' }}>✓</strong>}
            </button>
          );
        })}
      </div>

      {revelado && <p className="corpo" style={{ maxWidth: '40em' }}>{cena.explicacao}</p>}
      {papel === 'player' && escolha && !revelado && <div className="chip forte">resposta enviada · segure a ansiedade</div>}
    </div>
  );
}

function Widget({ cena, arena, papel }: { cena: C<'WidgetScene'>; arena: Arena; papel: Papel }) {
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
    <div className="cena">
      <div className="olho">{cena.titulo}{arena.estado.restante !== null && ` · ${arena.estado.restante}s`}</div>
      <p className="corpo" style={{ maxWidth: '44em' }}>{cena.enunciado}</p>

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
    ? grupos.map((g) => ({ chave: g.nome, nome: `grupo ${g.nome}`, xp: g.media, extra: `${g.membros.length} pessoas` }))
    : individual.slice(0, 10).map((p) => ({ chave: p.id, nome: `${p.emoji} ${p.nick}`, xp: p.xp, extra: `nível ${p.nivel}` }));

  return (
    <div className="cena">
      <h2 className="titulo" style={{ fontSize: 'clamp(26px, 3vw, 48px)' }}>{cena.titulo}</h2>
      <div className="grade">
        {linhas.length === 0 && <p className="corpo">ninguém pontuou ainda.</p>}
        {linhas.map((l, i) => (
          <div key={l.chave} className="cartao" style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 'clamp(16px, 1.8vw, 26px)' }}>
            <strong style={{ width: 44, color: 'var(--tinta-2)' }}>{i + 1}º</strong>
            <span style={{ flex: 1 }}>{l.nome}</span>
            <span style={{ color: 'var(--tinta-2)', fontSize: '0.8em' }}>{l.extra}</span>
            <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{l.xp} XP</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function Recap({ cena, passo }: { cena: C<'Recap'>; passo: number }) {
  return (
    <div className="cena">
      <div className="olho">{cena.titulo}</div>
      <h2 className="titulo" style={{ fontSize: 'clamp(26px, 3.2vw, 52px)' }}>{cena.perguntaDeRecuperacao}</h2>
      {passo > 0 ? (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {cena.resumo.map((c) => <code key={c} className="kbd" style={{ fontSize: 'clamp(16px, 1.8vw, 28px)' }}>{c}</code>)}
        </div>
      ) : (
        <p className="corpo">pense antes. (o resumo aparece no próximo passo — tentar lembrar é o que fixa)</p>
      )}
    </div>
  );
}
