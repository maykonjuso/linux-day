'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Arena, CartaoPublico } from '@/deck/useArena';
import { Icone } from '../Icone';

/**
 * O chamado jogado com cartões: no lugar do terminal, a mão de cartões que a
 * pessoa pode enviar (os do cargo dela e os dos cargos sem dono) e o registro
 * de tudo o que a equipe já enviou, com a saída de cada comando.
 *
 * A trava de verdade é do servidor (src/server/chamado.mjs); aqui só não se
 * mostra o que a pessoa não pode enviar.
 */
export function CartoesDoChamado({ arena, nomeDaCarta, aberto }: {
  arena: Arena; nomeDaCarta: Record<string, string>; aberto: boolean;
}) {
  const papeis = arena.meuGrupo?.papeis ?? {};
  const meuPapel = arena.eu?.id ? papeis[arena.eu.id] ?? null : null;
  const { carregarJogadas } = arena;
  useEffect(() => { carregarJogadas(); }, [carregarJogadas, arena.eu?.grupo]);

  const liberados = useMemo(() => {
    const comDono = new Set(Object.values(papeis));
    return arena.cartoes.filter((c) => c.papel === meuPapel || !comDono.has(c.papel));
  }, [arena.cartoes, papeis, meuPapel]);
  const porPapel = useMemo(() => {
    const m = new Map<string, CartaoPublico[]>();
    for (const c of liberados) m.set(c.papel, [...(m.get(c.papel) ?? []), c]);
    // a carta da pessoa primeiro; as livres depois
    return [...m.entries()].sort(([a], [b]) => Number(b === meuPapel) - Number(a === meuPapel));
  }, [liberados, meuPapel]);

  return (
    <div className="cartoes-chamado">
      <div className="mao-de-cartoes" aria-label="seus cartões de comando">
        {!meuPapel && liberados.length === 0 && (
          <div className="cartao">Todas as cartas da equipe têm dono. Ajude pelo chat e acompanhe o registro ao lado.</div>
        )}
        {porPapel.map(([papel, lista]) => (
          <section key={papel} className="naipe">
            <div className="olho">
              {nomeDaCarta[papel] ?? papel}{papel === meuPapel ? ' · sua carta' : ' · carta livre'}
            </div>
            {lista.map((c) => <Cartao key={c.id} cartao={c} arena={arena} aberto={aberto} />)}
          </section>
        ))}
      </div>

      <div className="registro-chamado" aria-live="polite" aria-label="o que a equipe enviou">
        <div className="olho"><Icone nome="historico" tamanho={14} /> o que a equipe enviou</div>
        {arena.jogadas.length === 0 && <small style={{ color: 'var(--tinta-2)' }}>nenhum cartão ainda</small>}
        {[...arena.jogadas].reverse().map((j) => (
          <div key={`${j.em}-${j.nick}`} className="jogada" data-armadilha={!!j.armadilha || undefined} data-ok={j.ok}>
            <span className="quem">{j.emoji} {j.nick} · {nomeDaCarta[j.papel] ?? j.papel}</span>
            <code className="cmd">$ {j.comando}</code>
            {j.armadilha
              ? <span className="aviso-armadilha"><Icone nome="perigo" tamanho={14} /> não rodou: {j.armadilha}</span>
              : j.saida ? <pre className="saida">{j.saida}</pre> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function Cartao({ cartao, arena, aberto }: { cartao: CartaoPublico; arena: Arena; aberto: boolean }) {
  const [valor, setValor] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [antes, depois] = cartao.campo ? cartao.comando.split(`{${cartao.campo.nome}}`) : [cartao.comando, ''];

  const enviar = async () => {
    if (ocupado || !aberto || (cartao.campo && !valor.trim())) return;
    setOcupado(true); setErro(null);
    const r = await arena.enviarCartao(cartao.id, cartao.campo ? valor : undefined);
    setOcupado(false);
    if (r.erro) setErro(r.erro); else if (cartao.campo) setValor('');
  };

  return (
    <div className="cartao-comando" data-cartao={cartao.id}>
      <code className="texto-cartao">
        {antes}
        {cartao.campo && (
          <input value={valor} onChange={(e) => setValor(e.target.value)} disabled={!aberto}
            onKeyDown={(e) => { if (e.key === 'Enter') enviar(); }}
            placeholder={cartao.campo.nome} title={cartao.campo.dica} aria-label={cartao.campo.dica}
            inputMode={cartao.campo.tipo === 'pid' ? 'numeric' : 'text'}
            size={cartao.campo.tipo === 'pid' ? 7 : 22} maxLength={cartao.campo.tipo === 'pid' ? 7 : 200} />
        )}
        {depois}
      </code>
      <button className="btn primario" disabled={!aberto || ocupado || (!!cartao.campo && !valor.trim())} onClick={enviar}>
        {ocupado ? 'enviando…' : 'enviar'}
      </button>
      {erro && <small role="alert" className="erro-cartao">{erro}</small>}
    </div>
  );
}
