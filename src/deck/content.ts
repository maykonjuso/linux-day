import type { Cena } from './types';

/**
 * O DECK.
 *
 * Conteúdo é código, não dado: uma cena pode ler estado ao vivo (placar,
 * critérios, grupo). Ordem = ordem de apresentação, e o apresentador só aperta
 * "próximo": quem sabe o que isso significa é a cena.
 *
 * Roteiro didático completo (o que dizer, em que ordem, e por quê):
 * docs/plano-workshop.md §5. Cada LabScene casa com um checker em
 * src/server/labs.mjs pelo `taskSlug`.
 */
export const DECK: Cena[] = [
  // ════════════════════════════ ABERTURA ════════════════════════════════════
  {
    id: 'abertura', tipo: 'ModuleCover', modulo: 0, passos: 1,
    titulo: 'Linux Day',
    pergunta: 'Duas horas. Do "nunca abri um terminal" a consertar um servidor quebrado.',
    xpDoModulo: 2800,
  },
  {
    id: 'abertura-grupos', tipo: 'GroupScene', modulo: 0, passos: 1,
    titulo: 'Escolham seu grupo',
    enunciado: 'Entre num grupo (dá para trocar depois). O placar de grupos conta pela MÉDIA, não pela soma — ninguém ganha por ter mais gente, e ninguém culpa o colega mais lento.',
  },

  // ═══════════════════════ M0 · INTRODUÇÃO (KAHOOT) ═════════════════════════
  {
    id: 'm0-capa', tipo: 'ModuleCover', modulo: 0, passos: 1,
    titulo: 'O que é Linux, afinal',
    pergunta: 'De onde isso veio e por que está em tudo?',
    xpDoModulo: 630,
  },
  {
    id: 'm0-origem', tipo: 'TerminalDemo', modulo: 0, passos: 3,
    titulo: 'Ciclo 1 · de onde veio',
    linhas: [
      { comando: '# 1983 — Richard Stallman começa o projeto GNU', saida: 'software livre: usar, estudar, modificar, distribuir', traducao: 'Primeiro vieram as ferramentas. Faltava o núcleo.' },
      { comando: '# 1991 — Linus Torvalds, 21 anos, Finlândia', saida: '"just a hobby, won\'t be big and professional like gnu"', destaque: "won't be big", traducao: 'Essa frase é dele, no anúncio original. Envelheceu mal — e é a melhor parte da história.' },
      { comando: '# GNU + Linux = um sistema operacional completo', saida: 'licença GPL: o código é de todos, e continua sendo', traducao: 'É por isso que você pode baixar, abrir, mudar e revender o que quiser.' },
    ],
  },
  {
    id: 'm0-q1', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Ciclo 1 · pergunta 1',
    pergunta: 'Em que ano Linus Torvalds anunciou o Linux?',
    alternativas: [{ id: 'a', texto: '1983' }, { id: 'b', texto: '1991' }, { id: 'c', texto: '1998' }, { id: 'd', texto: '2004' }],
    correta: 'b', segundos: 20,
    explicacao: '1991, num post num grupo de discussão. O projeto GNU, de 1983, já existia — o Linux veio completar o que faltava: o kernel.',
  },
  {
    id: 'm0-q2', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Ciclo 1 · pergunta 2',
    pergunta: 'Que nome Linus queria dar ao sistema, antes de "Linux"?',
    alternativas: [{ id: 'a', texto: 'Freax' }, { id: 'b', texto: 'Minix' }, { id: 'c', texto: 'Tux' }, { id: 'd', texto: 'GNUx' }],
    correta: 'a', segundos: 20,
    explicacao: '"Freax" (free + freak + x). Quem salvou o mundo foi o amigo que administrava o servidor e renomeou a pasta para "linux" sem pedir licença.',
  },
  {
    id: 'm0-q3', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Ciclo 1 · pergunta 3',
    pergunta: 'Por que o mascote do Linux é um pinguim?',
    alternativas: [
      { id: 'a', texto: 'Pinguins vivem em colônias, como a comunidade' },
      { id: 'b', texto: 'Linus foi mordido por um pinguim num zoológico' },
      { id: 'c', texto: 'Porque o Linux nasceu na Finlândia' },
      { id: 'd', texto: 'Foi sorteado entre os desenvolvedores' },
    ],
    correta: 'b', segundos: 20,
    explicacao: 'Mordido por um pinguim num zoológico na Austrália. O mascote se chama Tux — e sim: um sistema que roda metade da internet tem esse símbolo por causa de uma mordida.',
  },
  {
    id: 'm0-kernel', tipo: 'MentalModel', modulo: 0, passos: 1,
    titulo: 'Ciclo 2 · kernel ≠ distribuição',
    diagrama: 'arvore',
    legenda: 'O Linux é só o núcleo: ele conversa com o hardware. Uma distro é o núcleo + as ferramentas GNU + o gerenciador de pacotes + a interface. Debian → Ubuntu → Mint. Red Hat → Fedora → Rocky. Arch → Manjaro. Mesmo coração, embalagens diferentes.',
  },
  {
    id: 'm0-q4', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Ciclo 2 · pergunta 1',
    pergunta: 'O que é, exatamente, "o Linux"?',
    alternativas: [
      { id: 'a', texto: 'Um sistema operacional completo' },
      { id: 'b', texto: 'O kernel — o núcleo que conversa com o hardware' },
      { id: 'c', texto: 'Uma interface gráfica' },
      { id: 'd', texto: 'Uma empresa' },
    ],
    correta: 'b', segundos: 20,
    explicacao: 'O kernel. O que você instala na máquina é uma distribuição: kernel + ferramentas + gerenciador de pacotes + ambiente gráfico.',
  },
  {
    id: 'm0-q5', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Ciclo 2 · pergunta 2',
    pergunta: 'Ubuntu é baseado em qual distribuição?',
    alternativas: [{ id: 'a', texto: 'Fedora' }, { id: 'b', texto: 'Arch' }, { id: 'c', texto: 'Debian' }, { id: 'd', texto: 'Alpine' }],
    correta: 'c', segundos: 20,
    explicacao: 'Debian. E é por isso que no Ubuntu você usa `apt` — o gerenciador de pacotes da família Debian. Guardem essa palavra: ela volta no módulo 5.',
  },
  {
    id: 'm0-q6', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Ciclo 2 · pergunta 3',
    pergunta: 'Qual comando instala programas numa máquina Ubuntu?',
    alternativas: [{ id: 'a', texto: 'install' }, { id: 'b', texto: 'apt' }, { id: 'c', texto: 'brew' }, { id: 'd', texto: 'yum' }],
    correta: 'b', segundos: 20,
    explicacao: '`apt`. O `brew` é do macOS, o `yum`/`dnf` é da família Red Hat. Vocês vão rodar um `apt install` de verdade hoje.',
  },
  {
    id: 'm0-onde', tipo: 'TerminalDemo', modulo: 0, passos: 4,
    titulo: 'Ciclo 3 · onde o Linux está',
    linhas: [
      { comando: '# o celular de vocês', saida: 'Android roda sobre o kernel Linux', traducao: 'Quase todo mundo nesta sala usa Linux todos os dias, sem saber.' },
      { comando: '# a internet', saida: 'a maioria absoluta dos servidores web roda Linux', traducao: 'Todo site que vocês abriram hoje passou por uma máquina Linux.' },
      { comando: '# os 500 supercomputadores mais rápidos do mundo', saida: '500 de 500', destaque: '500 de 500', traducao: 'Não é "a maioria". É todos.' },
      { comando: '# e o Git?', saida: 'também foi criado pelo Linus, para versionar o kernel', traducao: 'A ferramenta que vocês usam na faculdade nasceu deste mesmo projeto.' },
    ],
  },
  {
    id: 'm0-q7', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Ciclo 3 · pergunta 1',
    pergunta: 'Qual destes NÃO roda sobre o kernel Linux?',
    alternativas: [{ id: 'a', texto: 'Android' }, { id: 'b', texto: 'ChromeOS' }, { id: 'c', texto: 'iOS' }, { id: 'd', texto: 'Steam Deck' }],
    correta: 'c', segundos: 20,
    explicacao: 'iOS. Android, ChromeOS e o Steam Deck são todos Linux por baixo.',
  },
  {
    id: 'm0-q8', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Ciclo 3 · pergunta 2',
    pergunta: 'Quantos dos 500 supercomputadores mais rápidos do mundo rodam Linux?',
    alternativas: [{ id: 'a', texto: 'Uns 150' }, { id: 'b', texto: 'Cerca de 300' }, { id: 'c', texto: '480' }, { id: 'd', texto: 'Todos os 500' }],
    correta: 'd', segundos: 20,
    explicacao: 'Todos. Quando o assunto é máquina séria, não existe alternativa — e é por isso que saber se virar num terminal muda a sua empregabilidade.',
  },
  {
    id: 'm0-q9', tipo: 'QuizScene', modulo: 0, passos: 4,
    titulo: 'Ciclo 3 · pergunta final',
    pergunta: 'Qual outra ferramenta que vocês usam foi criada pelo Linus Torvalds?',
    alternativas: [{ id: 'a', texto: 'Docker' }, { id: 'b', texto: 'Git' }, { id: 'c', texto: 'VS Code' }, { id: 'd', texto: 'Python' }],
    correta: 'b', segundos: 20,
    explicacao: 'Git — ele precisava versionar o kernel e não gostou de nada que existia. Agora chega de história: vamos abrir o terminal.',
  },

  // ═══════════════════════════ M1 · NAVEGAÇÃO ═══════════════════════════════
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
    legenda: 'Tudo começa em / (a raiz). Sua casa é /home/aluno, e ~ é um atalho para ela. /home/aluno/docs e ~/docs são o mesmo lugar escrito de duas formas.',
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
    id: 'm1-demo', tipo: 'TerminalDemo', modulo: 1, passos: 6,
    titulo: 'Olhando em volta',
    linhas: [
      { comando: 'whoami', saida: 'aluno', traducao: 'Quem eu sou nesta máquina.' },
      { comando: 'pwd', saida: '/home/aluno', traducao: 'Onde eu estou. Perdido? Este é sempre o primeiro comando.' },
      { comando: 'ls', saida: 'app  bagunca  docs  projetos', traducao: 'O que tem aqui.' },
      { comando: 'ls -la', saida: 'drwxr-xr-x  2 aluno aluno  4096 out 19 09:12 docs\n-rw-r--r--  1 aluno aluno   220 out 19 09:12 .bashrc', destaque: 'drwxr-xr-x', traducao: 'A mesma coisa com tudo: permissões, dono, e os escondidos (que começam com ponto). Olhem só três colunas por enquanto.' },
      { comando: 'cd docs && pwd', saida: '/home/aluno/docs', traducao: 'Entrei. "cd .." volta um nível, "cd ~" volta para casa, "cd -" volta para onde eu estava.' },
      { comando: 'ls --help | head -3', saida: 'Usage: ls [OPTION]... [FILE]...\nList information about the FILEs', traducao: 'Nunca mais precisam decorar nada: todo comando explica a si mesmo. E no `man`, sair é com q.' },
    ],
  },
  {
    id: 'm1-fuga', tipo: 'WillGoWrong', modulo: 1, passos: 1,
    titulo: 'O kit de fuga (os 5 minutos de maior retorno do dia)',
    erros: [
      { mensagem: 'a tela do man/less não fecha', significa: 'você está num visualizador, não travado', causa: 'aperte q' },
      { mensagem: 'abriu o vim e você não sai', significa: 'o vim espera comando, não texto', causa: 'Esc, depois :q! e Enter' },
      { mensagem: 'o programa roda e o prompt não volta', significa: 'ele está ocupado, não travado', causa: 'Ctrl+C interrompe' },
      { mensagem: 'a tela virou uma bagunça visual', significa: 'só sujeira de saída antiga', causa: 'Ctrl+L limpa' },
      { mensagem: 'Ctrl+C não copiou meu texto', significa: 'no terminal, Ctrl+C interrompe', causa: 'copiar é Ctrl+Shift+C, colar é Ctrl+Shift+V' },
    ],
  },
  {
    id: 'm1-fuga-widget', tipo: 'WidgetScene', modulo: 1, passos: 1,
    titulo: 'Qual tecla te salva?',
    widget: 'escape-room',
    enunciado: 'Três telas em que todo iniciante trava. Para cada uma, escolha a saída. Errar aqui não custa nada — é para isso que este exercício existe.',
    segundos: 60, pontePara: 'q · Esc :q! · Ctrl+C',
  },
  {
    id: 'm1-widget', tipo: 'WidgetScene', modulo: 1, passos: 1,
    titulo: 'Onde eu caio?',
    widget: 'path-quiz',
    enunciado: 'Clique na pasta onde você termina depois do comando. Caminho relativo deixa de ser abstrato antes de você digitar o primeiro cd.',
    segundos: 90, pontePara: 'cd ../..',
  },
  {
    id: 'm1-lab', tipo: 'LabScene', modulo: 1, passos: 3,
    titulo: 'Mão na massa · a flag escondida',
    taskSlug: 'm1-flag',
    objetivo: 'Em algum lugar da sua casa existe um arquivo flag.txt escondido, quatro níveis abaixo. Ache, abra, e cole o conteúdo aqui. (sua flag é só sua: copiar a do colega não funciona — copiar o comando dele funciona, e isso é aprendizado)',
    criterios: [{ id: 'm1-c1', descricao: 'Entregar o conteúdo de flag.txt', xp: 150 }],
    comandosDoModulo: ['pwd', 'ls -la', 'cd', 'cat', 'find', 'Tab', '--help'],
    segundos: 360, escopo: 'individual',
  },
  {
    id: 'm1-recap', tipo: 'Recap', modulo: 1, passos: 2,
    titulo: 'Fecho do módulo 1',
    perguntaDeRecuperacao: 'Você está perdido numa máquina qualquer. Quais são os dois primeiros comandos?',
    resumo: ['pwd', 'ls -la', 'cd', 'cat', 'Tab', '↑', '--help', 'q', 'Ctrl+C'],
  },

  // ════════════════════════════ M2 · ARQUIVOS ═══════════════════════════════
  {
    id: 'm2-capa', tipo: 'ModuleCover', modulo: 2, passos: 1,
    titulo: 'Mexendo nas coisas',
    pergunta: 'Como eu crio, movo, leio, edito e apago arquivos?',
    xpDoModulo: 240,
  },
  {
    id: 'm2-demo', tipo: 'TerminalDemo', modulo: 2, passos: 7,
    titulo: 'Criar, mover, ler, editar',
    linhas: [
      { comando: 'mkdir -p projeto/src && tree projeto', saida: 'projeto\n└── src', traducao: 'O -p cria o caminho inteiro de uma vez, sem reclamar se já existir.' },
      { comando: 'touch projeto/src/app.js && ls projeto/src', saida: 'app.js', traducao: 'touch cria um arquivo vazio.' },
      { comando: 'mv projeto/src/app.js projeto/src/main.js', saida: '', traducao: 'Renomear É mover: mesmo comando, mesmo lugar, nome novo. É a confusão nº 1 do módulo.' },
      { comando: 'echo "primeira linha" > notas.txt && cat notas.txt', saida: 'primeira linha', traducao: '> cria/sobrescreve o arquivo com a saída do comando.' },
      { comando: 'echo "segunda" >> notas.txt && cat notas.txt', saida: 'primeira linha\nsegunda', destaque: 'segunda', traducao: '>> acrescenta no fim. Um sobrescreve, dois acrescentam — esse par volta no módulo 4.' },
      { comando: 'nano notas.txt', saida: '^O gravar    ^X sair', destaque: '^O gravar    ^X sair', traducao: 'As teclas estão escritas no rodapé da tela. Ninguém precisa decorar: Ctrl+O grava, Ctrl+X sai.' },
      { comando: 'rm notas.txt', saida: '', traducao: 'Não existe lixeira. E `rm -rf` numa pasta errada não tem volta — nessas duas letras você relê antes do Enter.' },
    ],
  },
  {
    id: 'm2-coringa', tipo: 'CommandAnatomy', modulo: 2, passos: 1,
    titulo: 'O coringa: * significa "qualquer coisa aqui"',
    comando: 'mv *.png imagens/',
    partes: [
      { trecho: 'mv', rotulo: 'o programa: mover' },
      { trecho: '*.png', rotulo: 'TODO arquivo terminado em .png' },
      { trecho: 'imagens/', rotulo: 'para onde' },
    ],
  },
  {
    id: 'm2-perigo', tipo: 'WidgetScene', modulo: 2, passos: 1,
    titulo: 'Ache o comando perigoso',
    widget: 'spot-the-danger',
    enunciado: 'Dois rounds. Em cada um, descubra qual comando faz estrago de verdade — sem correr nenhum risco.',
    segundos: 60, pontePara: 'rm -rf ~   # o que você NUNCA digita no automático',
  },
  {
    id: 'm2-widget', tipo: 'WidgetScene', modulo: 2, passos: 1,
    titulo: 'Arrume a bagunça (com o mouse, antes do teclado)',
    widget: 'fs-dragdrop',
    enunciado: 'Clique num arquivo e depois na pasta certa. No fim, eu mostro os comandos mv que você acabou de executar com o mouse.',
    segundos: 90, pontePara: 'mv *.png imagens/',
  },
  {
    id: 'm2-lab', tipo: 'LabScene', modulo: 2, passos: 3,
    titulo: 'Mão na massa · arrumando o diretório',
    taskSlug: 'm2-bagunca',
    objetivo: 'Organize ~/bagunca conforme a lista. Cada item acende sozinho quando fica certo — e cada um vale XP, então ninguém sai com zero.',
    criterios: [
      { id: 'm2-c1', descricao: 'imagens/ com todos os .png e .jpg', xp: 40 },
      { id: 'm2-c2', descricao: 'docs/ com todos os .txt e .md', xp: 40 },
      { id: 'm2-c3', descricao: 'scripts/ com todos os .sh', xp: 40 },
      { id: 'm2-c4', descricao: 'rascunho.txt renomeado para docs/notas.md', xp: 40 },
      { id: 'm2-c5', descricao: 'nenhum arquivo tmp_* sobrando', xp: 40 },
      { id: 'm2-c6', descricao: 'README.md com a linha "organizado por <seu nick>"', xp: 40 },
    ],
    comandosDoModulo: ['mkdir -p', 'mv', 'cp', 'rm', 'cat', 'nano', '*', '>', '>>'],
    segundos: 480, escopo: 'individual',
  },
  {
    id: 'm2-recap', tipo: 'Recap', modulo: 2, passos: 2,
    titulo: 'Fecho do módulo 2',
    perguntaDeRecuperacao: 'Qual a diferença entre > e >> ?',
    resumo: ['mkdir -p', 'cp', 'mv', 'rm -r', 'cat', 'less', 'nano', '*', '>', '>>'],
  },

  // ═══════════════════════════ M3 · PERMISSÕES ══════════════════════════════
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
    legenda: 'Dono, grupo, outros. Cada um pode ler (r=4), escrever (w=2) e executar (x=1). Some o que está ligado e você tem o número: 7 para o dono, 5 para o grupo, 4 para os outros = 754.',
  },
  {
    id: 'm3-demo', tipo: 'TerminalDemo', modulo: 3, passos: 6,
    titulo: 'Erro → diagnóstico → conserto',
    linhas: [
      { comando: 'cat relatorio.txt', saida: 'cat: relatorio.txt: Permission denied', destaque: 'Permission denied', traducao: 'A mensagem mais comum do Linux. Não é o computador quebrado: é o sistema protegendo algo.' },
      { comando: 'ls -l relatorio.txt', saida: '---------- 1 aluno aluno 24 out 19 09:40 relatorio.txt', destaque: '----------', traducao: 'Dez tracinhos: ninguém pode nada. Agora faz sentido ler essa coluna.' },
      { comando: 'chmod 644 relatorio.txt && cat relatorio.txt', saida: 'faturamento: 1.240 reais', traducao: '644 = dono lê e escreve, o resto só lê. É o padrão de um arquivo de texto.' },
      { comando: './deploy.sh', saida: 'bash: ./deploy.sh: Permission denied', destaque: 'Permission denied', traducao: 'Mesma mensagem, outro motivo: o arquivo existe e é legível, mas ninguém marcou que ele pode ser executado.' },
      { comando: 'chmod +x deploy.sh && ./deploy.sh', saida: 'deploy feito', traducao: '+x é "pode executar". 755 é o padrão de um script.' },
      { comando: 'sudo apt update', saida: '[sudo] password for aluno:', destaque: 'password', traducao: 'A senha NÃO aparece enquanto você digita. Nem asterisco. Seu teclado está funcionando: digite e dê Enter.' },
    ],
  },
  {
    id: 'm3-widget', tipo: 'WidgetScene', modulo: 3, passos: 1,
    titulo: 'Clique nos cadeados',
    widget: 'permission-toggles',
    enunciado: 'Ligue e desligue cada permissão e olhe o rwx e o número mudando ao vivo. Depois resolva os três desafios.',
    segundos: 120, pontePara: 'chmod 755 deploy.sh',
  },
  {
    id: 'm3-lab', tipo: 'LabScene', modulo: 3, passos: 3,
    titulo: 'Mão na massa · fazendo um script rodar',
    taskSlug: 'm3-permissoes',
    objetivo: 'Crie o ~/deploy.sh (com shebang e um echo), faça ele rodar, e conserte o relatorio.txt que está ilegível.',
    criterios: [
      { id: 'm3-c1', descricao: 'deploy.sh existe, tem shebang e é executável', xp: 80 },
      { id: 'm3-c2', descricao: 'deploy.sh roda e imprime algo', xp: 80 },
      { id: 'm3-c3', descricao: 'relatorio.txt legível', xp: 40 },
    ],
    comandosDoModulo: ['ls -l', 'chmod +x', 'chmod 644', 'nano', 'sudo', 'id'],
    segundos: 420, escopo: 'individual',
  },
  {
    id: 'm3-recap', tipo: 'Recap', modulo: 3, passos: 2,
    titulo: 'Fecho do módulo 3',
    perguntaDeRecuperacao: 'Deu "permission denied". Quais são as duas primeiras coisas que você olha?',
    resumo: ['ls -l', 'chmod +x', 'chmod 644', 'chmod 755', 'sudo', 'whoami', 'id'],
  },

  // ══════════════════════ KAHOOT RELÂMPAGO (M3 → M4) ════════════════════════
  {
    id: 'kr-1', tipo: 'QuizScene', modulo: 3, passos: 4,
    titulo: 'Kahoot relâmpago · 1 de 4',
    pergunta: 'Qual comando apaga uma pasta e tudo dentro dela?',
    alternativas: [{ id: 'a', texto: 'rm pasta' }, { id: 'b', texto: 'rm -r pasta' }, { id: 'c', texto: 'del pasta' }, { id: 'd', texto: 'mv pasta' }],
    correta: 'b', segundos: 20,
    explicacao: '`rm -r`. Sem o -r ele reclama que é um diretório. E com -rf ele não pergunta nada — é aí que mora o perigo.',
  },
  {
    id: 'kr-2', tipo: 'QuizScene', modulo: 3, passos: 4,
    titulo: 'Kahoot relâmpago · 2 de 4',
    pergunta: 'O que `chmod +x arquivo` faz?',
    alternativas: [
      { id: 'a', texto: 'Deixa o arquivo executável' },
      { id: 'b', texto: 'Apaga o arquivo' },
      { id: 'c', texto: 'Troca o dono' },
      { id: 'd', texto: 'Esconde o arquivo' },
    ],
    correta: 'a', segundos: 20,
    explicacao: 'Liga o bit de execução. É o que falta em 90% dos "não consigo rodar meu script".',
  },
  {
    id: 'kr-3', tipo: 'QuizScene', modulo: 3, passos: 4,
    titulo: 'Kahoot relâmpago · 3 de 4',
    pergunta: 'O que `..` significa num caminho?',
    alternativas: [
      { id: 'a', texto: 'A pasta atual' },
      { id: 'b', texto: 'A pasta de cima' },
      { id: 'c', texto: 'A minha casa' },
      { id: 'd', texto: 'A raiz do sistema' },
    ],
    correta: 'b', segundos: 20,
    explicacao: 'Um nível acima. `.` é a atual, `~` é a sua casa, `/` é a raiz.',
  },
  {
    id: 'kr-4', tipo: 'QuizScene', modulo: 3, passos: 4,
    titulo: 'Kahoot relâmpago · 4 de 4',
    pergunta: 'Você roda um programa e fecha o terminal. O que acontece com ele?',
    alternativas: [
      { id: 'a', texto: 'Continua rodando para sempre' },
      { id: 'b', texto: 'Morre junto com o terminal' },
      { id: 'c', texto: 'Reinicia sozinho' },
      { id: 'd', texto: 'Vira um arquivo' },
    ],
    correta: 'b', segundos: 20,
    explicacao: 'Morre — e é exatamente o problema que o próximo módulo resolve. Guardem essa dor.',
  },

  // ══════════════════════════ M4 · PIPES E BUSCA ════════════════════════════
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
    legenda: 'Todo comando tem uma entrada e uma saída. O | liga a saída de um na entrada do outro. O > despeja o resultado num arquivo. grep sozinho é um truque; o pipe é uma IDEIA — e é a ideia que vocês levam para qualquer Linux.',
  },
  {
    id: 'm4-demo', tipo: 'TerminalDemo', modulo: 4, passos: 7,
    titulo: 'Montando a linha, peça por peça',
    linhas: [
      { comando: 'wc -l app.log', saida: '50402 app.log', traducao: 'Cinquenta mil linhas. Boa sorte com o mouse.' },
      { comando: 'grep -c ERROR app.log', saida: '1031', traducao: '-c conta em vez de listar. Essa é a resposta do primeiro critério do lab.' },
      { comando: 'grep -rn "FATAL" .', saida: './app.log:50401:... FATAL disco cheio em /var', destaque: 'FATAL', traducao: '-r procura nas subpastas, -n mostra o número da linha. grep acha o que está DENTRO dos arquivos.' },
      { comando: 'find . -name "*.log"', saida: './app.log', traducao: 'find acha o ARQUIVO pelo nome; grep acha o CONTEÚDO. É a distinção que mais confunde.' },
      { comando: 'grep ERROR app.log | cut -d" " -f3 | head -3', saida: '10.0.0.9\n10.0.0.7\n10.0.0.7', traducao: 'Peguei só a terceira coluna de cada linha de erro: os IPs.' },
      { comando: 'grep ERROR app.log | cut -d" " -f3 | sort | uniq -c | sort -rn | head -3', saida: '    512 10.0.0.7\n    260 10.0.0.9\n    140 172.16.0.3', destaque: '512 10.0.0.7', traducao: 'Cinco comandos simples responderam uma pergunta de negócio: quem mais deu erro.' },
      { comando: 'grep FATAL app.log > fatais.txt && wc -l fatais.txt', saida: '2 fatais.txt', traducao: 'E o > guarda o resultado num arquivo. Fechamos o laço com o módulo 2.' },
    ],
  },
  {
    id: 'm4-encadear', tipo: 'CommandAnatomy', modulo: 4, passos: 1,
    titulo: 'Encadear: ; e &&',
    comando: 'mkdir relatorios && cd relatorios',
    partes: [
      { trecho: 'mkdir relatorios', rotulo: 'primeiro comando' },
      { trecho: '&&', rotulo: 'SE o primeiro der certo, faça o próximo' },
      { trecho: 'cd relatorios', rotulo: 'segundo comando' },
    ],
  },
  {
    id: 'm4-widget', tipo: 'WidgetScene', modulo: 4, passos: 1,
    titulo: 'Monte o encanamento',
    widget: 'pipe-builder',
    enunciado: 'Encaixe as peças e veja a saída se transformando a cada uma: 50.000 linhas → 1.031 → só os IPs → ordenados → contados → o top 3.',
    segundos: 150, pontePara: 'grep ERROR app.log | cut -d" " -f3 | sort | uniq -c | sort -rn | head -3',
  },
  {
    id: 'm4-lab', tipo: 'LabScene', modulo: 4, passos: 3,
    titulo: 'Mão na massa · caçando no log',
    taskSlug: 'm4-pipes',
    objetivo: 'Seu ~/app.log tem 50 mil linhas. Responda as duas primeiras perguntas no campo abaixo (uma por vez) e grave as linhas FATAL em ~/fatais.txt.',
    criterios: [
      { id: 'm4-c1', descricao: 'Quantas linhas de ERROR tem o app.log?', xp: 100 },
      { id: 'm4-c2', descricao: 'Qual IP aparece mais no log?', xp: 100 },
      { id: 'm4-c3', descricao: '~/fatais.txt com todas as linhas FATAL', xp: 150 },
    ],
    comandosDoModulo: ['grep -c', 'grep -rn', 'find', '|', '>', 'sort', 'uniq -c', 'cut', 'wc -l', 'head'],
    segundos: 540, escopo: 'individual',
  },
  {
    id: 'm4-recap', tipo: 'Recap', modulo: 4, passos: 2,
    titulo: 'Fecho do módulo 4',
    perguntaDeRecuperacao: 'Você quer achar o arquivo chamado config.yml. find ou grep?',
    resumo: ['grep -rn', 'grep -c', 'find -name', '|', '>', 'sort', 'uniq -c', 'cut', 'wc -l', '&&'],
  },

  // ════════════════════ M5 · PROGRAMAS E PROCESSOS ══════════════════════════
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
    legenda: 'Em primeiro plano a caixa fica presa ao seu terminal: fechou, morreu (foi a resposta do último Kahoot). Com & ela solta e o prompt volta. O número é o PID — é por ele que você mata.',
  },
  {
    id: 'm5-demo', tipo: 'TerminalDemo', modulo: 5, passos: 7,
    titulo: 'Instalar, ver, matar',
    linhas: [
      { comando: 'sudo apt install -y htop', saida: 'Setting up htop ...', traducao: 'Vem de um repositório: é uma loja de aplicativos, não um .exe baixado de um site qualquer.' },
      { comando: 'htop', saida: 'PID USER  CPU%  COMMAND\n4821 aluno  0.3  node app.js', destaque: '4821', traducao: 'Olhem só três coisas: PID, CPU% e o nome. E sair é com q.' },
      { comando: 'node app/app.js', saida: 'app no ar na porta 3000 — PID 4821\n█', traducao: 'O prompt não volta: ele não travou, está ocupado. Ctrl+C interrompe.' },
      { comando: 'node app/app.js &', saida: '[1] 4822', destaque: '[1] 4822', traducao: 'O & solta o processo. O número é o PID, e o prompt voltou.' },
      { comando: 'ps aux | grep app.js', saida: 'aluno  4822  0.1  node app/app.js', traducao: 'O pipe do módulo 4 reaparecendo com propósito: listei os processos e filtrei o meu.' },
      { comando: 'kill 4822', saida: '[1]+  Terminated', traducao: 'Pedido educado. Se o programa não ouvir, kill -9 é a ordem — mas tente o educado primeiro.' },
      { comando: 'which htop', saida: '/usr/bin/htop', traducao: 'Deu "command not found" depois de instalar? O sistema só encontra o programa se ele estiver numa das pastas da lista do PATH.' },
    ],
  },
  {
    id: 'm5-prever', tipo: 'WidgetScene', modulo: 5, passos: 1,
    titulo: 'O que vai acontecer?',
    widget: 'predict-output',
    enunciado: 'Três comandos. Antes de rodar, aposte no resultado — prever vale XP e muda a forma como você olha a saída.',
    segundos: 60, pontePara: 'node app.js &',
  },
  {
    id: 'm5-builder', tipo: 'WidgetScene', modulo: 5, passos: 1,
    titulo: 'Monte o comando',
    widget: 'command-builder',
    enunciado: 'Encaixe as peças na ordem certa. Depois da terceira vez, você começa a decompor comandos novos sozinho — e esse é o objetivo real do workshop.',
    segundos: 90, pontePara: 'sudo apt install -y htop',
  },
  {
    id: 'm5-lab', tipo: 'LabScene', modulo: 5, passos: 3,
    titulo: 'Mão na massa · instalar, soltar, matar',
    taskSlug: 'm5-processos',
    objetivo: 'Instale o SEU pacote (está em ~/.pacote — cada um recebeu um diferente), rode a app em background e depois ache o PID e mate.',
    criterios: [
      { id: 'm5-c1', descricao: 'Seu pacote sorteado está instalado', xp: 80 },
      { id: 'm5-c2', descricao: 'app.js rodando em background (com &)', xp: 80 },
      { id: 'm5-c3', descricao: 'Você matou a app depois', xp: 120 },
    ],
    comandosDoModulo: ['apt install', 'cat', 'ps aux', 'top', 'kill', '&', 'jobs', 'which'],
    segundos: 420, escopo: 'individual',
  },
  {
    id: 'm5-recap', tipo: 'Recap', modulo: 5, passos: 2,
    titulo: 'Fecho do módulo 5',
    perguntaDeRecuperacao: 'Um programa travou e não responde ao Ctrl+C. O que você faz?',
    resumo: ['sudo apt install', 'ps aux', 'top', 'kill', 'kill -9', '&', 'jobs', 'which'],
  },

  // ═════════════════════════ BOSS · O CHAMADO ═══════════════════════════════
  {
    id: 'pre-boss-erros', tipo: 'WidgetScene', modulo: 6, passos: 1,
    titulo: 'Leia o erro (o hábito que fica para a vida)',
    widget: 'error-match',
    enunciado: 'Três mensagens que vocês já viram hoje. Para cada uma, a causa. É exatamente o que o chamado vai exigir.',
    segundos: 60, pontePara: 'pwd · ls -l · apt install',
  },
  {
    id: 'm6-capa', tipo: 'ModuleCover', modulo: 6, passos: 1,
    titulo: 'O Chamado',
    pergunta: '"O relatório da madrugada não foi gerado." Vocês têm 10 minutos e um servidor quebrado.',
    xpDoModulo: 700,
  },
  {
    id: 'm6-cartas', tipo: 'GroupScene', modulo: 6, passos: 1,
    titulo: 'Dividam as cartas de função',
    enunciado: 'Cada critério do chamado só pode ser fechado por quem está com a carta correspondente. Não é burocracia: é o que impede uma pessoa fazer tudo sozinha enquanto quatro assistem.',
    papeis: [
      { id: 'investigador', nome: 'Investigador', faz: 'acha o log e a mensagem de erro (find, grep)' },
      { id: 'operador', nome: 'Operador', faz: 'acha e mata o processo travado (top, ps, kill)' },
      { id: 'mecanico', nome: 'Mecânico', faz: 'conserta a permissão do backup.sh e roda (ls -l, chmod +x)' },
      { id: 'relator', nome: 'Relator', faz: 'escreve o laudo.txt e aperta Verificar (grep -c, >)' },
    ],
  },
  {
    id: 'm6-boss', tipo: 'LabScene', modulo: 6, passos: 3,
    titulo: 'Boss · o relatório da madrugada não rodou',
    taskSlug: 'boss-chamado',
    objetivo: 'Quatro defeitos no diretório do grupo (/srv/chamado/grupo-<cor>). Nada aqui é novo: tudo está nos últimos 50 minutos. O Investigador responde a mensagem de erro no campo abaixo.',
    criterios: [
      { id: 'b-c1', descricao: 'Investigador: qual é a mensagem de erro do log?', xp: 150 },
      { id: 'b-c2', descricao: 'Operador: o processo travado foi morto', xp: 150 },
      { id: 'b-c3', descricao: 'Mecânico: backup.sh executável e executado', xp: 150 },
      { id: 'b-c4', descricao: 'Relator: laudo.txt com grupo, contagem de ERROR e o PID morto', xp: 250 },
    ],
    comandosDoModulo: ['find', 'grep', 'grep -c', 'ps aux', 'top', 'kill', 'ls -l', 'chmod +x', 'nano', '>'],
    segundos: 600, escopo: 'grupo',
  },
  {
    id: 'm6-placar', tipo: 'Scoreboard', modulo: 6, passos: 1,
    titulo: 'Chamados fechados', escopo: 'grupo',
  },

  // ═════════════════════════════ ENCERRAMENTO ═══════════════════════════════
  {
    id: 'fim-alias', tipo: 'TerminalDemo', modulo: 6, passos: 4,
    titulo: 'Bônus · deixe o terminal do seu jeito',
    linhas: [
      { comando: "alias ll='ls -la'", saida: '', traducao: 'Um apelido para o comando que vocês mais usaram hoje.' },
      { comando: 'll', saida: 'drwxr-xr-x  2 aluno aluno 4096 out 19 docs', traducao: 'Funciona. Agora vejam o problema.' },
      { comando: 'exit    # e entrar de novo', saida: 'bash: ll: command not found', destaque: 'command not found', traducao: 'Sumiu: ele vivia só na memória daquela sessão.' },
      { comando: "echo \"alias ll='ls -la'\" >> ~/.bashrc && source ~/.bashrc", saida: '', traducao: 'Agora é para sempre. E olhem o que acabou de acontecer: a configuração do seu terminal é um arquivo de texto, na sua casa, editável com o mesmo nano do módulo 2. O Linux é seu.' },
    ],
  },
  {
    id: 'fim-pacote', tipo: 'Recap', modulo: 6, passos: 2,
    titulo: 'O que vocês sabem fazer agora',
    perguntaDeRecuperacao: 'Você abre um Linux desconhecido, sem mouse, sem janela. E agora?',
    resumo: [
      'pwd', 'ls -la', 'cd', 'cat', 'less', 'nano', 'mkdir', 'cp', 'mv', 'rm -r', '*',
      'ls -l', 'chmod +x', 'chmod 644', 'sudo', 'grep -rn', 'find', '|', '>', '>>',
      'sort', 'uniq -c', 'wc -l', 'apt install', 'ps aux', 'top', 'kill', '&',
      'Tab', 'Ctrl+R', '--help', 'man', 'q', 'Ctrl+C', ':q!', 'alias',
    ],
  },
  {
    id: 'fim-placar', tipo: 'Scoreboard', modulo: 6, passos: 1,
    titulo: 'Pódio', escopo: 'individual',
  },
];

export const CENAS_POR_MODULO = DECK.reduce<Record<number, number>>((acc, c) => {
  acc[c.modulo] = (acc[c.modulo] ?? 0) + 1;
  return acc;
}, {});

/** Primeira cena de cada módulo — para o "ir para" do painel do apresentador. */
export const INICIO_DOS_MODULOS = DECK.reduce<Record<number, number>>((acc, c, i) => {
  if (!(c.modulo in acc)) acc[c.modulo] = i;
  return acc;
}, {});
