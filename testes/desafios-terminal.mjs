/** Prova de força dos desafios feitos no PTY real: M1–M5 e corrida. */
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { io } from 'socket.io-client';

const PORTA = 3094;
const URL = `http://localhost:${PORTA}`;
let falhas = 0;
const ok = (c, msg, extra = '') => { console.log(`${c ? '✅' : '❌'} ${msg}${!c && extra ? ` ${extra}` : ''}`); if (!c) falhas++; };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const pedir = (s, evento, dados) => new Promise((r) => s.emit(evento, dados, r));
const limparAnsi = (s) => s.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '').replace(/\r/g, '');

for (const f of ['./data/desafios.db', './data/desafios.db-wal', './data/desafios.db-shm']) rmSync(f, { force: true });
rmSync('./data/casas-desafios', { recursive: true, force: true });
const servidor = spawn('node', ['server.mjs'], {
  env: { ...process.env, PORT: String(PORTA), NODE_ENV: 'production', ARENA_MODO: 'local', ARENA_DB: './data/desafios.db', ARENA_CASAS: './data/casas-desafios' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const encerrar = () => { try { servidor.kill('SIGKILL'); } catch { /* encerrado */ } };
process.on('uncaughtException', (e) => { console.error('\n❌', e); encerrar(); process.exit(1); });
process.on('unhandledRejection', (e) => { console.error('\n❌', e); encerrar(); process.exit(1); });
let erroServidor = '';
servidor.stderr.on('data', (d) => { erroServidor += String(d); });
const subiu = await new Promise((resolve) => {
  const t = setTimeout(() => resolve(false), 40_000);
  servidor.stdout.on('data', (d) => { if (String(d).includes('apresentador')) { clearTimeout(t); resolve(true); } });
});
ok(subiu, 'servidor da prova de força subiu', subiu ? '' : erroServidor.slice(-300));
if (!subiu) { encerrar(); process.exit(1); }

const socket = io(URL, { path: '/rt', transports: ['websocket'] });
let terminal = '';
socket.on('term:dados', (d) => { terminal += d; });
await new Promise((resolve) => socket.on('connect', resolve));
const entrada = await pedir(socket, 'entrar', { nick: 'Ana Teste', emoji: '🐧' });
ok(!!entrada?.eu?.conta, 'participante recebeu uma conta isolada');
await esperar(3500);
socket.emit('term:abrir', { cols: 110, rows: 30 });
await esperar(1200);

let sequencia = 0;
async function comando(script, timeout = 8_000) {
  const marca = `__FIM_${++sequencia}__`;
  const inicio = terminal.length;
  socket.emit('term:entrada', `${script}; printf '\\n${marca}:%s\\n' "$?"\n`);
  const limite = Date.now() + timeout;
  while (Date.now() < limite) {
    const trecho = limparAnsi(terminal.slice(inicio));
    // O terminal ecoa o comando digitado, inclusive o texto da marca. Só
    // termina quando a marca EXECUTADA aparece numa linha com o status; antes
    // disso o teste corria para o checker enquanto o comando ainda trabalhava.
    if (new RegExp(`(?:^|\\n)${marca}:\\d+(?:\\n|$)`).test(trecho)) return trecho;
    await esperar(80);
  }
  throw new Error(`timeout no terminal: ${script}`);
}
const verificar = (taskSlug, resposta = '') => pedir(socket, 'lab:verificar', { taskSlug, resposta });
const passou = (r, id) => r?.resultados?.find((x) => x.id === id)?.passou === true;
const nenhumPassou = (r) => (r?.resultados ?? []).every((x) => !x.passou);

console.log('\n▸ M1 · navegação e flag');
let r = await verificar('m1-flag', 'tux-inventado');
ok(nenhumPassou(r), 'M1 rejeita resposta inventada');
let out = await comando('cd ~/projetos && ls -la && cd 2024 && ls -la && cd .backup/antigo && cat flag.txt');
const flag = out.match(/tux-[0-9a-f]{6}/)?.[0];
ok(!!flag, 'M1 é navegável e a flag aparece com os comandos ensinados');
r = await verificar('m1-flag', flag ?? '');
ok(passou(r, 'm1-c1'), 'M1 termina ao enviar a flag encontrada');

console.log('\n▸ M2 · arquivos, glob e recuperação de desastre');
await comando('cd ~/bagunca && rm -rf -- *');
r = await verificar('m2-bagunca');
ok(nenhumPassou(r), 'M2 não aceita apagar tudo como solução');
const reset = await pedir(socket, 'lab:reset', null);
ok(reset?.ok, 'reset recupera o ambiente depois de uma remoção destrutiva');
await esperar(1000);
await comando('cd ~/bagunca && mkdir imagens docs scripts && mv *.png *.jpg imagens/ && mv rascunho.txt docs/notas.md && mv *.txt *.md docs/ && mv *.sh scripts/ && rm tmp_* && echo "organizado por anateste" > README.md');
r = await verificar('m2-bagunca');
ok(['m2-c1', 'm2-c2', 'm2-c3', 'm2-c4', 'm2-c5', 'm2-c6'].every((id) => passou(r, id)), 'M2 termina com a sequência descrita no enunciado', JSON.stringify(r?.resultados));

console.log('\n▸ M3 · criação, execução e permissões');
await comando("cd ~ && printf '#!/bin/bash\\n' > deploy.sh && chmod +x deploy.sh");
r = await verificar('m3-permissoes');
ok(passou(r, 'm3-c1') && !passou(r, 'm3-c2') && !passou(r, 'm3-c3'), 'M3 distingue script criado de script funcional e relatório legível');
await comando("echo 'echo deploy feito' >> ~/deploy.sh && ~/deploy.sh && chmod 644 ~/relatorio.txt && cat ~/relatorio.txt");
r = await verificar('m3-permissoes');
ok(['m3-c1', 'm3-c2', 'm3-c3'].every((id) => passou(r, id)), 'M3 termina usando somente os comandos ensinados');

console.log('\n▸ M4 · respostas e redirecionamento');
out = await comando("cd ~ && grep -c ERROR app.log && grep -oE '([0-9]{1,3}[.]){3}[0-9]{1,3}' app.log | sort | uniq -c | sort -rn | head -1");
const linhas = out.split('\n').map((x) => x.trim());
const quantidade = linhas.find((x) => /^\d{2,}$/.test(x));
const ip = out.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)?.[0];
ok(!!quantidade && !!ip, 'M4 produz as duas respostas pelo pipeline proposto', `(${quantidade ?? '?'}, ${ip ?? '?'}) ${JSON.stringify(out)}`);
r = await verificar('m4-pipes', 'resposta errada');
ok(nenhumPassou(r), 'M4 não aceita resposta errada nem arquivo ausente');
r = await verificar('m4-pipes', quantidade ?? '');
ok(passou(r, 'm4-c1') && !passou(r, 'm4-c2'), 'M4 aceita a contagem sem confundi-la com o IP');
r = await verificar('m4-pipes', ip ?? '');
ok(passou(r, 'm4-c2'), 'M4 aceita separadamente o IP mais frequente');
await comando('cd ~ && grep FATAL app.log > fatais.txt');
r = await verificar('m4-pipes');
ok(['m4-c1', 'm4-c2', 'm4-c3'].every((id) => passou(r, id)), 'M4 termina depois de gravar todas as linhas FATAL');

console.log('\n▸ corrida · pasta e arquivo da equipe');
const grupo = await pedir(socket, 'grupo:entrar', 'azul');
ok(grupo?.ok, 'participante entra na equipe antes da corrida');
r = await verificar('corrida-1');
ok(!passou(r, 'corrida-c1'), 'corrida não chega antes de criar pasta e arquivo');
await comando('mkdir -p ~/corrida && echo quase > ~/corrida/azul.txt');
r = await verificar('corrida-1');
ok(!passou(r, 'corrida-c1'), 'corrida rejeita arquivo correto com conteúdo errado');
await comando('mkdir -p ~/corrida && echo pronto > ~/corrida/azul.txt');
r = await verificar('corrida-1');
ok(passou(r, 'corrida-c1'), 'corrida termina no terminal individual com o nome da equipe');

console.log('\n▸ M5 · instalação, processo em segundo plano e kill');
out = await comando('cd ~ && cat ~/.pacote');
const pacote = out.split('\n').map((x) => x.trim()).find((x) => /^(cmatrix|jq|cowsay|figlet|ncdu|sl|neofetch|tree)$/.test(x));
ok(!!pacote, 'M5 informa um pacote válido para a pessoa');
out = await comando('sudo apt install -y pacote-que-nao-existe');
ok(/não está liberado/.test(out), 'M5 bloqueia pacote fora da atividade');
r = await verificar('m5-processos');
ok(nenhumPassou(r), 'M5 começa sem instalação, execução ou kill falsos', JSON.stringify(r?.resultados));
await comando(`sudo apt install -y ${pacote}`);
r = await verificar('m5-processos');
ok(passou(r, 'm5-c1') && !passou(r, 'm5-c2') && !passou(r, 'm5-c3'), 'M5 reconhece apenas a instalação neste estágio', JSON.stringify(r?.resultados));
await comando('cd ~ && node app/app.js >/tmp/app-arena.log 2>&1 & echo app-iniciada');
await esperar(500);
r = await verificar('m5-processos');
ok(passou(r, 'm5-c2') && !passou(r, 'm5-c3'), 'M5 reconhece a app viva antes de permitir o kill');
out = await comando("ps aux | grep '[a]pp/app.js'");
const linhaProcesso = out.split('\n').find((x) => /node app\/app\.js/.test(x) && !/printf/.test(x));
const pid = linhaProcesso?.trim().split(/\s+/)[1];
ok(/^\d+$/.test(pid ?? ''), 'M5 permite descobrir o PID pela segunda coluna do ps', `(${pid ?? '?'}) ${JSON.stringify(out)}`);
if (pid) await comando(`kill ${pid}`);
await esperar(300);
r = await verificar('m5-processos');
ok(['m5-c1', 'm5-c2', 'm5-c3'].every((id) => passou(r, id)), 'M5 termina após matar exatamente a app executada');

socket.close();
encerrar();
console.log(`\n${falhas === 0 ? '✅ TODOS OS DESAFIOS DE TERMINAL PASSARAM' : `❌ ${falhas} falha(s)`}`);
process.exit(falhas === 0 ? 0 : 1);
