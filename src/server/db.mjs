/**
 * Persistência. `node:sqlite` vem embutido no Node 24 — zero dependência
 * nativa para instalar na VM, e o banco é um arquivo que você copia para o
 * SSD externo no meio do evento se precisar.
 *
 * O que é persistido e por quê: se o processo cair no minuto 70 (e é o seu
 * Mac apresentando, então pode cair), ninguém perde XP, grupo nem critério.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const ARQUIVO = process.env.ARENA_DB ?? './data/arena.db';

mkdirSync(dirname(ARQUIVO), { recursive: true });
const db = new DatabaseSync(ARQUIVO);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS participantes (
    id TEXT PRIMARY KEY, nick TEXT NOT NULL, emoji TEXT NOT NULL,
    conta TEXT, grupo TEXT, papel TEXT, tokens INTEGER NOT NULL DEFAULT 3,
    criado_em INTEGER NOT NULL, visto_em INTEGER NOT NULL
  );

  -- livro-caixa append-only: nunca atualizamos XP, só acrescentamos linhas.
  -- É o que permite estornar uma tarefa quebrada ao vivo sem corromper o placar.
  CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participante_id TEXT NOT NULL, xp INTEGER NOT NULL,
    tipo TEXT NOT NULL, referencia TEXT, em INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS ix_ledger_p ON ledger(participante_id);

  CREATE TABLE IF NOT EXISTS tokens_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participante_id TEXT NOT NULL, delta INTEGER NOT NULL,
    motivo TEXT NOT NULL, em INTEGER NOT NULL
  );

  -- idempotência do XP por critério: reenviar o Verificar não pontua 2x
  CREATE TABLE IF NOT EXISTS criterios_premiados (
    dono TEXT NOT NULL, criterio_id TEXT NOT NULL, em INTEGER NOT NULL,
    PRIMARY KEY (dono, criterio_id)
  );

  CREATE TABLE IF NOT EXISTS respostas (
    chave TEXT PRIMARY KEY, cena_id TEXT NOT NULL, participante_id TEXT NOT NULL,
    alternativa TEXT, restante INTEGER, em INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS badges (
    participante_id TEXT NOT NULL, badge TEXT NOT NULL, em INTEGER NOT NULL,
    PRIMARY KEY (participante_id, badge)
  );

  CREATE TABLE IF NOT EXISTS submissoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dono TEXT NOT NULL, task TEXT NOT NULL, resultado TEXT NOT NULL, em INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS grupos (
    nome TEXT PRIMARY KEY, cor TEXT NOT NULL, capacidade INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS estado (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);

  -- a foto fica fora da linha da pessoa: o placar vai para todas as telas a
  -- cada ponto, e não pode carregar 30 KB por pessoa junto
  CREATE TABLE IF NOT EXISTS fotos (
    participante_id TEXT PRIMARY KEY, mime TEXT NOT NULL, dados BLOB NOT NULL, versao INTEGER NOT NULL
  );
`);

const q = {
  upsertParticipante: db.prepare(`
    INSERT INTO participantes (id, nick, emoji, conta, grupo, papel, tokens, criado_em, visto_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET nick = excluded.nick, emoji = excluded.emoji,
      grupo = excluded.grupo, papel = excluded.papel, tokens = excluded.tokens, visto_em = excluded.visto_em`),
  participantes: db.prepare('SELECT * FROM participantes'),
  ledgerInsert: db.prepare('INSERT INTO ledger (participante_id, xp, tipo, referencia, em) VALUES (?, ?, ?, ?, ?)'),
  xpPorParticipante: db.prepare('SELECT participante_id id, COALESCE(SUM(xp), 0) xp FROM ledger GROUP BY participante_id'),
  tokenInsert: db.prepare('INSERT INTO tokens_ledger (participante_id, delta, motivo, em) VALUES (?, ?, ?, ?)'),
  premiarCriterio: db.prepare('INSERT OR IGNORE INTO criterios_premiados (dono, criterio_id, em) VALUES (?, ?, ?)'),
  criteriosDe: db.prepare('SELECT criterio_id FROM criterios_premiados WHERE dono = ?'),
  todosCriterios: db.prepare('SELECT dono, criterio_id FROM criterios_premiados'),
  resposta: db.prepare('SELECT * FROM respostas WHERE chave = ?'),
  respostaInsert: db.prepare('INSERT OR IGNORE INTO respostas (chave, cena_id, participante_id, alternativa, restante, em) VALUES (?, ?, ?, ?, ?, ?)'),
  respostasDaCena: db.prepare('SELECT * FROM respostas WHERE cena_id = ?'),
  badgeInsert: db.prepare('INSERT OR IGNORE INTO badges (participante_id, badge, em) VALUES (?, ?, ?)'),
  badgesDe: db.prepare('SELECT badge FROM badges WHERE participante_id = ?'),
  submissaoInsert: db.prepare('INSERT INTO submissoes (dono, task, resultado, em) VALUES (?, ?, ?, ?)'),
  grupoUpsert: db.prepare('INSERT INTO grupos (nome, cor, capacidade) VALUES (?, ?, ?) ON CONFLICT(nome) DO UPDATE SET cor = excluded.cor, capacidade = excluded.capacidade'),
  grupos: db.prepare('SELECT * FROM grupos'),
  estadoSet: db.prepare('INSERT INTO estado (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor'),
  estadoGet: db.prepare('SELECT valor FROM estado WHERE chave = ?'),
  fotoSet: db.prepare('INSERT INTO fotos (participante_id, mime, dados, versao) VALUES (?, ?, ?, ?) ON CONFLICT(participante_id) DO UPDATE SET mime = excluded.mime, dados = excluded.dados, versao = excluded.versao'),
  fotoGet: db.prepare('SELECT mime, dados, versao FROM fotos WHERE participante_id = ?'),
  fotoApagar: db.prepare('DELETE FROM fotos WHERE participante_id = ?'),
  fotosVersoes: db.prepare('SELECT participante_id id, versao FROM fotos'),
};

export const dao = {
  salvarParticipante(p) {
    q.upsertParticipante.run(p.id, p.nick, p.emoji, p.conta ?? null, p.grupo ?? null, p.papel ?? null, p.tokens, p.criadoEm ?? Date.now(), Date.now());
  },
  participantes: () => q.participantes.all(),
  lancarXp(id, xp, tipo, referencia) { q.ledgerInsert.run(id, xp, tipo, referencia ?? null, Date.now()); },
  xpTotais: () => Object.fromEntries(q.xpPorParticipante.all().map((r) => [r.id, r.xp])),
  lancarToken(id, delta, motivo) { q.tokenInsert.run(id, delta, motivo, Date.now()); },
  /** true se foi a primeira vez (ou seja: pode pontuar) */
  premiarCriterio(dono, criterioId) { return q.premiarCriterio.run(dono, criterioId, Date.now()).changes > 0; },
  criteriosDe: (dono) => q.criteriosDe.all(dono).map((r) => r.criterio_id),
  todosCriterios: () => q.todosCriterios.all(),
  resposta: (chave) => q.resposta.get(chave),
  registrarResposta(chave, cenaId, pid, alternativa, restante) {
    return q.respostaInsert.run(chave, cenaId, pid, alternativa ?? null, restante ?? null, Date.now()).changes > 0;
  },
  respostasDaCena: (cenaId) => q.respostasDaCena.all(cenaId),
  darBadge(id, badge) { return q.badgeInsert.run(id, badge, Date.now()).changes > 0; },
  badgesDe: (id) => q.badgesDe.all(id).map((r) => r.badge),
  registrarSubmissao(dono, task, resultado) { q.submissaoInsert.run(dono, task, JSON.stringify(resultado), Date.now()); },
  salvarGrupo(g) { q.grupoUpsert.run(g.nome, g.cor, g.capacidade); },
  grupos: () => q.grupos.all(),
  setEstado(chave, valor) { q.estadoSet.run(chave, JSON.stringify(valor)); },
  salvarFoto(id, mime, dados) { const versao = Date.now(); q.fotoSet.run(id, mime, dados, versao); return versao; },
  foto: (id) => q.fotoGet.get(id),
  apagarFoto(id) { q.fotoApagar.run(id); },
  versoesDasFotos: () => Object.fromEntries(q.fotosVersoes.all().map((r) => [r.id, r.versao])),
  getEstado(chave) {
    const r = q.estadoGet.get(chave);
    return r ? JSON.parse(r.valor) : null;
  },
};

export default dao;
