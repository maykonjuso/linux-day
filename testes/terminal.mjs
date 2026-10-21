/**
 * O terminal sob estresse: prompt, troca de nome e as travas que protegem a
 * máquina de quem apresenta.
 *
 * Este teste existe porque o servidor roda no notebook de quem está
 * apresentando, com dezenas de pessoas digitando ao mesmo tempo. Se alguém
 * conseguir travar essa máquina, o workshop termina ali.
 *
 * Uso: npm run teste:terminal
 */
import { spawn, execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { io } from 'socket.io-client';

const PORTA = 3090;
let falhas = 0;
const ok = (c, msg, extra = '') => { console.log(`${c ? '✅' : '❌'} ${msg}${extra ? ` ${extra}` : ''}`); if (!c) falhas++; };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

try { execSync(`lsof -nP -iTCP:${PORTA} -sTCP:LISTEN -t | xargs kill -9`, { stdio: 'ignore' }); } catch { /* vazio */ }
try { execSync("pkill -f 'arena-teste-sleep'", { stdio: 'ignore' }); } catch { /* vazio */ }
for (const f of ['./data/term.db', './data/term.db-wal', './data/term.db-shm']) rmSync(f, { force: true });
rmSync('./data/casas-term', { recursive: true, force: true });

const srv = spawn('node', ['server.mjs'], {
  env: {
    ...process.env,
    PORT: String(PORTA), NODE_ENV: 'production',
    ARENA_DB: './data/term.db', ARENA_CASAS: './data/casas-term', ARENA_MODO: 'local',
    ARENA_MAX_CPU: '6',          // laço infinito morre em 6s de CPU
    ARENA_TETO_PROC: '20',       // o vigia encerra a sessão com mais de 20 processos
    ARENA_VIGIA_MS: '1500',      // vistoria rápida, para o teste não demorar
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const matar = () => { try { srv.kill('SIGKILL'); } catch { /* já morreu */ } };
process.on('uncaughtException', (e) => { console.error('\n❌', e.message); matar(); process.exit(1); });
let subiu = false;
await new Promise((r) => { const t = setTimeout(r, 40_000); srv.stdout.on('data', (d) => { if (String(d).includes('apresentador')) { subiu = true; clearTimeout(t); r(); } }); });
ok(subiu, 'servidor no ar');
if (!subiu) { matar(); process.exit(1); }

const URL = `http://localhost:${PORTA}`;
const s = io(URL, { path: '/rt', transports: ['websocket'] });
let saida = '';
let encerrado = null;
s.on('term:dados', (d) => { saida += d; });
s.on('terminal:encerrado', (d) => { encerrado = d.motivo; });
await espera(400);
const entrada = await new Promise((r) => s.emit('entrar', { nick: 'Ana', emoji: '🐧' }, r));
await espera(2600);
s.emit('term:abrir', { cols: 90, rows: 24 });
await espera(1800);

// ── isolamento real: sem segredos do servidor, host ou casa de colega ──
saida = '';
s.emit('term:entrada', 'printf "pin=%s db=%s\\n" "$PIN_HOST" "$ARENA_DB"; test ! -e /etc/passwd && echo host-oculto; test ! -e ../aluno02 && echo colega-oculto\n');
await espera(1200);
ok(/pin= db=/.test(saida), 'o PTY não herda segredos do processo servidor');
ok(/host-oculto/.test(saida), 'arquivos do sistema hospedeiro não existem no sandbox');
ok(/colega-oculto/.test(saida), 'cada participante tem um sistema de arquivos separado');

// o id é público; ele sozinho não pode anexar outro socket ao terminal
const intruso = io(URL, { path: '/rt', transports: ['websocket'] });
await espera(300);
const invasao = await new Promise((r) => intruso.emit('entrar', { id: entrada.eu.id, nick: 'Ana', emoji: '🐧' }, r));
ok(invasao?.erro === 'sessao-invalida', 'id público sem segredo não acessa o terminal de outra pessoa');
intruso.close();

// ── prompt ──
ok(/ana@linuxday:[^$]*\$/.test(saida), 'o prompt mostra o nome da pessoa', `(${(saida.match(/[a-z0-9]+@linuxday:[^$]*\$/) ?? ['nenhum'])[0]})`);
ok(!/bash-\d/.test(saida), 'não aparece o prompt padrão do bash');
ok(!/zsh/i.test(saida), 'não aparece o aviso do macOS sobre o zsh');

// ── troca de nome com o terminal aberto ──
saida = '';
await new Promise((r) => s.emit('renomear', { nick: 'Ana Clara' }, r));
await espera(1200);
s.emit('term:entrada', 'whoami\n');
await espera(1500);
ok(/anaclara@linuxday/.test(saida), 'trocar de nome muda o prompt na mesma sessão');
ok(/\banaclara\b/.test(saida), 'e o whoami passa a responder o nome novo');
s.emit('term:entrada', 'ls ~ | head -3\n');
await espera(1200);
ok(/bagunca|app|docs/.test(saida), 'o terminal continua vivo e os arquivos do lab estão lá');

// ── travas por processo ──
saida = '';
s.emit('term:entrada', 'ulimit -t\n');
await espera(1000);
ok(/^6$/m.test(saida), 'o limite de CPU por processo está aplicado', `(${(saida.match(/^\d+$/m) ?? ['?'])[0]}s)`);

// ── o vigia encerra uma sessão que cria processos demais ──
saida = '';
s.emit('term:entrada', 'for i in $(seq 1 30); do (exec -a arena-teste-sleep sleep 120) & done; echo criados\n');
await espera(7000);
ok(encerrado !== null, 'o vigia encerra a sessão que passa do teto de processos', `(${encerrado ?? 'não encerrou'})`);

// ── e o ambiente da pessoa sobrevive ao encerramento ──
s.emit('term:abrir', { cols: 90, rows: 24 });
await espera(1800);
saida = '';
s.emit('term:entrada', 'ls ~/bagunca | wc -l\n');
await espera(1500);
ok(/\d/.test(saida.replace(/[^\d]/g, '')), 'depois do encerramento o terminal reabre com os arquivos intactos');

try { execSync("pkill -f 'arena-teste-sleep'", { stdio: 'ignore' }); } catch { /* vazio */ }
s.close();
matar();
console.log(`\n${falhas === 0 ? '✅ TUDO PASSOU' : `❌ ${falhas} falha(s)`}`);
process.exit(falhas === 0 ? 0 : 1);
