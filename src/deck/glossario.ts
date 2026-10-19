/**
 * As palavras que travam o iniciante. Cada uma em linguagem simples, com um
 * exemplo do dia a dia. Fica na gaveta de consulta, aberta a qualquer momento.
 *
 * Regra de escrita: frases curtas, sem jargão para explicar jargão.
 */
export const GLOSSARIO: { palavra: string; oque: string; exemplo: string }[] = [
  { palavra: 'terminal', oque: 'A janela preta onde você escreve comandos.', exemplo: 'É como conversar com o computador por mensagem, em vez de clicar.' },
  { palavra: 'shell', oque: 'O programa que fica dentro do terminal esperando o que você digita.', exemplo: 'Ele lê o que você escreveu, executa e espera o próximo.' },
  { palavra: 'prompt', oque: 'O texto que aparece antes do cursor.', exemplo: 'aluno@servidor:~$ quer dizer: eu sou aluno, na máquina servidor, dentro da minha casa.' },
  { palavra: 'comando', oque: 'O nome de um programa que você manda rodar.', exemplo: 'ls é um comando. Ele lista o que tem na pasta.' },
  { palavra: 'flag', oque: 'Um ajuste que muda como o comando funciona. Começa com - ou --.', exemplo: 'Em ls -la, o -la é a flag.' },
  { palavra: 'argumento', oque: 'A coisa em que o comando vai agir.', exemplo: 'Em cat notas.txt, o argumento é notas.txt.' },
  { palavra: 'diretório', oque: 'Outro nome para pasta.', exemplo: '/home/aluno/docs é um diretório.' },
  { palavra: 'caminho', oque: 'O endereço de um arquivo ou pasta.', exemplo: '~/docs/notas.md é o caminho do arquivo notas.md.' },
  { palavra: '~ (til)', oque: 'Atalho para a sua pasta pessoal.', exemplo: '~ é o mesmo que /home/aluno.' },
  { palavra: '.. (dois pontos)', oque: 'A pasta de cima.', exemplo: 'cd .. sobe um nível.' },
  { palavra: 'raiz (/)', oque: 'O começo de tudo no sistema de arquivos.', exemplo: 'Toda pasta está dentro de /, direta ou indiretamente.' },
  { palavra: 'permissão', oque: 'A regra de quem pode ler, escrever ou executar um arquivo.', exemplo: 'Se falta a permissão de execução, o script não roda.' },
  { palavra: 'root', oque: 'O usuário que pode tudo na máquina.', exemplo: 'É o administrador. Você empresta esse poder por um comando com sudo.' },
  { palavra: 'sudo', oque: 'Rodar um comando como administrador.', exemplo: 'sudo apt install htop instala um programa. A senha não aparece ao digitar.' },
  { palavra: 'processo', oque: 'Um programa que está rodando agora.', exemplo: 'Cada processo tem um número, o PID.' },
  { palavra: 'PID', oque: 'O número que identifica um processo.', exemplo: 'Para encerrar um programa travado: kill 4821.' },
  { palavra: 'primeiro plano', oque: 'O programa ocupa o seu terminal enquanto roda.', exemplo: 'O prompt só volta quando ele termina, ou com Ctrl+C.' },
  { palavra: 'segundo plano', oque: 'O programa roda solto e devolve o seu terminal.', exemplo: 'Acrescente & no fim: node app.js &' },
  { palavra: 'pipe ( | )', oque: 'Liga a saída de um comando na entrada do outro.', exemplo: 'ls | wc -l conta quantos arquivos tem na pasta.' },
  { palavra: 'redirecionar (>)', oque: 'Manda a saída do comando para um arquivo.', exemplo: 'ls > lista.txt grava a lista num arquivo. >> acrescenta no fim.' },
  { palavra: 'pacote', oque: 'Um programa pronto para instalar.', exemplo: 'sudo apt install htop baixa e instala o pacote htop.' },
  { palavra: 'repositório', oque: 'O lugar oficial de onde os pacotes vêm.', exemplo: 'É como a loja de aplicativos do sistema.' },
  { palavra: 'kernel', oque: 'O núcleo do sistema, que conversa com o hardware.', exemplo: 'Linux, na origem, é só o kernel.' },
  { palavra: 'distribuição', oque: 'O sistema completo: kernel mais programas.', exemplo: 'Ubuntu, Fedora e Debian são distribuições.' },
  { palavra: 'log', oque: 'Arquivo de texto onde os programas anotam o que aconteceu.', exemplo: 'Quando algo falha, a explicação está no log.' },
];
