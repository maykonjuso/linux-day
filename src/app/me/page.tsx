'use client';

import { useEffect, useState } from 'react';
import { useArena } from '@/deck/useArena';
import { nivelDe } from '@/deck/types';
import { usuarioDoNick } from '@/deck/avatares';
import { PACOTE } from '@/deck/pacote';

/** Resumo pessoal pós-evento + certificado (abre a impressão do navegador). */
export default function Eu() {
  const arena = useArena('player');
  const { eu, placar } = arena;
  const [agora, setAgora] = useState('');
  useEffect(() => setAgora(new Date().toLocaleDateString('pt-BR')), []);

  useEffect(() => { document.body.classList.add('rolavel'); return () => document.body.classList.remove('rolavel'); }, []);

  if (!eu) return <div className="centro"><div className="cartao">Entre pelo deck primeiro: <a href="/">abrir</a></div></div>;

  const n = nivelDe(eu.xp);
  const posicao = placar.individual.findIndex((p) => p.id === eu.id) + 1;
  const comandos = PACOTE.flatMap((p) => p.itens).length;

  return (
    <main style={{ padding: 'var(--e5) var(--e6) var(--e8)' }}>
      <style>{`@media print { .naoimprime { display: none } }`}</style>
      <div className="olho">Linux Day · {agora}</div>
      <h1 className="titulo" style={{ fontSize: 40 }}>{eu.emoji} {eu.nick}</h1>

      <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', margin: 'var(--e3) 0', maxWidth: 820 }}>
        <div className="cartao"><div className="olho">XP</div><strong style={{ fontSize: 30 }}>{eu.xp}</strong></div>
        <div className="cartao"><div className="olho">patente</div><strong style={{ fontSize: 22 }}>{n.patente}</strong></div>
        <div className="cartao"><div className="olho">posição</div><strong style={{ fontSize: 30 }}>{posicao || '—'}º</strong></div>
        <div className="cartao"><div className="olho">grupo</div><strong style={{ fontSize: 22, textTransform: 'capitalize' }}>{eu.grupo ?? '—'}</strong></div>
      </div>

      <div className="cartao" style={{ maxWidth: 820 }}>
        <div className="olho">seu prompt final</div>
        <code className="kbd" style={{ fontSize: 22 }}>{n.prompt.replace('{nick}', usuarioDoNick(eu.nick))}</code>
      </div>

      {(eu.badges?.length ?? 0) > 0 && (
        <>
          <h2 style={{ fontSize: 22, margin: 'var(--e3) 0 var(--e1)' }}>Badges</h2>
          <div style={{ display: 'flex', gap: 'var(--e1)', flexWrap: 'wrap' }}>
            {eu.badges!.map((b) => <span key={b} className="chip forte">🏅 {b.replace(/-/g, ' ')}</span>)}
          </div>
        </>
      )}

      <h2 style={{ fontSize: 22, margin: 'var(--e3) 0 var(--e1)' }}>Certificado</h2>
      <div className="cartao" style={{ maxWidth: 820, textAlign: 'center', padding: 'var(--e5)' }}>
        <div className="olho">certifico que</div>
        <div style={{ fontSize: 30, fontWeight: 700, margin: 'var(--e1) 0' }}>{eu.nick}</div>
        <p style={{ color: 'var(--tinta-2)', maxWidth: '36em', margin: '0 auto' }}>
          participou do workshop <strong>Linux Day</strong>, completou laboratórios verificados de navegação,
          manipulação de arquivos, permissões, pipes e processos, e fechou um chamado de diagnóstico em equipe,
          somando <strong>{eu.xp} XP</strong> e a patente de <strong>{n.patente}</strong>.
        </p>
        <small style={{ color: 'var(--tinta-2)', display: 'block', marginTop: 'var(--e2)' }}>{comandos} comandos no pacote de sobrevivência · {agora}</small>
        <button className="btn primario naoimprime" style={{ marginTop: 'var(--e3)' }} onClick={() => window.print()}>salvar em PDF</button>
      </div>

      <p className="naoimprime" style={{ marginTop: 'var(--e3)' }}>
        <a className="btn" href="/cheatsheet">abrir o cheatsheet</a>{' '}
        <a className="btn" href="/regras">as regras</a>{' '}
        <a className="btn" href="/">voltar ao deck</a>
      </p>

      <h2 style={{ fontSize: 22, margin: 'var(--e4) 0 var(--e1)' }}>Próximos passos</h2>
      <ul style={{ color: 'var(--tinta-2)', lineHeight: 1.8, maxWidth: '44em' }}>
        <li>Instale uma VM (ou WSL, no Windows) e repita o boss sozinho. É o melhor exercício que existe.</li>
        <li>Exercícios: <code className="kbd">overthewire.org/wargames/bandit</code>, um jogo de terminal que começa do zero.</li>
        <li>Leitura: <em>The Linux Command Line</em>, de William Shotts (grátis em linuxcommand.org).</li>
        <li>O que vem depois do que vimos: <code className="kbd">ssh</code> (entrar em outra máquina) e <code className="kbd">tar</code> (empacotar arquivos).</li>
      </ul>
    </main>
  );
}
