/**
 * Diagnóstico de rede: "por que o outro computador não abre?"
 *
 * Roda no Mac que serve o workshop e verifica, em ordem, as coisas que
 * realmente impedem o acesso: o processo está no ar? está escutando em todas
 * as interfaces ou só no localhost? o firewall do macOS está bloqueando o
 * node? qual é o endereço para passar para a turma?
 *
 * Uso: npm run rede
 */
import { execSync } from 'node:child_process';
import { networkInterfaces } from 'node:os';

const PORTA = Number(process.env.PORT ?? 3000);
const ok = (t) => console.log(`  ✅ ${t}`);
const nao = (t, conserto) => { console.log(`  ❌ ${t}`); if (conserto) console.log(`     → ${conserto}`); };
const info = (t) => console.log(`  •  ${t}`);

const cmd = (c) => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };

console.log(`\n▸ Diagnóstico da porta ${PORTA}\n`);

// 1. tem alguém escutando?
const escutando = cmd(`lsof -nP -iTCP:${PORTA} -sTCP:LISTEN`);
if (!escutando) {
  nao('nada está escutando nessa porta', 'rode `npm start` em outro terminal e tente de novo');
  process.exit(1);
}
ok('o servidor está no ar');

// 2. escutando em todas as interfaces, ou só no localhost?
const soLocal = /127\.0\.0\.1:|\[::1\]:/.test(escutando) && !/\*:|0\.0\.0\.0:/.test(escutando);
if (soLocal) {
  nao('está escutando SÓ no localhost, então nenhum outro computador alcança',
      'o servidor deve subir em 0.0.0.0 (é o padrão deste projeto). Confira se não há PORT/HOST forçando localhost');
} else {
  ok('está escutando em todas as interfaces (0.0.0.0), que é o necessário para a rede');
}

// 3. firewall do macOS
const fw = cmd('/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate');
if (/enabled/i.test(fw)) {
  const bloqueado = cmd('/usr/libexec/ApplicationFirewall/socketfilterfw --listapps');
  const temNode = /node/i.test(bloqueado);
  nao('o firewall do macOS está LIGADO',
      temNode
        ? 'o node já aparece na lista: confirme que está como "Allow incoming connections" em Ajustes do Sistema > Rede > Firewall > Opções'
        : 'na primeira conexão o macOS pergunta se aceita conexões de entrada: responda PERMITIR. Se já recusou, vá em Ajustes do Sistema > Rede > Firewall > Opções e permita o node');
} else {
  ok('o firewall do macOS está desligado, nada bloqueando');
}

// 4. endereços para a turma
console.log('\n▸ Endereços\n');
let algum = false;
for (const [nome, ifaces] of Object.entries(networkInterfaces())) {
  for (const i of ifaces ?? []) {
    if (i.family !== 'IPv4' || i.internal) continue;
    algum = true;
    const tipo = nome.startsWith('en') ? 'Wi-Fi ou cabo' : nome.startsWith('bridge') ? 'ponte (VM)' : nome;
    console.log(`  http://${i.address}:${PORTA}   (${nome}, ${tipo})`);
  }
}
if (!algum) nao('o Mac não tem endereço de rede local', 'conecte no Wi-Fi da sala ou no roteador');

console.log('\n▸ Teste de verdade\n');
info('No OUTRO computador, abra o endereço acima. Se não abrir, teste nesta ordem:');
info('1. ping do outro computador para o IP do Mac. Falhou? É a rede, não o app.');
info('   Wi-Fi de faculdade costuma isolar os clientes entre si (AP isolation).');
info('   Solução: um roteador próprio, com todos conectados nele.');
info('2. ping funciona mas a página não abre? É firewall do Mac: permita o node.');
info('3. Abre mas fica "reconectando"? É o WebSocket. Confirme que não há proxy');
info('   configurado no navegador do outro computador.');
console.log('');
