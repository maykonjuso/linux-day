# Workshop Linux Day — Plano de Conteúdo e Condução

> Formato: 2h, presencial, gamificado, em duas metades:
> **(1) Introdução ao Linux — história e conceitos, jogada no estilo Kahoot.**
> **(2) Mão na massa — comandos de verdade, verificados pelo sistema, do `ls` até diagnosticar e consertar um servidor quebrado.**
> Público assumido: estudantes, nível misto, maioria com pouca ou nenhuma experiência de terminal.
> Clímax do evento: cada grupo recebe um servidor quebrado e tem que fechar o chamado usando **tudo** que aprendeu nas duas horas.

---

## 1. Arco narrativo

A primeira meia hora responde **"o que é essa coisa e por que eu deveria me importar"**, e é toda baseada em quiz coletivo: pergunta no projetor, todos respondem no próprio aparelho, pontos por acerto e velocidade, revelação com o gráfico de respostas e a explicação logo depois. É assim que você aquece a sala, nivela quem nunca ouviu falar de kernel e já começa o placar antes de qualquer comando.

Da metade em diante, a aula vira uma única missão: **"você entrou hoje no time de suporte. O servidor é seu."** Cada módulo entrega uma ferramenta de trabalho, e o boss final é um chamado de verdade que só fecha quem juntar todas.

| # | Capítulo | Pergunta que responde | Mecânica |
|---|----------|----------------------|----------|
| 0 | O que é Linux, afinal | De onde isso veio e por que está em tudo? | **Kahoot** (3 rodadas) |
| 1 | Cheguei no servidor | Onde eu estou, como olho em volta e como me ajudo sozinho? | lab individual |
| 2 | Mexendo nas coisas | Como eu crio, movo, leio, edito e apago arquivos? | lab individual |
| 3 | Quem manda aqui | Por que "permission denied"? O que é `sudo`? | lab individual |
| — | Quiz relâmpago | Você entendeu os comandos até aqui? | **Kahoot** (1 rodada) |
| 4 | O superpoder | Como eu acho uma agulha no palheiro e ligo comandos entre si? | lab individual |
| 5 | Programas e processos | Como instalo coisas e o que faço quando algo travou? | lab individual |
| 6 | **O chamado** | Consigo juntar tudo e consertar um servidor quebrado? | **lab em grupo (boss)** |

**O que saiu e por quê:** o módulo de expor aplicação na rede com Apache (VirtualHost, proxy reverso, firewall) saiu. É conteúdo de sysadmin: exige entender cliente-servidor, portas, proxy e config de serviço — tudo isso **antes** de a pessoa estar segura com `cd`, `grep` e `chmod`. Na prática, o iniciante sai com um `app.conf` copiado que ele não consegue explicar. O lugar dele é num workshop 2.
**O que entrou:** pipes, `grep` e `find` como módulo cheio (é a ideia mais característica do Unix e a de maior retorno imediato), `--help`/`man`/`Ctrl+R` como habilidade explícita, e um boss de **diagnóstico** — que não ensina nada novo, e é exactamente por isso que consolida.

---

## 2. Grade de tempo (120 min)

| Tempo | Bloco | Minutos | Tipo |
|-------|-------|---------|------|
| 00:00 | Abertura: QR code, entrar no app, nickname, formar grupos | 8 | plenária |
| 00:08 | **M0** Introdução ao Linux — 3 blocos de slide + Kahoot alternados | 18 | slide + quiz |
| 00:26 | **M1** Cheguei no servidor (navegação + se ajudar sozinho) | 5 slide + 6 lab + 1 placar | misto |
| 00:38 | **M2** Mexendo nas coisas (arquivos + nano) | 6 slide + 8 lab + 2 placar | misto |
| 00:54 | **M3** Quem manda aqui (permissões e `sudo`) | 5 slide + 7 lab + 1 placar | misto |
| 01:07 | Respiro + **Kahoot relâmpago de comandos** | 4 | quiz |
| 01:11 | **M4** O superpoder (pipes, `grep`, `find`, redirecionamento) | 6 slide + 9 lab + 1 placar | misto |
| 01:27 | **M5** Programas e processos (`apt`, `ps`, `top`, `kill`, `&`) | 5 slide + 7 lab + 1 placar | misto |
| 01:40 | **M6** Boss em grupo: **O Chamado** | 2 slide + 10 lab | em grupo |
| 01:52 | Placar final, premiação, cheatsheet, feedback | 8 | plenária |

Regras de cronometragem:
- Cada lab tem **timer visível** e fecha automaticamente; quem não terminou recebe o **gabarito em 1 clique** (aplica o estado correto no ambiente). **Isso é crítico:** o boss depende de todos os módulos anteriores terem "acontecido" no ambiente da pessoa.
- Se atrasar: encurte o M3 (um critério só) e corte o Kahoot relâmpago. Em último caso, o M5 vira demonstração sua (sem lab) — o boss já exercita `ps`/`kill`.
- **O boss nunca é cortado.** Se sobrarem 6 minutos em vez de 10, reduza de 4 para 3 critérios; ele é o fecho emocional e o único momento de integração do workshop.
- Se adiantar: libere os desafios bônus e uma rodada extra de Kahoot de curiosidades.

---

## 3. Módulo 0 — Introdução ao Linux (formato Kahoot)

**Estrutura:** 3 ciclos de `slide (3–4 min) → 3 perguntas (20s cada) → revelação comentada`. A pergunta aparece no projetor; as alternativas aparecem no aparelho de cada um; o gráfico de respostas aparece na revelação e você usa os erros da sala como gancho para explicar. Nunca explique antes: a pergunta vem primeiro, e a curiosidade faz o conteúdo colar.

### Ciclo 1 — De onde veio
**Slide:** Unix nos anos 70 → o projeto GNU de Richard Stallman (1983) e a ideia de software livre → Linus Torvalds, estudante finlandês de 21 anos, publica o kernel em 1991 → a combinação GNU + Linux → licença GPL e o que "código aberto" significa na prática.
**Perguntas:**
1. Em que ano Linus Torvalds anunciou o Linux? *(1991)*
2. O nome que Linus queria originalmente era… *("Freax")*
3. Por que o mascote é um pinguim? *(Tux — Linus foi mordido por um pinguim num zoológico na Austrália)*

### Ciclo 2 — O que é, tecnicamente
**Slide:** a distinção que quase ninguém chega sabendo — **kernel ≠ distribuição**. Kernel = o núcleo que conversa com o hardware. Distro = kernel + GNU + gerenciador de pacotes + ambiente gráfico. Árvore das famílias: Debian → Ubuntu → Mint; Red Hat → Fedora → CentOS/Rocky; Arch → Manjaro; e Alpine nos containers. Terminal vs interface gráfica e por que servidor quase nunca tem tela.
**Perguntas:**
4. O que é, exatamente, "o Linux"? *(o kernel)*
5. Ubuntu é baseado em qual distribuição? *(Debian)*
6. Qual comando instala pacotes numa família Debian? *(`apt`)* — ponte direta para o M4.

### Ciclo 3 — Onde ele está (o "por que me importar")
**Slide:** Android é Linux. Praticamente todo site que eles usam roda em Linux. 100% dos 500 supercomputadores mais rápidos do mundo. Roteadores, TVs, caixas eletrônicos, carros, a Estação Espacial, os Falcon 9 da SpaceX. Depois: o Git também nasceu das mãos do Linus, para versionar o próprio kernel. Fecha com: "e hoje vocês vão administrar um servidor Linux de verdade".
**Perguntas:**
7. Qual desses **não** roda sobre o kernel Linux? *(alternativas: Android, ChromeOS, iOS ✔, Steam Deck)*
8. Quantos dos 500 supercomputadores mais rápidos do mundo rodam Linux? *(todos os 500)*
9. Qual outra ferramenta que vocês usam todo dia foi criada pelo Linus? *(Git)*

**Pontuação:** 40 XP por acerto + até 30 por velocidade (decrescente linear nos 20s) + 1 token `sudo` por acerto. Pontos vão para o placar individual; a média do grupo também entra no placar de grupos, o que já cria torcida interna antes do primeiro comando.

**Banco de perguntas:** escreva 18 e sorteie 9 na hora. Sobra material para a rodada extra se adiantar, e o conteúdo não fica previsível se você repetir o workshop.

---

## 4. O pacote de sobrevivência (o que a pessoa leva para casa)

Antes de escrever qualquer slide, feche **isto**: a lista do que alguém precisa para não ficar paralisado na frente de um Linux aberto. Todo o resto do workshop existe para instalar este pacote na cabeça da pessoa — e nada que esteja fora dele entra na aula.

O pacote é organizado **por situação**, não por comando. Iniciante não pensa "preciso de `grep`"; pensa "preciso achar onde está escrito isso". O cheatsheet impresso tem exatamente esta estrutura, e os slides de fecho de módulo também.

| Situação real | O que ele usa |
|---|---|
| **"Onde eu estou? O que tem aqui?"** | `pwd` · `ls` · `ls -la` · `cd` · `cd ..` · `cd ~` · `tree` |
| **"Quero ver o que tem dentro desse arquivo"** | `cat` · `less` · `head` · `tail` · `wc -l` |
| **"Quero criar, copiar, renomear, apagar"** | `mkdir -p` · `touch` · `cp` · `mv` · `rm` · `rm -r` |
| **"Quero fazer isso com vários arquivos de uma vez"** | o coringa `*` — `*.txt` · `tmp_*` · `rm *.log` |
| **"Quero editar um arquivo"** | `nano` (salvar `Ctrl+O`, sair `Ctrl+X`) |
| **"Deu `permission denied`"** | `ls -l` · `whoami` · `id` · `chmod +x` · `chmod 644` · `sudo` |
| **"Preciso achar uma coisa"** | `find . -name` · `grep -rn` · `grep -c` · `which` |
| **"Quero juntar comandos / salvar o resultado"** | `|` · `>` · `>>` · `sort` · `uniq -c` · `cut` · `wc` |
| **"Algo travou / o que está rodando?"** | `Ctrl+C` · `ps aux` · `top` · `kill` · `kill -9` · `&` · `jobs` · `fg` |
| **"Preciso instalar um programa"** | `apt update` · `apt install` · `apt search` |
| **"Quero rodar um comando depois do outro"** | `;` · `&&` |
| **"Errei o começo de um comando enorme"** | `Ctrl+A` início · `Ctrl+E` fim · `Ctrl+W` apaga palavra · `Ctrl+U` apaga a linha |
| **"Não sei o comando / esqueci a sintaxe"** | `Tab` · `↑` · `Ctrl+R` · `history` · `comando --help` · `man` · `tldr` |
| **"Socorro, não consigo SAIR disso"** | `q` (no `less`/`man`) · `Ctrl+C` · `Ctrl+D` · `Esc` `:q!` (vim) |

São ~40 comandos e atalhos. É pouco de propósito: alguém que domina estes **se vira em qualquer Linux**, e alguém que viu 80 não se vira em nenhum.

### Três armadilhas que fazem iniciante achar que o computador está quebrado

Cada uma custa 20 segundos de aula e evita 5 minutos de travamento silencioso. Não deixe nenhuma de fora:

1. **A senha do `sudo` não aparece enquanto você digita.** Nem asterisco. A pessoa acha que o teclado parou de funcionar, apaga, tenta de novo, erra, e conclui que é incompetente. É só digitar e dar Enter. **Avise no M3, antes do primeiro `sudo`.**
2. **`Ctrl+C` no terminal não copia** — interrompe o programa. Copiar é `Ctrl+Shift+C`, colar é `Ctrl+Shift+V`. Avise no M1 ou perca 5 minutos depois.
3. **Maiúscula importa e espaço no nome quebra o comando.** `Docs` ≠ `docs`. `cat meu arquivo.txt` procura **dois** arquivos; o certo é `"meu arquivo.txt"`. Avise no M2, onde eles começam a criar nomes.

### O kit de fuga (os 5 minutos de maior retorno do workshop)

Ensine isto no **M1**, antes de qualquer outra coisa, e repita sempre que aparecer:

- **`Ctrl+C`** interrompe o que está rodando. É o botão de pânico, e usar não quebra nada.
- **`q`** sai do `less` e do `man` — a tela que "não fecha" e faz o iniciante fechar o terminal inteiro.
- **`Esc` `:q!` `Enter`** sai do `vim` sem salvar. Vai acontecer por acidente; se ninguém avisar, a pessoa trava por 3 minutos e se sente burra.
- **`Ctrl+L`** limpa a tela quando a bagunça visual começa a atrapalhar o raciocínio.
- **`clear`**, **`exit`**, e: **fechar o terminal nunca estraga o computador.**

Parece bobo. É a diferença entre "eu travei e desisti" e "eu travei e saí". **Nenhum workshop de Linux ensina isso, e é o conteúdo que mais destrava gente de verdade.**

### Os 6 hábitos (valem mais que os comandos)

1. **Leia a mensagem de erro.** Ela quase sempre diz exatamente o que está errado. Em inglês, mas são 6 mensagens que se repetem para sempre.
2. **Perdido? `pwd` e `ls -la`.** Nessa ordem, sempre. Resolve metade dos problemas de iniciante.
3. **Use `Tab`.** Não digite caminho inteiro: além de ser mais rápido, se o `Tab` não completa, **o caminho não existe** — é um teste de erro de graça.
4. **`--help` antes de perguntar.** `comando --help` responde mais rápido que qualquer colega.
5. **Pare antes de `rm -r` e antes de `sudo`.** Os dois comandos que fazem estrago de verdade. Reler antes de apertar Enter é um hábito, não medo.
6. **Comando que você colou e não entende é dívida.** Decomponha com a anatomia que você aprendeu (programa → subcomando → flag → argumento) ou não cole.

---

## 5. Roteiro didático, módulo por módulo

Cada módulo segue a mesma estrutura de 5 batidas — e a repetição é deliberada: depois do segundo módulo a sala já sabe o que vem, e passa a usar energia no conteúdo em vez de no formato.

> **Gancho** (uma pergunta ou dor, 30s) → **Modelo mental** (um diagrama, 2 min) → **Demonstração** (comandos na ordem, com saída na tela) → **Widget** (exercício interativo de 60s no slide, sem terminal) → **Mão na massa** (lab verificado no terminal) → **Fecho** (pergunta de recuperação + resumo que acumula)

**A batida do widget é nova e é a mais importante para o iniciante: widget antes, terminal depois.** O widget é um exercício interativo dentro do próprio slide — arrastar, clicar, encaixar — onde **errar por digitação é impossível** e o feedback é imediato. Ele instala o modelo mental; o terminal depois consolida com as mãos. Isso ataca o que mais destrói a confiança de quem está começando: errar um `cd` por causa de uma letra e concluir que não entendeu o conceito.
Bônus: todo widget **funciona no celular**, então quem veio sem notebook participa de verdade; e nenhum widget precisa de checker, shell ou reset — o que também salva o cronograma, porque cabe um exercício de 60 segundos onde não cabe um lab de 8 minutos. O catálogo completo dos tipos está em `plano-app.md` §1.3b.

### M1 — Cheguei no servidor · 12 min

**Gancho:** *"Vou tirar o mouse de vocês. Essa tela preta é tudo o que um servidor de verdade te dá — e 99% dos servidores do mundo são assim. A boa notícia: dá para se virar com 5 comandos."*

**Modelo mental:** a árvore invertida a partir de `/`, com `~` aceso como "sua casa". O mesmo caminho escrito das duas formas (`/home/aluno/docs` e `~/docs`) para a pessoa ver que são a mesma coisa.

**Demonstração, nesta ordem (a ordem importa):**
1. Ler o prompt em voz alta: `aluno@servidor:~$` → *"eu sou aluno, na máquina servidor, dentro da minha casa"*. **Repita isso em todos os módulos.**
2. `whoami`, `pwd` — "quem sou eu, onde estou".
3. `ls` → `ls -la`, comparando as duas saídas lado a lado. Explique **só** três colunas: permissões, dono, nome. O resto é ruído agora.
4. `cd docs`, `pwd`, `cd ..`, `cd ~`, `cd -`.
5. **O kit de fuga**, aqui: `Ctrl+C`, `q`, `Ctrl+L`, e o `:q!` do vim.
6. `Tab` completando um nome longo; `↑` repetindo; `history`; `Ctrl+R` buscando um comando antigo. Diga a regra de ouro: *"se o `Tab` não completa, o caminho não existe — ele é um corretor ortográfico de graça"*.
7. **Editar a linha sem usar a seta 40 vezes:** `Ctrl+A` vai para o início, `Ctrl+E` para o fim, `Ctrl+W` apaga a última palavra, `Ctrl+U` apaga tudo. É o tipo de coisa que faz a pessoa parar de ter raiva do terminal.
8. **Copiar e colar:** `Ctrl+Shift+C` / `Ctrl+Shift+V` — e **`Ctrl+C` não copia, interrompe**. Dois segundos de aviso, cinco minutos economizados.
9. `ls --help` e `man ls` → e sair com `q`. Fecha o laço: *"nunca mais precisam decorar nada"*.

**Widget (`path-quiz`, 60s):** a árvore de diretórios na tela; "você está em `/home/aluno/docs/2024`. Clique onde você cai com `cd ../..`". Três rodadas, cada uma mais fundo. Caminho relativo deixa de ser abstrato **antes** de alguém digitar `cd`.
**Widget 2 (`escape-room`, 30s):** quatro telas travadas (`less`, `man`, `vim`, um programa rodando) e a pergunta "qual tecla te salva?". É o kit de fuga entrando pela mão, não pelo ouvido.

**Mão na massa:** `flag.txt` escondida 4 níveis abaixo, num diretório que só aparece com `ls -a`. Entregar o conteúdo da flag.
**XP:** 150 + bônus de velocidade.
**Fecho:** *"qual comando eu uso quando não sei onde estou?"* → resumo acumulado: `pwd` `ls -la` `cd` `Tab` `--help` `q`.

### M2 — Mexendo nas coisas · 16 min

**Gancho:** *"Até agora vocês só olharam. Agora vão mexer — e sim, dá para apagar coisa sem querer. Vou mostrar exatamente onde é o precipício."*

**Modelo mental:** o diretório como gaveta; `mv` é a mesma ação para mover e renomear (é a sacada que confunde todo mundo: renomear = mover para o mesmo lugar com outro nome).

**Demonstração:**
1. `mkdir -p projeto/src`, `touch projeto/src/app.js`, `tree projeto`.
2. `cp`, `mv` renomeando, `mv` movendo — mostrando o `ls` antes e depois de cada um. **Sempre mostre o antes e o depois.**
3. `cat` num arquivo curto, `less` num longo (e **sair com `q`**), `head -5`, `tail -5`, `wc -l`.
4. `nano notas.md`: digitar, `Ctrl+O` salvar, `Ctrl+X` sair. Mostre que as teclas estão escritas no rodapé da tela — ninguém precisa decorar.
5. `echo "oi" > a.txt` e depois `>> a.txt`, com `cat` entre os dois para ver a diferença entre **sobrescrever** e **acrescentar**. Esse par é a base do M4.
6. **O coringa `*`**, montado em três passos com a saída na tela: `ls *.txt` → `ls tmp_*` → `cp *.md docs/`. Diga o que ele é: *"`*` significa 'qualquer coisa aqui' — é o que transforma 20 comandos em um"*. **Sem isso o lab deste módulo é desumano**, e com isso ele fica elegante.
7. **Nome de arquivo:** `Docs` ≠ `docs`, e `cat meu arquivo.txt` procura dois arquivos — use `"meu arquivo.txt"` ou evite espaço. 20 segundos.
8. `rm arquivo.txt`, `rm -r pasta/`, e o slide de precipício: *"não existe lixeira. `rm -rf /` apaga a máquina. Nessas duas letras você relê antes de apertar Enter."*

**Widget (`fs-dragdrop`, 90s):** os 20 arquivos bagunçados aparecem como cartões e as três pastas como alvos; a pessoa **arrasta** cada um para o lugar. Ao terminar, o slide mostra **os comandos `mv` equivalentes** ao que ela acabou de fazer com o mouse — e aí o lab no terminal deixa de ser um salto no escuro: é repetir no teclado o que ela já resolveu com a cabeça.
**Widget 2 (`spot-the-danger`, 30s):** quatro comandos parecidos, um destrói tudo (`rm -rf ~` entre `rm -r ~/tmp`, `rm -i *.log`, `rm tmp_*`). Achar o perigoso sem correr risco nenhum.

**Mão na massa (o lab de arrumar o diretório):** `~/bagunca/` com 20 arquivos soltos; a especificação pede 6 coisas:
1. `imagens/` com todos os `.png`/`.jpg`
2. `docs/` com todos os `.txt`/`.md`
3. `scripts/` com todos os `.sh`
4. `rascunho.txt` renomeado para `notas.md` dentro de `docs/`
5. apagar tudo que começa com `tmp_`
6. criar `README.md` contendo a linha `organizado por <seu nick>`

**Verificação:** critério por critério, ✅/❌ item a item, a pessoa vê exatamente o que falta. **40 XP por critério (240 no total)** — ninguém zera.
**Desafio bônus (+50 XP, badge `Faxineiro`):** resolver tudo em um único comando com `for` ou `find -exec`.
**Fecho:** *"qual a diferença entre `>` e `>>`?"* → resumo: `mkdir` `cp` `mv` `rm` `cat` `nano` `*` `>` `>>`.

### M3 — Quem manda aqui · 13 min

**Gancho:** *"Quem já viu `permission denied` e não soube o que fazer? Em 10 minutos isso deixa de ser mistério — é a mensagem de erro mais comum do Linux."*

**Modelo mental:** o arquivo com **três cadeados** — dono / grupo / outros — e `rwx` acendendo em cada um. Depois, o `-rwxr-xr--` do `ls -l` decodificado pedaço por pedaço, encaixando no diagrama.

**Demonstração:**
1. `whoami`, `id`, `ls -l` relendo a coluna de permissões agora que ela faz sentido.
2. `cat relatorio.txt` → `Permission denied`. **Deixe o erro na tela e pergunte à sala o que fazer.**
3. `ls -l relatorio.txt` → `chmod 644` → `cat` funciona. O ciclo completo: erro → diagnóstico → conserto.
4. `nano deploy.sh`, `#!/bin/bash` + um `echo`, `./deploy.sh` → `Permission denied` de novo, mas por outro motivo → `chmod +x` → roda.
5. `sudo` em uma coisa que precisa (`sudo apt update`): *"`sudo` é pedir a chave do cofre emprestada por um comando só. Funciona — e é por isso que você relê antes."* **Avise antes de eles digitarem: a senha não aparece na tela, nem asterisco. O teclado está funcionando.** Essa frase sozinha evita meia dúzia de mãos levantadas.
6. Mostre `chmod 777` e diga por que **não**: *"é tirar as três portas da casa porque você perdeu uma chave."*

**Widget (`permission-toggles`, 90s):** os 9 cadeados (dono/grupo/outros × rwx) clicáveis, e **ao lado, ao vivo**, o `-rwxr-xr--` e o número `754` mudando a cada clique. Depois três desafios: "deixe só o dono editar", "deixe todos executarem", "qual número dá isso?". É o único jeito que eu conheço de permissões numéricas entrarem na cabeça de alguém em 90 segundos — por texto, não entram.

**Mão na massa:** criar `~/deploy.sh` com shebang, torná-lo executável e rodar; consertar um `relatorio.txt` com permissão `000`.
**XP:** 80 + 80 + 40 (200).
**Fecho:** *"deu permission denied: quais são as duas primeiras coisas que você olha?"* → resumo: `ls -l` `chmod +x` `chmod 644` `sudo`.

### Kahoot relâmpago · 4 min

4 perguntas sobre o que acabaram de digitar: qual comando apaga diretório; o que `chmod +x` faz; o que `..` significa; qual a diferença entre `>` e `>>`. Reengaja quem dispersou **e** te diz se os slides funcionaram — se a sala errar a terceira, reforce antes do M4.

### M4 — O superpoder · 16 min

**Gancho:** *"Esse é o módulo que separa quem usa Linux de quem só digita comandos. Um arquivo de log com 50 mil linhas: a resposta que vocês precisam está em uma delas. Boa sorte com o mouse."*

**Modelo mental:** o **encanamento**. Todo comando tem uma entrada e uma saída; o `|` conecta a saída de um na entrada do outro; o `>` despeja a saída num arquivo. Desenhe literalmente como mangueiras conectadas. **É o diagrama mais importante do workshop** — o `grep` sozinho é um truque, o pipe é uma ideia.

**Demonstração (vá montando a linha, pedaço por pedaço, com a saída na tela a cada passo):**
1. `grep ERROR app.log` — muita saída. *"Agora eu quero só contar."*
2. `grep -c ERROR app.log` — a contagem.
3. `grep -rn "ERROR" .` — achar **conteúdo** dentro de arquivos, com arquivo e linha.
4. `find . -name "*.log"` — achar **arquivo** pelo nome. Diga a diferença em uma frase: *"`find` acha o arquivo, `grep` acha o que está dentro dele."*
5. Monte ao vivo, acrescentando um pedaço por vez e mostrando a saída de cada etapa:
   `cat app.log` → `| grep ERROR` → `| cut -d' ' -f4` → `| sort` → `| uniq -c` → `| sort -rn | head -3`
   *"cinco comandos simples viraram uma pergunta de negócio respondida: quais os 3 erros mais frequentes."*
6. `... > relatorio.txt` e `cat relatorio.txt` — fechando com o `>` do M2, agora com propósito.
7. **Encadear:** `mkdir relatorios && cd relatorios` — *"`&&` é 'se o primeiro der certo, faça o segundo'; `;` é 'faça os dois de qualquer jeito'"*. Duas linhas de slide, e eles passam a escrever comandos compostos sem medo.

**Widget (`pipe-builder`, 2 min — o melhor widget do workshop):** as peças (`cat`, `grep ERROR`, `cut`, `sort`, `uniq -c`, `head -3`) ficam disponíveis para **arrastar para o encanamento**, e a cada peça encaixada o painel do lado mostra **a saída real se transformando** — 50 mil linhas → 400 → 400 cortadas → ordenadas → contadas → top 3. A pessoa *vê* o pipe funcionar antes de digitar uma barra vertical. Encaixar na ordem errada mostra a saída errada, sem drama: é assim que se aprende.

**Mão na massa:** `app.log` de 50 mil linhas, três entregas: quantos `ERROR` (número), qual IP aparece mais (string), e gravar as 3 linhas com `FATAL` em `~/fatais.txt` (verificado no arquivo).
**XP:** 100 + 100 + 150.
**Desafio bônus (+50):** o top 3 de erros em uma linha só.
**Fecho:** *"`find` ou `grep`: eu quero achar o arquivo chamado `config.yml`?"* → resumo: `grep -rn` `grep -c` `find -name` `|` `>` `sort` `uniq -c` `wc -l`.

### M5 — Programas e processos · 13 min

**Gancho:** *"Duas perguntas que vocês vão fazer na primeira semana de trabalho: 'como instalo isso?' e 'por que está travado?'"*

**Modelo mental:** o processo como uma caixa com um número (PID). Duas versões do mesmo desenho: em **foreground** a caixa está presa ao seu terminal (fechou o terminal, morreu); com `&` ela solta e o prompt volta.

**Demonstração:**
1. `apt search htop`, `sudo apt update`, `sudo apt install htop`. Diga de onde vem: *"um repositório, igual loja de aplicativos — não é baixar .exe de site."*
2. `htop` (ou `top`), ler só três coisas: PID, CPU%, nome. **Sair com `q`.**
3. `node app.js` em foreground → o terminal "travou" → *"ele não travou: ele está ocupado"* → `Ctrl+C`.
4. `node app.js &` → o prompt volta → `jobs`, `ps aux | grep node` (**pipe do M4 reaparecendo com propósito — aponte isso em voz alta**).
5. `kill <PID>`, confirmar com `ps`; e `kill -9` *"quando o programa não ouve o pedido educado"*.
6. `command not found` depois de instalar → `which htop` → uma frase sobre `PATH`: *"o sistema só encontra o programa se ele estiver numa das pastas da lista."*

**Widget (`predict-output`, 60s):** três rodadas de "o que acontece?" — `node app.js` (o prompt não volta), `node app.js &` (volta, e aparece um número), `Ctrl+C` numa das duas. Escolher entre 3 respostas. Vale XP de predição, e prepara o terminal.

**Mão na massa:** instalar **o seu pacote** (cada participante recebe um diferente — `htop`, `jq`, `cowsay`, `figlet`…; a sala descobre 30 programas em vez de um); rodar a app em foreground e matar com `Ctrl+C`; rodar com `&`; achar o PID com `ps aux | grep` e matar com `kill`.
**XP:** 80 + 80 + 120.
**Fecho:** *"um programa travou e não responde ao `Ctrl+C`. O que você faz?"* → resumo: `apt install` `ps aux` `top` `kill` `&` `jobs`.

### M6 — Boss em grupo: **O Chamado** · 12 min

**Gancho (2 min, slide único):** *"Chegou um chamado: 'o relatório da madrugada não foi gerado'. Vocês têm 10 minutos e um servidor quebrado. Nada de novo aqui — tudo que vocês precisam está nos últimos 50 minutos."*

Cada grupo recebe **um diretório compartilhado** em `/srv/chamado/grupo-<cor>` (permissão `2770`, os quatro mexendo nos mesmos arquivos, cada um no seu terminal — um plantão de verdade, e uma aula de grupo em Linux de graça), já quebrado de propósito, com 4 defeitos, um por módulo:

| # | Defeito | Resolve com | Carta de função | XP |
|---|---|---|---|---|
| 1 | Achar o log do serviço e a mensagem de erro (ninguém disse onde ele está) | `find` · `grep` · `less` | `Investigador` | 150 |
| 2 | Um processo travado comendo CPU — identificar e matar | `top` · `ps aux \| grep` · `kill` | `Operador` | 150 |
| 3 | O `backup.sh` não roda: falta permissão de execução | `ls -l` · `chmod +x` · `./backup.sh` | `Mecânico` | 150 |
| 4 | Entregar o laudo: gravar em `laudo.txt` (no diretório do grupo) o nome do grupo, a contagem de `ERROR` no log e o PID que foi morto | `grep -c` · `>` · `nano` | `Relator` | 250 |

**Cartas de função:** cada critério só pode ser submetido pela pessoa que está com a carta correspondente. É o que impede o aluno mais rápido de fazer tudo sozinho enquanto o grupo assiste — e o que garante que cada pessoa digite comando no boss.

**Por que esse boss é melhor que "subir um Apache":** não tem conteúdo novo, e isso é a virtude. Ele força **transferência** — a pessoa tem que escolher a ferramenta sem ninguém dizer qual é, que é precisamente a habilidade que faltava. É a primeira vez na vida dela que ela diagnostica um sistema, e a sensação de "eu consertei" é incomparavelmente mais forte do que "eu copiei uma config que funcionou".

**Momento de palco:** o primeiro grupo a fechar o chamado toca o som, a animação do placar e leva o badge `Chamado Fechado`. Projete o placar de grupos com os 4 critérios acendendo ao vivo, e **fique calado nos últimos 2 minutos** — a sala se resolve sozinha e é o melhor momento do evento.
**Desempate:** horário de conclusão do critério 4.

### Antes do boss — widget de 60s: `error-match`

Ligue as seis mensagens de erro do workshop às suas causas e aos seus consertos, arrastando. É a última coisa antes do chamado, e é exactamente a habilidade que o boss vai exigir: ler o erro e saber para onde ir.

### Encerramento · 8 min

1. Pódio individual e de grupos + prêmio do júri (mentoria).
2. **O slide que fecha o laço:** o diagrama do pacote de sobrevivência (§4) inteiro na tela, com todas as situações já vividas acesas. *"Vocês entraram aqui sem saber abrir um terminal. Olhem o que vocês sabem fazer agora."*
3. **Bônus de 3 minutos — "deixe o terminal do seu jeito" (`alias`):** ao vivo, sem lab.
   `alias ll='ls -la'` → usa → `exit` → voltou, e o alias sumiu. *"Por que? Porque ele vivia só na memória dessa sessão."* → `nano ~/.bashrc`, acrescenta `alias ll='ls -la'` e `alias ..='cd ..'` → `source ~/.bashrc` → agora é para sempre.
   Duas ideias caem juntas aqui, e são grandes: **o terminal é configurável, e a configuração é só um arquivo de texto** — editado com o mesmo `nano` do M2, dentro da sua casa, que eles já sabem navegar. É a ponte do "eu uso o Linux" para "o Linux é meu".
   *Por que no fim e não no meio:* alias não é sobrevivência, é conforto — só paga quem já repete comandos. Mas é **gratificante** e personalizado, e é isso que faz a pessoa abrir o terminal de novo no dia seguinte. Esse é o objetivo real do último slide. Se o workshop atrasar, este é o primeiro item a cair sem prejuízo nenhum.
4. Cheatsheet (impresso + PDF), com exatamente a estrutura do §4, e um canto para a pessoa anotar os aliases dela.
5. Três caminhos concretos para continuar, nomeados — um site de exercícios, um livro, e um projeto para fazer em casa (instalar uma VM/WSL e repetir o boss sozinho). Mencione `ssh` e `tar` como "o que vem depois", sem ensinar.
6. QR do feedback → libera o certificado (+50 XP, badge `Relatório Entregue`).

---

## 6. Gamificação

O design de jogo completo — duas moedas (XP e tokens `sudo`), economia balanceada, níveis/patentes, combos, predições, diagnóstico de erro, eventos ao vivo, cartas de função, badges e as regras de justiça — está em **`plano-gamificacao.md`**. O essencial para conduzir:

- **XP nunca diminui.** Dica, erro, reset e desconexão custam tokens ou nada, jamais pontuação.
- **Tudo rende progresso:** check-in, predição durante o slide, acerto no quiz, cada critério de lab, diagnosticar um erro, ajudar colega, preencher o feedback.
- **Dois placares:** individual e de grupos (por **média**, nunca soma).
- **Nenhum último lugar é exibido:** top 10 + a sua posição, comunicada como movimento ("você subiu 4 posições").
- **XP por minuto é crescente:** o boss do M5 vale 700 XP justamente para que quem está atrás no minuto 60 ainda acredite.

## 7. Gestão de presença e de quem travou

O que o app precisa garantir (detalhado em `plano-app.md`):
- **Follow-the-presenter com escape:** o slide de todos acompanha o apresentador, mas quem navegar sozinho entra em modo livre com um botão flutuante "voltar ao vivo". Ninguém fica preso na apresentação.
- **Estados de presença:** `ativo` (interagiu < 90s), `ocioso` (90s–5min), `desconectado`, `concluiu`, `travado` (tarefa aberta há > 60% do tempo sem nenhum critério novo), `pediu ajuda`.
- **Painel do facilitador:** grade pessoas × critérios. Verde = feito, amarelo = em progresso, vermelho = travado, cinza = offline. Você olha a tela e sabe em 3 segundos se pode seguir.
- **Regra dos 70%:** só avance o módulo quando 70% completaram o critério principal — o app mostra esse percentual ao vivo para a decisão não ser por intuição.
- **Botão "pedir ajuda"** → fila ordenada no painel, notifica monitores sem interromper a aula.
- **Pausa global** (congela timers), **broadcast** na tela de todos, **reset de ambiente** em 1 clique, **gabarito em 1 clique** no fim do timer.
- No Kahoot, quem está desconectado quando a pergunta abre entra na seguinte sem prejuízo, e o app não espera por quem caiu para revelar a resposta.

---

## 8. Papéis humanos

- **Você (apresentador):** fala e opera os slides/quiz. Não debugue ninguém individualmente — isso mata o ritmo.
- **Monitores:** 1 para cada ~10 participantes, atendendo a fila de ajuda. Briefing de 30 min **tendo rodado os labs inteiros antes**; entregue a eles o cheatsheet e as respostas.
- **Operador do app:** fica no painel, te avisa dos travados, opera reset/pausa e dispara as perguntas do Kahoot enquanto você fala.
- **Dupla obrigatória:** quem não tem notebook pareia com quem tem; pontos compartilhados. Anuncie na inscrição.

---

## 9. Runbook do dia

**T-7 dias:** ensaio completo com 3–5 cobaias reais (não desenvolvedores). Teste de carga com N ambientes simultâneos. Banco de perguntas do Kahoot revisado por alguém de fora (pergunta ambígua em quiz ao vivo gera revolta).
**T-1 dia:** ambientes provisionados e com snapshot; slides exportados em PDF estático (plano B); app em produção; dados de teste limpos.
**T-2h:** testar projetor (fonte e contraste reais), Wi-Fi com 5 dispositivos, fluxo QR code → entrar → responder quiz → pontuar, tomadas e extensões.
**T-15min:** QR code e URL curta projetados; monitores posicionados.
**Durante:** operador monitora; antes de cada transição você olha o percentual de conclusão.
**Imediatamente após:** placar congelado, certificados, formulário de feedback (NPS + "o que travou") com QR na tela.
**T+2 dias:** repositório público com slides, labs e cheatsheet; destruir ambientes e dados pessoais (ver LGPD em `gaps-e-riscos.md`).

**Plano B se o app cair:** slides em PDF + perguntas do quiz lidas em voz alta com voto de mão + labs numa folha impressa + verificação pelos monitores com checklist + placar no flipchart. Tenha isso pronto; são 2h irrecuperáveis.
