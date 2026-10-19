/**
 * A camada de jogo: XP, tokens, níveis, combos, badges e eventos ao vivo.
 *
 * Duas regras que o código precisa garantir, não só a documentação:
 *   1. XP nunca diminui. Dica, erro, reset e desconexão custam token ou nada.
 *   2. Nenhum critério pontua duas vezes (idempotência no banco).
 */
import { dao } from './db.mjs';

export const NIVEIS = [
  { nivel: 1, xp: 0, patente: 'Visitante', prompt: 'visitante@linuxday:~$' },
  { nivel: 2, xp: 300, patente: 'Usuário', prompt: '{nick}@linuxday:~$' },
  { nivel: 3, xp: 700, patente: 'Operador', prompt: '{nick}@servidor:~$' },
  { nivel: 4, xp: 1300, patente: 'Sysadmin', prompt: '{nick}@servidor:/etc$' },
  { nivel: 5, xp: 1900, patente: 'Root', prompt: 'root@servidor:/#' },
];

export const BADGES = {
  'chegou-cedo': 'check-in nos 3 primeiros minutos',
  'primeiro-sangue': 'primeiro XP do evento',
  historiador: 'acertou todo o quiz do módulo 0',
  vidente: '4 predições corretas',
  'mao-de-vidro': 'um lab inteiro aprovado na primeira submissão',
  autodidata: 'módulo completo sem gastar token',
  'pe-de-chumbo': 'combo ×1.3 atingido',
  'sobreviveu-ao-rm-rf': 'resetou o ambiente e terminou a tarefa mesmo assim',
  detetive: '3 diagnósticos de erro corretos',
  encanador: 'montou o pipe de 5 comandos do M4',
  dedetizador: 'matou o processo travado sem dica',
  'chamado-fechado': 'primeiro grupo a entregar o laudo',
  escapista: 'usou o kit de fuga sem pedir ajuda',
  faxineiro: 'resolveu o M2 em um comando só',
  mentor: '3 ajudas validadas',
  root: 'nível 5',
  'relatorio-entregue': 'preencheu o feedback',
};

export const CAPACIDADE_DO_GRUPO = 10;

/** nome e cor dos dez grupos (as cores viram a borda do card e do placar) */
export const GRUPOS_PADRAO = [
  ['azul', '#2563eb'],
  ['verde', '#16a34a'],
  ['vermelho', '#dc2626'],
  ['amarelo', '#ca8a04'],
  ['roxo', '#7c3aed'],
  ['laranja', '#ea580c'],
  ['ciano', '#0891b2'],
  ['rosa', '#db2777'],
  ['lima', '#65a30d'],
  ['grafite', '#475569'],
];

export function nivelDe(xp) {
  return NIVEIS.reduce((a, n) => (xp >= n.xp ? n : a), NIVEIS[0]);
}

export function criarJogo({ emitir, emitirPara }) {
  const participantes = new Map();   // id -> estado completo
  const grupos = new Map();
  const combos = new Map();          // id -> { mult, seguidos }
  const ledgerDaEquipe = new Map();  // nome da equipe -> XP conquistado por ela
  const contagens = new Map();       // id -> { predicoes, diagnosticos, ajudas, resets, tokensGastos }
  let multiplicadorGlobal = 1;       // evento "XP dobrado"
  let abertoEm = Date.now();

  /**
   * Dez grupos, até dez pessoas em cada. O tamanho de cada um é o que a turma
   * decidir: ninguém é empurrado para um grupo, e um grupo pequeno não é
   * penalizado porque o placar de grupo usa a média, não a soma.
   */
  for (const [nome, cor] of GRUPOS_PADRAO) {
    grupos.set(nome, { nome, cor, capacidade: CAPACIDADE_DO_GRUPO, membros: new Set(), papeis: {}, chat: [] });
    dao.salvarGrupo({ nome, cor, capacidade: CAPACIDADE_DO_GRUPO });
  }
  for (const g of dao.grupos()) {
    if (!grupos.has(g.nome)) grupos.set(g.nome, { nome: g.nome, cor: g.cor, capacidade: g.capacidade, membros: new Set(), papeis: {}, chat: [] });
  }

  const contador = (id) => {
    if (!contagens.has(id)) contagens.set(id, { predicoes: 0, diagnosticos: 0, ajudas: 0, resets: 0, tokensGastos: 0 });
    return contagens.get(id);
  };

  function recarregarDoBanco() {
    const xps = dao.xpTotais();
    for (const r of dao.participantes()) {
      participantes.set(r.id, {
        id: r.id, nick: r.nick, emoji: r.emoji, conta: r.conta, grupo: r.grupo, papel: r.papel,
        tokens: r.tokens, xp: xps[r.id] ?? 0, nivel: nivelDe(xps[r.id] ?? 0).nivel,
        presenca: 'desconectado', livre: false, visto: r.visto_em,
        criterios: dao.criteriosDe(r.id), badges: dao.badgesDe(r.id),
      });
      if (r.grupo && grupos.has(r.grupo)) grupos.get(r.grupo).membros.add(r.id);
    }
  }

  function publico(p) {
    return {
      id: p.id, nick: p.nick, emoji: p.emoji, xp: p.xp, tokens: p.tokens, nivel: p.nivel,
      grupo: p.grupo, papel: p.papel, presenca: p.presenca, livre: p.livre,
      criterios: p.criterios, badges: p.badges, conta: p.conta,
      combo: combos.get(p.id)?.mult ?? 1,
    };
  }

  /**
   * O placar.
   *
   * O de equipes conta o XP que a EQUIPE conquistou (os critérios do chamado),
   * e não a média do XP pessoal de quem está dentro. A média premiava trocar de
   * equipe: bastava pular para a que tinha gente com mais pontos e a sua
   * posição subia sem você fazer nada. Com o XP da equipe, só sobe quem
   * resolveu o chamado junto.
   *
   * A média pessoal continua aparecendo, como informação, mas não ordena nada.
   */
  function placar() {
    const individual = [...participantes.values()].map(publico).sort((a, b) => b.xp - a.xp);
    const porGrupo = [...grupos.values()].map((g) => {
      const membros = [...g.membros].map((id) => participantes.get(id)).filter(Boolean);
      const media = membros.length ? Math.round(membros.reduce((s, m) => s + m.xp, 0) / membros.length) : 0;
      return {
        nome: g.nome, cor: g.cor, capacidade: g.capacidade, papeis: g.papeis,
        xp: xpDaEquipe(g.nome), media, membros: membros.map(publico),
      };
    }).sort((a, b) => b.xp - a.xp || b.media - a.media);
    return { individual, grupos: porGrupo };
  }

  /** XP conquistado pela equipe: só os critérios fechados por ela */
  function xpDaEquipe(nome) {
    return ledgerDaEquipe.get(nome) ?? 0;
  }

  /** O único caminho por onde XP entra. Multiplicadores aplicados aqui. */
  function premiar(id, xpBase, tipo, referencia, { usarCombo = false } = {}) {
    const p = participantes.get(id);
    if (!p || xpBase <= 0) return 0;
    const mult = (usarCombo ? combos.get(id)?.mult ?? 1 : 1) * multiplicadorGlobal;
    const xp = Math.round(xpBase * mult);
    dao.lancarXp(id, xp, tipo, referencia);
    const antes = p.nivel;
    p.xp += xp;
    p.nivel = nivelDe(p.xp).nivel;
    emitirPara(id, 'xp', { xp, tipo, referencia, total: p.xp, mult });
    if (p.nivel > antes) {
      emitir('nivel', { id, nick: p.nick, nivel: p.nivel, patente: nivelDe(p.xp).patente });
      if (p.nivel === 5) darBadge(id, 'root');
    }
    if (dao.xpTotais() && [...participantes.values()].every((o) => o.id === id || o.xp === 0)) darBadge(id, 'primeiro-sangue');
    return xp;
  }

  function mexerTokens(id, delta, motivo) {
    const p = participantes.get(id);
    if (!p) return false;
    if (delta < 0 && p.tokens + delta < 0) return false;
    p.tokens += delta;
    if (delta < 0) contador(id).tokensGastos += -delta;
    dao.lancarToken(id, delta, motivo);
    dao.salvarParticipante(p);
    emitirPara(id, 'tokens', { saldo: p.tokens, delta, motivo });
    return true;
  }

  function darBadge(id, badge) {
    if (!BADGES[badge]) return;
    if (!dao.darBadge(id, badge)) return;
    const p = participantes.get(id);
    if (p) p.badges = dao.badgesDe(id);
    emitir('badge', { id, nick: p?.nick ?? '', badge, descricao: BADGES[badge] });
  }

  function mexerCombo(id, acertou) {
    const c = combos.get(id) ?? { mult: 1, seguidos: 0 };
    if (acertou) {
      c.seguidos += 1;
      c.mult = Math.min(1.3, 1 + Math.floor(c.seguidos / 2) * 0.1);
      if (c.mult >= 1.3) darBadge(id, 'pe-de-chumbo');
    } else {
      c.seguidos = 0;
      c.mult = 1;   // errar nunca tira XP: só zera o combo
    }
    combos.set(id, c);
    emitirPara(id, 'combo', { mult: c.mult, seguidos: c.seguidos });
  }

  /** registra XP no nome da equipe (critérios do chamado) */
  function premiarEquipe(nome, xp) {
    if (!nome || !xp) return;
    ledgerDaEquipe.set(nome, (ledgerDaEquipe.get(nome) ?? 0) + xp);
  }

  return {
    participantes, grupos, combos, contador, publico, placar, premiar, mexerTokens, premiarEquipe,
    darBadge, mexerCombo, recarregarDoBanco,
    get multiplicadorGlobal() { return multiplicadorGlobal; },
    set multiplicadorGlobal(v) { multiplicadorGlobal = v; },
    get abertoEm() { return abertoEm; },
    reiniciarRelogio() { abertoEm = Date.now(); },
  };
}
