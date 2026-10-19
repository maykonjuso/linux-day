# Design dos Slides e da Experiência de Aprendizagem

> Premissa: o deck **não é material de apoio para o apresentador**. É a interface de aprendizagem de alguém que talvez nunca tenha aberto um terminal, usada ao mesmo tempo no projetor e no notebook de cada pessoa.
> Pergunta que valida cada slide: *se eu olhar só para esta tela, por 8 segundos, entendo o que está acontecendo e o que devo fazer?*
> Meta de retenção: a pessoa sai sabendo **o que acontece quando ela digita um comando**, não só quais letras digitar.

---

## 1. Os quatro princípios que governam o deck

**1. Modelo mental antes de sintaxe.** Ninguém decora `chmod 755` sem antes entender que existe dono, grupo e "os outros". Todo módulo abre com **uma** imagem/analogia do modelo mental e só depois mostra comandos. Comando sem modelo mental é ruído que evapora em 20 minutos.

**2. Carga cognitiva baixa e deliberada.** Um slide = uma ideia. Nunca mais de 3 comandos novos por slide, nunca mais de ~7 itens em qualquer lista. O terminal e a explicação nunca competem pela atenção: quando o terminal está em foco, o texto some.

**3. Recuperar é melhor que reler.** O que fixa memória é *tentar lembrar*, não ver de novo. Por isso: Kahoot no M0, pergunta-relâmpago no fim de cada módulo, e cada lab exige escrever o comando sem o slide na frente — o enunciado descreve o **objetivo**, não a solução.

**4. Erro é conteúdo, não acidente.** Um workshop de Linux onde nada dá errado não ensina Linux. Cada módulo tem um slide "o que vai dar errado e como ler a mensagem" **antes** do lab, e os erros previstos valem pontos quando o participante os reconhece.

---

## 2. Anatomia dos tipos de slide

O deck tem **8 tipos** de slide e nada além disso. Consistência é o que permite a pessoa parar de decodificar o layout e usar a cabeça para o conteúdo.

### T1 · Capa de módulo
Número + título + a pergunta do capítulo em uma frase + barra de progresso do workshop (`Módulo 3 de 6`) + o que vai ganhar de ponto. Mostra à pessoa onde ela está na jornada — isso reduz ansiedade e ancora a memória.

### T2 · Modelo mental (visual, quase sem texto)
Um diagrama grande, legível a 10 metros, com no máximo 6 rótulos. Exemplos obrigatórios do workshop:
- **Sistema de arquivos** = árvore invertida a partir de `/`, com `~` destacado como "sua casa". Mostrar o mesmo caminho das duas formas: `/home/joao/docs` e `~/docs`.
- **Processo** = uma caixa com PID, com uma seta "você" apontando para ela; e a segunda versão: você fecha o terminal e a caixa desaparece (foreground) vs continua (background).
- **Permissões** = o arquivo com três cadeados lado a lado: dono / grupo / outros, e o `rwx` acendendo em cada um.
- **O pipe** = encanamento. Cada comando é uma peça com entrada e saída; o `|` conecta a saída de um na entrada do outro; o `>` despeja num arquivo. Desenhe mangueiras de verdade, e vá acrescentando uma peça por vez na mesma imagem conforme a linha cresce.

Esse último diagrama é o mais importante do workshop inteiro: `grep` sozinho é um truque, o pipe é uma **ideia**, e é a ideia que a pessoa leva para qualquer Linux que abrir depois.

### T3 · Anatomia do comando
Um comando grande em mono, com setas rotuladas apontando para cada parte:
```
sudo  apt install -y  htop
└┬─┘  └┬┘ └──┬──┘ └┬┘  └─┬──┘
 │     │     │     │      └── argumento: o quê
 │     │     │     └───────── flag: "não me pergunte nada"
 │     │     └─────────────── subcomando: a ação
 │     └───────────────────── o programa
 └───────────────────────────  "como administrador"
```
Use esse mesmo formato para `ls -la`, `chmod +x deploy.sh`, `grep -rn "ERROR" .` e a linha com pipes do M4 (nessa, cada peça do encanamento recebe seu rótulo). Depois do terceiro, a pessoa começa a **decompor comandos novos sozinha** — é esse o objetivo real do workshop.

### T4 · Terminal demonstrado (o slide que mais ensina)
Bloco de terminal com entrada **e saída reais**, nunca só o comando. Três regras:
- A saída aparece com o comando, com a parte que importa **destacada** (o resto esmaecido). Beginner não sabe onde olhar numa saída de `ls -la`; você diz onde.
- Um rótulo "o que acabou de acontecer" em uma frase, em linguagem humana, embaixo do bloco.
- Replay opcional: botão que "digita" o comando caractere por caractere (~35ms por caractere) e revela a saída. Útil quando você está falando; ligado só por clique seu, nunca em loop automático.

### T5 · Vai dar errado assim
Dois a três erros reais, cada um com: a mensagem exata, a tradução em português humano, e a causa. Exemplos que **vão** acontecer:
| Mensagem | O que significa | Causa comum |
|---|---|---|
| `bash: cd: docs: No such file or directory` | "não existe nada chamado `docs` aqui" | está em outro diretório — rode `pwd` |
| `Permission denied` | "você não tem direito de fazer isso" | falta `sudo`, ou falta `chmod +x` |
| `command not found` | "esse programa não existe nesta máquina" | erro de digitação ou falta instalar |
| `rm: cannot remove 'x': Is a directory` | "isso é uma pasta, não um arquivo" | falta o `-r` |
| `No such process` | "esse PID não existe mais" | o processo já morreu — confirme com `ps` |
Ensine o **reflexo diagnóstico** junto: `pwd` → onde estou, `ls -la` → o que tem aqui, `ls -l arquivo` → quem é o dono, `whoami` → quem eu sou, `ps aux | grep` → ainda está rodando?
E o **kit de fuga** (`Ctrl+C`, `q`, `:q!`, `Ctrl+L`) tem um slide `WillGoWrong` só dele, no M1: é o conteúdo que mais destrava gente de verdade, e nenhum workshop ensina.

### T5b · Widget (exercício interativo no slide)
Um exercício jogável dentro do próprio slide, de 30 a 120 segundos, sem terminal: arrastar, clicar, encaixar. Catálogo dos 11 tipos em `plano-app.md` §1.3b (`pipe-builder`, `permission-toggles`, `fs-dragdrop`, `path-quiz`, `escape-room`, `spot-the-danger`, `predict-output`, `error-match`, `command-builder`, `quiz`…).
Contrato de todo widget, sem exceção:
- **errar não dói:** nenhuma ação destrói progresso, e tentar de novo é imediato e ilimitado;
- **feedback em menos de 300 ms**, visual, no próprio lugar onde a pessoa agiu;
- **estado sempre visível:** o resultado da ação aparece ao lado da ação (o `755` mudando enquanto os cadeados são clicados; a saída se transformando enquanto o pipe é montado);
- **ponte explícita para o terminal:** ao concluir, o widget mostra **o comando equivalente** ao que a pessoa acabou de fazer com o mouse. É isso que transforma o widget em preparação em vez de distração;
- **funciona com o dedo**, em tela de celular, sem hover.

Por que isso existe: o iniciante que erra um `mv` por causa de uma letra conclui que não entendeu o conceito. O widget separa as duas coisas — primeiro o conceito, com erro de digitação impossível; depois o teclado.

### T6 · Mão na massa (ponte para o lab)
Objetivo em uma frase, os critérios como checklist, tempo, pontos, e **a dica de partida** (qual comando dos últimos slides é o ponto de entrada). Nenhuma solução. Quando você avança deste slide, o app abre o lab na tela de todos automaticamente.

### T7 · Fechamento de módulo (retrieval + consolidação)
Uma pergunta de recuperação respondida no aparelho ("qual comando faria X?"), depois a revelação com os 3 comandos do módulo em uma única linha de resumo, que vai acumulando: ao fim do workshop esse slide é o cheatsheet construído pela própria aula. Mostrar o resumo **só depois** da tentativa.

---

## 3. A cena de lab (onde a pessoa passa 45 minutos)

**Não é uma tela separada: é um slide.** O terminal vive dentro da própria cena do deck (arquitetura em `plano-app.md` §3), então a pessoa nunca "sai da apresentação para o laboratório" — o enunciado, os critérios e o terminal estão no mesmo lugar onde ela estava ouvindo você 20 segundos atrás. Layout de três faixas, pensado para quem nunca usou terminal:

```
┌──────────────────────┬─────────────────────────────┬──────────────┐
│ OBJETIVO             │                             │ TAREFA       │
│ 1 frase              │   terminal (xterm.js)       │ 3º lugar     │
│                      │   fonte 16px, alto contraste│ 12/28 feitos │
│ CRITÉRIOS            │                             │              │
│ ✅ criar imagens/    │                             │ ⏱ 4:12       │
│ ✅ mover .png        │                             │              │
│ ⬜ renomear rascunho │                             │ [Verificar]  │
│ ⬜ apagar tmp_*      │                             │ [Dica −10%]  │
│                      │                             │ [Resetar]    │
│ COMANDOS DO MÓDULO   │                             │ [Ajuda 🙋]   │
│ mkdir · mv · rm · cat│                             │              │
└──────────────────────┴─────────────────────────────┴──────────────┘
```

Decisões que importam para quem tem conhecimento mínimo:
- **A régua de comandos do módulo está sempre visível** (só os nomes, sem a sintaxe completa). Dá autonomia sem entregar a resposta; `?` em cima de um nome abre a sintaxe num popover — e só então custa nada.
- **Critérios acendem sozinhos** (o checker roda também a cada 20s em background, não só no clique): o feedback chega antes da pessoa duvidar de si. Essa é a diferença entre "não sei se estou indo bem" e "estou indo bem".
- **Feedback diz o que falta, nunca "errado"**: ❌ `docs/notas.md` não encontrado — você renomeou `rascunho.txt`? A mensagem é sempre uma pergunta que aponta o próximo passo.
- **Resetar ambiente** sem culpa e sem perder pontos já conquistados. Medo de quebrar a máquina é o maior freio do iniciante; tire esse medo explicitamente num slide.
- **Nada de rolagem** na cena de lab. Se não cabe, o enunciado está longo demais.
- **Consulta sem sair da cena:** `?` abre uma gaveta com os slides de anatomia de comando e de terminal já vistos no módulo. A pessoa precisa rever a sintaxe sem se perder no deck — e essa é a única "navegação" que ela tem.
- **Foco de teclado explícito:** quando o cursor está no terminal, borda acesa e a legenda "o teclado está no terminal"; sai com `Esc Esc`. Iniciante que digita e não vê nada aparecer acha que travou.
- **O terminal continua vivo fora do lab:** recolhe numa gaveta (`Ctrl+\``) durante os slides de teoria, com a mesma sessão. Quem quiser testar um comando no meio da sua explicação deve poder — isso é ótimo para o aprendizado, e o estado do sistema de arquivos acompanha a pessoa do M1 até o M5.
- **Predição antes de executar** na primeira tarefa de cada módulo: um micro-prompt ("o que você acha que `ls -la` vai mostrar?" com 2 opções) antes de liberar o terminal. Custa 8 segundos e aumenta muito a fixação — a pessoa passa a executar para *testar uma hipótese*, não para copiar.

---

## 4. Regras visuais (projetor + notebook ao mesmo tempo)

| Decisão | Valor | Por quê |
|---|---|---|
| Tema do slide no projetor | **claro**, alto contraste (texto `#0B0B0C` sobre `#FAFAF9`) | projetor em sala com luz come o preto; dark theme bonito no monitor vira sopa cinza na parede |
| Tema do terminal | escuro **dentro de um bloco** no slide claro | o bloco escuro passa a ser "o terminal" visualmente — reduz confusão sobre onde digitar |
| Fonte mínima do slide | 28px efetivos no corpo, 56px+ no título | leitura da última fileira |
| Fonte do bloco de terminal | ≥ 22px no projetor, 15–16px no lab | ninguém decora o que não consegue ler |
| Tipografia | Inter (texto) + JetBrains Mono (código) | mono com `l`/`1`/`I` e `0`/`O` distinguíveis evita 10 minutos de erro de digitação |
| Cor como informação | sempre com ícone/texto redundante | daltonismo + projetor que distorce cor; ✅/⬜ nunca só verde/cinza |
| Grade | 16px base, respiro generoso | slide cheio é slide não lido |
| Mobile | cenas de conteúdo, quiz, placar e enunciado **sim**; terminal **não** | quem ficou sem notebook participa do Kahoot e torce no placar |
| Quiz dentro do slide | projetor mostra pergunta + timer + nº de respostas; aparelho mostra **só as alternativas**, grandes e tocáveis | repetir a pergunta em letra miúda no aparelho divide a atenção da sala; o Kahoot funciona porque todos olham para o mesmo lugar |

---

## 5. Movimento (do que vale animar ao que nunca animar)

A regra: animação aqui existe para **direcionar atenção** e **confirmar progresso**. Fora disso, atrapalha quem está tentando pensar.

| Elemento | Tratamento |
|---|---|
| Troca de slide | fade + 8px de subida, 200ms `cubic-bezier(0.23, 1, 0.32, 1)`. Nada de deslize de tela cheia: desorienta e cansa em 60 trocas |
| Critério que acende | 180ms ease-out, escala de `0.95` → `1` + cor, **uma vez**, com som curto opcional. É o reforço positivo central do workshop |
| Avanço no placar | 400ms, movimento com `transform` e stagger de 40ms entre linhas. Pode ser o único momento "divertido" do movimento |
| Revelação do Kahoot | barras crescendo em 500ms linear, depois destaque da correta. Lento o suficiente para criar tensão |
| Digitação do comando (T4) | ~35ms/caractere, disparada por clique seu, nunca em loop |
| Timer | número inteiro atualizando a cada segundo, sem animação; muda de cor nos últimos 30s | 
| Navegação por teclado (→ / ←, atalhos) | **sem animação nenhuma** — você vai pressionar isso centenas de vezes e qualquer transição começa a parecer atraso |
| Entrada de elementos | nunca de `scale(0)`; sempre `scale(0.95)` + `opacity: 0` | 
| Qualquer coisa | só `transform` e `opacity`, nunca `height`/`margin`; `prefers-reduced-motion` mantém opacidade e corta movimento |

Duas armadilhas específicas deste projeto:
- **Não anime o terminal.** Nenhuma transição no xterm.js, nenhum efeito no cursor além do padrão. O terminal precisa parecer o terminal real, porque é isso que a pessoa vai reencontrar na vida.
- **Não anime o que indica estado crítico** (travado, desconectado, tempo esgotado). Piscar é alarme; use cor estática + ícone, senão a tela do facilitador fica uma árvore de natal ilegível.

---

## 6. O conteúdo que falta em 90% dos workshops (e que fixa de verdade)

Para alguém com conhecimento mínimo, estas são as peças que fazem a diferença entre "copiei comandos" e "entendi o que está acontecendo". Cada uma vira um slide curto ou uma caixa dentro de um slide:

1. **O que é o shell, em uma frase:** "um programa que espera você digitar o nome de outro programa, executa, mostra o resultado e espera de novo". Com isso, `command not found` deixa de ser misterioso.
2. **O que acontece ao apertar Enter:** o shell quebra sua linha em palavras → procura o programa → cria um processo → o processo escreve na tela → termina → devolve o prompt. É este slide que explica *por que* o terminal "trava" quando você roda a app em foreground (M4) — e aí o `&` faz sentido em vez de ser mágica.
3. **Tudo é arquivo, inclusive configuração:** `~/.bashrc`, os logs em `/var/log`, a configuração de qualquer programa — tudo é texto, editável com o mesmo `nano` do M2. Dizer isso em voz alta derruba a intimidação de mexer no sistema.
4. **Onde cada coisa mora:** `/etc` = configuração, `/var/log` = logs, `/var/www` = sites, `/home` = pessoas, `/usr/bin` = programas. Cinco pastas, uma frase cada. Volta como pergunta de Kahoot.
5. **O prompt é um mapa:** reler `joao@servidor:~/docs$` em voz alta ("eu sou joao, na máquina servidor, dentro de docs") em todo módulo. Repetição deliberada.
6. **O `*` é o coringa:** `*.txt` é "qualquer coisa terminada em .txt". É o que transforma 20 comandos em um — e sem ele o lab de organizar diretório é desumano. Sequência pedagógica geral do workshop: **dor primeiro, ferramenta depois**.
7. **A senha do `sudo` não aparece quando você digita** — nem asterisco. Sem esse aviso, a pessoa acha que o teclado quebrou e que o problema é ela.
8. **Como pedir ajuda ao próprio sistema:** `comando --help`, `man comando`, `tldr`. Ensinar isso vale mais que qualquer comando individual, porque é o que sobrevive ao workshop.
9. **Teclado:** mostre onde ficam `|`, `~`, `/`, `\` e `$` no teclado ABNT2 **antes** do primeiro pipe. Parece bobo; é responsável por uma quantidade absurda de travamentos reais.
10. **Copiar/colar no terminal:** `Ctrl+Shift+V` (ou clique do meio), e por que `Ctrl+C` **não** copia ali. Diga no M1 ou perca 5 minutos depois.
11. **Case sensitive e espaço em nome de arquivo:** `Docs` ≠ `docs`; `meu arquivo.txt` precisa de `"` ou `\`. Dois dos erros mais frequentes de iniciante.
12. **O que você acabou de aprender:** slide final com o **pacote de sobrevivência** inteiro na tela (`plano-workshop.md` §4), organizado por situação, com todas as situações já vividas acesas. *"Vocês entraram sem saber abrir um terminal."* Fechar o laço é o que transforma 6 labs numa memória única e durável.
13. **O terminal é configurável, e a configuração é um arquivo de texto:** `alias` + `~/.bashrc` + `source`, nos 3 minutos finais. Não é sobrevivência, é o que faz a pessoa abrir o terminal de novo amanhã.

---

## 7. Checklist de revisão de cada slide (use antes de considerar o deck pronto)

- [ ] Uma ideia só. Se tem "e", provavelmente são dois slides.
- [ ] Legível a 10 metros: abra em tela cheia e se afaste.
- [ ] Todo comando mostrado tem **saída** mostrada.
- [ ] Toda saída tem a parte importante destacada.
- [ ] Nenhum jargão não definido (kernel, daemon, porta, proxy, root, flag, PID — cada um apresentado uma vez, de forma explícita).
- [ ] Existe o "o que acabou de acontecer" em linguagem humana.
- [ ] Existe o que pode dar errado.
- [ ] A pessoa consegue agir sem perguntar nada a você.
- [ ] Funciona sem cor (teste em escala de cinza).
- [ ] Funciona sem animação (`prefers-reduced-motion`).
- [ ] O slide anterior e o próximo não repetem a mesma informação sem motivo.
