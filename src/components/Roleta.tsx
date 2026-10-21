'use client';

import { useEffect, useRef, useState } from 'react';
import type { Arena, EstadoRoleta, PessoaDaRoleta } from '@/deck/useArena';
import type { Papel } from '@/deck/types';
import { Avatar } from './Avatar';
import { Confete } from './Celebracao';

type Atual = NonNullable<EstadoRoleta['atual']>;

/** cores de bala: vivas, e cada uma com texto branco legível por cima */
const CORES = ['#ff5a5f', '#2f80ed', '#f2a900', '#8e44ad', '#27ae60', '#ff7a00', '#e84393'];
const EMOJI: Record<string, string> = {
  'bonus-direto': '🎁', 'par-impar': '🎲', ppt: '✊', 'perde-xp': '💸', 'fala-comando': '🗣️', 'equipe-desafio': '👥',
};
const LANCE: Record<string, { emoji: string; nome: string }> = {
  pedra: { emoji: '✊', nome: 'pedra' }, papel: { emoji: '✋', nome: 'papel' }, tesoura: { emoji: '✌️', nome: 'tesoura' },
};
const FAIXA: Record<string, string> = {
  baixo: 'fatias que pagam mais (quem tem menos XP)',
  medio: 'fatias equilibradas',
  alto: 'fatias que pagam menos (quem tem mais XP)',
};
const GIRO_MS = 3800;
/** fatias que viram duelo: quem gira escolhe o adversário, e a sala assiste */
const DUELOS = ['ppt', 'par-impar'];

/** o lance revelado: o emoji no pedra-papel-tesoura, os dedos (e o lado) no par ou ímpar */
function mostrarLance(fatia: string | null, lance: string | undefined) {
  if (!lance) return '';
  if (fatia === 'ppt') return LANCE[lance]?.emoji ?? lance;
  const [a, b] = lance.split(':');
  return b !== undefined ? `${b}✋ ${a === 'par' ? 'par' : 'ímpar'}` : `${a}✋`;
}

/** quebra o nome da fatia no espaço mais perto do meio */
function duasLinhas(texto: string): string[] {
  if (texto.length <= 10) return [texto];
  const espacos = [...texto.matchAll(/ /g)].map((m) => m.index ?? 0);
  if (!espacos.length) return [texto];
  const corte = espacos.reduce((a, b) => (Math.abs(b - texto.length / 2) < Math.abs(a - texto.length / 2) ? b : a));
  return [texto.slice(0, corte), texto.slice(corte + 1)];
}

/**
 * A roleta.
 *
 * Projetor, painel, quem gira e quem foi desafiado veem a roleta inteira. O
 * resto da turma vê só a faixa "roleta: fulano está na vez" no alto, que vira
 * o placar ao vivo quando a fatia é um duelo de pedra, papel e tesoura: a sala
 * toda acompanha a disputa sem largar o que está fazendo.
 */
export function Roleta({ arena, papel }: { arena: Arena; papel: Papel }) {
  const atual = arena.roleta?.atual ?? null;
  const eu = arena.eu?.id;
  const envolvido = !!atual && (atual.id === eu || atual.alvo === eu);
  const parou = useParou(atual);
  // quem não está na vez pode minimizar para voltar ao que fazia; a próxima
  // pessoa da roleta abre a tela cheia de novo
  const [minimizada, setMinimizada] = useState<string | null>(null);

  if (!atual) return null;
  if (papel === 'player' && !envolvido && minimizada === atual.id) {
    return <FaixaDaRoleta atual={atual} parou={parou} onAbrir={() => setMinimizada(null)} />;
  }

  const vitoria = atual.fase === 'fim' && parou && (atual.resultado?.vencedor ? atual.resultado.vencedor === eu || papel !== 'player' : /\+\d/.test(atual.resultado?.texto ?? ''));
  return (
    <div className="roleta-fundo" data-papel={papel}>
      {vitoria && <Confete quantidade={40} />}
      <div className="roleta-cartao" role="dialog" aria-label="roleta" key={atual.id}>
        <div className="roleta-topo">
          <span className="roleta-selo">🎡 roleta</span>
          <div className="roleta-quem">
            {atual.pessoa && <Avatar pessoa={atual.pessoa} tamanho={52} />}
            <div>
              <strong className="roleta-nome">{atual.id === eu ? 'sua vez!' : atual.pessoa?.nick}</strong>
              <small className="apoio">{FAIXA[atual.faixa]}</small>
            </div>
          </div>
        </div>

        {/* depois do giro a roda encolhe para o lado e o jogo da fatia ganha o espaço */}
        <div className="roleta-corpo" data-girou={atual.fase !== 'girar' || undefined}>
          <Roda atual={atual} parou={parou} />
          <div className="roleta-etapa"><Etapa arena={arena} papel={papel} parou={parou} /></div>
        </div>

        {(arena.roleta?.fila.length ?? 0) > 0 && <small className="apoio">depois: {arena.roleta!.fila.map((p) => p.nick).join(', ')}</small>}
        {papel === 'host' && <button className="btn" onClick={() => arena.emit('host:roleta:cancelar')}>encerrar a roleta</button>}
        {papel === 'player' && !envolvido && (
          <button className="btn" data-acao="minimizar-roleta" onClick={() => setMinimizada(atual.id)}>minimizar e voltar ao que eu fazia</button>
        )}
      </div>
    </div>
  );
}

/** a roleta terminou de girar? (o resultado só aparece depois) */
function useParou(atual: Atual | null) {
  const [parou, setParou] = useState(true);
  const faseAntes = useRef<string | null>(null);
  useEffect(() => {
    if (!atual) return;
    const girou = faseAntes.current === 'girar' && atual.fase !== 'girar';
    faseAntes.current = atual.fase;
    if (!girou) return;
    setParou(false);
    const t = setTimeout(() => setParou(true), GIRO_MS);
    return () => clearTimeout(t);
  }, [atual?.fase, atual?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return parou;
}

function Roda({ atual, parou }: { atual: Atual; parou: boolean }) {
  const n = atual.fatias.length;
  const angulo = 360 / n;
  const indice = atual.fatia ? atual.fatias.findIndex((f) => f.id === atual.fatia) : -1;
  // seis voltas e para com a fatia sorteada embaixo do ponteiro, no alto
  const giro = indice >= 0 ? 360 * 6 - (indice * angulo + angulo / 2) : 0;
  const ponto = (graus: number, raio: number) => {
    const a = (graus - 90) * (Math.PI / 180);
    return [raio * Math.cos(a), raio * Math.sin(a)];
  };
  return (
    <div className="roleta-roda" data-fase={atual.fase} data-girando={!parou || undefined}>
      <svg className="roleta-ponteiro" viewBox="0 0 40 48" aria-hidden>
        <path d="M20 46 L4 10 Q20 -4 36 10 Z" fill="#ffcc00" stroke="#1f2937" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="20" cy="14" r="5" fill="#fff" stroke="#1f2937" strokeWidth="3" />
      </svg>
      <svg viewBox="-120 -120 240 240" className="roleta-svg" aria-hidden>
        {/* aro com luzes que piscam alternadas, como de parque */}
        <circle r="116" fill="#1f2937" />
        {Array.from({ length: 24 }, (_, i) => {
          const [x, y] = ponto(i * 15, 108);
          return <circle key={i} cx={x} cy={y} r="4.2" className="luz" data-par={i % 2 === 0 || undefined} />;
        })}
        <g className="roleta-giro" style={{ transform: `rotate(${giro}deg)` }}>
          {atual.fatias.map((f, i) => {
            const [x0, y0] = ponto(i * angulo, 100);
            const [x1, y1] = ponto((i + 1) * angulo, 100);
            const meio = (i + 0.5) * angulo;
            const [tx, ty] = ponto(meio, 62);
            return (
              <g key={f.id} className="fatia" data-sorteada={parou && i === indice ? true : undefined}>
                <path d={`M0 0 L${x0} ${y0} A100 100 0 ${angulo > 180 ? 1 : 0} 1 ${x1} ${y1} Z`}
                  fill={CORES[i % CORES.length]} stroke="#1f2937" strokeWidth="3.5" strokeLinejoin="round" />
                {/* só o nome na roda, sem emoji, em duas linhas para caber na fatia */}
                <text x={tx} y={ty} fontSize="9" fontWeight="900" fill="#fff" stroke="#1f2937" strokeWidth="2.4" paintOrder="stroke"
                  textAnchor="middle" transform={`rotate(${meio > 90 && meio < 270 ? meio + 180 : meio} ${tx} ${ty})`}>
                  {duasLinhas(f.rotulo).map((linha, k, todas) => (
                    <tspan key={k} x={tx} dy={k === 0 ? `${-(todas.length - 1) * 0.55 + 0.35}em` : '1.1em'}>{linha}</tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </g>
        {/* o eixo: dois círculos e um brilho, desenhados */}
        <circle r="20" fill="#ffcc00" stroke="#1f2937" strokeWidth="4" />
        <circle r="8" fill="#fff" stroke="#1f2937" strokeWidth="3" />
        <circle cx="-7" cy="-8" r="3" fill="#fff" opacity=".8" />
      </svg>
    </div>
  );
}

function Etapa({ arena, papel, parou }: { arena: Arena; papel: Papel; parou: boolean }) {
  const atual = arena.roleta!.atual!;
  const eu = arena.eu?.id;
  const souEu = atual.id === eu;
  const [erro, setErro] = useState<string | null>(null);
  const enviar = (ev: string, dado?: unknown) => arena.emit(ev, dado, (r: { erro?: string }) => setErro(r?.erro ?? null));
  const fatia = atual.fatias.find((f) => f.id === atual.fatia);
  const aviso = erro && <small role="alert" style={{ color: 'var(--erro)' }}>{erro}</small>;

  if (atual.fase === 'girar') {
    return souEu
      ? <button className="btn-girar" data-acao="girar" onClick={() => enviar('roleta:girar')}>GIRAR!</button>
      : <p className="roleta-texto">esperando {atual.pessoa?.nick} girar…</p>;
  }
  if (!parou) return <p className="roleta-texto">girando…</p>;
  const titulo = <div className="roleta-fatia"><span>{EMOJI[atual.fatia ?? ''] ?? '⭐'}</span> {fatia?.rotulo}</div>;

  // os duelos (pedra-papel-tesoura, par ou ímpar): quem girou × quem foi desafiado
  if (DUELOS.includes(atual.fatia ?? '') && atual.fase !== 'indicar') {
    return <>{titulo}<Duelo arena={arena} atual={atual} enviar={enviar} />{aviso}</>;
  }
  if (atual.fase === 'fim') {
    return <>{titulo}<p className="roleta-resultado">{atual.resultado?.texto}</p></>;
  }
  if (atual.fase === 'indicar') {
    const outros = arena.placar.individual.filter((p) => p.id !== atual.id && p.presenca === 'ativo');
    return (
      <>
        {titulo}
        {souEu ? (
          <>
            <p className="roleta-texto">{DUELOS.includes(atual.fatia ?? '') ? 'Quem você desafia?' : 'Quem perde XP?'}</p>
            <div className="escolha-adversario">
              {outros.map((p, i) => (
                <button key={p.id} className="cartao-pessoa" style={{ ['--i' as string]: i }} onClick={() => enviar('roleta:indicar', p.id)}>
                  <Avatar pessoa={p} tamanho={40} /><span>{p.nick}</span>
                </button>
              ))}
            </div>
          </>
        ) : <p className="roleta-texto">{atual.pessoa?.nick} está escolhendo {DUELOS.includes(atual.fatia ?? '') ? 'o adversário' : 'quem perde um token'}…</p>}
        {aviso}
      </>
    );
  }
  // julgar: dinâmica falada, quem confirma é o apresentador
  return (
    <>
      {titulo}
      <p className="roleta-dinamica">{atual.dinamica}</p>
      {papel === 'host' ? (
        <div className="roleta-opcoes">
          <button className="btn primario" onClick={() => enviar('host:roleta:julgar', true)}>cumpriu</button>
          <button className="btn" onClick={() => enviar('host:roleta:julgar', false)}>não cumpriu</button>
        </div>
      ) : <p className="apoio">o apresentador confirma</p>}
      {aviso}
    </>
  );
}

/** os dois lados frente a frente; quem joga escolhe nos cartões */
function Duelo({ arena, atual, enviar }: { arena: Arena; atual: Atual; enviar: (ev: string, d?: unknown) => void }) {
  const eu = arena.eu?.id;
  const jogo = eu === atual.id || eu === atual.alvo;
  const jaEscolhi = !!(eu && atual.escolhas?.[eu]);
  const fim = atual.fase === 'fim';
  const [lado, setLado] = useState<'par' | 'impar' | null>(null);
  return (
    <>
      <div className="duelo" data-fim={fim || undefined}>
        <LadoDoDuelo pessoa={atual.pessoa} lance={mostrarLance(atual.fatia, atual.escolhas?.[atual.id])} escolheu={!!atual.escolhas?.[atual.id]} fim={fim} venceu={atual.resultado?.vencedor === atual.id} />
        <span className="vs" aria-hidden>VS</span>
        <LadoDoDuelo pessoa={atual.alvoPessoa} lance={mostrarLance(atual.fatia, atual.alvo ? atual.escolhas?.[atual.alvo] : undefined)} escolheu={!!(atual.alvo && atual.escolhas?.[atual.alvo])} fim={fim} venceu={atual.resultado?.vencedor === atual.alvo} />
      </div>
      {fim && (
        <p className="roleta-resultado">
          {atual.resultado?.empate ? '🤝 empate · ' : `🏆 ${atual.resultado?.vencedor === atual.id ? atual.pessoa?.nick : atual.alvoPessoa?.nick} venceu · `}
          {atual.resultado?.texto}
        </p>
      )}
      {!fim && jogo && !jaEscolhi && atual.fatia === 'ppt' && (
        <div className="cartoes-lance">
          {Object.entries(LANCE).map(([id, l], i) => (
            <button key={id} className="cartao-lance" data-lance={id} style={{ ['--i' as string]: i }} onClick={() => enviar('roleta:escolher', id)}>
              <span className="emoji-lance">{l.emoji}</span><strong>{l.nome}</strong>
            </button>
          ))}
        </div>
      )}
      {!fim && jogo && !jaEscolhi && atual.fatia === 'par-impar' && (
        <>
          {/* quem girou escolhe o lado primeiro; o adversário fica com o outro */}
          {eu === atual.id && !lado ? (
            <>
              <p className="roleta-texto">Você fica com par ou com ímpar?</p>
              <div className="cartoes-lance">
                {(['par', 'impar'] as const).map((l, i) => (
                  <button key={l} className="cartao-lance" style={{ ['--i' as string]: i }} onClick={() => setLado(l)}>
                    <span className="emoji-lance">{l === 'par' ? '2' : '1'}</span><strong>{l === 'par' ? 'par' : 'ímpar'}</strong>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="roleta-texto">{eu === atual.id ? `Você é ${lado === 'par' ? 'par' : 'ímpar'}. Quantos dedos?` : 'Você fica com o outro lado. Quantos dedos?'}</p>
              <div className="cartoes-lance cartoes-dedos">
                {[0, 1, 2, 3, 4, 5].map((n, i) => (
                  <button key={n} className="cartao-lance" style={{ ['--i' as string]: i }}
                    onClick={() => enviar('roleta:escolher', eu === atual.id ? `${lado}:${n}` : String(n))}>
                    <span className="emoji-lance">{n}</span><strong>{n === 1 ? 'dedo' : 'dedos'}</strong>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
      {!fim && jogo && jaEscolhi && <p className="roleta-texto">lance enviado! esperando o outro lado…</p>}
      {!fim && !jogo && <p className="roleta-texto">{atual.pessoa?.nick} × {atual.alvoPessoa?.nick}: cada um escolhe na própria tela</p>}
    </>
  );
}

function LadoDoDuelo({ pessoa, lance, escolheu, fim, venceu }: { pessoa: PessoaDaRoleta | null; lance: string; escolheu: boolean; fim: boolean; venceu: boolean }) {
  return (
    <div className="lado-duelo" data-venceu={(fim && venceu) || undefined}>
      {fim && venceu && <span className="coroa-duelo" aria-hidden>👑</span>}
      {pessoa && <Avatar pessoa={pessoa} tamanho={56} />}
      <strong>{pessoa?.nick ?? '…'}</strong>
      {/* o lance só aparece no fim; antes, só "escolheu" ou "pensando" */}
      <span className="carta-virada" data-virada={(fim && !!lance) || undefined} key={fim ? 'fim' : 'jogo'}>
        {fim && lance ? lance : escolheu ? '✅' : '🤔'}
      </span>
    </div>
  );
}

/** a roleta minimizada: uma faixa no alto, e o placar do duelo ao vivo */
function FaixaDaRoleta({ atual, parou, onAbrir }: { atual: Atual; parou: boolean; onAbrir: () => void }) {
  const duelo = DUELOS.includes(atual.fatia ?? '') && atual.alvoPessoa && parou && atual.fase !== 'indicar';
  if (!duelo) {
    return (
      <button className="faixa-roleta" role="status" onClick={onAbrir} title="abrir a roleta">
        <span aria-hidden>🎡</span> roleta: <strong>{atual.pessoa?.nick}</strong> está na vez
      </button>
    );
  }
  const fim = atual.fase === 'fim';
  const lado = (id: string | undefined, p: PessoaDaRoleta | null) => {
    const l = id ? atual.escolhas?.[id] : undefined;
    return (
      <span className="lado-faixa" data-venceu={(fim && atual.resultado?.vencedor === id) || undefined}>
        {fim && atual.resultado?.vencedor === id && '👑 '}{p?.nick} {fim && l ? mostrarLance(atual.fatia, l) : l ? '✅' : '🤔'}
      </span>
    );
  };
  return (
    <button className="faixa-roleta faixa-duelo" role="status" onClick={onAbrir} title="abrir a roleta">
      <span aria-hidden>{atual.fatia === 'ppt' ? '✊✋✌️' : '🖐️'}</span>
      {lado(atual.id, atual.pessoa)}<strong className="vs-faixa">×</strong>{lado(atual.alvo, atual.alvoPessoa)}
      {fim && <span className="apoio">{atual.resultado?.empate ? 'empate!' : 'venceu!'}</span>}
    </button>
  );
}
