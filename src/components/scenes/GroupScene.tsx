'use client';

import { useState } from 'react';
import type { Arena } from '@/deck/useArena';
import type { Cena, Papel } from '@/deck/types';
import { Icone } from '../Icone';
import { Ilustra } from '../Ilustra';
import { Texto } from '../Texto';
import { Cabecalho } from '../Cabecalho';
import { Avatar } from '../Avatar';

type CenaGrupos = Extract<Cena, { tipo: 'GroupScene' }>;

const CORES_DE_PAPEL: Record<string, string> = {
  investigador: 'lupa', operador: 'alarme', mecanico: 'ferramenta', relator: 'arquivo',
};

/**
 * Duas telas, uma decisão em cada.
 *
 * `modo: 'equipes'` mostra só as equipes, em cartões grandes o suficiente para
 * caber o nome, as vagas e quem já está dentro. `modo: 'papeis'` mostra só as
 * cartas de função, com espaço para explicar o que cada uma faz. Antes era tudo
 * na mesma cena: os cartões ficavam pequenos e o texto vazava deles.
 */
export function GroupScene({ cena, arena, papel }: { cena: CenaGrupos; arena: Arena; papel: Papel }) {
  const souJogador = papel === 'player';
  const meu = arena.eu?.grupo ?? null;

  return (
    <div className="cena" data-modulo={cena.modulo} style={{ gap: 'var(--e2)' }}>
      <Cabecalho
        ilustra={cena.modo === 'papeis' ? 'aperto-de-mao' : 'pessoas'}
        olho={cena.modo === 'papeis' ? 'cartas de função' : 'equipes'}
        titulo={cena.titulo}
      />
      <p className="corpo-p"><Texto>{cena.enunciado}</Texto></p>

      {cena.modo === 'equipes' ? <Equipes arena={arena} souJogador={souJogador} meu={meu} /> : <Papeis cena={cena} arena={arena} souJogador={souJogador} meu={meu} />}
    </div>
  );
}

/** cartões de equipe: nome, vagas, quem está dentro e a média */
function Equipes({ arena, souJogador, meu }: { arena: Arena; souJogador: boolean; meu: string | null }) {
  return (
    <>
      {/* ordem fixa: o placar vem ordenado por XP, e o check-in já dá XP, então
          os cartões trocavam de lugar enquanto a turma clicava */}
      <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--e2)' }}>
        {[...arena.placar.grupos].sort((a, b) => a.ordem - b.ordem).map((g) => {
          const souDaqui = meu === g.nome;
          const cheia = g.membros.length >= g.capacidade && !souDaqui;
          return (
            <button key={g.nome} className="cartao" disabled={!souJogador || cheia}
              onClick={() => arena.emit('grupo:entrar', souDaqui ? null : g.nome)}
              title={souDaqui ? 'clique para sair desta equipe' : cheia ? 'equipe cheia' : 'clique para entrar'}
              style={{
                textAlign: 'left', display: 'grid', gap: 'var(--e1)',
                borderColor: souDaqui ? g.cor : 'var(--borda)',
                borderWidth: souDaqui ? 2 : 1,
                opacity: cheia ? 0.5 : 1,
                cursor: souJogador && !cheia ? 'pointer' : 'default',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--e1)' }}>
                <span style={{ width: 14, height: 14, borderRadius: 99, background: g.cor, flex: 'none' }} />
                <strong style={{ textTransform: 'capitalize', fontSize: 'clamp(16px, 1.6vw, 22px)' }}>{g.nome}</strong>
                <span className="xp-item" style={{ marginLeft: 'auto' }}>{g.membros.length}/{g.capacidade}</span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--e05)', flexWrap: 'wrap', minHeight: 30 }}>
                {g.membros.length === 0 && <small style={{ color: 'var(--tinta-2)' }}>vazia, seja a primeira pessoa</small>}
                {g.membros.map((m) => (
                  <span key={m.id} title={m.nick}
                    style={{ filter: m.presenca === 'ativo' ? undefined : 'grayscale(1) opacity(0.5)' }}>
                    <Avatar pessoa={m} tamanho={24} />
                  </span>
                ))}
              </div>

              <small style={{ color: 'var(--tinta-2)', display: 'flex', gap: 'var(--e05)', alignItems: 'center' }}>
                <Icone nome="xp" tamanho={13} /> média {g.media} XP
                {souDaqui && <strong style={{ color: g.cor, marginLeft: 'auto' }}>você está aqui</strong>}
              </small>
            </button>
          );
        })}
      </div>

      {souJogador && !meu && (
        <div className="chip forte" data-aviso="sem-equipe">
          <Icone nome="duvida" tamanho={14} /> escolha uma equipe: a apresentação só continua quando todo mundo tiver a sua
        </div>
      )}
      {!souJogador && <Pendentes arena={arena} />}
    </>
  );
}

/** projetor e painel: quem ainda falta escolher (só quem está ativo segura a sala) */
function Pendentes({ arena }: { arena: Arena }) {
  const faltam = arena.placar.individual.filter((p) => p.presenca === 'ativo' && !p.grupo);
  if (!faltam.length) {
    return <div className="chip"><Icone nome="checklist" tamanho={14} /> todo mundo já tem equipe</div>;
  }
  return (
    <div className="chip forte" data-aviso="sem-equipe">
      <Icone nome="pessoas" tamanho={14} />
      {faltam.length === 1 ? 'falta 1 pessoa' : `faltam ${faltam.length} pessoas`} escolher equipe:{' '}
      {faltam.slice(0, 6).map((p) => `${p.emoji} ${p.nick}`).join(', ')}{faltam.length > 6 ? '…' : ''}
    </div>
  );
}

/** cartas de função: o que cada uma faz e quem está com ela */
function Papeis({ cena, arena, souJogador, meu }: { cena: CenaGrupos; arena: Arena; souJogador: boolean; meu: string | null }) {
  const [texto, setTexto] = useState('');
  const papeis = cena.papeis ?? [];
  const mapa = arena.meuGrupo?.papeis ?? {};
  const membros = arena.meuGrupo?.membros ?? [];
  const semCarta = membros.filter((m) => !mapa[m.id]);

  if (!meu) {
    return (
      <div className="cartao" style={{ display: 'flex', gap: 'var(--e2)', alignItems: 'center' }}>
        <Ilustra nome="alerta" tamanho={30} />
        <span>Você ainda não está numa equipe. Volte um slide e escolha a sua.</span>
      </div>
    );
  }

  return (
    <>
      <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--e2)' }}>
        {papeis.map((p) => {
          const donoId = Object.entries(mapa).find(([, v]) => v === p.id)?.[0];
          const dono = membros.find((m) => m.id === donoId);
          const souEu = arena.eu?.papel === p.id;
          return (
            <button key={p.id} className="cartao" disabled={!souJogador || (!!dono && !souEu)}
              onClick={() => arena.emit('grupo:papel', souEu ? null : p.id)}
              title={souEu ? 'clique para largar esta carta' : dono ? 'já tem dono' : 'clique para assumir'}
              style={{
                textAlign: 'left', display: 'grid', gap: 'var(--e1)', alignContent: 'start',
                borderColor: souEu ? 'var(--acento)' : 'var(--borda)', borderWidth: souEu ? 2 : 1,
                opacity: dono && !souEu ? 0.55 : 1,
                cursor: souJogador && (!dono || souEu) ? 'pointer' : 'default',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--e1)' }}>
                <Ilustra nome={(CORES_DE_PAPEL[p.id] ?? 'ferramenta') as never} tamanho={28} />
                <strong style={{ fontSize: 'clamp(15px, 1.5vw, 20px)' }}>{p.nome}</strong>
              </div>
              <span style={{ color: 'var(--tinta-2)', fontSize: 'clamp(13px, 1.25vw, 16px)', lineHeight: 1.45 }}>
                <Texto>{p.faz}</Texto>
              </span>
              <small style={{ color: dono ? 'var(--acento)' : 'var(--tinta-2)', marginTop: 'auto' }}>
                {dono ? `${dono.emoji} ${dono.nick}${souEu ? ' (você, clique para largar)' : ''}` : 'carta livre'}
              </small>
            </button>
          );
        })}
      </div>

      {semCarta.length > 0 && (
        <div className="cartao" style={{ background: 'var(--papel-2)', display: 'flex', gap: 'var(--e2)', alignItems: 'center' }}>
          <Ilustra nome="pessoas" tamanho={26} />
          <span style={{ fontSize: 14, color: 'var(--tinta-2)' }}>
            <strong>{semCarta.map((m) => `${m.emoji} ${m.nick}`).join(', ')}</strong>{' '}
            {semCarta.length > 1 ? 'estão' : 'está'} sem carta e {semCarta.length > 1 ? 'são' : 'é'} <strong>apoio</strong>:
            investiga, testa e dita o comando no mesmo servidor. O XP dos critérios vai para a equipe inteira,
            e dá para trocar de carta a qualquer momento.
          </span>
        </div>
      )}

      {souJogador && (
        <div className="cartao" style={{ display: 'grid', gap: 'var(--e1)' }}>
          <div className="olho" style={{ display: 'flex', gap: 'var(--e1)', alignItems: 'center' }}>
            <Icone nome="pessoas" tamanho={15} /> combinem o plano aqui
          </div>
          <div style={{ maxHeight: 110, overflow: 'auto', display: 'grid', gap: 'var(--e05)' }}>
            {arena.chat.map((m, i) => (
              <div key={i} style={{ fontSize: 14 }}>
                <strong>{m.emoji} {m.nick}</strong>{' '}
                <span style={{ fontFamily: m.texto.trim().startsWith('$') ? 'var(--mono)' : 'var(--sans)' }}>{m.texto}</span>
              </div>
            ))}
            {arena.chat.length === 0 && (
              <small style={{ color: 'var(--tinta-2)' }}>
                Pode colar comandos começando com $. O colega digita no teclado dele, e é assim que ele aprende.
              </small>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--e1)' }}>
            <input className="btn" style={{ flex: 1, textAlign: 'left' }} value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && texto.trim()) { arena.emit('grupo:chat', texto.trim()); setTexto(''); } }}
              placeholder="mensagem para a equipe" />
            <button className="btn" onClick={() => { if (texto.trim()) { arena.emit('grupo:chat', texto.trim()); setTexto(''); } }}>enviar</button>
          </div>
        </div>
      )}
    </>
  );
}
