'use client';

import { useEffect, useState } from 'react';
import { useArena } from '@/deck/useArena';
import { SceneRouter } from '@/components/SceneRouter';
import { Encaixe } from '@/components/Encaixe';
import { TerminalHost } from '@/components/TerminalHost';
import { Consulta } from '@/components/Consulta';
import { Icone } from '@/components/Icone';
import { Tour } from '@/components/Tour';
import { nivelDe } from '@/deck/types';
import { DECK } from '@/deck/content';

import { AVATARES, AVATAR_PADRAO, usuarioDoNick } from '@/deck/avatares';

/**
 * A tela do participante. É o deck, e é a única URL dele nas 2 horas: o quiz,
 * os exercícios e o terminal acontecem DENTRO do slide.
 *
 * Navegação: por padrão ele segue o apresentador ("ao vivo"). Se quiser olhar
 * um slide anterior, ele navega livremente e um botão grande oferece voltar ao
 * vivo. Sem essa saída, quem perdeu algo fica preso olhando uma tela onde não
 * tem nada para fazer, e foi exatamente isso que aconteceu nos testes de sala.
 */
export default function Player() {
  const arena = useArena('player');
  const { eu, estado, conectado, aviso, entrar } = arena;
  const [nick, setNick] = useState('');
  const [emoji, setEmoji] = useState<string>(AVATAR_PADRAO);
  const [gaveta, setGaveta] = useState(false);
  const [consulta, setConsulta] = useState(false);
  const [tour, setTour] = useState(false);
  /** índice da cena que estou olhando por conta própria (null = ao vivo) */
  const [livre, setLivre] = useState<number | null>(null);

  // volta ao vivo quando o apresentador pede, ou quando a sala muda de cena
  useEffect(() => {
    const s = arena.socket;
    const aoVivo = () => setLivre(null);
    s?.on('aovivo', aoVivo);
    return () => { s?.off('aovivo', aoVivo); };
  }, [arena.socket]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const digitando = alvo?.tagName === 'INPUT' || !!alvo?.closest('.xterm');
      if (e.ctrlKey && e.key === '`') { e.preventDefault(); setGaveta((g) => !g); }
      if (digitando) return;
      if (e.key === '?') setConsulta((c) => !c);
      if (e.key === 'Escape') { setConsulta(false); setLivre(null); }
      // navegação livre: só com as setas, e sempre com volta ao vivo à mão
      if (e.key === 'ArrowLeft') setLivre((l) => Math.max(0, (l ?? estado.cenaIndex) - 1));
      if (e.key === 'ArrowRight') setLivre((l) => Math.min(DECK.length - 1, (l ?? estado.cenaIndex) + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [estado.cenaIndex]);

  if (!eu) {
    const usados = new Set(arena.placar.individual.map((p) => p.emoji));
    return (
      <div className="centro">
        <div className="cartao" style={{ width: 'min(470px, 100%)', display: 'grid', gap: 16 }}>
          <div className="olho" style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center' }}>
            <Icone nome="shell" tamanho={16} /> Linux Day
          </div>
          <h1 className="titulo" style={{ fontSize: 34 }}>Escolha seu nome</h1>
          <input className="btn" style={{ textAlign: 'left', borderColor: arena.nomeRecusado ? 'var(--erro)' : 'var(--borda)' }}
            placeholder="seu nome" value={nick} maxLength={20}
            onChange={(e) => setNick(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && nick.trim()) entrar(nick.trim(), emoji); }} />

          {arena.nomeRecusado && (
            <div className="cartao" style={{ borderColor: 'var(--erro)', display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 14 }}>
                Já tem alguém chamado <strong>{arena.nomeRecusado.nome}</strong> na sala. Escolha outro para
                ninguém confundir o seu XP com o dele.
              </span>
              {arena.nomeRecusado.sugestoes.length > 0 && (
                <div style={{ display: 'flex', gap: 'var(--e1)', flexWrap: 'wrap' }}>
                  {arena.nomeRecusado.sugestoes.map((su) => (
                    <button key={su} className="btn" style={{ padding: 'var(--e1) var(--e2)' }}
                      onClick={() => { setNick(su); entrar(su, emoji); }}>
                      {su}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div>
            <div className="olho" style={{ marginBottom: 'var(--e1)' }}>
              escolha seu bicho ({AVATARES.length} opções{usados.size ? `, ${usados.size} já escolhidos` : ''})
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(46px, 1fr))',
              gap: 'var(--e05)', maxHeight: 210, overflowY: 'auto', padding: 'var(--e05)',
              border: '1px solid var(--borda)', borderRadius: 12, background: 'var(--papel-2)',
            }}>
              {AVATARES.map((e) => {
                // avatar já escolhido por alguém: ainda dá para usar, mas fica
                // esmaecido para a sala naturalmente se espalhar pelos 64
                const emUso = usados.has(e);
                return (
                  <button key={e} onClick={() => setEmoji(e)} aria-label={`avatar ${e}`}
                    title={emUso ? 'já escolhido por alguém' : undefined}
                    style={{
                      fontSize: 24, lineHeight: 1, padding: 'var(--e1) 0', cursor: 'pointer',
                      borderRadius: 9, background: emoji === e ? '#eff4ff' : 'var(--papel)',
                      border: `1.5px solid ${emoji === e ? 'var(--acento)' : 'transparent'}`,
                      opacity: emUso && emoji !== e ? 0.32 : 1,
                    }}>
                    {e}
                  </button>
                );
              })}
            </div>
          </div>
          {nick.trim() && (
            <div className="cartao" style={{ background: 'var(--papel-2)', display: 'flex', gap: 'var(--e1)', alignItems: 'center' }}>
              <Icone nome="terminal" tamanho={16} />
              <span style={{ fontSize: 13, color: 'var(--tinta-2)' }}>no terminal você vai aparecer como</span>
              <code className="kbd">{usuarioDoNick(nick)}@linuxday:~$</code>
            </div>
          )}
          <button className="btn primario" disabled={!nick.trim()} onClick={() => entrar(nick.trim(), emoji)}>
            entrar
          </button>
          <small style={{ color: 'var(--tinta-2)' }}>
            Guardamos só o nick e o emoji. Tudo é apagado depois do evento.
          </small>
        </div>
      </div>
    );
  }

  const nivel = nivelDe(eu.xp);
  const posicao = arena.placar.individual.findIndex((p) => p.id === eu.id) + 1;
  const cenaVista = livre === null ? arena.cena : DECK[livre];
  const emLab = cenaVista.tipo === 'LabScene' && livre === null;

  return (
    <div className="palco" data-papel="player">
      <Encaixe chave={`${cenaVista.id}:${estado.passo}:${estado.fase}`}>
        <SceneRouter arena={arena} papel="player" cenaForcada={livre === null ? undefined : cenaVista} />
      </Encaixe>

      {/* o terminal é montado UMA vez e segue vivo o workshop inteiro */}
      <TerminalHost socket={arena.socket} ativo={emLab} gaveta={gaveta && !emLab} />

      {/* fora do ao vivo: faixa grande, impossível de não ver */}
      {livre !== null && (
        <button className="btn primario"
          onClick={() => setLivre(null)}
          style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', gap: 'var(--e1)', alignItems: 'center' }}>
          <Icone nome="tocar" tamanho={16} /> voltar ao vivo (você está olhando sozinho)
        </button>
      )}

      {/* controles em grupos: identidade · navegação · ajuda · estado */}
      <div className="controles">
        <div className="bloco-controle">
          <span style={{ fontSize: 18 }}>{eu.emoji}</span>
          <strong style={{ fontSize: 14 }}>{eu.nick}</strong>
        </div>

        <div className="bloco-controle" title="seus pontos, tokens de dica e nível">
          <span className="rotulo">placar</span>
          <span className="btn-icone" style={{ color: 'var(--acento)', fontWeight: 700 }}>
            <Icone nome="xp" tamanho={15} /> {eu.xp} XP
          </span>
          <span className="btn-icone"><Icone nome="token" tamanho={15} /> {eu.tokens}</span>
          {posicao > 0 && <span className="btn-icone"><Icone nome="troféu" tamanho={15} /> {posicao}º</span>}
          {(eu.combo ?? 1) > 1 && <span className="btn-icone" style={{ color: 'var(--ok)' }}>combo ×{eu.combo}</span>}
        </div>

        <div className="bloco-controle">
          <span className="rotulo">slides</span>
          <button className="btn-icone" title="olhar o slide anterior"
            onClick={() => setLivre((l) => Math.max(0, (l ?? estado.cenaIndex) - 1))}>
            <Icone nome="anterior" tamanho={16} /><span className="texto">voltar</span>
          </button>
          <button className="btn-icone" title="olhar o próximo slide"
            onClick={() => setLivre((l) => Math.min(DECK.length - 1, (l ?? estado.cenaIndex) + 1))}>
            <span className="texto">avançar</span><Icone nome="proximo" tamanho={16} />
          </button>
          {livre !== null && (
            <button className="btn-icone destaque" onClick={() => setLivre(null)}>
              <Icone nome="tocar" tamanho={16} /><span className="texto">voltar ao vivo</span>
            </button>
          )}
        </div>

        <div className="bloco-controle">
          <span className="rotulo">ajuda</span>
          <button className="btn-icone" onClick={() => setConsulta(true)} title="comandos, glossário e o que já vimos">
            <Icone nome="consultar" tamanho={16} /><span className="texto">consultar</span>
          </button>
          <button className="btn-icone" onClick={() => arena.emit('pulso', 'perdi')} title="avisa o monitor, sem custo nenhum">
            <Icone nome="duvida" tamanho={16} /><span className="texto">me perdi</span>
          </button>
          <button className="btn-icone" onClick={() => setTour(true)} title="o que é cada coisa desta tela">
            <Icone nome="info" tamanho={16} />
          </button>
          {!emLab && (
            <button className="btn-icone" onClick={() => setGaveta((g) => !g)} title="abrir o terminal fora do laboratório">
              <Icone nome="terminal" tamanho={16} /><span className="texto">terminal</span>
            </button>
          )}
        </div>

        <div className="estado-faixa">
          <span style={{ fontFamily: 'var(--mono)' }}>{nivel.prompt.replace('{nick}', usuarioDoNick(eu.nick))}</span>
          {estado.pausado && <span className="chip forte"><Icone nome="pausar" tamanho={14} /> pausado</span>}
          <span className="chip">
            {!conectado ? '🔴 reconectando' : livre === null ? '🟢 ao vivo' : '🟡 olhando sozinho'}
          </span>
        </div>
      </div>

      {consulta && <Consulta moduloAtual={cenaVista.modulo} onFechar={() => setConsulta(false)} />}
      {tour && <Tour onFechar={() => setTour(false)} />}

      {/*
        Ninguém mexeu há 4 minutos. A tela pergunta se a pessoa está aí e, até
        ela responder, sai da contagem da sala: assim um notebook esquecido
        aberto não impede o quiz de revelar nem o grupo de avançar.
      */}
      {arena.ocioso && (
        <div className="nivel-cheio" style={{ animation: 'none', background: 'rgba(250,250,249,.97)' }}>
          <div className="cartao" style={{ textAlign: 'center', display: 'grid', gap: 'var(--e2)', maxWidth: 420 }}>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <Icone nome="duvida" tamanho={44} cor="var(--atencao)" />
            </div>
            <h2 style={{ fontSize: 26 }}>Você ainda está aí?</h2>
            <p style={{ color: 'var(--tinta-2)' }}>
              Faz um tempo que você não mexe. Enquanto isso você fica fora da contagem da sala,
              para não travar o grupo. Seu XP está guardado.
            </p>
            <button className="btn primario" onClick={arena.estouAqui}>estou aqui, voltar</button>
          </div>
        </div>
      )}

      {/* avisos */}
      {arena.ganho && (
        <div className="flutuante" style={{ right: 28, bottom: 90, fontSize: 30, fontWeight: 800, color: 'var(--ok)' }}>
          +{arena.ganho.xp} XP{arena.ganho.mult > 1 ? ` ×${arena.ganho.mult}` : ''}
        </div>
      )}
      {arena.badge && <div className="toast">🏅 {arena.badge.nick}: {arena.badge.badge.replace(/-/g, ' ')}</div>}
      {aviso && <div className="toast">📣 {aviso}</div>}
      {arena.evento && <div className="toast">⚡ {arena.evento.replace(/-/g, ' ')}</div>}
      {arena.subiuNivel && (
        <div className="nivel-cheio">
          <div style={{ textAlign: 'center' }}>
            <div className="olho">subiu de nível</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(26px, 4vw, 56px)', fontWeight: 700 }}>
              {nivelDe(eu.xp).prompt.replace('{nick}', usuarioDoNick(eu.nick))}
            </div>
            <div className="chip forte" style={{ marginTop: 'var(--e2)' }}>{arena.subiuNivel.patente}</div>
          </div>
        </div>
      )}
    </div>
  );
}
