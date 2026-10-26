'use client';

import { useEffect, useRef, useState } from 'react';
import { useArena } from '@/deck/useArena';
import { SceneRouter } from '@/components/SceneRouter';
import { Encaixe } from '@/components/Encaixe';
import { TerminalHost } from '@/components/TerminalHost';
import { Consulta } from '@/components/Consulta';
import { Icone } from '@/components/Icone';
import { MenuControles } from '@/components/MenuControles';
import { Roleta } from '@/components/Roleta';
import { Avatar } from '@/components/Avatar';
import { Ilustra } from '@/components/Ilustra';
import { Tour } from '@/components/Tour';
import { Perfil } from '@/components/Perfil';
import { useTema, useTemaTerminal } from '@/deck/useTema';
import { TEMAS_TERMINAL, temaTerminalPorId } from '@/deck/temas';
import { nivelDe } from '@/deck/types';
import { DECK } from '@/deck/content';
import { CartaoEvento, CartaoConquista, Confete } from '@/components/Celebracao';
import { prepararFoto } from '@/deck/foto';

import { AVATARES, AVATAR_PADRAO, usuarioDoNick } from '@/deck/avatares';

/** a cena em que a turma escolhe a equipe (a primeira GroupScene do deck) */
const ESCOLHA_DE_EQUIPE = DECK.findIndex((c) => c.tipo === 'GroupScene' && c.modo === 'equipes');

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
  /** foto escolhida antes de entrar: dataUrl pronto para enviar */
  const fotaPendente = useRef<string | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoErro, setFotoErro] = useState<string | null>(null);
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

  // envia foto pendente logo após o login ser concluído
  useEffect(() => {
    if (!eu || !fotaPendente.current) return;
    const dataUrl = fotaPendente.current;
    fotaPendente.current = null;
    arena.enviarFoto(dataUrl);
  }, [eu]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const doEntrar = () => entrar(nick.trim(), emoji);
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
            onKeyDown={(e) => { if (e.key === 'Enter' && nick.trim()) doEntrar(); }} />

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

          {/* foto opcional: aparece como preview e é enviada logo após entrar */}
          <div>
            <div className="olho" style={{ marginBottom: 'var(--e1)' }}>sua foto (opcional)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--e2)' }}>
              {fotoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoPreview} alt="sua foto" width={56} height={56}
                  style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--borda)', flex: 'none' }} />
              ) : (
                <span style={{ fontSize: 36, lineHeight: 1, flex: 'none' }}>{emoji}</span>
              )}
              <div style={{ display: 'grid', gap: 4, flex: 1 }}>
                <label className="btn" style={{ padding: 'var(--e1) var(--e2)', cursor: 'pointer', justifySelf: 'start' }}>
                  {fotoPreview ? 'trocar foto' : 'enviar foto'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (!f) return;
                      setFotoErro(null);
                      const r = await prepararFoto(f);
                      if ('erro' in r) { setFotoErro(r.erro); return; }
                      fotaPendente.current = r.dataUrl;
                      setFotoPreview(r.dataUrl);
                    }} />
                </label>
                {fotoPreview && (
                  <button className="btn" style={{ padding: 'var(--e1) var(--e2)', justifySelf: 'start' }}
                    onClick={() => { fotaPendente.current = null; setFotoPreview(null); setFotoErro(null); }}>
                    remover foto
                  </button>
                )}
                {fotoErro && <small style={{ color: 'var(--erro)' }}>{fotoErro}</small>}
                {!fotoErro && <small style={{ color: 'var(--tinta-2)' }}>PNG, JPG ou WebP · até 2 MB</small>}
              </div>
            </div>
          </div>

          <div>
            <div className="olho" style={{ marginBottom: 'var(--e1)' }}>
              {fotoPreview ? 'ou escolha um bicho (aparece quando não tem foto)' : `escolha seu bicho (${AVATARES.length} opções${usados.size ? `, ${usados.size} já escolhidos` : ''})`}
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(46px, 1fr))',
              gap: 'var(--e05)', maxHeight: 210, overflowY: 'auto', padding: 'var(--e05)',
              border: '1px solid var(--borda)', borderRadius: 'var(--r-p)', background: 'var(--papel-2)',
            }}>
              {AVATARES.map((e) => {
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
          <button className="btn primario" disabled={!nick.trim()} onClick={doEntrar}>
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
  const indiceAtual = livre ?? estado.cenaIndex;
  const cenaVista = livre === null ? arena.cena : DECK[livre];
  /**
   * O terminal entra na cena quando a tarefa é digitada nele: nos laboratórios
   * e na corrida de equipes. Nos outros jogos ele fica disponível na gaveta.
   */
  // só depois de o apresentador liberar: antes disso a turma lê o enunciado
  const emLab = livre === null && estado.fase !== 'idle' && (
    // o chamado é jogado com cartões, sem terminal
    (cenaVista.tipo === 'LabScene' && !cenaVista.cartoes) ||
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

      {/* chegou depois da escolha de equipe: sem equipe a apresentação não
          avança, então o caminho de volta para escolher fica na cara */}
      {livre === null && !eu.grupo && ESCOLHA_DE_EQUIPE >= 0 && estado.cenaIndex > ESCOLHA_DE_EQUIPE && (
        <button className="btn primario" data-acao="escolher-equipe"
          onClick={() => setLivre(ESCOLHA_DE_EQUIPE)}
          style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', gap: 'var(--e1)', alignItems: 'center' }}>
          <Icone nome="pessoas" tamanho={16} /> você está sem equipe: escolher agora
        </button>
      )}

      {/* uma linha só: identidade, tokens e navegação à mostra; ajuda e tela
          em menus que abrem para cima */}
      <div className="controles">
        <div className="bloco-controle" title={nivel.prompt.replace('{nick}', usuarioDoNick(eu.nick))}>
          <Avatar pessoa={eu} tamanho={22} />
          <strong style={{ fontSize: 14, marginLeft: 'var(--e1)' }}>{eu.nick}</strong>
        </div>

        {/* sem placar aqui de propósito: a posição de cada um só aparece no
            pódio, quando o apresentador mostra (como no Kahoot). Fica só o
            saldo de tokens, que a pessoa precisa para decidir pedir dica. */}
        <div className="bloco-controle" title="tokens: moedas para comprar dicas nos laboratórios">
          <span className="btn-icone"><Icone nome="token" tamanho={15} /> {eu.tokens}<span className="texto"> tokens</span></span>
        </div>

        <div className="bloco-controle">
          <button className="btn-icone" title="olhar o slide anterior"
            disabled={indiceAtual <= 0}
            onClick={() => setLivre((l) => Math.max(0, (l ?? estado.cenaIndex) - 1))}>
            <Icone nome="anterior" tamanho={16} /><span className="texto">voltar</span>
          </button>
          {livre !== null && (
            <button className="btn-icone destaque" onClick={() => setLivre(null)}>
              <Icone nome="tocar" tamanho={16} /><span className="texto">ao vivo</span>
            </button>
          )}
        </div>

        {/*
          A equipe também se escolhe daqui, a qualquer momento: quem chegou
          atrasado, saiu sem querer ou caiu numa equipe cheia não precisa
          esperar o slide de equipes voltar. A própria equipe não é clicável
          (no cartão da cena, clicar nela é sair, e sair seguraria a sala).
        */}
        <MenuControles rotulo={eu.grupo ?? 'equipe'} icone="pessoas" destaque={eu.grupo ? null : '!'}
          titulo={eu.grupo ? `sua equipe: ${eu.grupo}. Clique para trocar` : 'você está sem equipe: escolha a sua'}>
          {arena.equipesTrancadas && eu.grupo && <div className="info-menu">As trocas de equipe estão trancadas durante o chamado.</div>}
          {arena.equipesTrancadas && !eu.grupo && <div className="info-menu">O chamado já começou, mas você ainda pode escolher uma equipe com vaga.</div>}
          {[...arena.placar.grupos].sort((a, b) => a.ordem - b.ordem).map((g) => {
            const minha = g.nome === eu.grupo;
            const cheia = !minha && g.membros.length >= g.capacidade;
            const trancada = arena.equipesTrancadas && !!eu.grupo;
            return (
              <button key={g.nome} className="btn-icone" data-equipe={g.nome}
                disabled={minha || cheia || trancada}
                title={minha ? 'esta é a sua equipe' : cheia ? 'equipe cheia' : trancada ? 'equipes trancadas' : `entrar na equipe ${g.nome}`}
                onClick={() => arena.emit('grupo:entrar', g.nome)}>
                <span aria-hidden style={{ width: 12, height: 12, borderRadius: 99, background: g.cor, flex: 'none' }} />
                <span className="texto" style={{ textTransform: 'capitalize' }}>{g.nome}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--tinta-2)' }}>
                  {minha ? 'sua equipe' : cheia ? 'cheia' : `${g.membros.length}/${g.capacidade}`}
                </span>
              </button>
            );
          })}
        </MenuControles>

        <MenuControles rotulo="ajuda" icone="ajuda">
          <button className="btn-icone" onClick={() => setConsulta(true)} title="comandos, glossário e o que já vimos">
            <Icone nome="consultar" tamanho={16} /><span className="texto">consultar comandos</span>
          </button>
          <button className="btn-icone" onClick={() => arena.emit('pulso', 'perdi')} title="avisa o monitor, sem custo nenhum">
            <Icone nome="duvida" tamanho={16} /><span className="texto">me perdi</span>
          </button>
          <button className="btn-icone" onClick={() => setTour(true)} title="o que é cada coisa desta tela">
            <Icone nome="info" tamanho={16} /><span className="texto">o que é cada coisa</span>
          </button>
        </MenuControles>

        <MenuControles rotulo="você" icone="ajustes" titulo="seu nome, sua foto, as cores e o terminal">
          <div className="info-menu">seu prompt: <code>{nivel.prompt.replace('{nick}', usuarioDoNick(eu.nick))}</code></div>
          <button className="btn-icone" onClick={() => setPerfil(true)} title="trocar seu nome, seu avatar ou sair">
            <Icone nome="nome" tamanho={16} /><span className="texto">nome, avatar e foto</span>
          </button>
          <button className="btn-icone" onClick={() => trocar()} title="alternar entre slide claro e escuro">
            <Icone nome="olho" tamanho={16} /><span className="texto">slide {tema === 'claro' ? 'claro' : 'escuro'}</span>
          </button>
          <button className="btn-icone" onClick={() => setEscolhendoTema((v) => !v)} title="trocar as cores do terminal">
            <Icone nome="terminal" tamanho={16} /><span className="texto">cores do terminal</span>
          </button>
          {!emLab && (
            <button className="btn-icone" onClick={() => setGaveta((g) => !g)} title="abrir o terminal fora do laboratório">
              <Icone nome="shell" tamanho={16} /><span className="texto">abrir o terminal</span>
            </button>
          )}
        </MenuControles>

        <div className="estado-faixa">
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
      <Roleta arena={arena} papel="player" />
      {arena.avisoTerminal && (
        <div className="toast" style={{ background: 'var(--atencao)', color: 'var(--papel)', borderColor: 'var(--atencao)', maxWidth: '90vw', textAlign: 'center' }}>
          Seu terminal foi reiniciado porque {arena.avisoTerminal}. Seus arquivos e seu XP continuam lá:
          clique no terminal para abrir de novo.
        </div>
      )}
      {eu.silenciado && <div className="chip forte" style={{ position: 'fixed', top: 'var(--e2)', right: 'var(--e2)', zIndex: 50 }}>chat silenciado pelo apresentador</div>}
      {/* só para quem subiu: o evento vem para a sala toda, e a tela cheia dos
          outros piscava em cima do conteúdo (e com o nome errado, o de quem
          estava lendo). Mesmo filtro do cartão de conquista. */}
      {arena.subiuNivel?.id === eu.id && (
        <div className="nivel-cheio">
          <Confete />
          <div className="nivel-cartao">
            <Ilustra nome="trofeu" tamanho={64} />
            <div className="olho">subiu de nível</div>
            {/* o nome da pessoa, e não o prompt inteiro (nome@servidor:/etc$):
                no meio de um jogo o que ela precisa ler é que foi ela */}
            <div style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 800 }}>{arena.subiuNivel.nick}</div>
            <div className="chip forte grande" style={{ marginTop: 'var(--e2)' }}>{arena.subiuNivel.patente}</div>
          </div>
        </div>
      )}
    </div>
  );
}
