import type { Cena } from './types';

/**
 * O DECK.
 *
 * Conteúdo é código, não dado: uma cena pode ler estado ao vivo (placar,
 * critérios, grupo). Ordem = ordem de apresentação, e o apresentador só aperta
 * "próximo": quem sabe o que isso significa é a cena.
 *
 * Três regras que o deck inteiro segue:
 *
 *  1. Nada é perguntado antes de ser mostrado. Toda pergunta, exercício e lab
 *     só cobra o que algum slide ANTERIOR ensinou (as `referencias` apontam
 *     para esses slides, e o participante pode clicar para rever).
 *  2. Kahoot: em toda cena em que a turma age, o primeiro avanço mostra só o
 *     enunciado (para quem apresenta explicar) e o segundo libera as opções, o
 *     exercício ou o terminal, e só então o tempo começa a contar.
 *  3. Tudo cabe em 120 minutos. Cada cena declara seus `minutos` (explicação
 *     + tempo de fazer) e `npm run teste:tempo` reprova o deck se a soma
 *     passar de 120.
 *
 * Roteiro didático completo: docs/plano-workshop.md. Cada LabScene casa com um
 * checker em src/server/labs.mjs pelo `taskSlug`.
 */
export const DECK: Cena[] = [
  // ════════════════════════════ ABERTURA ════════════════════════════════════
  {
    id: 'abertura', ilustra: 'pinguim', tipo: 'ModuleCover', modulo: 0, passos: 1, minutos: 1,
    titulo: 'Linux Day',
    pergunta: 'Duas horas. Do "nunca abri um terminal" a **consertar um servidor quebrado**.',
    xpDoModulo: 2800,
  },
  {
    // um passo com os dois juntos e depois um passo para cada pessoa
    id: 'apresentacao', ilustra: 'aperto-de-mao', tipo: 'Apresentacao', modulo: 0, passos: 3, minutos: 3,
    titulo: 'Quem está com vocês hoje',
    pessoas: [
      {
        nome: 'Ian Costa Guimarães', github: 'iancostag', foto: '/equipe/iancostag.jpg',
        cargo: 'Pesquisador no ITRAC · Engenharia de Software na UnB',
        linkedin: 'https://www.linkedin.com/in/iancostaguimaraes',
        historia: [
          'Começou pelo **back-end**: nos projetos AGIS e MeuCapilar escrevia a regra de negócio e modelava os bancos, em PostgreSQL e MongoDB, tudo empacotado em Docker.',
          'Cuidando de onde o dado mora, descobriu a **engenharia de dados**, e não largou mais.',
          'Como pesquisador no ITRAC, da UnB, mapeou gargalos de **serviços públicos** da Secretaria do Patrimônio da União. Hoje faz a residência em IA e Engenharia de Dados do Instituto Eldorado com a Softex.',
        ],
      },
      {
        nome: 'Maykon Soares', github: 'maykonjuso', foto: '/equipe/maykonjuso.jpg',
        cargo: 'Desenvolvedor Full-Stack no Sicoob · cursando Engenharia de Software na UnB',
        linkedin: 'https://www.linkedin.com/in/maykon13',
        historia: [
          'Antes do código veio a química: é **técnico em Química** pelo IFB. Hoje cursa Engenharia de Software na UnB, onde participou da **empresa júnior Orcquesta**.',
          'Estagiou na **GEAP** e depois no **Sicoob**, onde foi efetivado. Desde então faz **automações de infraestrutura** para o Sicoob.',
          'Hoje também faz a residência em IA e Engenharia de Dados do Instituto Eldorado com a Softex.',
        ],
      },
    ],
  },
  {
    id: 'controles', ilustra: 'computador', tipo: 'Controles', modulo: 0, passos: 1, minutos: 2,
    titulo: 'Como usar a sua tela',
    legenda: 'Em toda pergunta e exercício, primeiro aparece **só o enunciado**: a gente explica, e só depois libera as opções. Aí o tempo começa a contar, e quem responde mais rápido ganha mais XP.',
  },
  {
    id: 'abertura-grupos', ilustra: 'pessoas', tipo: 'GroupScene', modulo: 0, passos: 1, minutos: 2, modo: 'equipes',
    titulo: 'Escolham sua equipe',
    enunciado: 'Clique numa cor para entrar na equipe. A equipe vale para os **jogos em grupo** e para o desafio final. O placar das equipes usa a **média** de XP, então equipe pequena não perde por ter menos gente.',
  },

  // ═══════════════════════ M0 · O QUE É LINUX ═══════════════════════════════
  {
    id: 'm0-capa', ilustra: 'pinguim', tipo: 'ModuleCover', modulo: 0, passos: 1, minutos: 0.5,
    titulo: 'O que é Linux, afinal',
    pergunta: 'De onde ele veio e por que ele está **em todo lugar**?',
    xpDoModulo: 350,
  },
  {
    id: 'm0-origem', ilustra: 'livro', tipo: 'TerminalDemo', modulo: 0, passos: 4, minutos: 1.5,
    titulo: 'De onde veio',
    linhas: [
      {
        comando: '# 1983: Richard Stallman começa o projeto GNU',
        saida: 'objetivo: um sistema inteiro feito de software livre',
        traducao: 'Software livre: qualquer pessoa pode usar, estudar, mudar e distribuir. Vieram as ferramentas, mas faltava **o núcleo**.',
        imagem: '/slides/m0-stallman.jpeg',
        legendaImagem: 'Richard Stallman — fundador do Projeto GNU e da Free Software Foundation',
      },
      {
        comando: '# 1991: Linus Torvalds, estudante de 21 anos, Finlândia',
        saida: '"just a hobby, won\'t be big and professional"',
        destaque: "won't be big",
        traducao: 'Ele anunciou o núcleo num fórum dizendo que era **só um hobby**. Envelheceu muito mal.',
        imagem: '/slides/m0-linus-1991.jpeg',
        imagens: ['/slides/linus_torvalds.png', '/slides/m0-linus-1991.jpeg'],
        legendaImagem: 'Linus Torvalds (1991): o criador e o anúncio histórico do Linux',
      },
      {
        comando: '# o mascote: Tux, o pinguim',
        saida: 'Linus foi mordido por um pinguim num zoológico',
        destaque: 'mordido por um pinguim',
        traducao: 'É sério: o pinguim virou o símbolo por causa de **uma mordida** que ele levou na Austrália.',
        imagem: '/slides/m0-tux.jpg',
        legendaImagem: 'Tux: o pinguim mascote criado em 1996 por Larry Ewing',
      },
      {
        comando: '# GNU + Linux = um sistema operacional completo',
        saida: 'licença GPL: o código é de todos, e continua sendo',
        traducao: 'Por isso qualquer pessoa pode baixar, abrir e **modificar** o Linux.',
        imagem: '/slides/m0-gnu-linux.png',
        legendaImagem: 'Ferramentas GNU + Kernel Linux = Sistema Operacional GNU/Linux',
      },
    ],
  },
  {
    id: 'm0-q1', ilustra: 'relogio', tipo: 'QuizScene', modulo: 0, passos: 1, minutos: 1.25,
    titulo: 'Pergunta 1 de 4',
    pergunta: 'Em que ano o Linux foi anunciado?',
    alternativas: [{ id: 'a', texto: '1983' }, { id: 'b', texto: '1991' }, { id: 'c', texto: '1998' }, { id: 'd', texto: '2004' }],
    segundos: 20,
    explicacao: 'Em **1991**, por Linus Torvalds. O 1983 é do projeto GNU, que trouxe as ferramentas. O Linux trouxe o núcleo que faltava.',
    referencias: [{ id: 'm0-origem', titulo: 'De onde veio' }],
  },
  {
    id: 'm0-q3', ilustra: 'pinguim', tipo: 'QuizScene', modulo: 0, passos: 1, minutos: 1.25,
    titulo: 'Pergunta 2 de 4',
    pergunta: 'Por que o mascote do Linux é um pinguim?',
    alternativas: [
      { id: 'a', texto: 'Pinguins vivem em grupo, como a comunidade' },
      { id: 'b', texto: 'Linus foi mordido por um pinguim' },
      { id: 'c', texto: 'Porque a Finlândia é fria' },
      { id: 'd', texto: 'Foi sorteado entre os programadores' },
    ],
    segundos: 20,
    explicacao: 'Linus foi **mordido por um pinguim** num zoológico. O mascote se chama Tux.',
    referencias: [{ id: 'm0-origem', titulo: 'De onde veio' }],
  },
  {
    id: 'm0-kernel', ilustra: 'arvore', tipo: 'MentalModel', modulo: 0, passos: 1, minutos: 1.5,
    titulo: 'Kernel e distribuição',
    diagrama: 'distros',
    legenda: 'O **Linux, sozinho, é só o kernel**: o núcleo que conversa com o hardware. Uma **distribuição** (distro) junta o kernel com ferramentas, um instalador de programas e a interface. O Ubuntu, por exemplo, vem do Debian e instala programas com o comando `apt`.',
  },
  {
    id: 'm0-q4', ilustra: 'engrenagem', tipo: 'QuizScene', modulo: 0, passos: 1, minutos: 1.25,
    titulo: 'Pergunta 3 de 4',
    pergunta: 'O Linux, sozinho, é o quê?',
    alternativas: [
      { id: 'a', texto: 'Um sistema operacional completo, com janelas' },
      { id: 'b', texto: 'O kernel: o núcleo que conversa com o hardware' },
      { id: 'c', texto: 'Um programa para editar textos' },
      { id: 'd', texto: 'Uma empresa' },
    ],
    segundos: 20,
    explicacao: 'O **kernel**. O que você instala no computador é uma distribuição: o kernel junto com ferramentas, instalador de programas e interface.',
    referencias: [{ id: 'm0-kernel', titulo: 'Kernel e distribuição' }],
  },

  {
    id: 'm0-onde', ilustra: 'celular', tipo: 'TerminalDemo', modulo: 0, passos: 4, minutos: 1,
    titulo: 'Onde o Linux está',
    linhas: [
      {
        comando: '# no seu bolso e na sua mochila',
        saida: 'Android, ChromeOS e Steam Deck rodam sobre o kernel Linux',
        destaque: 'Android',
        traducao: 'Quase todo mundo aqui usa Linux todo dia sem saber. (O iPhone não: o iOS é da Apple.)',
        imagem: '/slides/m0-gadgets.png',
        legendaImagem: 'Android, Steam Deck, ChromeOS e roteadores: Linux no seu dia a dia',
      },
      {
        comando: '# na internet',
        saida: 'a maioria dos servidores web roda Linux',
        traducao: 'Todo site que vocês abriram hoje passou por uma máquina Linux.',
        imagem: '/slides/m0-datacenter.jpeg',
        legendaImagem: 'A nuvem mundial roda em servidores Linux (AWS, Google Cloud, Azure)',
      },
      {
        comando: '# nos 500 supercomputadores mais rápidos do mundo',
        saida: '500 de 500',
        destaque: '500 de 500',
        traducao: 'Não é "a maioria". São **todos**.',
        imagem: '/slides/m0-supercomputador.jpeg',
        legendaImagem: 'TOP500: 100% dos supercomputadores mais potentes do planeta rodam Linux',
      },
      {
        comando: '# e o Git?',
        saida: 'também foi criado pelo Linus, para guardar as versões do kernel',
        destaque: 'criado pelo Linus',
        traducao: 'A ferramenta de versionar código que vocês usam nasceu **do mesmo projeto**.',
        imagem: '/slides/m0-git-linus.png',
        legendaImagem: 'Git: criado por Linus Torvalds em 2005 para gerenciar o kernel do Linux',
      },
    ],
  },
  {
    id: 'm0-q7', ilustra: 'celular', tipo: 'QuizScene', modulo: 0, passos: 1, minutos: 1.25,
    titulo: 'Pergunta 4 de 4',
    pergunta: 'Qual destes NÃO usa o kernel Linux?',
    alternativas: [{ id: 'a', texto: 'Android' }, { id: 'b', texto: 'ChromeOS' }, { id: 'c', texto: 'iOS (iPhone)' }, { id: 'd', texto: 'Steam Deck' }],
    segundos: 20,
    explicacao: 'O **iOS**, do iPhone, é da Apple. Android, ChromeOS e Steam Deck são Linux por baixo.',
    referencias: [{ id: 'm0-onde', titulo: 'Onde o Linux está' }],
  },
  {
    id: 'm0-q9', ilustra: 'alarme', tipo: 'ArenaScene', modulo: 0, passos: 1, minutos: 2,
    jogo: 'buzzer',
    titulo: 'Passa ou repassa',
    pergunta: 'Que outra ferramenta famosa, que vocês usam para guardar versões de código, o Linus Torvalds criou?',
    enunciado: 'A equipe que **apertar primeiro** responde em voz alta. Acertou, leva o XP para todo mundo da equipe. Errou, a vez passa para a próxima da fila.',
    segundos: 60,
    premios: [300],
    imagem: '/slides/m0-desafio-git.png',
    imagemResposta: '/slides/m0-git-resposta.png',
    referencias: [{ id: 'm0-onde', titulo: 'Onde o Linux está' }],
  },


  // ═══════════════════════════ M1 · NAVEGAÇÃO ═══════════════════════════════
  {
    id: 'm1-capa', ilustra: 'bussola', tipo: 'ModuleCover', modulo: 1, passos: 1, minutos: 0.5,
    titulo: 'Cheguei no servidor',
    pergunta: 'Onde eu estou, como olho em volta e **como saio de uma tela travada**?',
    xpDoModulo: 150,
  },
  {
    id: 'm1-arvore', ilustra: 'arvore', tipo: 'MentalModel', modulo: 1, passos: 1, minutos: 1.5,
    titulo: 'As pastas formam uma árvore',
    diagrama: 'arvore',
    legenda: 'Tudo começa em `/`, a **raiz**. A sua pasta pessoal ("casa") é `/home/aluno`, e `~` é um atalho para ela. Então `/home/aluno/docs` e `~/docs` são **o mesmo lugar**.',
  },
  {
    id: 'm1-prompt', ilustra: 'mapa', tipo: 'CommandAnatomy', modulo: 1, passos: 1, minutos: 0.5,
    titulo: 'O prompt diz onde você está',
    comando: 'aluno@servidor:~$',
    partes: [
      { trecho: 'aluno', rotulo: 'quem eu sou' },
      { trecho: 'servidor', rotulo: 'em que máquina' },
      { trecho: '~', rotulo: 'em que pasta (~ é a minha casa)' },
      { trecho: '$', rotulo: 'pode digitar' },
    ],
  },
  {
    id: 'm1-demo', ilustra: 'bussola', tipo: 'TerminalDemo', modulo: 1, passos: 7, minutos: 2.5,
    titulo: 'Olhando em volta',
    imagem: '/slides/m1-arvore-navegacao.png',
    legendaImagem: 'Navegação no Linux: árvore de diretórios, onde estou (pwd) e atalhos (~, ., ..)',
    linhas: [
      { comando: 'pwd', saida: '/home/aluno', traducao: '**Onde eu estou.** Perdido? Comece sempre por aqui.' },
      { comando: 'ls', saida: 'app  app.log  bagunca  docs  projetos  relatorio.txt', traducao: '**O que tem aqui**: pastas e arquivos da pasta atual.' },
      { comando: 'ls -la', saida: 'drwxr-xr-x  3 aluno aluno 4096 out 19 09:12 projetos\n-rw-r--r--  1 aluno aluno  220 out 19 09:12 .bashrc', destaque: '.bashrc', traducao: 'Mostra também os **escondidos**: todo nome que começa com ponto fica escondido do `ls` simples.' },
      { comando: 'cd projetos && pwd', saida: '/home/aluno/projetos', traducao: '`cd` entra numa pasta. `cd ..` **sobe um nível**, `cd ~` volta para casa.' },
      { comando: 'cat leia-me.txt', saida: 'nada aqui. tente mais fundo.', traducao: '`cat` mostra **o conteúdo** de um arquivo. Atenção: maiúscula importa, `Leia-me.txt` e `leia-me.txt` são arquivos diferentes.' },
      { comando: 'cd 20  ← aperte Tab', saida: 'cd 2024/', destaque: '2024/', traducao: '**Tab completa o nome** para você. Use sempre: evita erro de digitação. A seta ↑ traz de volta os comandos anteriores.' },
      { comando: 'ls --help', saida: 'Usage: ls [OPTION]... [FILE]...\n  -a, --all    do not ignore entries starting with .', traducao: 'Todo comando explica a si mesmo com `--help`. Ninguém precisa decorar nada.' },
    ],
  },
  {
    id: 'm1-widget', ilustra: 'mapa', tipo: 'WidgetScene', modulo: 1, passos: 1, minutos: 2.5,
    titulo: 'Onde eu caio?',
    widget: 'path-quiz',
    enunciado: 'Na sua tela aparece **onde você está** e um **comando** `cd`. Clique na pasta onde você vai parar depois desse comando. Lembre: `..` sobe um nível, `../..` sobe dois, e `~` é a sua casa.',
    segundos: 60, pontePara: 'cd ../..',
    referencias: [
      { id: 'm1-arvore', titulo: 'As pastas formam uma árvore' },
      { id: 'm1-demo', titulo: 'Olhando em volta (pwd, ls, cd)' },
    ],
  },
  {
    id: 'm1-fuga', ilustra: 'extintor', tipo: 'WillGoWrong', modulo: 1, passos: 1, minutos: 1.5,
    titulo: 'Kit de fuga: como sair de uma tela travada',
    erros: [
      { mensagem: 'abriu um manual ou texto longo e ele não fecha', significa: 'você está num leitor de texto, não travou', causa: 'aperte q' },
      { mensagem: 'abriu o vim (um editor) e não consegue sair', significa: 'o vim espera um comando, não texto', causa: 'Esc, depois digite :q! e Enter' },
      { mensagem: 'o programa roda e o prompt não volta', significa: 'ele está ocupado, não travado', causa: 'Ctrl+C interrompe' },
      { mensagem: 'a tela ficou cheia de texto velho', significa: 'é só sujeira na tela', causa: 'Ctrl+L limpa' },
      { mensagem: 'Ctrl+C não copiou o texto', significa: 'no terminal, Ctrl+C interrompe', causa: 'copiar: Ctrl+Shift+C · colar: Ctrl+Shift+V' },
    ],
  },
  {
    id: 'm1-fuga-widget', ilustra: 'porta', tipo: 'WidgetScene', modulo: 1, passos: 1, minutos: 2,
    titulo: 'Qual tecla te salva?',
    widget: 'escape-room',
    enunciado: 'Três telas em que **todo iniciante trava**. Em cada uma, clique na saída certa. Errou? Leia a explicação e tente de novo: não perde nada.',
    segundos: 45, pontePara: 'q · Esc :q! · Ctrl+C',
    referencias: [{ id: 'm1-fuga', titulo: 'Kit de fuga' }],
  },
  {
    id: 'm1-lab', ilustra: 'bandeira', tipo: 'LabScene', modulo: 1, passos: 1, minutos: 6,
    titulo: 'Mão na massa · a flag escondida',
    taskSlug: 'm1-flag',
    objetivo: 'Dentro da pasta `projetos` existe um arquivo `flag.txt`, guardado em pastas, uma dentro da outra. Entre nas pastas com `cd`, olhe com `ls -la` (uma delas é **escondida**: o nome começa com ponto), abra o arquivo com `cat` e **cole o texto dele no campo "Achou a resposta?"**. Cada pessoa tem uma flag diferente.',
    criterios: [{ id: 'm1-c1', descricao: 'Colar no campo o texto que está dentro de `flag.txt` (algo como `tux-a1b2c3`)', xp: 150 }],
    comandosDoModulo: ['pwd', 'ls -la', 'cd', 'cd ..', 'cat', 'Tab'],
    segundos: 240, escopo: 'individual',
    referencias: [
      { id: 'm1-arvore', titulo: 'As pastas formam uma árvore' },
      { id: 'm1-demo', titulo: 'Olhando em volta (pwd, ls -la, cd, cat)' },
      { id: 'm1-fuga', titulo: 'Kit de fuga (copiar e colar)' },
    ],
  },
  {
    id: 'm1-recap', ilustra: 'bandeira', tipo: 'Recap', modulo: 1, passos: 2, minutos: 1,
    titulo: 'Fecho do módulo 1',
    perguntaDeRecuperacao: 'Você está perdido numa máquina qualquer. Quais são os dois primeiros comandos?',
    resumo: ['pwd', 'ls -la', 'cd', 'cd ..', 'cat', 'Tab', '↑', '--help', 'q', 'Ctrl+C'],
  },

  // ════════════════════════════ M2 · ARQUIVOS ═══════════════════════════════
  {
    id: 'm2-capa', ilustra: 'pasta', tipo: 'ModuleCover', modulo: 2, passos: 1, minutos: 0.5,
    titulo: 'Mexendo nas coisas',
    pergunta: 'Como eu **crio, copio, movo, edito e apago** arquivos?',
    xpDoModulo: 240,
  },
  {
    id: 'm2-demo', ilustra: 'pasta-aberta', tipo: 'TerminalDemo', modulo: 2, passos: 8, minutos: 3.5,
    titulo: 'Criar, copiar, mover, editar, apagar',
    imagem: '/slides/m2-cuidado-rm.png',
    legendaImagem: 'Atenção: no Linux o rm apaga imediatamente, sem lixeira e sem confirmação',
    linhas: [
      { comando: 'mkdir -p projeto/src && ls projeto', saida: 'src', traducao: '`mkdir` cria pastas. O `-p` cria o caminho inteiro de uma vez.' },
      { comando: 'touch projeto/src/app.js', saida: '', traducao: '`touch` cria um **arquivo vazio**.' },
      { comando: 'cp projeto/src/app.js copia.js', saida: '', traducao: '`cp` **copia**: o original continua onde estava.' },
      { comando: 'mv copia.js backup.js', saida: '', traducao: '`mv` move **e também renomeia**. Mesmo comando: de onde, para onde (ou para que nome).' },
      { comando: 'echo "primeira linha" > notas.txt && cat notas.txt', saida: 'primeira linha', traducao: '`>` grava a saída num arquivo. Se o arquivo já existir, **apaga o que tinha** e escreve por cima.' },
      { comando: 'echo "segunda" >> notas.txt && cat notas.txt', saida: 'primeira linha\nsegunda', destaque: 'segunda', traducao: '`>>` **acrescenta no fim**, sem apagar. Um sinal sobrescreve, dois acrescentam.' },
      { comando: 'nano notas.txt', saida: '^O Gravar    ^X Sair', destaque: '^O Gravar    ^X Sair', traducao: '`nano` é um editor simples. O `^` quer dizer Ctrl: **Ctrl+O grava** (confirme com Enter) e **Ctrl+X sai**.' },
      { comando: 'rm backup.js', saida: '', traducao: '`rm` apaga **sem lixeira e sem volta**. Para pasta é `rm -r`. Leia duas vezes antes de apertar Enter.' },
    ],
  },
  {
    id: 'm2-coringa', ilustra: 'estrela', tipo: 'CommandAnatomy', modulo: 2, passos: 1, minutos: 1,
    titulo: 'O coringa: * quer dizer "qualquer coisa"',
    comando: 'mv *.png imagens/',
    partes: [
      { trecho: 'mv', rotulo: 'mover' },
      { trecho: '*.png', rotulo: 'todo arquivo que termina em .png' },
      { trecho: 'imagens/', rotulo: 'para a pasta imagens' },
    ],
  },
  {
    id: 'm2-lab', ilustra: 'pasta-aberta', tipo: 'LabScene', modulo: 2, passos: 1, minutos: 6.5,
    titulo: 'Mão na massa · arrumando a bagunça',
    taskSlug: 'm2-bagunca',
    objetivo: 'Entre na pasta com `cd ~/bagunca` e veja os arquivos soltos com `ls`. Faça os itens da lista, todos **dentro de** `~/bagunca`. Cada item fica verde sozinho quando estiver certo. Deixe o `README.md` por último: um `mv *.md` levaria ele junto.',
    criterios: [
      { id: 'm2-c1', descricao: 'Criar a pasta `imagens` e mover para ela todos os `.png` e `.jpg`', xp: 40 },
      { id: 'm2-c2', descricao: 'Criar a pasta `docs` e mover para ela todos os `.txt` e `.md`', xp: 40 },
      { id: 'm2-c3', descricao: 'Criar a pasta `scripts` e mover para ela todos os `.sh`', xp: 40 },
      { id: 'm2-c4', descricao: 'Renomear o `rascunho.txt` para `notas.md`, dentro de `docs`', xp: 40 },
      { id: 'm2-c5', descricao: 'Apagar os arquivos que começam com `tmp_`', xp: 40 },
      { id: 'm2-c6', descricao: 'Criar `README.md` em `~/bagunca` com o texto: `organizado por` + o nome que aparece no seu prompt', xp: 40 },
    ],
    comandosDoModulo: ['cd', 'ls', 'mkdir', 'mv', '*', 'rm', 'echo >', 'cat'],
    segundos: 330, escopo: 'individual',
    referencias: [
      { id: 'm2-demo', titulo: 'Criar, copiar, mover, editar, apagar' },
      { id: 'm2-coringa', titulo: 'O coringa: *' },
    ],
  },
  {
    id: 'm2-recap', ilustra: 'bandeira', tipo: 'Recap', modulo: 2, passos: 2, minutos: 1,
    titulo: 'Fecho do módulo 2',
    perguntaDeRecuperacao: 'Qual a diferença entre > e >> ?',
    resumo: ['mkdir -p', 'touch', 'cp', 'mv', 'rm', 'rm -r', '*', '>', '>>', 'nano'],
  },

  // ═══════════════════════════ M3 · PERMISSÕES ══════════════════════════════
  {
    id: 'm3-capa', ilustra: 'cadeado', tipo: 'ModuleCover', modulo: 3, passos: 1, minutos: 0.5,
    titulo: 'Quem manda aqui',
    pergunta: 'Por que aparece **"Permission denied"** e como eu resolvo?',
    xpDoModulo: 200,
  },
  {
    id: 'm3-cadeados', ilustra: 'cadeado', tipo: 'MentalModel', modulo: 3, passos: 1, minutos: 1.5,
    titulo: 'Três cadeados em todo arquivo',
    diagrama: 'cadeados',
    legenda: 'Todo arquivo tem permissões para três públicos: **dono**, **grupo** e **outros**. Cada um pode ler (`r` vale 4), escrever (`w` vale 2) e executar (`x` vale 1). Some o que está ligado e sai um número por público: 7 para o dono, 5 para o grupo, 4 para os outros, ou seja, `754`.',
  },
  {
    id: 'm3-demo', ilustra: 'chave', tipo: 'TerminalDemo', modulo: 3, passos: 8, minutos: 3.5,
    titulo: 'Erro → diagnóstico → conserto',
    imagem: '/slides/m3-permissoes-rwx.png',
    legendaImagem: 'Permissões: r (leitura = 4), w (escrita = 2), x (execução = 1) para Dono, Grupo e Outros',
    linhas: [
      { comando: 'cat relatorio.txt', saida: 'cat: relatorio.txt: Permission denied', destaque: 'Permission denied', traducao: 'A mensagem mais comum do Linux. Não é defeito: é o sistema **protegendo** o arquivo.' },
      { comando: 'ls -l relatorio.txt', saida: '---------- 1 aluno aluno 24 out 19 09:40 relatorio.txt', destaque: '----------', traducao: 'O começo da linha são as permissões. **Tudo tracinho**: ninguém pode nada.' },
      { comando: 'chmod 644 relatorio.txt && cat relatorio.txt', saida: 'faturamento: 1.240 reais', traducao: '`chmod` muda as permissões. **644** = o dono lê e escreve, o resto só lê.' },
      { comando: "echo '#!/bin/bash' > deploy.sh", saida: '', traducao: 'Um **script** é um arquivo com comandos. A 1ª linha, `#!/bin/bash`, diz quem vai executar o arquivo (o nome disso é **shebang**). Use aspas simples.' },
      { comando: "echo 'echo \"deploy feito\"' >> deploy.sh", saida: '', traducao: 'A 2ª linha é o que o script faz: imprimir uma frase. `>>` acrescenta sem apagar a 1ª.' },
      { comando: './deploy.sh', saida: 'bash: ./deploy.sh: Permission denied', destaque: 'Permission denied', traducao: '`./` quer dizer "o arquivo **desta pasta**". Deu erro porque ninguém marcou que ele pode ser executado.' },
      { comando: 'chmod +x deploy.sh && ./deploy.sh', saida: 'deploy feito', destaque: 'deploy feito', traducao: '`+x` liga a permissão de **executar**. Agora roda.' },
      { comando: 'sudo apt update', saida: '[sudo] password for aluno:', destaque: 'password', traducao: '`sudo` = "faça isso **como administrador**". A senha não aparece enquanto você digita, nem asterisco: digite e dê Enter.' },
    ],
  },
  {
    id: 'm3-widget', ilustra: 'cadeado-aberto', tipo: 'WidgetScene', modulo: 3, passos: 1, minutos: 2.5,
    titulo: 'Clique nos cadeados',
    widget: 'permission-toggles',
    enunciado: 'Cada botão liga ou desliga uma permissão (`r` ler, `w` escrever, `x` executar) para o dono, o grupo e os outros. Veja **o número mudar** e resolva os três desafios que aparecem ao lado.',
    segundos: 90, pontePara: 'chmod 755 deploy.sh',
    referencias: [
      { id: 'm3-cadeados', titulo: 'Três cadeados (r=4, w=2, x=1)' },
      { id: 'm3-demo', titulo: 'Erro → diagnóstico → conserto (chmod)' },
    ],
  },
  {
    id: 'm3-lab', ilustra: 'chave', tipo: 'LabScene', modulo: 3, passos: 1, minutos: 6.5,
    titulo: 'Mão na massa · fazendo um script rodar',
    taskSlug: 'm3-permissoes',
    objetivo: 'Trabalhe na sua pasta pessoal (`cd ~`). Crie um script `deploy.sh` que imprime uma frase e faça ele rodar. Depois libere a leitura do `relatorio.txt`, que está bloqueado. **Os comandos são os mesmos da demonstração** "Erro → diagnóstico → conserto".',
    criterios: [
      { id: 'm3-c1', descricao: 'Criar `~/deploy.sh` com a 1ª linha `#!/bin/bash` e deixá-lo executável (`chmod +x`)', xp: 80 },
      { id: 'm3-c2', descricao: 'Fazer o `deploy.sh` imprimir uma frase quando roda (`./deploy.sh`)', xp: 80 },
      { id: 'm3-c3', descricao: 'Liberar a leitura do `relatorio.txt` (`chmod 644`)', xp: 40 },
    ],
    comandosDoModulo: ['ls -l', "echo '...' >", '>>', 'chmod +x', 'chmod 644', './deploy.sh', 'cat'],
    segundos: 300, escopo: 'individual',
    referencias: [
      { id: 'm3-demo', titulo: 'Erro → diagnóstico → conserto' },
      { id: 'm3-cadeados', titulo: 'Três cadeados (rwx)' },
      { id: 'm2-demo', titulo: 'Criar e editar arquivos (>, >>, nano)' },
    ],
  },
  {
    id: 'm3-recap', ilustra: 'bandeira', tipo: 'Recap', modulo: 3, passos: 2, minutos: 1,
    titulo: 'Fecho do módulo 3',
    perguntaDeRecuperacao: 'Deu "Permission denied". Qual comando mostra as permissões, e qual muda?',
    resumo: ['ls -l', 'chmod 644', 'chmod +x', './script.sh', '#!/bin/bash', 'sudo'],
  },

  // ═════════════════ REVISÃO RELÂMPAGO: PASSA OU REPASSA ══════════════════════
  {
    id: 'kr-1', ilustra: 'lixeira', tipo: 'ArenaScene', modulo: 3, passos: 1, minutos: 2,
    jogo: 'buzzer',
    titulo: 'Passa ou repassa · revisão',
    pergunta: 'Qual é o comando completo para apagar a pasta fotos, com tudo o que tem dentro?',
    enunciado: 'A equipe que **apertar primeiro** fala o comando em voz alta. Errou, a vez passa. Dica: é um comando e uma letra a mais.',
    segundos: 60,
    premios: [300],
    imagem: '/slides/kr1-perigo-rmr.png',
    imagemResposta: '/slides/kr1-rmr-resposta.png',
    referencias: [{ id: 'm2-demo', titulo: 'Criar, copiar, mover, editar, apagar (rm -r)' }],
  },




  // ══════════════════════════ M4 · PIPES E BUSCA ════════════════════════════
  {
    id: 'm4-capa', ilustra: 'lupa', tipo: 'ModuleCover', modulo: 4, passos: 1, minutos: 0.5,
    titulo: 'O superpoder',
    pergunta: 'Como eu acho uma agulha num palheiro de **50 mil linhas**?',
    xpDoModulo: 350,
  },
  {
    id: 'm4-encanamento', ilustra: 'elo', tipo: 'MentalModel', modulo: 4, passos: 1, minutos: 1,
    titulo: 'O pipe é um encanamento',
    diagrama: 'encanamento',
    legenda: 'Todo comando tem uma entrada e uma saída. A barra `|` (pipe) **liga a saída de um comando na entrada do próximo**. E o `>` que vocês já viram guarda o resultado num arquivo.',
  },
  {
    id: 'm4-demo', ilustra: 'lupa', tipo: 'TerminalDemo', modulo: 4, passos: 8, minutos: 3.5,
    titulo: 'Procurando no log, peça por peça',
    imagem: '/slides/m4-esteira-pipes.png',
    legendaImagem: 'Pipeline: encadeamento de comandos com | (pipe) refinando dados brutos até a resposta',
    linhas: [
      { comando: 'wc -l app.log', saida: '50652 app.log', traducao: '`wc -l` **conta as linhas**. São mais de 50 mil: ninguém lê isso no olho.' },
      { comando: 'grep WARN app.log | head -2', saida: '2026-10-19T08:57:00 WARN 10.0.0.9 fila crescendo\n2026-10-19T08:34:00 WARN 192.168.0.14 fila crescendo', destaque: 'WARN', traducao: '`grep` mostra só as linhas que **contêm a palavra**. `head -2` corta nas 2 primeiras.' },
      { comando: 'grep -c WARN app.log', saida: '515', traducao: '`-c` **conta** as linhas em vez de mostrar.' },
      { comando: 'grep -n FATAL app.log', saida: '50651:2026-10-19T09:10:00 FATAL 10.0.0.7 disco cheio em /var', destaque: 'FATAL', traducao: '`-n` mostra **o número da linha** onde achou.' },
      { comando: 'find ~ -name "*.log"', saida: '/home/aluno/app.log', traducao: '`find` procura **arquivos pelo nome**. Já o `grep` procura **texto dentro** dos arquivos.' },
      { comando: 'grep ERROR app.log | cut -d" " -f3 | head -3', saida: '10.0.0.9\n10.0.0.9\n192.168.0.14', traducao: '`cut -d" " -f3` corta cada linha nos espaços e pega **o 3º pedaço**: o IP.' },
      { comando: 'grep ERROR app.log | cut -d" " -f3 | sort | uniq -c | sort -rn | head -3', saida: '    508 172.16.0.3\n    258 192.168.0.14\n    258 10.0.0.9', destaque: '508 172.16.0.3', traducao: '`sort` ordena, `uniq -c` conta os repetidos, `sort -rn` põe o maior primeiro. Resposta: **quem mais deu erro**.' },
      { comando: 'grep WARN app.log > avisos.txt && wc -l avisos.txt', saida: '515 avisos.txt', traducao: 'O `>` do módulo 2 **guarda o resultado num arquivo** em vez de mostrar na tela.' },
    ],
  },
  {
    id: 'm4-encadear', ilustra: 'elo', tipo: 'CommandAnatomy', modulo: 4, passos: 1, minutos: 1,
    titulo: 'Dois comandos numa linha: &&',
    comando: 'mkdir relatorios && cd relatorios',
    partes: [
      { trecho: 'mkdir relatorios', rotulo: 'primeiro comando' },
      { trecho: '&&', rotulo: 'se o primeiro der certo, roda o próximo' },
      { trecho: 'cd relatorios', rotulo: 'segundo comando' },
    ],
  },
  {
    id: 'm4-widget', ilustra: 'elo', tipo: 'WidgetScene', modulo: 4, passos: 1, minutos: 2.5,
    titulo: 'Monte o encanamento',
    widget: 'pipe-builder',
    enunciado: 'Objetivo: descobrir **os 3 IPs que mais deram erro**. Clique nas peças na ordem certa. A cada peça encaixada, a saída embaixo muda e mostra o que aquela peça fez.',
    segundos: 90, pontePara: 'cat app.log | grep ERROR | cut -d" " -f3 | sort | uniq -c | sort -rn | head -3',
    referencias: [
      { id: 'm4-encanamento', titulo: 'O pipe é um encanamento' },
      { id: 'm4-demo', titulo: 'Procurando no log (grep, cut, sort, uniq)' },
    ],
  },
  {
    id: 'm4-lab', ilustra: 'detetive', tipo: 'LabScene', modulo: 4, passos: 1, minutos: 7,
    titulo: 'Mão na massa · caçando no log',
    taskSlug: 'm4-pipes',
    objetivo: 'Tudo acontece no arquivo `~/app.log`. Para os itens 1 e 2, descubra a resposta no terminal, **cole no campo "Achou a resposta?"** e envie, uma pergunta de cada vez. O item 3 é feito só no terminal.',
    criterios: [
      { id: 'm4-c1', descricao: 'Quantas linhas do log têm a palavra `ERROR`? (responda só o número)', xp: 100 },
      { id: 'm4-c2', descricao: 'Qual IP aparece mais vezes **no log inteiro**, contando todas as linhas? (responda o IP)', xp: 100 },
      { id: 'm4-c3', descricao: 'Guardar todas as linhas com `FATAL` no arquivo `~/fatais.txt`', xp: 150 },
    ],
    comandosDoModulo: ['grep', 'grep -c', '|', 'cut -d" " -f3', 'sort', 'uniq -c', 'sort -rn', 'head', '>'],
    segundos: 360, escopo: 'individual',
    referencias: [
      { id: 'm4-demo', titulo: 'Procurando no log, peça por peça' },
      { id: 'm4-encanamento', titulo: 'O pipe (|) e o >' },
    ],
  },
  {
    id: 'm4-recap', ilustra: 'bandeira', tipo: 'Recap', modulo: 4, passos: 2, minutos: 1,
    titulo: 'Fecho do módulo 4',
    perguntaDeRecuperacao: 'Você quer achar o arquivo chamado config.yml. Usa find ou grep?',
    resumo: ['grep', 'grep -c', 'grep -n', 'find -name', '|', 'cut', 'sort', 'uniq -c', 'wc -l', '>', '&&'],
  },

  // ═════════════════════════ JOGO DE EQUIPE: CORRIDA ════════════════════════
  {
    id: 'arena-corrida', ilustra: 'foguete', tipo: 'ArenaScene', modulo: 4, passos: 1, minutos: 3,
    jogo: 'corrida',
    titulo: 'Corrida de equipes',
    enunciado: 'Cada pessoa faz no **próprio terminal**, e conta quem da equipe terminar primeiro. Tarefa: criar a pasta `~/corrida` e, dentro dela, um arquivo com **o nome da sua equipe** (exemplo: `azul.txt`) contendo a palavra `pronto`. A chegada é conferida sozinha.',
    segundos: 120,
    taskSlug: 'corrida-1',
    premios: [450, 300, 210, 140],
    referencias: [
      { id: 'm2-demo', titulo: 'Criar pasta e arquivo (mkdir, echo >)' },
      { id: 'm4-encadear', titulo: 'Dois comandos numa linha (&&)' },
    ],
  },

  // ════════════════════ M5 · PROGRAMAS E PROCESSOS ══════════════════════════
  {
    id: 'm5-capa', ilustra: 'engrenagem', tipo: 'ModuleCover', modulo: 5, passos: 1, minutos: 0.5,
    titulo: 'Programas e processos',
    pergunta: 'Como eu instalo programas e **o que faço quando um deles trava**?',
    xpDoModulo: 280,
  },
  {
    id: 'm5-processo', ilustra: 'engrenagem', tipo: 'MentalModel', modulo: 5, passos: 1, minutos: 1,
    titulo: 'Todo programa rodando tem um número',
    diagrama: 'processo',
    legenda: 'Um programa rodando é um **processo**, e cada processo tem um número: o **PID**. Sem o `&`, o programa ocupa o seu terminal até terminar. Com o `&` no fim, ele roda **em segundo plano** e o prompt volta na hora. Para encerrar: `kill` e o PID.',
  },
  {
    id: 'm5-demo', ilustra: 'pacote', tipo: 'TerminalDemo', modulo: 5, passos: 7, minutos: 3,
    titulo: 'Instalar, rodar, encerrar',
    imagem: '/slides/m5-processo-pid.png',
    legendaImagem: 'Processos no Linux: segundo plano (&), identificador único (PID) e encerramento com kill',
    linhas: [
      { comando: 'sudo apt install -y htop', saida: 'Setting up htop ...', traducao: '`sudo` = como administrador. `apt install` baixa o programa da **loja oficial** da distro. `-y` responde "sim" para tudo.' },
      { comando: 'htop', saida: '  PID USER   CPU%  COMMAND\n 4821 aluno   0.3  node app.js', destaque: '4821', traducao: 'Mostra o que está rodando. Olhe só **PID, CPU% e o nome**. Sai com q.' },
      { comando: 'node app/app.js', saida: 'app no ar na porta 3000 — PID 4821\n█', traducao: 'O prompt não volta: o programa **está ocupando o terminal**. Ctrl+C encerra.' },
      { comando: 'node app/app.js &', saida: '[1] 4822', destaque: '4822', traducao: 'Com `&` ele vai para **segundo plano**. O 4822 é o PID, e o prompt voltou.' },
      { comando: 'ps aux | grep app.js', saida: 'aluno  4822  0.1  0.4  node app/app.js', destaque: '4822', traducao: '`ps aux` lista **todos os processos**, e o `grep` filtra o nosso. A 2ª coluna é o PID.' },
      { comando: 'kill 4822', saida: '[1]+  Terminated   node app/app.js', traducao: '`kill` + **o PID** encerra o processo (pelo nome não funciona). Se ele não obedecer: `kill -9 4822` força.' },
      { comando: 'which htop', saida: '/usr/bin/htop', traducao: '`which` diz onde o programa está. Se aparecer **command not found**, ele não está instalado ou o nome está errado.' },
    ],
  },
  {
    id: 'm5-prever', ilustra: 'robo', tipo: 'WidgetScene', modulo: 5, passos: 1, minutos: 2,
    titulo: 'O que vai acontecer?',
    widget: 'predict-output',
    enunciado: 'Três comandos. Antes de ver o resultado, **escolha o que você acha que acontece**. Errou? Leia a explicação e tente de novo.',
    segundos: 60, pontePara: 'node app/app.js &  ·  kill <PID>',
    referencias: [
      { id: 'm5-processo', titulo: 'Todo programa rodando tem um número (PID)' },
      { id: 'm5-demo', titulo: 'Instalar, rodar, encerrar' },
    ],
  },
  {
    id: 'm5-lab', ilustra: 'loja', tipo: 'LabScene', modulo: 5, passos: 1, minutos: 6.5,
    titulo: 'Mão na massa · instalar, rodar, encerrar',
    taskSlug: 'm5-processos',
    objetivo: 'Faça os três itens **na ordem**, na sua pasta pessoal (`cd ~`). Cada item fica verde sozinho em poucos segundos: **espere o item 2 ficar verde** antes de encerrar a app, porque ele só conta enquanto ela está rodando.',
    criterios: [
      { id: 'm5-c1', descricao: 'Instalar o seu programa: veja o nome com `cat ~/.pacote` e rode `sudo apt install -y` + o nome', xp: 80 },
      { id: 'm5-c2', descricao: 'Rodar `node app/app.js &` (com o `&`) e esperar este item ficar verde', xp: 80 },
      { id: 'm5-c3', descricao: 'Achar o PID com `ps aux | grep app.js` e encerrar a app com `kill` + o PID', xp: 120 },
    ],
    comandosDoModulo: ['cat ~/.pacote', 'sudo apt install -y', 'node app/app.js &', 'ps aux | grep', 'kill'],
    segundos: 300, escopo: 'individual',
    referencias: [
      { id: 'm5-demo', titulo: 'Instalar, rodar, encerrar' },
      { id: 'm5-processo', titulo: 'Processo e PID' },
    ],
  },
  {
    id: 'm5-recap', ilustra: 'bandeira', tipo: 'Recap', modulo: 5, passos: 2, minutos: 1,
    titulo: 'Fecho do módulo 5',
    perguntaDeRecuperacao: 'Um programa travou e não responde ao Ctrl+C. Como você descobre o PID e encerra?',
    resumo: ['sudo apt install -y', 'htop', '&', 'ps aux', 'kill', 'kill -9', 'which'],
  },

  // ═══════════════════════ JOGO DE EQUIPE: CAÇA AO ERRO ═════════════════════
  {
    id: 'arena-caca-erro', ilustra: 'lupa', tipo: 'ArenaScene', modulo: 5, passos: 1, minutos: 3,
    jogo: 'caca-erro',
    titulo: 'Caça ao erro',
    enunciado: 'Oito comandos e **três deles dão erro**. Leiam primeiro o que existe na pasta (está logo acima dos comandos). Em equipe, cliquem nos três errados e enviem. A equipe mais rápida leva mais XP, e errar só custa tempo.',
    segundos: 120,
    premios: [420, 290, 200, 120],
    referencias: [
      { id: 'm1-demo', titulo: 'Maiúscula importa (cat)' },
      { id: 'm2-demo', titulo: 'Apagar pasta (rm -r)' },
      { id: 'm5-demo', titulo: 'Encerrar processo (kill + PID)' },
    ],
  },

  // ═════════════════════════ BOSS · O CHAMADO ═══════════════════════════════
  {
    id: 'm6-capa', ilustra: 'alarme', tipo: 'ModuleCover', modulo: 6, passos: 1, minutos: 0.5,
    titulo: 'O Chamado',
    pergunta: '"O relatório da madrugada não foi gerado." Cada equipe recebe um servidor com **4 defeitos** e tem 9 minutos.',
    xpDoModulo: 700,
  },
  {
    id: 'm6-cartas', ilustra: 'aperto-de-mao', tipo: 'GroupScene', modulo: 6, passos: 1, minutos: 1, modo: 'papeis',
    titulo: 'Cada pessoa pega uma carta',
    enunciado: 'Clique numa carta para ficar com ela. Cada defeito só pode ser entregue **por quem tem a carta dele**. Se a equipe tiver menos de 4 pessoas, deixe as cartas que sobrarem sem dono: aí qualquer pessoa pode entregar aqueles itens.',
    papeis: [
      { id: 'investigador', nome: 'Investigador', faz: 'acha a linha FATAL no log (grep) e cola a mensagem no campo de resposta' },
      { id: 'operador', nome: 'Operador', faz: 'acha no htop o processo travado que está gastando CPU e encerra (htop, kill)' },
      { id: 'mecanico', nome: 'Mecânico', faz: 'faz o backup.sh rodar (ls -l, chmod +x, ./backup.sh)' },
      { id: 'relator', nome: 'Relator', faz: 'escreve o laudo.txt com o resumo do conserto (echo >, grep -c)' },
    ],
  },
  {
    id: 'm6-boss', ilustra: 'ferramenta', tipo: 'LabScene', modulo: 6, passos: 1, minutos: 11,
    titulo: 'Boss · o relatório da madrugada não rodou',
    taskSlug: 'boss-chamado', cartoes: true,
    objetivo: 'Cada cargo tem os **seus cartões de comando**, e só quem tem a carta envia os dela. Tem cartão que investiga, cartão que conserta e cartão que **parece resolver mas causa outro problema**. Tudo o que a equipe envia aparece para a equipe inteira.',
    criterios: [
      { id: 'b-c1', papel: 'investigador', descricao: 'Colar no campo a mensagem da linha `FATAL` do log (o texto depois de FATAL)', xp: 150 },
      { id: 'b-c2', papel: 'operador', descricao: 'Achar no `ps` o processo que mais gasta CPU (o PID está na 2ª coluna) e encerrar com `kill` + o PID', xp: 150 },
      { id: 'b-c3', papel: 'mecanico', descricao: 'Deixar o `backup.sh` executável e rodar ele (`./backup.sh`)', xp: 150 },
      { id: 'b-c4', papel: 'relator', descricao: 'Criar `laudo.txt` na pasta da equipe com o nome da equipe, quantas linhas `ERROR` o log tem e o PID encerrado', xp: 250 },
    ],
    comandosDoModulo: ['ls -l', 'grep', 'grep -c', 'ps aux', 'kill', 'chmod +x', './backup.sh', 'echo >'],
    segundos: 540, escopo: 'grupo',
    referencias: [
      { id: 'm4-demo', titulo: 'Investigador e Relator: grep e grep -c' },
      { id: 'm5-demo', titulo: 'Operador: ps e kill' },
      { id: 'm3-demo', titulo: 'Mecânico: chmod +x e ./' },
      { id: 'm2-demo', titulo: 'Relator: criar arquivo (echo >)' },
    ],
  },


  // ═════════════════════════════ ENCERRAMENTO ═══════════════════════════════
  {
    id: 'fim-pacote', ilustra: 'festa', tipo: 'Recap', modulo: 6, passos: 2, minutos: 1,
    titulo: 'O que vocês sabem fazer agora',
    perguntaDeRecuperacao: 'Você abre um Linux desconhecido, sem mouse e sem janelas. Por onde começa?',
    resumo: [
      'pwd', 'ls -la', 'cd', 'cat', 'nano', 'mkdir', 'cp', 'mv', 'rm -r', '*', '>', '>>',
      'ls -l', 'chmod +x', 'chmod 644', 'sudo', 'grep', 'find', '|', 'sort', 'uniq -c', 'wc -l',
      'apt install', 'ps aux', 'kill', '&', 'Tab', '--help', 'q', 'Ctrl+C', ':q!',
    ],
  },
  {
    id: 'fim-placar', ilustra: 'trofeu', tipo: 'Scoreboard', modulo: 6, passos: 1, minutos: 1.5,
    titulo: 'Pódio final: pessoas e equipes', escopo: 'individual',
  },
];

/** Minutos planejados do deck inteiro (precisa caber em 120). */
export const MINUTOS_TOTAIS = DECK.reduce((s, c) => s + c.minutos, 0);

/** Minutos planejados ANTES da cena `i` começar: o painel compara com o relógio. */
export function minutosAte(i: number): number {
  return DECK.slice(0, i).reduce((s, c) => s + c.minutos, 0);
}

export const CENAS_POR_MODULO = DECK.reduce<Record<number, number>>((acc, c) => {
  acc[c.modulo] = (acc[c.modulo] ?? 0) + 1;
  return acc;
}, {});

/** Primeira cena de cada módulo, para o "ir para" do painel do apresentador. */
export const INICIO_DOS_MODULOS = DECK.reduce<Record<number, number>>((acc, c, i) => {
  if (!(c.modulo in acc)) acc[c.modulo] = i;
  return acc;
}, {});
