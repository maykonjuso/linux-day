'use client';

import { useEffect, useState } from 'react';
import { useArena } from '@/deck/useArena';
import { SceneRouter } from '@/components/SceneRouter';
import { Encaixe } from '@/components/Encaixe';
import { TerminalHost } from '@/components/TerminalHost';
import { Consulta } from '@/components/Consulta';
import { Icone } from '@/components/Icone';
import { Ilustra } from '@/components/Ilustra';
import { Tour } from '@/components/Tour';
import { Perfil } from '@/components/Perfil';
import { useTema, useTemaTerminal } from '@/deck/useTema';
import { TEMAS_TERMINAL, temaTerminalPorId } from '@/deck/temas';
import { nivelDe } from '@/deck/types';
import { DECK } from '@/deck/content';
import { CartaoEvento, CartaoConquista, Confete } from '@/components/Celebracao';

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
  const [perfil, setPerfil] = useState(false);
  const [codigo, setCodigo] = useState('');
  const { tema, trocar } = useTema('claro');
  const { temaTerminal, trocarTemaTerminal } = useTemaTerminal();
  const [escolhendoTema, setEscolhendoTema] = useState(false);
  /** índice da cena que estou olhando por conta própria (null = ao vivo) */
  const [livre, setLivre] = useState<number | null>(null);

  // só para trás: o participante revê o que já passou, mas nunca adianta o
  // que o apresentador ainda não mostrou (o teto é o slide ao vivo)
  const tetoSlide = Math.min(DECK.length - 1, estado.cenaIndex);

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
      // navegação livre: só com as setas, travada no último slide já mostrado pelo apresentador
      if (e.key === 'ArrowLeft') setLivre((l) => Math.max(0, (l ?? estado.cenaIndex) - 1));
      // → só anda de volta em direção ao ao vivo; chegando nele, volta ao vivo
      if (e.key === 'ArrowRight') setLivre((l) => (l === null || l + 1 >= tetoSlide ? null : l + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [estado.cenaIndex, tetoSlide]);

  if (!eu) {
    const usados = new Set(arena.placar.individual.map((p) => p.emoji));
    if (arena.expulso) {
      return (
        <div className="centro">
          <div className="cartao" style={{ width: 'min(440px, 100%)', display: 'grid', gap: 'var(--e2)', textAlign: 'center' }}>
            <div style={{ display: 'grid', placeItems: 'center' }}><Icone nome="sair" tamanho={40} cor="var(--erro)" /></div>
            <h1 style={{ fontSize: 24 }}>Sua participação foi encerrada</h1>
            <p style={{ color: 'var(--tinta-2)' }}>{arena.expulso}</p>
            <button className="btn" onClick={() => location.reload()}>entrar de novo</button>
          </div>
        </div>
      );
    }
    return (
      <div className="centro">
        <div className="cartao" style={{ width: 'min(470px, 100%)', display: 'grid', gap: 'var(--e2)' }}>
          <div className="olho" style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center' }}>
            <Icone nome="shell" tamanho={16} /> Linux Day
          </div>
          <h1 className="titulo" style={{ fontSize: 34 }}>Escolha seu nome</h1>
          <input className="btn" style={{ textAlign: 'left', borderColor: arena.nomeRecusado ? 'var(--erro)' : 'var(--borda)' }}
            placeholder="seu nome" value={nick} maxLength={20}
            onChange={(e) => setNick(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && nick.trim()) entrar(nick.trim(), emoji); }} />

          {arena.nomeRecusado && (
            <div className="cartao" style={{ borderColor: 'var(--erro)', display: 'grid', gap: 'var(--e1)' }}>
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
              border: '1px solid var(--borda)', borderRadius: 'var(--r-p)', background: 'var(--papel-2)',
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
                      borderRadius: 'var(--r-p)', background: emoji === e ? 'var(--acento-suave)' : 'var(--papel)',
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

          {!arena.ultimaPessoa && (
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--tinta-2)' }}>
                já participei hoje em outro computador
              </summary>
              <div style={{ display: 'flex', gap: 'var(--e1)', marginTop: 'var(--e1)' }}>
                <input className="btn" style={{ flex: 1, textAlign: 'left', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}
                  placeholder="código de 4 letras" value={codigo} maxLength={4}
                  onChange={(e) => setCodigo(e.target.value)} />
                <button className="btn" disabled={codigo.trim().length < 4}
                  onClick={() => entrar(nick.trim() || 'voltei', emoji, undefined, codigo.trim())}>
                  recuperar
                </button>
              </div>
              <small style={{ color: 'var(--tinta-2)' }}>
                O código aparece no seu perfil, naquele computador. Sem ele ninguém assume a sua conta,
                nem de propósito nem por acidente.
              </small>
            </details>
          )}

          {arena.ultimaPessoa && (
            <button className="btn" onClick={() => entrar(arena.ultimaPessoa!.nick, arena.ultimaPessoa!.emoji, arena.ultimaPessoa!.id)}
              style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center', justifyContent: 'center' }}>
              <Icone nome="historico" tamanho={16} />
              voltar como {arena.ultimaPessoa.emoji} {arena.ultimaPessoa.nick}
            </button>
          )}
          <small style={{ color: 'var(--tinta-2)' }}>
            Guardamos só o nick e o emoji. Tudo é apagado depois do evento.
          </small>
        </div>
      </div>
    );
  }

  const nivel = nivelDe(eu.xp);
  const indiceAtual = livre ?? estado.cenaIndex;
  const cenaVista = livre === null ? arena.cena : DECK[livre];
  /**
   * O terminal entra na cena quando a tarefa é digitada nele: nos laboratórios
   * e na corrida de equipes. Nos outros jogos ele fica disponível na gaveta.
   */
  // só depois de o apresentador liberar: antes disso a turma lê o enunciado
  const emLab = livre === null && estado.fase !== 'idle' && (
    cenaVista.tipo === 'LabScene' ||
    (cenaVista.tipo === 'ArenaScene' && cenaVista.jogo === 'corrida')
  );

  const irParaSlidePorId = (id: string) => {
    const idx = DECK.findIndex((c) => c.id === id);
    if (idx >= 0 && idx <= tetoSlide) {
      setLivre(idx);
    }
  };

  return (
    <div className="palco" data-papel="player">
      <Encaixe modo="rolagem" chave={`${cenaVista.id}:${estado.passo}:${estado.fase}`}>
        <SceneRouter
          arena={arena}
          papel="player"
          cenaForcada={livre === null ? undefined : cenaVista}
          onIrParaSlide={irParaSlidePorId}
        />
      </Encaixe>

      {/* o terminal é montado UMA vez e segue vivo o workshop inteiro */}
      <TerminalHost
        socket={arena.socket}
        ativo={emLab}
        gaveta={gaveta && !emLab}
        tema={temaTerminalPorId(temaTerminal)}
        onFechar={() => setGaveta(false)}
      />

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

        {/* sem placar aqui de propósito: a posição de cada um só aparece no
            pódio, quando o apresentador mostra (como no Kahoot). Fica só o
            saldo de tokens, que a pessoa precisa para decidir pedir dica. */}
        <div className="bloco-controle" title="tokens: moedas para comprar dicas nos laboratórios">
          <span className="btn-icone"><Icone nome="token" tamanho={15} /> {eu.tokens} tokens</span>
        </div>

        <div className="bloco-controle">
          <span className="rotulo">slides</span>
          <button className="btn-icone" title="olhar o slide anterior"
            disabled={indiceAtual <= 0}
            onClick={() => setLivre((l) => Math.max(0, (l ?? estado.cenaIndex) - 1))}>
            <Icone nome="anterior" tamanho={16} /><span className="texto">voltar</span>
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
          <button className="btn-icone" onClick={() => setPerfil(true)} title="trocar seu nome, seu bicho ou sair">
            <Icone nome="ajustes" tamanho={16} />
          </button>
        </div>

        <div className="bloco-controle">
          <span className="rotulo">tema</span>
          <button className="btn-icone" onClick={() => trocar()} title="alternar entre slide claro e escuro">
            <Icone nome={tema === 'claro' ? 'cadeado' : 'estrela'} tamanho={16} />
            <span className="texto">{tema === 'claro' ? 'claro' : 'escuro'}</span>
          </button>
          <button className="btn-icone" onClick={() => setEscolhendoTema((v) => !v)} title="trocar as cores do terminal">
            <Icone nome="terminal" tamanho={16} /><span className="texto">cores</span>
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
      {perfil && <Perfil arena={arena} onFechar={() => setPerfil(false)} />}

      {/* cores do terminal: dois temas abertos desde o começo e os outros
          desbloqueiam por nível. É a recompensa do jogo que aparece justamente
          na tela onde a pessoa está trabalhando. */}
      {escolhendoTema && (
        <div onClick={() => setEscolhendoTema(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(11,11,12,.45)', zIndex: 58, display: 'grid', placeItems: 'center', padding: 'var(--e3)' }}>
          <div className="cartao" onClick={(e) => e.stopPropagation()} style={{ width: 'min(620px, 100%)', display: 'grid', gap: 'var(--e2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--e1)' }}>
              <Icone nome="terminal" />
              <strong style={{ fontSize: 18 }}>Cores do terminal</strong>
              <span className="chip" style={{ marginLeft: 'auto' }}>nível {nivel.nivel}</span>
            </div>

            <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 'var(--e2)' }}>
              {TEMAS_TERMINAL.map((t) => {
                const aberto = t.nivelMinimo <= nivel.nivel;
                const atual = t.id === temaTerminal;
                return (
                  <button key={t.id} disabled={!aberto}
                    onClick={() => { trocarTemaTerminal(t.id); setEscolhendoTema(false); }}
                    title={aberto ? `usar o tema ${t.nome}` : `abre no nível ${t.nivelMinimo}`}
                    style={{
                      display: 'grid', gap: 'var(--e1)', padding: 'var(--e2)', cursor: aberto ? 'pointer' : 'default',
                      border: `2px solid ${atual ? 'var(--acento)' : 'var(--borda)'}`, borderRadius: 'var(--r-m)',
                      background: 'var(--papel)', opacity: aberto ? 1 : 0.45, textAlign: 'left',
                    }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--e1)' }}>
                      <strong style={{ fontSize: 14 }}>{t.nome}</strong>
                      {!aberto && <span className="xp-item">nível {t.nivelMinimo}</span>}
                      {atual && <span className="xp-item" style={{ marginLeft: 'auto', background: 'var(--acento)', borderColor: 'var(--acento)', color: 'var(--sobre-acento)' }}>em uso</span>}
                    </span>
                    {/* amostra: o mesmo prompt, nas cores do tema */}
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 12, borderRadius: 'var(--r-p)', padding: 'var(--e1)',
                      background: t.cores.background, color: t.cores.foreground, display: 'grid', gap: 'var(--e1)',
                    }}>
                      <span><span style={{ color: t.cores.green }}>{usuarioDoNick(eu.nick)}@linuxday</span>:~$ ls</span>
                      <span style={{ color: t.cores.blue }}>bagunca  app  docs</span>
                      <span style={{ color: t.cores.red }}>erro: permission denied</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <small style={{ color: 'var(--tinta-2)' }}>
              Temas novos abrem quando você sobe de nível. Nível vem de XP, e XP vem de responder,
              resolver os exercícios e fechar os laboratórios.
            </small>
          </div>
        </div>
      )}

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
        <div className="flutuante ganho-flutuante" key={arena.ganho.em}>
          +{arena.ganho.xp} XP{arena.ganho.mult > 1 ? ` ×${arena.ganho.mult}` : ''}
        </div>
      )}
      <CartaoConquista arena={arena} />
      {aviso && <div className="toast">📣 {aviso}</div>}
      <CartaoEvento arena={arena} />
      {arena.avisoTerminal && (
        <div className="toast" style={{ background: 'var(--atencao)', color: 'var(--papel)', borderColor: 'var(--atencao)', maxWidth: '90vw', textAlign: 'center' }}>
          Seu terminal foi reiniciado porque {arena.avisoTerminal}. Seus arquivos e seu XP continuam lá:
          clique no terminal para abrir de novo.
        </div>
      )}
      {eu.silenciado && <div className="chip forte" style={{ position: 'fixed', top: 'var(--e2)', right: 'var(--e2)', zIndex: 50 }}>chat silenciado pelo apresentador</div>}
      {arena.subiuNivel && (
        <div className="nivel-cheio">
          <Confete />
          <div className="nivel-cartao">
            <Ilustra nome="trofeu" tamanho={64} />
            <div className="olho">subiu de nível</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(26px, 4vw, 56px)', fontWeight: 700 }}>
              {nivelDe(eu.xp).prompt.replace('{nick}', usuarioDoNick(eu.nick))}
            </div>
            <div className="chip forte grande" style={{ marginTop: 'var(--e2)' }}>{arena.subiuNivel.patente}</div>
            <p className="apoio" style={{ marginTop: 'var(--e2)' }}>esse é o seu novo prompt no terminal</p>
          </div>
        </div>
      )}
    </div>
  );
}
