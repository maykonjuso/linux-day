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
npm run dev            # desenvolvimento (modo de lab "local", no seu Mac)
npm run build && npm start
npm run teste          # 38 verificações de ponta a ponta, num servidor de verdade
```

O servidor imprime as URLs no boot:

| Papel | URL |
|---|---|
| participante | `http://<seu-ip>:3000` — é o QR code |
| projetor | `http://localhost:3000/screen` |
| apresentador | `http://localhost:3000/host` — PIN `1991` (`PIN_HOST=…` troca) |
| extras | `/cheatsheet` (imprimível em A4) · `/regras` · `/me` (resumo + certificado) |

**Atalhos do apresentador:** `→`/`espaço` avança passo ou cena · `←` volta · `A` abre a cena (liga o timer) · `R` revela o quiz e pontua · `P` pausa global · `V` traz todos ao vivo · `G` abre a grade pessoas × critérios.
**Atalhos do participante:** `Ctrl+\`` gaveta do terminal · `?` consulta os slides de comando já vistos · `Esc Esc` devolve o teclado ao slide.

### Modos de ambiente

| Variável | Para quê |
|---|---|
| `ARENA_MODO=local` (padrão) | cada participante recebe uma "casa" em `data/casas/<conta>`; o shell roda como você. Desenvolvimento e ensaio. |
| `ARENA_MODO=usuarios` | conta = `alunoNN` de verdade: o shell abre com `su - alunoNN` e os checks rodam como root. É o modo do dia do evento, dentro da Lima VM. |
| `ARENA_CHECKERS=6` | quantos checkers rodam em paralelo (a fila existe para 30 cliques simultâneos no Verificar não derreterem o Mac) |
| `ARENA_DB`, `ARENA_CASAS` | caminhos do banco e das casas |

### No dia (dentro da Lima VM)

```bash
limactl create --name=linuxday --vm-type=vz infra/lima.yaml && limactl start linuxday
limactl shell linuxday
bash infra/setup-vm.sh          # pacotes, locale, hidepid=2, limites, sudo em lista branca
sudo bash infra/provision.sh 30 # 30 contas, cada uma com o lab semeado e um pacote sorteado
ARENA_MODO=usuarios npm start
```

Guia completo, com o checklist de T-2h: [docs/infra-mac.md](docs/infra-mac.md).

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
