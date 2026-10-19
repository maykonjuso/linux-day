import type { Cena } from './types';

/**
 * O deck. Conteúdo é código, não dado: uma cena pode ler estado ao vivo.
 * Ordem = ordem de apresentação. Roteiro em docs/plano-workshop.md §5.
 *
 * Estado do conteúdo: M0 e M1 completos; M2–M6 com as cenas-chave esboçadas.
 */
export const DECK: Cena[] = [
  // ─────────────────────────────── M0 · Introdução ───────────────────────────
  {
    id: 'm0-capa', tipo: 'ModuleCover', modulo: 0, passos: 1,
    titulo: 'O que é Linux, afinal',
    pergunta: 'De onde isso veio e por que está em tudo?',
    xpDoModulo: 630,
  },
  {
    id: 'm0-origem', tipo: 'TerminalDemo', modulo: 0, passos: 3,
    titulo: 'De onde veio',
    linhas: [
      { comando: '# 1983 — Richard Stallman começa o projeto GNU', saida: 'software livre: usar, estudar, modificar, distribuir', traducao: 'Primeiro vieram as ferramentas. Faltava o núcleo.' },
      { comando: '# 1991 — Linus Torvalds, 21 anos, Finlândia', saida: '"just a hobby, won\'t be big and professional like gnu"', destaque: "won't be big", traducao: 'Essa frase é dele. Envelheceu mal — e é a melhor parte da história.' },
      { comando: '# GNU + Linux = um sistema operacional completo', saida: 'licença GPL: o código é de todos, para sempre', traducao: 'É por isso que você pode baixar, abrir e mudar o que quiser.' },
    ],
  },
  {
    id: 'm0-q1', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Rodada 1 · pergunta 1',
    pergunta: 'Em que ano Linus Torvalds anunciou o Linux?',
    alternativas: [
      { id: 'a', texto: '1983' }, { id: 'b', texto: '1991' },
      { id: 'c', texto: '1998' }, { id: 'd', texto: '2004' },
    ],
    correta: 'b', segundos: 20,
    explicacao: '1991, num post num grupo de discussão. O projeto GNU, de 1983, já existia — o Linux veio completar o que faltava: o kernel.',
  },
  {
    id: 'm0-q2', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Rodada 1 · pergunta 2',
    pergunta: 'Que nome Linus queria dar ao sistema, antes de "Linux"?',
    alternativas: [
      { id: 'a', texto: 'Freax' }, { id: 'b', texto: 'Minix' },
      { id: 'c', texto: 'Tux' }, { id: 'd', texto: 'GNUx' },
    ],
    correta: 'a', segundos: 20,
    explicacao: '"Freax" (free + freak + x). Quem salvou o mundo foi o amigo que administrava o servidor e renomeou a pasta para "linux" sem pedir licença.',
  },
  {
    id: 'm0-q3', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Rodada 1 · pergunta 3',
    pergunta: 'Por que o mascote do Linux é um pinguim?',
    alternativas: [
      { id: 'a', texto: 'Porque pinguins vivem em colônias, como a comunidade' },
      { id: 'b', texto: 'Porque Linus foi mordido por um pinguim num zoológico' },
      { id: 'c', texto: 'Porque o Linux nasceu na Finlândia, onde faz frio' },
      { id: 'd', texto: 'Foi sorteado entre os desenvolvedores' },
    ],
    correta: 'b', segundos: 20,
    explicacao: 'Mordido por um pinguim num zoológico na Austrália. O mascote se chama Tux, e sim: um sistema que roda metade da internet tem esse nome por causa de uma mordida.',
  },
  {
    id: 'm0-kernel', tipo: 'MentalModel', modulo: 0, passos: 1,
    titulo: 'Kernel ≠ distribuição',
    diagrama: 'arvore',
    legenda: 'O Linux é só o núcleo. Uma distro é o núcleo + as ferramentas + o gerenciador de pacotes + a interface. Ubuntu, Fedora e Arch são distros diferentes com o mesmo coração.',
  },
  {
    id: 'm0-q4', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Rodada 2 · pergunta 1',
    pergunta: 'O que é, exatamente, "o Linux"?',
    alternativas: [
      { id: 'a', texto: 'Um sistema operacional completo' },
      { id: 'b', texto: 'O kernel — o núcleo que conversa com o hardware' },
      { id: 'c', texto: 'Uma interface gráfica' },
      { id: 'd', texto: 'Uma empresa' },
    ],
    correta: 'b', segundos: 20,
    explicacao: 'O kernel. O que você instala no computador é uma **distribuição**: kernel + ferramentas GNU + gerenciador de pacotes + ambiente gráfico.',
  },
  {
    id: 'm0-q5', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Rodada 3 · pergunta final',
    pergunta: 'Quantos dos 500 supercomputadores mais rápidos do mundo rodam Linux?',
    alternativas: [
      { id: 'a', texto: 'Uns 150' }, { id: 'b', texto: 'Cerca de 300' },
      { id: 'c', texto: '480' }, { id: 'd', texto: 'Todos os 500' },
    ],
    correta: 'd', segundos: 20,
    explicacao: 'Todos. Mais: seu Android é Linux, quase todo site que você abre roda em Linux, e a Estação Espacial também. Em 2 horas vocês vão administrar um.',
  },

  // ───────────────────────────── M1 · Navegação ──────────────────────────────
  {
    id: 'm1-capa', tipo: 'ModuleCover', modulo: 1, passos: 1,
    titulo: 'Cheguei no servidor',
    pergunta: 'Onde eu estou, como olho em volta e como me ajudo sozinho?',
    xpDoModulo: 150,
  },
  {
    id: 'm1-arvore', tipo: 'MentalModel', modulo: 1, passos: 1,
    titulo: 'O sistema de arquivos é uma árvore',
    diagrama: 'arvore',
    legenda: 'Tudo começa em / (a raiz). Sua casa é /home/aluno — e ~ é um atalho para ela. /home/aluno/docs e ~/docs são o mesmo lugar.',
  },
  {
    id: 'm1-prompt', tipo: 'CommandAnatomy', modulo: 1, passos: 1,
    titulo: 'O prompt é um mapa',
    comando: 'aluno@servidor:~$',
    partes: [
      { trecho: 'aluno', rotulo: 'quem eu sou' },
      { trecho: 'servidor', rotulo: 'em que máquina' },
      { trecho: '~', rotulo: 'onde eu estou (minha casa)' },
      { trecho: '$', rotulo: 'pode digitar' },
    ],
  },
  {
    id: 'm1-demo', tipo: 'TerminalDemo', modulo: 1, passos: 5,
    titulo: 'Olhando em volta',
    linhas: [
      { comando: 'whoami', saida: 'aluno', traducao: 'Quem eu sou nesta máquina.' },
      { comando: 'pwd', saida: '/home/aluno', traducao: 'Onde eu estou. Perdido? Este é sempre o primeiro comando.' },
      { comando: 'ls', saida: 'app  docs  bagunca', traducao: 'O que tem aqui.' },
      { comando: 'ls -la', saida: 'drwxr-xr-x 2 aluno aluno 4096 out 19 09:12 docs\n-rw-r--r-- 1 aluno aluno  220 out 19 09:12 .bashrc', destaque: 'drwxr-xr-x', traducao: 'A mesma coisa, com tudo: permissões, dono e os arquivos escondidos (que começam com ponto).' },
      { comando: 'cd docs && pwd', saida: '/home/aluno/docs', traducao: 'Entrei. E "cd .." volta um nível, "cd ~" volta para casa.' },
    ],
  },
  {
    id: 'm1-fuga', tipo: 'WillGoWrong', modulo: 1, passos: 1,
    titulo: 'O kit de fuga (decore estes)',
    erros: [
      { mensagem: 'a tela do man/less não fecha', significa: 'você está num visualizador, não travado', causa: 'aperte q' },
      { mensagem: 'abriu o vim e você não sai', significa: 'o vim espera comando, não texto', causa: 'Esc depois :q! e Enter' },
      { mensagem: 'o programa está rodando e o prompt não volta', significa: 'ele está ocupado, não travado', causa: 'Ctrl+C interrompe' },
      { mensagem: 'bash: cd: docs: No such file or directory', significa: 'não existe nada chamado docs aqui', causa: 'rode pwd e ls -la para se localizar' },
    ],
  },
  {
    id: 'm1-widget', tipo: 'WidgetScene', modulo: 1, passos: 1,
    titulo: 'Onde eu caio?',
    widget: 'path-quiz',
    enunciado: 'Clique na pasta onde você termina depois do comando.',
    segundos: 90,
    pontePara: 'cd ../..',
  },
  {
    id: 'm1-lab', tipo: 'LabScene', modulo: 1, passos: 3,
    titulo: 'Mão na massa · a flag escondida',
    taskSlug: 'm1-flag',
    objetivo: 'Em algum lugar da sua casa existe um arquivo flag.txt escondido. Ache e entregue o conteúdo dele.',
    criterios: [{ id: 'm1-c1', descricao: 'Entregar o conteúdo de flag.txt', xp: 150 }],
    comandosDoModulo: ['pwd', 'ls -la', 'cd', 'cat', 'Tab', '--help'],
    segundos: 360, escopo: 'individual',
  },
  {
    id: 'm1-recap', tipo: 'Recap', modulo: 1, passos: 2,
    titulo: 'Fecho do módulo 1',
    perguntaDeRecuperacao: 'Qual comando você usa quando não sabe onde está?',
    resumo: ['pwd', 'ls -la', 'cd', 'Tab', '--help', 'q'],
  },

  // ──────────────────── M2 · Arquivos (cenas-chave) ─────────────────────────
  {
    id: 'm2-capa', tipo: 'ModuleCover', modulo: 2, passos: 1,
    titulo: 'Mexendo nas coisas',
    pergunta: 'Como eu crio, movo, leio, edito e apago arquivos?',
    xpDoModulo: 240,
  },
  {
    id: 'm2-widget', tipo: 'WidgetScene', modulo: 2, passos: 1,
    titulo: 'Arrume a bagunça (com o mouse, antes do teclado)',
    widget: 'fs-dragdrop',
    enunciado: 'Arraste cada arquivo para a pasta certa. No fim, eu mostro os comandos mv que você acabou de executar.',
    segundos: 90,
    pontePara: 'mv *.png imagens/',
  },
  {
    id: 'm2-lab', tipo: 'LabScene', modulo: 2, passos: 3,
    titulo: 'Mão na massa · arrumando o diretório',
    taskSlug: 'm2-bagunca',
    objetivo: 'Organize ~/bagunca conforme a especificação. Cada item acende sozinho quando fica certo.',
    criterios: [
      { id: 'm2-c1', descricao: 'imagens/ com todos os .png e .jpg', xp: 40 },
      { id: 'm2-c2', descricao: 'docs/ com todos os .txt e .md', xp: 40 },
      { id: 'm2-c3', descricao: 'scripts/ com todos os .sh', xp: 40 },
      { id: 'm2-c4', descricao: 'rascunho.txt renomeado para docs/notas.md', xp: 40 },
      { id: 'm2-c5', descricao: 'nenhum arquivo tmp_* sobrando', xp: 40 },
      { id: 'm2-c6', descricao: 'README.md com a linha "organizado por <seu nick>"', xp: 40 },
    ],
    comandosDoModulo: ['mkdir -p', 'mv', 'cp', 'rm', 'cat', 'nano', '*', '>'],
    segundos: 480, escopo: 'individual',
  },

  // ─────────────────── M3 · Permissões (cenas-chave) ────────────────────────
  {
    id: 'm3-capa', tipo: 'ModuleCover', modulo: 3, passos: 1,
    titulo: 'Quem manda aqui',
    pergunta: 'Por que "permission denied"? O que é sudo?',
    xpDoModulo: 200,
  },
  {
    id: 'm3-cadeados', tipo: 'MentalModel', modulo: 3, passos: 1,
    titulo: 'Três cadeados em todo arquivo',
    diagrama: 'cadeados',
    legenda: 'Dono, grupo, outros. Cada um pode ler (r), escrever (w) e executar (x). É só isso — e o -rwxr-xr-- do ls -l é essa tabela escrita em uma linha.',
  },
  {
    id: 'm3-widget', tipo: 'WidgetScene', modulo: 3, passos: 1,
    titulo: 'Clique nos cadeados',
    widget: 'permission-toggles',
    enunciado: 'Clique para ligar e desligar cada permissão. Olhe o rwx e o número mudando ao vivo — e resolva os três desafios.',
    segundos: 120,
    pontePara: 'chmod 755 deploy.sh',
  },

  // ──────────────────── M4 · Pipes (cenas-chave) ────────────────────────────
  {
    id: 'm4-capa', tipo: 'ModuleCover', modulo: 4, passos: 1,
    titulo: 'O superpoder',
    pergunta: 'Como eu acho uma agulha no palheiro e ligo comandos entre si?',
    xpDoModulo: 350,
  },
  {
    id: 'm4-encanamento', tipo: 'MentalModel', modulo: 4, passos: 1,
    titulo: 'O pipe é um encanamento',
    diagrama: 'encanamento',
    legenda: 'Todo comando tem uma entrada e uma saída. O | liga a saída de um na entrada do outro. O > despeja o resultado num arquivo. É a ideia mais importante do Unix.',
  },
  {
    id: 'm4-widget', tipo: 'WidgetScene', modulo: 4, passos: 1,
    titulo: 'Monte o encanamento',
    widget: 'pipe-builder',
    enunciado: 'Arraste as peças para o encanamento. A cada peça, veja a saída se transformando: 50.000 linhas → 400 → o top 3.',
    segundos: 150,
    pontePara: 'grep ERROR app.log | cut -d" " -f4 | sort | uniq -c | sort -rn | head -3',
  },

  // ─────────────── M5 · Processos e o boss (cenas-chave) ────────────────────
  {
    id: 'm5-capa', tipo: 'ModuleCover', modulo: 5, passos: 1,
    titulo: 'Programas e processos',
    pergunta: 'Como instalo coisas e o que faço quando algo travou?',
    xpDoModulo: 280,
  },
  {
    id: 'm5-processo', tipo: 'MentalModel', modulo: 5, passos: 1,
    titulo: 'Um processo é uma caixa com número',
    diagrama: 'processo',
    legenda: 'Em foreground a caixa fica presa ao seu terminal: fechou, morreu. Com & ela solta e o prompt volta. O número é o PID — é por ele que você mata.',
  },
  {
    id: 'm6-capa', tipo: 'ModuleCover', modulo: 6, passos: 1,
    titulo: 'O Chamado',
    pergunta: 'Consigo juntar tudo e consertar um servidor quebrado?',
    xpDoModulo: 700,
  },
  {
    id: 'm6-boss', tipo: 'LabScene', modulo: 6, passos: 3,
    titulo: 'Boss · o relatório da madrugada não rodou',
    taskSlug: 'boss-chamado',
    objetivo: 'Seu grupo recebeu o chamado. Quatro defeitos, quatro cartas de função. Nada aqui é novo: tudo está nos últimos 50 minutos.',
    criterios: [
      { id: 'b-c1', descricao: 'Investigador: achou o log e a mensagem de erro', xp: 150 },
      { id: 'b-c2', descricao: 'Operador: achou e matou o processo travado', xp: 150 },
      { id: 'b-c3', descricao: 'Mecânico: backup.sh executável e rodado', xp: 150 },
      { id: 'b-c4', descricao: 'Relator: laudo.txt com grupo, contagem de ERROR e o PID morto', xp: 250 },
    ],
    comandosDoModulo: ['find', 'grep -c', 'ps aux', 'kill', 'ls -l', 'chmod +x', '>'],
    segundos: 600, escopo: 'grupo',
  },
  {
    id: 'fim-placar', tipo: 'Scoreboard', modulo: 6, passos: 1,
    titulo: 'Placar final', escopo: 'grupo',
  },
  {
    id: 'fim-pacote', tipo: 'Recap', modulo: 6, passos: 2,
    titulo: 'O que vocês sabem fazer agora',
    perguntaDeRecuperacao: 'Você abre um Linux desconhecido. Quais são os dois primeiros comandos?',
    resumo: ['pwd', 'ls -la', 'cd', 'cat', 'nano', 'chmod', 'sudo', 'grep', 'find', '|', '>', 'ps', 'kill', 'apt install', '--help'],
  },
];

export const CENAS_POR_MODULO = DECK.reduce<Record<number, number>>((acc, c) => {
  acc[c.modulo] = (acc[c.modulo] ?? 0) + 1;
  return acc;
}, {});
