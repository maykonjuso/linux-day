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
    id: 'abertura', ilustra: 'pinguim', tipo: 'ModuleCover', modulo: 0, passos: 1,
    titulo: 'Linux Day',
    pergunta: 'Duas horas. Do "nunca abri um terminal" a consertar um servidor quebrado.',
    xpDoModulo: 2800,
  },
  {
    id: 'abertura-grupos', ilustra: 'pessoas', tipo: 'GroupScene', modulo: 0, passos: 1, modo: 'equipes',
    titulo: 'Escolham sua equipe',
    enunciado: 'Clique num grupo para entrar, e dá para trocar depois. O placar de grupo usa a **média**, não a soma: assim nenhum grupo ganha só por ter mais gente.',
  },

  // ═══════════════════════ M0 · INTRODUÇÃO (KAHOOT) ═════════════════════════
  {
    id: 'm0-capa', ilustra: 'pinguim', tipo: 'ModuleCover', modulo: 0, passos: 1,
    titulo: 'O que é Linux, afinal',
    pergunta: 'De onde isso veio e por que está em tudo?',
    xpDoModulo: 630,
  },
  {
    id: 'm0-origem', ilustra: 'livro', tipo: 'TerminalDemo', modulo: 0, passos: 3,
    titulo: 'Ciclo 1 · de onde veio',
    linhas: [
      { comando: '# 1983: Richard Stallman começa o projeto GNU', saida: 'software livre: usar, estudar, modificar, distribuir', traducao: 'Primeiro vieram as ferramentas. Faltava o núcleo.' },
      { comando: '# 1991: Linus Torvalds, 21 anos, Finlândia', saida: '"just a hobby, won\'t be big and professional like gnu"', destaque: "won't be big", traducao: 'Essa frase é dele, no anúncio original. Envelheceu muito mal.' },
      { comando: '# GNU + Linux = um sistema operacional completo', saida: 'licença GPL: o código é de todos, e continua sendo', traducao: 'É por isso que você pode baixar, abrir, mudar e revender o que quiser.' },
    ],
  },
  {
    id: 'm0-q1', ilustra: 'relogio', tipo: 'QuizScene', modulo: 0, passos: 1,
    titulo: 'Ciclo 1 · pergunta 1',
    pergunta: 'Em que ano Linus Torvalds anunciou o Linux?',
    alternativas: [{ id: 'a', texto: '1983' }, { id: 'b', texto: '1991' }, { id: 'c', texto: '1998' }, { id: 'd', texto: '2004' }],
    correta: 'b', segundos: 20,
    explicacao: 'Em 1991, num post de grupo de discussão. O projeto GNU já existia desde 1983. Faltava só o núcleo do sistema, e foi isso que o Linux trouxe.',
  },
  {
    id: 'm0-q2', ilustra: 'arquivo', tipo: 'QuizScene', modulo: 0, passos: 1,
    titulo: 'Ciclo 1 · pergunta 2',
    pergunta: 'Que nome Linus queria dar ao sistema, antes de "Linux"?',
    alternativas: [{ id: 'a', texto: 'Freax' }, { id: 'b', texto: 'Minix' }, { id: 'c', texto: 'Tux' }, { id: 'd', texto: 'GNUx' }],
    correta: 'a', segundos: 20,
    explicacao: '"Freax" (free + freak + x). Quem salvou o mundo foi o amigo que administrava o servidor e renomeou a pasta para "linux" sem pedir licença.',
  },
  {
    id: 'm0-q3', ilustra: 'pinguim', tipo: 'QuizScene', modulo: 0, passos: 1,
    titulo: 'Ciclo 1 · pergunta 3',
    pergunta: 'Por que o mascote do Linux é um pinguim?',
    alternativas: [
      { id: 'a', texto: 'Pinguins vivem em colônias, como a comunidade' },
      { id: 'b', texto: 'Linus foi mordido por um pinguim num zoológico' },
      { id: 'c', texto: 'Porque o Linux nasceu na Finlândia' },
      { id: 'd', texto: 'Foi sorteado entre os desenvolvedores' },
    ],
    correta: 'b', segundos: 20,
    explicacao: 'O Linus foi mordido por um pinguim num zoológico, na Austrália. O mascote se chama Tux. Um sistema que roda metade da internet tem esse símbolo por causa de uma mordida.',
  },
  {
    id: 'm0-kernel', ilustra: 'arvore', tipo: 'MentalModel', modulo: 0, passos: 1,
    titulo: 'Ciclo 2 · kernel ≠ distribuição',
    diagrama: 'arvore',
    legenda: 'O **Linux é só o núcleo**: ele conversa com o hardware. Uma **distro** é o núcleo mais as ferramentas, o gerenciador de pacotes e a interface. Debian → Ubuntu → Mint. Red Hat → Fedora → Rocky. Arch → Manjaro. Mesmo coração, embalagens diferentes.',
  },
  {
    id: 'm0-q4', ilustra: 'engrenagem', tipo: 'QuizScene', modulo: 0, passos: 1,
    titulo: 'Ciclo 2 · pergunta 1',
    pergunta: 'O que é, exatamente, "o Linux"?',
    alternativas: [
      { id: 'a', texto: 'Um sistema operacional completo' },
      { id: 'b', texto: 'O kernel, que é o núcleo e conversa com o hardware' },
      { id: 'c', texto: 'Uma interface gráfica' },
      { id: 'd', texto: 'Uma empresa' },
    ],
    correta: 'b', segundos: 20,
    explicacao: 'O kernel. O que você instala na máquina é uma distribuição: kernel + ferramentas + gerenciador de pacotes + ambiente gráfico.',
  },
  {
    id: 'm0-q5', ilustra: 'pacote', tipo: 'QuizScene', modulo: 0, passos: 1,
    titulo: 'Ciclo 2 · pergunta 2',
    pergunta: 'Ubuntu é baseado em qual distribuição?',
    alternativas: [{ id: 'a', texto: 'Fedora' }, { id: 'b', texto: 'Arch' }, { id: 'c', texto: 'Debian' }, { id: 'd', texto: 'Alpine' }],
    correta: 'c', segundos: 20,
    explicacao: 'Debian. Por isso o Ubuntu usa o `apt` para instalar programas. Guardem essa palavra. Ela volta no módulo 5.',
  },
  {
    id: 'm0-q6', ilustra: 'loja', tipo: 'QuizScene', modulo: 0, passos: 1,
    titulo: 'Ciclo 2 · pergunta 3',
    pergunta: 'Qual comando instala programas numa máquina Ubuntu?',
    alternativas: [{ id: 'a', texto: 'install' }, { id: 'b', texto: 'apt' }, { id: 'c', texto: 'brew' }, { id: 'd', texto: 'yum' }],
    correta: 'b', segundos: 20,
    explicacao: '`apt`. O `brew` é do macOS, o `yum`/`dnf` é da família Red Hat. Vocês vão rodar um `apt install` de verdade hoje.',
  },
  {
    id: 'm0-onde', ilustra: 'celular', tipo: 'TerminalDemo', modulo: 0, passos: 4,
    titulo: 'Ciclo 3 · onde o Linux está',
    linhas: [
      { comando: '# o celular de vocês', saida: 'Android roda sobre o kernel Linux', traducao: 'Quase todo mundo nesta sala usa Linux todos os dias, sem saber.' },
      { comando: '# a internet', saida: 'a maioria absoluta dos servidores web roda Linux', traducao: 'Todo site que vocês abriram hoje passou por uma máquina Linux.' },
      { comando: '# os 500 supercomputadores mais rápidos do mundo', saida: '500 de 500', destaque: '500 de 500', traducao: 'Não é "a maioria". É todos.' },
      { comando: '# e o Git?', saida: 'também foi criado pelo Linus, para versionar o kernel', traducao: 'A ferramenta que vocês usam na faculdade nasceu deste mesmo projeto.' },
    ],
  },
  {
    id: 'm0-q7', ilustra: 'celular', tipo: 'QuizScene', modulo: 0, passos: 1,
    titulo: 'Ciclo 3 · pergunta 1',
    pergunta: 'Qual destes NÃO roda sobre o kernel Linux?',
    alternativas: [{ id: 'a', texto: 'Android' }, { id: 'b', texto: 'ChromeOS' }, { id: 'c', texto: 'iOS' }, { id: 'd', texto: 'Steam Deck' }],
    correta: 'c', segundos: 20,
    explicacao: 'iOS. Android, ChromeOS e o Steam Deck são todos Linux por baixo.',
  },
  {
    id: 'm0-q8', ilustra: 'foguete', tipo: 'QuizScene', modulo: 0, passos: 1,
    titulo: 'Ciclo 3 · pergunta 2',
    pergunta: 'Quantos dos 500 supercomputadores mais rápidos do mundo rodam Linux?',
    alternativas: [{ id: 'a', texto: 'Uns 150' }, { id: 'b', texto: 'Cerca de 300' }, { id: 'c', texto: '480' }, { id: 'd', texto: 'Todos os 500' }],
    correta: 'd', segundos: 20,
    explicacao: 'Todos os 500. Em máquina grande, não existe outra opção. Saber usar o terminal muda o seu currículo.',
  },
  {
    id: 'm0-q9', ilustra: 'ferramenta', tipo: 'QuizScene', modulo: 0, passos: 1,
    titulo: 'Ciclo 3 · pergunta final',
    pergunta: 'Qual outra ferramenta que vocês usam foi criada pelo Linus Torvalds?',
    alternativas: [{ id: 'a', texto: 'Docker' }, { id: 'b', texto: 'Git' }, { id: 'c', texto: 'VS Code' }, { id: 'd', texto: 'Python' }],
    correta: 'b', segundos: 20,
    explicacao: 'O Git. Ele precisava guardar as versões do kernel e não gostou de nada que existia. Agora vamos abrir o terminal.',
  },

  // ═══════════════════════════ M1 · NAVEGAÇÃO ═══════════════════════════════
  {
    id: 'm1-capa', ilustra: 'bussola', tipo: 'ModuleCover', modulo: 1, passos: 1,
    titulo: 'Cheguei no servidor',
    pergunta: 'Onde eu estou, como olho em volta e como me ajudo sozinho?',
    xpDoModulo: 150,
  },
  {
    id: 'm1-arvore', ilustra: 'arvore', tipo: 'MentalModel', modulo: 1, passos: 1,
    titulo: 'O sistema de arquivos é uma árvore',
    diagrama: 'arvore',
    legenda: 'Tudo começa em `/`, a **raiz**. Sua casa é `/home/aluno`, e `~` é um atalho para ela. Então `/home/aluno/docs` e `~/docs` são **o mesmo lugar**.',
  },
  {
    id: 'm1-prompt', ilustra: 'mapa', tipo: 'CommandAnatomy', modulo: 1, passos: 1,
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
    id: 'm1-demo', ilustra: 'bussola', tipo: 'TerminalDemo', modulo: 1, passos: 6,
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
    id: 'm1-fuga', ilustra: 'extintor', tipo: 'WillGoWrong', modulo: 1, passos: 1,
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
    id: 'm1-fuga-widget', ilustra: 'porta', tipo: 'WidgetScene', modulo: 1, passos: 1,
    titulo: 'Qual tecla te salva?',
    widget: 'escape-room',
    enunciado: 'Três telas em que **todo iniciante trava**. Escolha como sair de cada uma. Errar aqui não custa nada.',
    segundos: 60, pontePara: 'q · Esc :q! · Ctrl+C',
  },
  {
    id: 'm1-widget', ilustra: 'mapa', tipo: 'WidgetScene', modulo: 1, passos: 1,
    titulo: 'Onde eu caio?',
    widget: 'path-quiz',
    enunciado: 'Clique na pasta onde você **termina** depois do comando.',
    segundos: 90, pontePara: 'cd ../..',
  },
  {
    id: 'm1-lab', ilustra: 'bandeira', tipo: 'LabScene', modulo: 1, passos: 1,
    titulo: 'Mão na massa · a flag escondida',
    taskSlug: 'm1-flag',
    objetivo: 'Existe um arquivo `flag.txt` **escondido** na sua pasta pessoal, quatro níveis abaixo. Ache, abra e escreva o conteúdo dele no campo aqui embaixo. Cada pessoa tem uma flag diferente, então **copiar a resposta do colega não funciona**. Copiar o comando dele funciona, e isso é aprender.',
    criterios: [{ id: 'm1-c1', descricao: 'Entregar o conteúdo de flag.txt', xp: 150 }],
    comandosDoModulo: ['pwd', 'ls -la', 'cd', 'cat', 'find', 'Tab', '--help'],
    segundos: 360, escopo: 'individual',
  },
  {
    id: 'm1-recap', ilustra: 'bandeira', tipo: 'Recap', modulo: 1, passos: 2,
    titulo: 'Fecho do módulo 1',
    perguntaDeRecuperacao: 'Você está perdido numa máquina qualquer. Quais são os dois primeiros comandos?',
    resumo: ['pwd', 'ls -la', 'cd', 'cat', 'Tab', '↑', '--help', 'q', 'Ctrl+C'],
  },

  // ════════════════════════════ M2 · ARQUIVOS ═══════════════════════════════
  {
    id: 'm2-capa', ilustra: 'pasta', tipo: 'ModuleCover', modulo: 2, passos: 1,
    titulo: 'Mexendo nas coisas',
    pergunta: 'Como eu crio, movo, leio, edito e apago arquivos?',
    xpDoModulo: 240,
  },
  {
    id: 'm2-demo', ilustra: 'pasta-aberta', tipo: 'TerminalDemo', modulo: 2, passos: 7,
    titulo: 'Criar, mover, ler, editar',
    linhas: [
      { comando: 'mkdir -p projeto/src && tree projeto', saida: 'projeto\n└── src', traducao: 'O -p cria o caminho inteiro de uma vez, sem reclamar se já existir.' },
      { comando: 'touch projeto/src/app.js && ls projeto/src', saida: 'app.js', traducao: 'touch cria um arquivo vazio.' },
      { comando: 'mv projeto/src/app.js projeto/src/main.js', saida: '', traducao: 'Renomear É mover: mesmo comando, mesmo lugar, nome novo. É a confusão nº 1 do módulo.' },
      { comando: 'echo "primeira linha" > notas.txt && cat notas.txt', saida: 'primeira linha', traducao: '> cria/sobrescreve o arquivo com a saída do comando.' },
      { comando: 'echo "segunda" >> notas.txt && cat notas.txt', saida: 'primeira linha\nsegunda', destaque: 'segunda', traducao: '>> acrescenta no fim. Um sinal apaga o que tinha, dois sinais acrescentam. Esse par volta no módulo 4.' },
      { comando: 'nano notas.txt', saida: '^O gravar    ^X sair', destaque: '^O gravar    ^X sair', traducao: 'As teclas estão escritas no rodapé da tela. Ninguém precisa decorar: Ctrl+O grava, Ctrl+X sai.' },
      { comando: 'rm notas.txt', saida: '', traducao: 'Não existe lixeira. O `rm -rf` na pasta errada não tem volta. Quando aparecerem essas duas letras, releia antes de apertar Enter.' },
    ],
  },
  {
    id: 'm2-coringa', ilustra: 'estrela', tipo: 'CommandAnatomy', modulo: 2, passos: 1,
    titulo: 'O coringa: * significa "qualquer coisa aqui"',
    comando: 'mv *.png imagens/',
    partes: [
      { trecho: 'mv', rotulo: 'o programa: mover' },
      { trecho: '*.png', rotulo: 'TODO arquivo terminado em .png' },
      { trecho: 'imagens/', rotulo: 'para onde' },
    ],
  },
  {
    id: 'm2-perigo', ilustra: 'bomba', tipo: 'WidgetScene', modulo: 2, passos: 1,
    titulo: 'Ache o comando perigoso',
    widget: 'spot-the-danger',
    enunciado: 'Duas rodadas: descubra qual comando **faz estrago de verdade**, sem correr risco nenhum.',
    segundos: 60, pontePara: 'rm -rf ~   # o que você NUNCA digita no automático',
  },
  {
    id: 'm2-widget', ilustra: 'pasta', tipo: 'WidgetScene', modulo: 2, passos: 1,
    titulo: 'Arrume a bagunça (com o mouse, antes do teclado)',
    widget: 'fs-dragdrop',
    enunciado: 'Clique num arquivo e depois na pasta certa. No fim eu mostro os comandos `mv` que **você acabou de executar** com o mouse.',
    segundos: 90, pontePara: 'mv *.png imagens/',
  },
  {
    id: 'm2-lab', ilustra: 'pasta-aberta', tipo: 'LabScene', modulo: 2, passos: 1,
    titulo: 'Mão na massa · arrumando o diretório',
    taskSlug: 'm2-bagunca',
    objetivo: 'Organize a pasta `~/bagunca` seguindo a lista ao lado. Cada item **acende sozinho** quando fica certo, e cada um vale XP. Ninguém sai com zero.',
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
    id: 'm2-recap', ilustra: 'bandeira', tipo: 'Recap', modulo: 2, passos: 2,
    titulo: 'Fecho do módulo 2',
    perguntaDeRecuperacao: 'Qual a diferença entre > e >> ?',
    resumo: ['mkdir -p', 'cp', 'mv', 'rm -r', 'cat', 'less', 'nano', '*', '>', '>>'],
  },

  // ═══════════════════════════ M3 · PERMISSÕES ══════════════════════════════
  {
    id: 'm3-capa', ilustra: 'cadeado', tipo: 'ModuleCover', modulo: 3, passos: 1,
    titulo: 'Quem manda aqui',
    pergunta: 'Por que "permission denied"? O que é sudo?',
    xpDoModulo: 200,
  },
  {
    id: 'm3-cadeados', ilustra: 'cadeado', tipo: 'MentalModel', modulo: 3, passos: 1,
    titulo: 'Três cadeados em todo arquivo',
    diagrama: 'cadeados',
    legenda: '**Dono**, **grupo** e **outros**. Cada um pode ler (`r`=4), escrever (`w`=2) e executar (`x`=1). Some o que está ligado e sai o número: 7 para o dono, 5 para o grupo, 4 para os outros, ou seja `754`.',
  },
  {
    id: 'm3-demo', ilustra: 'chave', tipo: 'TerminalDemo', modulo: 3, passos: 6,
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
    id: 'm3-widget', ilustra: 'cadeado-aberto', tipo: 'WidgetScene', modulo: 3, passos: 1,
    titulo: 'Clique nos cadeados',
    widget: 'permission-toggles',
    enunciado: 'Ligue e desligue cada permissão e olhe o `rwx` **e o número** mudando ao vivo. Depois resolva os três desafios.',
    segundos: 120, pontePara: 'chmod 755 deploy.sh',
  },
  {
    id: 'm3-lab', ilustra: 'chave', tipo: 'LabScene', modulo: 3, passos: 1,
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
    id: 'm3-recap', ilustra: 'bandeira', tipo: 'Recap', modulo: 3, passos: 2,
    titulo: 'Fecho do módulo 3',
    perguntaDeRecuperacao: 'Deu "permission denied". Quais são as duas primeiras coisas que você olha?',
    resumo: ['ls -l', 'chmod +x', 'chmod 644', 'chmod 755', 'sudo', 'whoami', 'id'],
  },

  // ══════════════════════ KAHOOT RELÂMPAGO (M3 → M4) ════════════════════════
  {
    id: 'kr-1', ilustra: 'lixeira', tipo: 'QuizScene', modulo: 3, passos: 1,
    titulo: 'Kahoot relâmpago · 1 de 4',
    pergunta: 'Qual comando apaga uma pasta e tudo dentro dela?',
    alternativas: [{ id: 'a', texto: 'rm pasta' }, { id: 'b', texto: 'rm -r pasta' }, { id: 'c', texto: 'del pasta' }, { id: 'd', texto: 'mv pasta' }],
    correta: 'b', segundos: 20,
    explicacao: 'É o `rm -r`. Sem o -r ele avisa que aquilo é uma pasta. Com -rf ele não pergunta nada, e aí mora o perigo.',
  },
  {
    id: 'kr-2', ilustra: 'chave', tipo: 'QuizScene', modulo: 3, passos: 1,
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
    id: 'kr-3', ilustra: 'mapa', tipo: 'QuizScene', modulo: 3, passos: 1,
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
    id: 'kr-4', ilustra: 'alarme', tipo: 'QuizScene', modulo: 3, passos: 1,
    titulo: 'Kahoot relâmpago · 4 de 4',
    pergunta: 'Você roda um programa e fecha o terminal. O que acontece com ele?',
    alternativas: [
      { id: 'a', texto: 'Continua rodando para sempre' },
      { id: 'b', texto: 'Morre junto com o terminal' },
      { id: 'c', texto: 'Reinicia sozinho' },
      { id: 'd', texto: 'Vira um arquivo' },
    ],
    correta: 'b', segundos: 20,
    explicacao: 'Ele morre junto. Esse é o problema que o próximo módulo resolve.',
  },

  // ══════════════════════════ M4 · PIPES E BUSCA ════════════════════════════
  {
    id: 'm4-capa', ilustra: 'lupa', tipo: 'ModuleCover', modulo: 4, passos: 1,
    titulo: 'O superpoder',
    pergunta: 'Como eu acho uma agulha no palheiro e ligo comandos entre si?',
    xpDoModulo: 350,
  },
  {
    id: 'm4-encanamento', ilustra: 'elo', tipo: 'MentalModel', modulo: 4, passos: 1,
    titulo: 'O pipe é um encanamento',
    diagrama: 'encanamento',
    legenda: 'Todo comando tem uma entrada e uma saída. A barra `|` **liga a saída de um na entrada do próximo**. O sinal `>` joga o resultado dentro de um arquivo. É assim que comandos simples resolvem problemas grandes.',
  },
  {
    id: 'm4-demo', ilustra: 'lupa', tipo: 'TerminalDemo', modulo: 4, passos: 7,
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
    id: 'm4-encadear', ilustra: 'elo', tipo: 'CommandAnatomy', modulo: 4, passos: 1,
    titulo: 'Encadear: ; e &&',
    comando: 'mkdir relatorios && cd relatorios',
    partes: [
      { trecho: 'mkdir relatorios', rotulo: 'primeiro comando' },
      { trecho: '&&', rotulo: 'SE o primeiro der certo, faça o próximo' },
      { trecho: 'cd relatorios', rotulo: 'segundo comando' },
    ],
  },
  {
    id: 'm4-widget', ilustra: 'elo', tipo: 'WidgetScene', modulo: 4, passos: 1,
    titulo: 'Monte o encanamento',
    widget: 'pipe-builder',
    enunciado: 'Encaixe as peças e **veja a saída se transformando** a cada uma: 50.000 linhas, depois 1.031, depois só os IPs, ordenados, contados, e o top 3.',
    segundos: 150, pontePara: 'grep ERROR app.log | cut -d" " -f3 | sort | uniq -c | sort -rn | head -3',
  },
  {
    id: 'm4-lab', ilustra: 'detetive', tipo: 'LabScene', modulo: 4, passos: 1,
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
    id: 'm4-recap', ilustra: 'bandeira', tipo: 'Recap', modulo: 4, passos: 2,
    titulo: 'Fecho do módulo 4',
    perguntaDeRecuperacao: 'Você quer achar o arquivo chamado config.yml. find ou grep?',
    resumo: ['grep -rn', 'grep -c', 'find -name', '|', '>', 'sort', 'uniq -c', 'cut', 'wc -l', '&&'],
  },

  // ════════════════════ M5 · PROGRAMAS E PROCESSOS ══════════════════════════
  {
    id: 'm5-capa', ilustra: 'engrenagem', tipo: 'ModuleCover', modulo: 5, passos: 1,
    titulo: 'Programas e processos',
    pergunta: 'Como instalo coisas e o que faço quando algo travou?',
    xpDoModulo: 280,
  },
  {
    id: 'm5-processo', ilustra: 'engrenagem', tipo: 'MentalModel', modulo: 5, passos: 1,
    titulo: 'Um processo é uma caixa com número',
    diagrama: 'processo',
    legenda: 'Sem o `&` o programa fica **preso ao seu terminal**: se você fechar, ele morre. Com o `&` ele **solta** e o seu prompt volta. O número que aparece é o **PID**, e é por ele que você encerra o programa depois.',
  },
  {
    id: 'm5-demo', ilustra: 'pacote', tipo: 'TerminalDemo', modulo: 5, passos: 7,
    titulo: 'Instalar, ver, matar',
    linhas: [
      { comando: 'sudo apt install -y htop', saida: 'Setting up htop ...', traducao: 'Vem de um repositório: é uma loja de aplicativos, não um .exe baixado de um site qualquer.' },
      { comando: 'htop', saida: 'PID USER  CPU%  COMMAND\n4821 aluno  0.3  node app.js', destaque: '4821', traducao: 'Olhem só três coisas: PID, CPU% e o nome. E sair é com q.' },
      { comando: 'node app/app.js', saida: 'app no ar na porta 3000. PID 4821\n█', traducao: 'O prompt não volta: ele não travou, está ocupado. Ctrl+C interrompe.' },
      { comando: 'node app/app.js &', saida: '[1] 4822', destaque: '[1] 4822', traducao: 'O & solta o processo. O número é o PID, e o prompt voltou.' },
      { comando: 'ps aux | grep app.js', saida: 'aluno  4822  0.1  node app/app.js', traducao: 'O pipe do módulo 4 reaparecendo com propósito: listei os processos e filtrei o meu.' },
      { comando: 'kill 4822', saida: '[1]+  Terminated', traducao: 'Esse é o pedido educado. Se o programa não obedecer, use kill -9. Tente o educado primeiro.' },
      { comando: 'which htop', saida: '/usr/bin/htop', traducao: 'Deu "command not found" depois de instalar? O sistema só encontra o programa se ele estiver numa das pastas da lista do PATH.' },
    ],
  },
  {
    id: 'm5-prever', ilustra: 'robo', tipo: 'WidgetScene', modulo: 5, passos: 1,
    titulo: 'O que vai acontecer?',
    widget: 'predict-output',
    enunciado: 'Três comandos. Antes de rodar, **aposte** no que vai acontecer. Acertar vale XP.',
    segundos: 60, pontePara: 'node app.js &',
  },
  {
    id: 'm5-builder', ilustra: 'ferramenta', tipo: 'WidgetScene', modulo: 5, passos: 1,
    titulo: 'Monte o comando',
    widget: 'command-builder',
    enunciado: 'Encaixe as peças na ordem certa. Depois de montar alguns, você começa a **entender comandos novos sozinho**.',
    segundos: 90, pontePara: 'sudo apt install -y htop',
  },
  {
    id: 'm5-lab', ilustra: 'loja', tipo: 'LabScene', modulo: 5, passos: 1,
    titulo: 'Mão na massa · instalar, soltar, matar',
    taskSlug: 'm5-processos',
    objetivo: 'Cada pessoa recebeu **um programa diferente** para instalar. Veja qual é o seu com `cat ~/.pacote`, instale, depois rode a app em **segundo plano** e por último encerre ela pelo **PID**.',
    criterios: [
      { id: 'm5-c1', descricao: 'Seu pacote sorteado está instalado', xp: 80 },
      { id: 'm5-c2', descricao: 'app.js rodando em background (com &)', xp: 80 },
      { id: 'm5-c3', descricao: 'Você matou a app depois', xp: 120 },
    ],
    comandosDoModulo: ['apt install', 'cat', 'ps aux', 'top', 'kill', '&', 'jobs', 'which'],
    segundos: 420, escopo: 'individual',
  },
  {
    id: 'm5-recap', ilustra: 'bandeira', tipo: 'Recap', modulo: 5, passos: 2,
    titulo: 'Fecho do módulo 5',
    perguntaDeRecuperacao: 'Um programa travou e não responde ao Ctrl+C. O que você faz?',
    resumo: ['sudo apt install', 'ps aux', 'top', 'kill', 'kill -9', '&', 'jobs', 'which'],
  },

  // ═════════════════════════ BOSS · O CHAMADO ═══════════════════════════════
  {
    id: 'pre-boss-erros', ilustra: 'alerta', tipo: 'WidgetScene', modulo: 6, passos: 1,
    titulo: 'Leia o erro (o hábito que fica para a vida)',
    widget: 'error-match',
    enunciado: 'Três mensagens que vocês **já viram hoje**. Para cada uma, a causa.',
    segundos: 60, pontePara: 'pwd · ls -l · apt install',
  },
  {
    id: 'm6-capa', ilustra: 'alarme', tipo: 'ModuleCover', modulo: 6, passos: 1,
    titulo: 'O Chamado',
    pergunta: '"O relatório da madrugada não foi gerado." Vocês têm 10 minutos e um servidor quebrado.',
    xpDoModulo: 700,
  },
  {
    id: 'm6-equipes', ilustra: 'pessoas', tipo: 'GroupScene', modulo: 6, passos: 1, modo: 'equipes',
    titulo: 'Confirmem a equipe',
    enunciado: 'Cada equipe recebe o MESMO servidor quebrado e trabalha junto nele. Até dez pessoas por equipe, e o tamanho é escolha de vocês: o placar usa a média, então equipe pequena não é desvantagem.',
  },
  {
    id: 'm6-cartas', ilustra: 'aperto-de-mao', tipo: 'GroupScene', modulo: 6, passos: 1, modo: 'papeis',
    titulo: 'Dividam as cartas de função',
    enunciado: 'Cada critério do chamado **só pode ser fechado por quem está com a carta**. Não é burocracia: é o que impede uma pessoa fazer tudo sozinha enquanto quatro assistem.',
    papeis: [
      { id: 'investigador', nome: 'Investigador', faz: 'acha o log e a mensagem de erro (find, grep)' },
      { id: 'operador', nome: 'Operador', faz: 'acha e mata o processo travado (top, ps, kill)' },
      { id: 'mecanico', nome: 'Mecânico', faz: 'conserta a permissão do backup.sh e roda (ls -l, chmod +x)' },
      { id: 'relator', nome: 'Relator', faz: 'escreve o laudo.txt e aperta Verificar (grep -c, >)' },
    ],
  },
  {
    id: 'm6-boss', ilustra: 'ferramenta', tipo: 'LabScene', modulo: 6, passos: 1,
    titulo: 'Boss · o relatório da madrugada não rodou',
    taskSlug: 'boss-chamado',
    objetivo: 'São **quatro defeitos** no diretório do grupo. **Nada aqui é novo**: tudo o que vocês precisam está nos últimos 50 minutos. O Investigador responde a mensagem de erro no campo abaixo.',
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
    id: 'm6-placar', ilustra: 'trofeu', tipo: 'Scoreboard', modulo: 6, passos: 1,
    titulo: 'Chamados fechados', escopo: 'grupo',
  },

  // ═════════════════════════════ ENCERRAMENTO ═══════════════════════════════
  {
    id: 'fim-alias', ilustra: 'coracao', tipo: 'TerminalDemo', modulo: 6, passos: 4,
    titulo: 'Bônus · deixe o terminal do seu jeito',
    linhas: [
      { comando: "alias ll='ls -la'", saida: '', traducao: 'Um apelido para o comando que vocês mais usaram hoje.' },
      { comando: 'll', saida: 'drwxr-xr-x  2 aluno aluno 4096 out 19 docs', traducao: 'Funciona. Agora vejam o problema.' },
      { comando: 'exit    # e entrar de novo', saida: 'bash: ll: command not found', destaque: 'command not found', traducao: 'Sumiu: ele vivia só na memória daquela sessão.' },
      { comando: "echo \"alias ll='ls -la'\" >> ~/.bashrc && source ~/.bashrc", saida: '', traducao: 'Agora é para sempre. E olhem o que acabou de acontecer: a configuração do seu terminal é um arquivo de texto, na sua casa, editável com o mesmo nano do módulo 2. O Linux é seu.' },
    ],
  },
  {
    id: 'fim-pacote', ilustra: 'festa', tipo: 'Recap', modulo: 6, passos: 2,
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
    id: 'fim-placar', ilustra: 'trofeu', tipo: 'Scoreboard', modulo: 6, passos: 1,
    titulo: 'Pódio', escopo: 'individual',
  },
];

export const CENAS_POR_MODULO = DECK.reduce<Record<number, number>>((acc, c) => {
  acc[c.modulo] = (acc[c.modulo] ?? 0) + 1;
  return acc;
}, {});

/** Primeira cena de cada módulo, para o "ir para" do painel do apresentador. */
export const INICIO_DOS_MODULOS = DECK.reduce<Record<number, number>>((acc, c, i) => {
  if (!(c.modulo in acc)) acc[c.modulo] = i;
  return acc;
}, {});
