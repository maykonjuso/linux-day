/**
 * As rodadas dos exercícios de escolha (src/components/widgets/Escolhas.tsx).
 * Ficam num .ts sem JSX para o teste ler direto com o Node (testes/novidades.mjs).
 * Toda rodada tem pelo menos 4 opções e exatamente uma certa; a ordem na tela
 * é embaralhada, então a certa pode ficar em qualquer posição aqui.
 */
export interface Rodada {
  contexto: string;          // o que está na tela / a mensagem / o comando
  pergunta: string;
  opcoes: { texto: string; certo?: boolean; porque: string }[];
  mono?: boolean;            // mostra o contexto como terminal
}

// ─────────────────────────── os bancos de rodadas ──────────────────────────

/** O kit de fuga: o conteúdo que mais destrava gente de verdade. */
export const ESCAPE: Rodada[] = [
  {
    mono: true, contexto: 'LS(1)                    User Commands\n\nNAME\n     ls - list directory contents\n\n:',
    pergunta: 'Você abriu o manual do ls e ele não fecha. Qual tecla te tira daqui?',
    opcoes: [
      { texto: 'q', certo: true, porque: 'q sai do man e do less. É a tecla que mais gente não conhece.' },
      { texto: 'Ctrl+C', porque: 'não faz nada aqui: o man não está "rodando", está exibindo.' },
      { texto: 'Esc', porque: 'não sai do man.' },
      { texto: 'fechar o terminal', porque: 'funciona, mas você perde a sessão sem precisar.' },
    ],
  },
  {
    mono: true, contexto: '~\n~\n~\n"arquivo.txt" [New]                      0,0-1',
    pergunta: 'Você abriu o vim sem querer. Como sai sem salvar?',
    opcoes: [
      { texto: 'Esc depois :q!', certo: true, porque: 'Esc sai do modo de inserção, :q! sai sem salvar. Decore: é a pergunta mais famosa da internet.' },
      { texto: 'Ctrl+X', porque: 'isso é o nano, não o vim.' },
      { texto: 'q', porque: 'o vim só entende q depois dos dois pontos.' },
      { texto: 'Ctrl+C', porque: 'ele avisa que não é assim que se sai.' },
    ],
  },
  {
    mono: true, contexto: '$ node app.js\napp no ar na porta 3000\n█',
    pergunta: 'Você rodou um programa e o prompt ($) não voltou. O que aconteceu, e o que fazer?',
    opcoes: [
      { texto: 'Está ocupado: Ctrl+C interrompe', certo: true, porque: 'não travou, está rodando. O Ctrl+C interrompe e devolve o prompt.' },
      { texto: 'O terminal travou, preciso fechar', porque: 'ele está ocupado, não travado. Essa confusão trava muita gente.' },
      { texto: 'O comando falhou', porque: 'ele imprimiu que está no ar: funcionou.' },
      { texto: 'Preciso reiniciar a máquina', porque: 'nunca precisa.' },
    ],
  },
];

export const PERIGO: Rodada[] = [
  {
    contexto: 'Quatro comandos parecidos. Um deles apaga coisas que você nunca mais recupera. No terminal não existe lixeira.',
    pergunta: 'Qual é o perigoso?',
    opcoes: [
      { texto: 'rm -rf ~', certo: true, porque: 'apaga a SUA CASA inteira, sem confirmar e sem volta. É o par de letras que você relê antes do Enter.' },
      { texto: 'rm -i *.log', porque: 'o -i pergunta antes de cada arquivo. É o modo covarde, e covarde é bom.' },
      { texto: 'rm tmp_*', porque: 'apaga só o que começa com tmp_.' },
      { texto: 'rm -r ~/tmp', porque: 'apaga uma pasta específica sua. Ruim se errar, mas limitado.' },
    ],
  },
  {
    contexto: 'Você está em /home/aluno/projeto e quer apagar a pasta build.',
    pergunta: 'Qual comando é seguro?',
    opcoes: [
      { texto: 'rm -r build', certo: true, porque: 'caminho relativo, dentro de onde você está. Confira com pwd antes.' },
      { texto: 'rm -rf /build', porque: 'a barra inicial aponta para a raiz do sistema, não para a sua pasta.' },
      { texto: 'sudo rm -rf build', porque: 'funciona, mas o sudo aqui é força desnecessária. É juntando sudo com rm -rf que as máquinas morrem.' },
      { texto: 'rm build', porque: 'dá erro: é uma pasta, falta o -r.' },
    ],
  },
];

export const PREVER: Rodada[] = [
  {
    mono: true, contexto: '$ node app/app.js',
    pergunta: 'O que acontece?',
    opcoes: [
      { texto: 'A app roda e o prompt NÃO volta', certo: true, porque: 'ela está ocupando o terminal. Para recuperar o prompt: Ctrl+C (encerra) ou rodar de novo com & no fim.' },
      { texto: 'A app roda e o prompt volta', porque: 'isso só com & no fim.' },
      { texto: 'Dá erro', porque: 'o arquivo existe: a app sobe normalmente.' },
      { texto: 'O terminal fecha', porque: 'o terminal continua aberto, só fica ocupado com a app.' },
    ],
  },
  {
    mono: true, contexto: '$ node app/app.js &',
    pergunta: 'E agora?',
    opcoes: [
      { texto: 'O prompt volta e aparece um número', certo: true, porque: 'o & solta o processo. O número é o PID, e é por ele que você encerra depois.' },
      { texto: 'Nada muda', porque: 'o & muda tudo: é o que libera o seu terminal.' },
      { texto: 'A app não sobe', porque: 'sobe, só não prende o terminal.' },
      { texto: 'A app sobe duas vezes', porque: 'o & não duplica nada: é a mesma app, só que em segundo plano.' },
    ],
  },
  {
    mono: true, contexto: '$ node app/app.js &\n[1] 4822\n$ kill 4822',
    pergunta: 'O que o kill 4822 faz?',
    opcoes: [
      { texto: 'Encerra o programa de PID 4822', certo: true, porque: 'kill + PID encerra aquele processo. É assim que você para um programa que está em segundo plano.' },
      { texto: 'Fecha o terminal', porque: 'o terminal continua aberto: só o processo 4822 é encerrado.' },
      { texto: 'Apaga o arquivo app.js', porque: 'kill mexe em processos, não em arquivos. Para apagar arquivo é rm.' },
      { texto: 'Pausa o programa até apertar Enter', porque: 'kill encerra. O programa não volta sozinho.' },
    ],
  },
];

export const ERROS: Rodada[] = [
  {
    mono: true, contexto: 'bash: cd: docs: No such file or directory',
    pergunta: 'Qual é a causa mais provável?',
    opcoes: [
      { texto: 'Você está em outro diretório', certo: true, porque: 'o caminho é relativo a onde você está. Reflexo: pwd e depois ls -la.' },
      { texto: 'Falta sudo', porque: 'não é permissão: o sistema diz que o caminho não existe.' },
      { texto: 'O comando cd não existe', porque: 'ele existe; a mensagem vem dele.' },
      { texto: 'A pasta docs está vazia', porque: 'pasta vazia também se entra com cd. O problema é que ela não existe onde você está.' },
    ],
  },
  {
    mono: true, contexto: 'bash: ./deploy.sh: Permission denied',
    pergunta: 'Qual é a causa desta mensagem?',
    opcoes: [
      { texto: 'Falta permissão de execução: chmod +x', certo: true, porque: 'o arquivo existe e você pode lê-lo, mas ninguém marcou que ele é executável.' },
      { texto: 'O arquivo não existe', porque: 'se não existisse, a mensagem seria No such file.' },
      { texto: 'Falta instalar o bash', porque: 'o bash está rodando. Foi ele que reclamou.' },
      { texto: 'O script tem erro de digitação', porque: 'erro dentro do script só aparece depois que ele começa a rodar, e ele nem começou.' },
    ],
  },
  {
    mono: true, contexto: 'bash: htop: command not found',
    pergunta: 'Qual é a causa desta mensagem?',
    opcoes: [
      { texto: 'O programa não está instalado nesta máquina', certo: true, porque: 'ou é erro de digitação. Instale com sudo apt install htop.' },
      { texto: 'Falta permissão', porque: 'permissão daria Permission denied.' },
      { texto: 'O htop está rodando', porque: 'nada está rodando: o shell não achou o programa.' },
      { texto: 'A máquina está sem memória', porque: 'falta de memória dá outra mensagem. Aqui o shell nem achou o programa.' },
    ],
  },
];
