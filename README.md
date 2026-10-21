# Linux Day — Workshop Gamificado

Workshop presencial de 2 horas: introdução ao Linux (história e conceitos, em formato Kahoot) seguida de laboratórios práticos verificados — navegação, arquivos, permissões, pipes/`grep`/`find`, processos — fechando com um boss em grupo: diagnosticar e consertar um servidor quebrado.

O alvo é o **pacote de sobrevivência**: ~40 comandos e hábitos, organizados por situação real, que deixam alguém capaz de se virar sozinho em qualquer Linux.

## Planejamento

| Documento | O que tem |
|---|---|
| [docs/plano-workshop.md](docs/plano-workshop.md) | arco narrativo, grade de 120 min, conteúdo módulo por módulo, condução e runbook do dia |
| [docs/plano-gamificacao.md](docs/plano-gamificacao.md) | game design: XP, tokens, níveis, combos, eventos ao vivo, badges, regras de justiça |
| [docs/plano-slides-ux.md](docs/plano-slides-ux.md) | design da experiência de aprendizagem: os 7 tipos de slide, tela do lab, tipografia, movimento |
| [docs/plano-app.md](docs/plano-app.md) | arquitetura de superfície única (o slide é a aplicação), stack, modelo de dados, eventos em tempo real, fases de build |
| [docs/infra-mac.md](docs/infra-mac.md) | guia concreto: Lima VM no Mac, um usuário por participante, isolamento, provisionamento, checklist do dia |
| [docs/gaps-e-riscos.md](docs/gaps-e-riscos.md) | decisões abertas, gaps técnicos/didáticos/logísticos/legais, riscos e custos |

## Como rodar

```bash
npm install
npm start
```

O `npm start` **sempre refaz o build antes de subir**. Isso é de propósito: o
`next start` serve o build de quando o processo subiu, então um servidor
deixado aberto continua entregando a versão antiga do deck mesmo depois de o
código mudar. Se você já sabe que o build está atual, `npm run start:rapido`
pula essa etapa.

O servidor imprime as URLs no boot:

| Papel | URL |
|---|---|
| participante | `http://<seu-ip>:3000` (é o QR code) |
| projetor | `http://localhost:3000/screen` |
| apresentador | `http://localhost:3000/host` com PIN `1991`, **só no computador do servidor** |
| endereço | `http://localhost:3000/ip`: o endereço da turma em letra grande, com QR code, para projetar |
| extras | `/cheatsheet` (imprime em A4) · `/regras` · `/me` (resumo e certificado) |

O painel do apresentador só abre no computador que roda o servidor: o PIN está
neste README, e qualquer aluno na rede abriria. Para abrir de outro aparelho,
suba com `ARENA_HOST_REMOTO=1` **e** um PIN próprio em `PIN_HOST`. Tentativas de
PIN são limitadas a 5 por minuto por aparelho.

O servidor precisa do **Node 22.18 ou mais novo** (o `node:sqlite` e a leitura
do deck em TypeScript sem build).

Para zerar XP, grupos e ambientes entre ensaios: `npm run limpar`.

### Controles do apresentador

A faixa de baixo cabe numa linha só: **voltar, avançar e ir para** ficam à
mostra, e os outros grupos abrem para cima como menus: **cena** (liberar,
gabarito, preparar boss), **sala** (pausar, todos ao vivo, grade, pessoas,
sortear e completar equipes) e **jogo** (eventos, eventos automáticos e
recado). À direita ficam chips curtos (fase, cronômetro, `👥 3/20` de quem já
respondeu, travados, pedidos de ajuda); o texto completo de cada um está no
`title`. O número da cena, o relógio do plano e quantos estão ativos ficam no
menu da ponta direita.

**Ninguém passa da escolha de equipe sem equipe.** Avançar (ou pular com o "ir
para") por uma cena de equipes ou de cartas com alguém **ativo** sem equipe é
recusado pelo servidor, e o painel diz quem falta. "Completar equipes" coloca só
essas pessoas nas equipes com menos gente, sem refazer o sorteio da sala.

### Eventos ao vivo e a roleta

Pelo menu **jogo**: XP dobrado, relâmpago (XP triplo por 1 min), chuva de
tokens, resgate, resgate de equipe, sabotagem e a **roleta**. Com **eventos
automáticos** ligados, o servidor sorteia um a cada 6 a 10 minutos, só quando
ele cabe (nunca no meio de uma pergunta aberta, nem sabotagem antes do M3).

Na roleta, uma pessoa a cada 20 é sorteada para girar, uma de cada vez, e a
roleta aparece em todas as telas ao mesmo tempo (quem não está na vez pode
minimizar). As fatias dependem do XP de quem gira: quem tem menos vê fatias que
pagam mais (300, 200 ou 120 XP). Par ou ímpar e pedra-papel-tesoura são
**duelos**: quem gira escolhe o adversário, cada um joga na própria tela e a
sala assiste. "Perder" na roleta é perder um token: XP nunca diminui.

Atalhos: `→` ou espaço avança · `←` volta · `A` abre a cena · `P` pausa ·
`V` traz todos ao vivo · `G` abre a grade.

O avançar segue o ritmo do Kahoot em toda cena em que a turma age: primeiro a
sala vê **só o enunciado** (você explica), o próximo avançar **libera** as opções
(ou o exercício, o terminal, o botão do jogo) e começa o tempo, e depois vem o
**pódio** de pessoas e equipes com o XP que cada um ganhou naquela rodada. No
quiz há um passo a mais, a revelação da resposta. A pergunta também **revela
sozinha quando todos responderam**, e quem responde mais rápido ganha mais XP.

O painel mostra o relógio do workshop contra o plano (cada cena declara seus
minutos em `content.ts`; o total é 119 de 120) e avisa quando a sala atrasa.

### Identidade de cada pessoa

Ela escolhe um nome e um entre **64 avatares**. O nome é único na sala (nomes
repetidos são recusados com sugestões livres, senão a sala tem dois
`ana@linuxday` e ninguém sabe de quem é o XP).

O nome tratado (sem acento nem espaço) é o que aparece **no prompt do terminal
dela e no `whoami`**: `anaclara@linuxday:~$`. A conta real do sistema continua
sendo `alunoNN`, e é ela que aparece na grade do apresentador, para suporte.

### Controles do participante

Ele segue o apresentador e pode **voltar** para rever slides que já passaram
(nunca adiantar). Atividades revisitadas ficam travadas, só para ler, e o placar
não fica na barra: ele aparece no pódio, quando o apresentador mostra. Tem também **consultar** (comandos que já
vimos, lista por situação e glossário), **me perdi** (avisa o monitor, sem
custo), o ícone de informação (explica cada item da tela) e o terminal.

Na barra de baixo também ficam a **equipe** (escolher ou trocar a qualquer
momento, respeitando equipe cheia, limite de trocas e equipes trancadas) e o
menu **você**: nome, bicho ou **foto** (PNG, JPG ou WebP de até 2 MB, cortada e
reduzida a 256 px no navegador), tema do slide e cores do terminal.

### O chamado (módulo 6)

Abrir o chamado prepara o servidor quebrado de cada equipe sozinho, e nenhum
critério passa antes disso. O chamado é jogado com **cartões de comando**, sem
terminal: cada cargo só envia os próprios cartões (carta sem dono fica aberta
para a equipe), há cartões que parecem resolver e não resolvem, e a saída de
tudo o que a equipe envia aparece para a equipe inteira. Quem tem carta começa
com a conquista do cargo.

### Travas do computador principal

No modo local em Linux, cada terminal roda dentro de um sandbox Bubblewrap:
enxerga somente `/usr` em leitura, um `/tmp` efêmero e a própria casa. As
casas dos colegas, os arquivos do apresentador e as variáveis secretas do
servidor não entram no terminal. Se Bubblewrap não estiver disponível, o
terminal falha fechado. No macOS e no evento, use a VM
(`ARENA_MODO=usuarios`), que entrega uma conta Linux distinta a cada pessoa.

### Quando outro computador não abre

```bash
npm run rede
```

Verifica em ordem o que realmente impede o acesso: o servidor está no ar, está
escutando em todas as interfaces (e não só no localhost), o firewall do macOS
está liberado, e qual é o endereço para passar para a turma. Também imprime o
roteiro de teste: se o `ping` do outro computador falha, o problema é a rede
(Wi-Fi de instituição costuma isolar os clientes entre si) e não o aplicativo.

### Jogos de equipe

Quatro jogos curtos de equipe contra equipe, todos decididos no servidor e
premiados por posição (450/300/210/140 XP):

- **Corrida de comandos**: a mesma tarefa no terminal, vale a ordem de chegada.
- **Montagem relâmpago**: montar a linha de comando com as peças na ordem certa.
- **Caça ao erro**: oito linhas, três não funcionam, achem as três.
- **Quem aperta primeiro**: a primeira equipe que aperta responde; errou, passa a vez.

As respostas ficam em `src/server/desafios-arena.mjs` e nunca vão para o
navegador. Detalhes e o porquê de cada formato em
[docs/plano-gamificacao.md](docs/plano-gamificacao.md) §4b.

### Anti-trapaça

Onze brechas fechadas, da mais grave (o gabarito do quiz vinha no pacote
JavaScript) à mais sutil (o placar de equipes premiava trocar de time). A tabela
completa está em [docs/plano-gamificacao.md](docs/plano-gamificacao.md) §4c.

### Temas

Slide claro e escuro nas três telas, guardado por navegador (o projetor começa
claro de propósito: sala com luz come o preto). O terminal tem seis temas, dois
abertos desde o começo e os outros desbloqueando por nível, o que faz a
recompensa do jogo aparecer na tela onde a pessoa trabalha.

### Ilustrações

As imagens do deck são SVG próprios em `public/ilustra`, extraídos do Noto por
`npm run ilustracoes` (o pacote fica só como dependência de desenvolvimento).
São 51 arquivos, 336 KB no total: nada é baixado da internet no dia do evento,
e o desenho fica igual no seu Mac, no notebook da pessoa e no projetor.

Para acrescentar uma, inclua o nome e o codepoint em `MAPA`, dentro de
`scripts/extrair-ilustracoes.mjs`, e rode `npm run ilustracoes`.

### Escrita dos slides

O texto das cenas aceita uma marcação mínima, que o componente `Texto` desenha:

| Escreve | Vira |
|---|---|
| `**assim**` | negrito, para a palavra que a pessoa precisa levar embora |
| `` `assim` `` | tecla, comando ou caminho |

A regra é uma ênfase por frase. Sem destaque, a frase inteira tem o mesmo peso
e ninguém sabe onde olhar a dez metros do projetor; com destaque em tudo, é a
mesma coisa.

### Espaçamento

Tudo usa uma escala fechada de 8px (`--e05` a `--e8`, com 4px como meio-passo)
e quatro raios (8, 12, 16, 24). Em tela de até 560px a escala comprime um
passo, mantendo a proporção. Uma escala fechada é o que faz telas diferentes
parecerem o mesmo produto: sem ela, cada caixa recebe um número inventado na
hora e o olho percebe o desalinho sem saber dizer onde está.

### Testes

```bash
npm run teste           # o fluxo inteiro no servidor (socket, XP, checkers)
npm run teste:novidades # regras puras: perguntas, foto, rede, travas, cartões, roleta, eventos
npm run teste:equipes   # equipe obrigatória e cartas que sobrevivem ao reinício
npm run teste:chamado   # o chamado jogado com cartões, a roleta e os eventos, no servidor
npm run teste:ui        # navegador clicando na interface inteira
npm run teste:tempo     # o deck cabe em 120 min, todo comando tem explicação, referências apontam para trás
npm run teste:widgets   # os exercícios do deck jogados até o fim, um por um
npm run teste:deck      # todas as cenas medidas em 3 telas e percorridas só com o avançar
npm run teste:tudo      # tudo acima, em sequência
```

## Arquitetura em uma frase

O slide **é** a aplicação: o deck é uma máquina de cenas e passos cujo estado vive no servidor, e cada cena se desenha de três formas — `screen` (projetor), `player` (participante), `host` (apresentador). Quiz, widget e terminal são **tipos de cena**, não telas separadas.

```
server.mjs                 Next + Socket.IO num processo (requisito do modo offline)
src/server/db.mjs          SQLite embutido (node:sqlite); XP é livro-caixa append-only
src/server/jogo.mjs        XP, tokens, níveis, combos, badges, eventos ao vivo
src/server/labs.mjs        os checkers, em bash: só leem, são idempotentes e explicam a falha
src/server/ambiente.mjs    contas, seed, gabarito, reset, execução de check (dois modos)
src/server/pty.mjs         uma sessão de terminal por pessoa, viva do começo ao fim
src/server/fila.mjs        concorrência limitada: 30 conferências simultâneas não derrubam o Mac
src/deck/content.ts        o DECK: 54 cenas, M0 ao encerramento, com os minutos de cada uma
src/deck/comandos.ts       o que cada comando faz e um exemplo (lab e fechos de módulo)
src/deck/pacote.ts         o pacote de sobrevivência (cheatsheet e slide final)
src/components/            SceneRouter · TerminalHost · widgets · Celebracao (pódio, eventos, conquistas) · diagramas SVG
infra/                     lima.yaml · setup-vm.sh · provision.sh · reset.sh · seed/ · solve/
testes/e2e.mjs             o fluxo inteiro, contra um servidor real
```

## O que está pronto

**Conteúdo:** 54 cenas em 119 minutos: abertura com apresentação (Ian e Maykon) e um slide de controles da tela; 4 perguntas de quiz com cores e formas do Kahoot; 2 rodadas de passa ou repassa; 5 exercícios na tela; 6 labs com conferência automática a cada 5 segundos (20 critérios, 1.920 XP); corrida e caça ao erro entre equipes; 7 demonstrações de terminal com saída real do ambiente; 5 diagramas; 6 fechos de módulo com o que cada comando faz. Toda pergunta só cobra o que um slide anterior ensinou (o `teste:tempo` confere as referências).

**Jogo:** XP em livro-caixa append-only (nunca diminui), tokens `sudo` gastáveis em dicas, 5 níveis com o prompt como troféu, combo de precisão até ×1.3, 17 badges, bônus de velocidade, predições, diagnóstico de erro, mentoria, eventos ao vivo (XP dobrado, sabotagem, resgate), placar individual e de grupos por média.

**Lab:** terminal PTY real por participante dentro do slide, sessão persistente com repintura do histórico na reconexão, checkers por critério com mensagem que aponta o próximo passo, critérios adesivos e idempotentes, dicas por token, reset grátis, gabarito em 1 clique, seeds randomizados por pessoa (flag e pacote), boss em diretório de grupo com cartas de função.

**Condução:** painel com grade pessoas × critérios, % de conclusão do critério principal (a regra dos 70%), travados, fila de ajuda, "me perdi" anônimo, pausa global, broadcast, sorteio de grupos, semeadura do boss, reset de qualquer ambiente, follow-the-presenter com escape.

**Infra:** Lima VM + um usuário Linux por participante com `chmod 700`, `hidepid=2`, cota, `limits.conf` e `sudo` em lista branca; provisionamento, reset e seeds versionados.

**Verificado:** `npm run teste` roda 38 verificações contra um servidor real — inclui resolver o lab do M2 digitando comandos no PTY e conferir que os 6 critérios acendem, que reenviar não pontua duas vezes, que a flag de um não serve para o outro, que dica custa token e não XP, e que quem reconecta recupera XP, critérios e cena.

## O que ficou de fora, de propósito

Chat de voz, autenticação com senha, HTTPS (rede local), e o módulo de expor aplicação com Apache — este último saiu do currículo por decisão de conteúdo, não de tempo: é sysadmin, não iniciante ([docs/plano-workshop.md](docs/plano-workshop.md) §1).

## Pendências para você decidir

Data do evento, número de monitores e se o Mac é um Air (ensaio térmico obrigatório). Ver [docs/gaps-e-riscos.md](docs/gaps-e-riscos.md) §1.
