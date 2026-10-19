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
| apresentador | `http://localhost:3000/host` com PIN `1991` (troque com `PIN_HOST=...`) |
| extras | `/cheatsheet` (imprime em A4) · `/regras` · `/me` (resumo e certificado) |

Para zerar XP, grupos e ambientes entre ensaios: `npm run limpar`.

### Controles do apresentador

Os controles estão agrupados por função na faixa de baixo: **slides** (voltar,
avançar, ir para um módulo), **cena** (abrir, gabarito, preparar boss),
**sala** (pausar, todos ao vivo, grade, sortear grupos) e **jogo** (eventos e
recado). A faixa da direita mostra o estado: cena, fase, cronômetro, quantos já
responderam, quantos estão ativos e quem travou.

Atalhos: `→` ou espaço avança · `←` volta · `A` abre a cena · `P` pausa ·
`V` traz todos ao vivo · `G` abre a grade.

Numa cena de pergunta, o avançar faz a coisa certa sozinho: abre, depois
revela, depois passa para a próxima. A pergunta também **revela sozinha quando
todos responderam**, como no Kahoot, e quem responde mais rápido ganha mais XP.

### Identidade de cada pessoa

Ela escolhe um nome e um entre **64 avatares**. O nome é único na sala (nomes
repetidos são recusados com sugestões livres, senão a sala tem dois
`ana@linuxday` e ninguém sabe de quem é o XP).

O nome tratado (sem acento nem espaço) é o que aparece **no prompt do terminal
dela e no `whoami`**: `anaclara@linuxday:~$`. A conta real do sistema continua
sendo `alunoNN`, e é ela que aparece na grade do apresentador, para suporte.

### Controles do participante

Ele segue o apresentador, mas pode olhar os slides sozinho com as setas (um
botão grande oferece voltar ao vivo). Tem também **consultar** (comandos que já
vimos, lista por situação e glossário), **me perdi** (avisa o monitor, sem
custo), o ícone de informação (explica cada item da tela) e o terminal.

### Testes

```bash
npm run teste           # 38 verificações no servidor (socket, XP, checkers)
npm run teste:ui        # navegador clicando na interface inteira
npm run teste:widgets   # os 9 exercícios jogados até o fim, um por um
npm run teste:deck      # as 63 cenas medidas em 3 telas: nada cortado
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
src/server/fila.mjs        concorrência limitada: 30 Verificar simultâneos não derrubam o Mac
src/deck/content.ts        o DECK: 61 cenas, M0 ao encerramento
src/deck/pacote.ts         o pacote de sobrevivência (cheatsheet e slide final)
src/components/            SceneRouter · TerminalHost · 9 widgets · diagramas SVG inline
infra/                     lima.yaml · setup-vm.sh · provision.sh · reset.sh · seed/ · solve/
testes/e2e.mjs             o fluxo inteiro, contra um servidor real
```

## O que está pronto

**Conteúdo:** 61 cenas — 13 perguntas de quiz (9 de história + 4 do relâmpago), 9 widgets jogáveis, 6 labs verificados (20 critérios, 1.920 XP), 8 demonstrações de terminal com saída real, 5 diagramas de modelo mental, 6 fechos de módulo. Teto de ~3.370 XP.

**Jogo:** XP em livro-caixa append-only (nunca diminui), tokens `sudo` gastáveis em dicas, 5 níveis com o prompt como troféu, combo de precisão até ×1.3, 17 badges, bônus de velocidade, predições, diagnóstico de erro, mentoria, eventos ao vivo (XP dobrado, sabotagem, resgate), placar individual e de grupos por média.

**Lab:** terminal PTY real por participante dentro do slide, sessão persistente com repintura do histórico na reconexão, checkers por critério com mensagem que aponta o próximo passo, critérios adesivos e idempotentes, dicas por token, reset grátis, gabarito em 1 clique, seeds randomizados por pessoa (flag e pacote), boss em diretório de grupo com cartas de função.

**Condução:** painel com grade pessoas × critérios, % de conclusão do critério principal (a regra dos 70%), travados, fila de ajuda, "me perdi" anônimo, pausa global, broadcast, sorteio de grupos, semeadura do boss, reset de qualquer ambiente, follow-the-presenter com escape.

**Infra:** Lima VM + um usuário Linux por participante com `chmod 700`, `hidepid=2`, cota, `limits.conf` e `sudo` em lista branca; provisionamento, reset e seeds versionados.

**Verificado:** `npm run teste` roda 38 verificações contra um servidor real — inclui resolver o lab do M2 digitando comandos no PTY e conferir que os 6 critérios acendem, que reenviar não pontua duas vezes, que a flag de um não serve para o outro, que dica custa token e não XP, e que quem reconecta recupera XP, critérios e cena.

## O que ficou de fora, de propósito

Chat de voz, autenticação com senha, HTTPS (rede local), e o módulo de expor aplicação com Apache — este último saiu do currículo por decisão de conteúdo, não de tempo: é sysadmin, não iniciante ([docs/plano-workshop.md](docs/plano-workshop.md) §1).

## Pendências para você decidir

Data do evento, número de monitores e se o Mac é um Air (ensaio térmico obrigatório). Ver [docs/gaps-e-riscos.md](docs/gaps-e-riscos.md) §1.
