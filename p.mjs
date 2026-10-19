import { io } from 'socket.io-client';
const conecta = () => io('http://localhost:3091', { path: '/rt', transports: ['websocket'] });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const s = conecta();
let saida = '', encerrado = null;
s.on('term:dados', (d) => { saida += d; });
s.on('terminal:encerrado', (d) => { encerrado = d.motivo; });
await espera(500);
await new Promise((r) => s.emit('entrar', { nick: 'Ana', emoji: '🐧' }, r));
await espera(2600);
s.emit('term:abrir', { cols: 90, rows: 24 });
await espera(1500);
console.log('prompt inicial:', (saida.match(/[a-z0-9]+@linuxday:[^$]*\$/) ?? ['NÃO APARECEU'])[0]);
console.log('aviso do zsh na tela:', /zsh/i.test(saida) ? 'SIM (ruim)' : 'não');

// troca de nome com o terminal aberto
saida = '';
const r = await new Promise((ok) => s.emit('renomear', { nick: 'Ana Clara' }, ok));
await espera(1200);
s.emit('term:entrada', 'whoami\n');
await espera(1200);
console.log('depois de renomear -> prompt:', (saida.match(/[a-z0-9]+@linuxday:[^$]*\$/) ?? ['?'])[0], '| whoami:', (saida.match(/\banaclara\b/) ?? ['?'])[0]);
console.log('terminal continua vivo:', saida.includes('anaclara') ? 'sim' : 'NÃO');

// vigia
console.log('\n▸ muitos processos (teto 25)');
s.emit('term:entrada', 'for i in $(seq 1 40); do sleep 300 & done; echo criados\n');
await espera(11000);
console.log('  encerrado pelo vigia:', encerrado ?? 'NÃO');
s.close(); process.exit(0);
