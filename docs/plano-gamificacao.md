# Game Design do Workshop — Tudo Gamificado

> Princípio: **nenhuma interação do workshop fica fora do jogo.** Entrar na sala, responder quiz, prever uma saída de comando, digitar comando, ajudar o colega, voltar de uma desconexão, preencher o feedback — tudo rende progresso visível.
> Princípio nº 2, igualmente importante: **o jogo nunca pune quem está aprendendo devagar.** Não existe XP negativo, não existe último lugar público, não existe eliminação. A pressão do jogo é para cima (quem corre ganha mais), nunca para baixo.
> Fantasia narrativa: *você entrou hoje no time de suporte. O servidor é seu. No fim das 2h chega um chamado — e você vai ter que fechar.*

---

## 1. As duas moedas

Separar "placar" de "recurso gastável" é a decisão estrutural que faz todo o resto funcionar.

| | **XP** | **Tokens `sudo`** |
|---|---|---|
| O que é | pontuação, define o ranking | recurso que se gasta |
| Como ganha | quiz, critérios de lab, bônus, eventos | acertos, submissão limpa, ajudar colega, predições |
| Pode diminuir? | **nunca** | sim, é para gastar |
| Serve para | status, ranking, nível, premiação | dicas, power-ups, revelar sintaxe, pular etapa |

Por que duas moedas: se a dica custa XP, a pessoa que mais precisa de ajuda é a que mais afunda no ranking — exatamente o oposto do que um workshop quer. Com tokens, pedir ajuda custa **recurso**, não **status**. E o token que você não gastou vale um bônus no fim, então economizar também é uma estratégia premiada.

**Saldo inicial:** 3 tokens para todos.
**Ganha token:** +1 por acerto no Kahoot · +1 por lab aprovado na primeira submissão · +2 por ajudar um colega (validado por ele) · +1 por predição correta.
**Gasta token:** dica leve 1 · dica forte 2 · revelar sintaxe completa de um comando 1 · power-up 3 · pular critério (recebe o gabarito daquele item, sem o XP dele) 2.
**Reset de ambiente é sempre grátis.** Medo de quebrar a máquina é o maior freio do iniciante; nunca cobre por isso.

---

## 2. Economia de XP (números canônicos)

| Fonte | Unidade | Qtd. | XP máx. |
|---|---|---|---|
| Kahoot M0 (história e conceitos) | 40 base + até 30 por velocidade | 9 perguntas | **630** |
| Kahoot relâmpago (comandos) | 40 + até 30 | 4 perguntas | **280** |
| M1 — flag escondida | 150 | 1 critério | **150** |
| M2 — organizar diretório | 40 por critério | 6 critérios | **240** |
| M3 — permissões | 80 + 80 + 40 | 3 critérios | **200** |
| M4 — pipes, grep e find | 100 + 100 + 150 | 3 entregas | **350** |
| M5 — programas e processos | 80 + 80 + 120 | 3 etapas | **280** |
| **M6 — boss "O Chamado" (grupo)** | 150 + 150 + 150 + 250 | 4 defeitos | **700** |
| Bônus de velocidade | +30 / +20 / +10 | por tarefa | ~120 |
| Predições corretas | 15 | 6 | 90 |
| Desafios bônus | 50 | 5 | 250 |
| Reconhecimento de erro ("eu sei por que falhou") | 20 | ~5 | 100 |
| Tokens não gastos, no fim | 25 cada | — | variável |

**Teto prático:** ~2.130 XP individuais + 700 XP de grupo. Divisão deliberada: ~35% teoria (quiz), ~41% labs individuais, ~24% grupo. Teoria pesa o suficiente para quem tem medo do terminal já estar no placar antes do primeiro comando — e não tanto que decidir o campeonato.

**Regra de ouro do balanceamento:** o XP por minuto deve ser crescente ao longo do workshop. Quem está atrás no minuto 60 precisa acreditar que ainda dá. O boss valendo 700 garante isso.

---

## 3. Progressão visível: níveis e o prompt como troféu

A cada faixa de XP a pessoa sobe de patente, e **o prompt dela no app muda** — o mesmo prompt que ela acabou de aprender a ler no M1 vira o medidor de status dela. Isso amarra mecânica de jogo com o conteúdo, que é o ideal.

| Nível | XP | Patente | Prompt exibido |
|---|---|---|---|
| 1 | 0 | Visitante | `visitante@linuxday:~$` |
| 2 | 300 | Usuário | `nick@linuxday:~$` |
| 3 | 700 | Operador | `nick@servidor:~$` |
| 4 | 1.300 | Sysadmin | `nick@servidor:/etc$` |
| 5 | 1.900 | **Root** | `root@servidor:/#` (prompt em `#`, destacado) |

Subir de nível toma a tela por 1,2s com o prompt novo sendo "digitado" e um som curto. É o único momento em que o jogo interrompe a pessoa — e vale, porque é raro e é recompensa.

---

## 4. Mecânicas por momento do workshop

### Entrada na sala (minuto 0)
- **Primeiro check-in** = +20 XP e o badge `Chegou Cedo` para quem entra nos primeiros 3 minutos. Resolve o problema real de gente entrando devagar.
- Escolha de **nickname + avatar emoji**; nicks no estilo hacker aparecem no placar e criam identidade.
- Um **mini-desafio de aquecimento** na tela de espera enquanto os atrasados chegam: "qual desses é um comando de verdade?" (+10 XP, sem ranking). Ninguém fica olhando tela parada.

### Durante os slides
- **Predições (apostas de 15 XP):** antes de um slide de terminal, aparece no aparelho "o que `ls -la` vai mostrar?" com 2–3 opções, 10 segundos. Acerto = XP + token. Transforma assistir em participar e mata o celular.
- **Pergunta de ouro:** uma pergunta aberta por módulo, respondida em voz alta; você aponta quem acertou e o operador dá +50 XP na hora. O jogo precisa ter um canal para o que acontece na sala de verdade.
- **Botão "entendi / perdi"** sempre visível no slide: anônimo, sem custo, sem XP. Alimenta o painel do facilitador com um termômetro de compreensão ao vivo. Não é gamificado de propósito — se valesse ponto, mentiria.

### Nos labs
- **XP por critério**, com cada ✅ acendendo na tela e no placar em tempo real. É o loop de recompensa principal do workshop: ação → feedback em segundos → progresso visível.
- **Combo de precisão:** critérios aprovados em sequência na primeira tentativa acumulam multiplicador ×1.1 → ×1.2 → ×1.3 (teto). Errar não zera XP, só o combo. Premia ler antes de digitar.
- **Bônus de velocidade** +30/+20/+10 para os três primeiros, contado **do momento em que a tarefa abriu para aquela pessoa** (não do relógio global), para desconexão e chegada tardia não roubarem a chance.
- **Desafio bônus (+50)** liberado assim que alguém conclui todos os critérios: sempre uma versão "faça isso em um comando só". Quem corre nunca fica sem o que fazer, e quem está no meio não é atropelado.
- **Reconhecimento de erro (+20):** quando um check falha, aparece "por que você acha que falhou?" com 3 opções. Acertar o diagnóstico vale XP. **Isso é a gamificação mais valiosa do workshop inteiro**, porque paga pela habilidade que fica para a vida: ler o erro.

### Entre módulos
- **Kahoot relâmpago** de 4 perguntas sobre o que acabou de ser digitado: reengaja quem dispersou e te diz se o slide funcionou.
- **Placar projetado** com animação de subida e ticker de badges. 45 segundos, não mais.

### Eventos ao vivo (botões no painel do facilitador)
Ferramentas de ritmo, para você consertar a energia da sala sem parar a aula:
- **XP Dobrado — 3 min:** usa quando a sala esfria.
- **Sudden Death:** uma pergunta valendo 150, quem erra só perde a chance (nunca XP).
- **Sabotagem:** o sistema apaga/quebra algo no ambiente de todos (ex.: remove a permissão de execução do `deploy.sh`); quem consertar primeiro leva +100. Caos controlado, ensina diagnóstico — e é um ensaio do boss.
- **Resgate:** marca os 5 mais atrasados e dá a eles uma tarefa curta valendo XP cheio. Ninguém percebe que é um resgate; eles só voltam pro jogo.
- **Pausa global** congela todos os timers (café, problema de rede, pergunta longa).

### Momento de palco (o boss, M6 — "O Chamado")
- Placar de grupos em tela cheia, os 4 defeitos de cada grupo acendendo ao vivo conforme são consertados.
- Quando um grupo entrega o laudo (critério 4), **som + animação + o nome do grupo em tela cheia**. É o pico emocional do workshop; projete essa tela e **fique calado nos últimos 2 minutos** — a sala se resolve sozinha.
- `Chamado Fechado` é o badge mais cobiçado do evento. Anuncie isso no começo do boss — antecipação é metade da diversão.

### Encerramento
- Pódio individual e de grupos, **prêmio do júri** para quem mais ajudou (voto dos colegas de grupo, 60s no aparelho).
- **Resumo pessoal:** XP, nível, badges, nº de comandos digitados, tempo total no terminal, "você usou 23 comandos diferentes hoje".
- **Certificado** desbloqueado ao preencher o feedback (+50 XP e o badge `Relatório Entregue`). Assim você sai com NPS de verdade em vez de 4 respostas.

---

## 5. Mecânica de grupo (o lado "Discord")

Os grupos são **plantões de plantão de TI**, criados por você na hora; as pessoas entram livremente nos canais, com capacidade visível (`4/5`).

- **Placar de grupo pela média**, nunca pela soma: time grande não ganha por tamanho, e ninguém culpa o colega mais lento.
- **Cartas de papel (role cards)** no boss, uma por pessoa: `Investigador` (acha o log e o erro com `find`/`grep`), `Operador` (acha e mata o processo travado com `ps`/`kill`), `Mecânico` (conserta a permissão do script com `chmod +x` e roda), `Relator` (escreve o laudo em `~/laudo.txt` e aperta Verificar). **Cada critério só pode ser submetido pela carta correspondente** — é o que impede o aluno mais rápido de fazer tudo sozinho enquanto 4 pessoas assistem. Rotacione as cartas se houver tempo.
- **XP de mentoria:** quem recebeu ajuda marca quem ajudou (+2 tokens e +40 XP para o mentor). Ajudar passa a ser estratégia dominante, e é exatamente o comportamento que você quer na sala.
- **Chat por grupo** com um botão de "colar comando" que manda o comando formatado em bloco de código — e **nunca** cola a resposta automaticamente no terminal do colega (tem que digitar; digitar é o aprendizado).
- **Grito de guerra:** o grupo escolhe nome e cor na entrada. Custa 30 segundos e muda completamente o engajamento no boss.

---

## 6. Badges (catálogo)

| Badge | Como ganha |
|---|---|
| `Chegou Cedo` | check-in nos 3 primeiros minutos |
| `Primeiro Sangue` | primeiro XP do evento |
| `Historiador` | Kahoot do M0 inteiro correto |
| `Vidente` | 4 predições corretas |
| `Mão de Vidro` | um lab inteiro aprovado na primeira submissão |
| `Autodidata` | módulo completo sem gastar token |
| `Pé de Chumbo` | combo ×1.3 atingido |
| `Sobreviveu ao rm -rf` | resetou o ambiente e terminou a tarefa mesmo assim |
| `Detetive` | 3 diagnósticos de erro corretos |
| `Encanador` | montou o pipe de 5 comandos do M4 |
| `Dedetizador` | matou o processo travado do M5 sem dica |
| `Chamado Fechado` | primeiro grupo a entregar o laudo no boss |
| `Escapista` | usou o kit de fuga (`q`, `Ctrl+C`, `:q!`) sem pedir ajuda |
| `Mentor` | 3 ajudas validadas |
| `Faxineiro` | desafio bônus do M2 em um comando só |
| `Root` | nível 5 |
| `Relatório Entregue` | feedback preenchido |

Badges não valem XP — valem vaidade, e vaidade é de graça. Aparecem no placar como ticker e no resumo pessoal.

---

## 7. Regras de justiça (o que impede o jogo de atrapalhar a aula)

- **Zero XP negativo.** Dica, erro, reset e desconexão nunca tiram XP.
- **Ninguém vê o último lugar.** O placar público mostra **top 10 + a sua posição**, e a sua posição é comunicada como movimento ("você subiu 4 posições"), não como classificação absoluta.
- **Pontos parciais em tudo** que tem mais de um critério. Ninguém termina o workshop com zero.
- **Flags e respostas randomizadas por participante:** copiar resposta não funciona; copiar *o comando* funciona — e isso é aprendizado, não cola.
- **Desconexão é neutra:** timers de velocidade são por pessoa; quem cai volta no mesmo ponto com os critérios já conquistados intactos.
- **Atrasado entra jogando:** fica fora do ranking dos módulos já encerrados, mas pontua integralmente dali em diante. Anuncie na abertura.
- **Teto de dicas, não de tentativas:** `Verificar` é ilimitado (com cooldown de 10s). Tentar de novo é o método científico, não trapaça.
- **O jogo pausa quando a aula precisa.** Se a sala travou, pausa global e ninguém perde nada. O jogo serve à aula, nunca o contrário.
- **Transparência total:** uma tela `/regras` sempre acessível com a tabela de XP. Jogo com regra escondida gera reclamação no fim.

---

## 8. O que isso exige da aplicação

Consequências diretas no backlog (ver `plano-app.md`):
- `points_ledger` **append-only** com `tipo` (quiz, criterio, bonus_velocidade, combo, predicao, diagnostico, mentoria, evento, token_bonus) — é o que permite estornar uma tarefa quebrada ao vivo sem corromper o placar.
- Tabelas para tokens (`token_ledger`), combos (estado por participante), predições, diagnósticos, mentorias, eventos ao vivo, role cards por critério, badges e níveis.
- Idempotência por `UNIQUE(participant_id, criterion_id)`: reenviar nunca pontua duas vezes.
- Eventos de socket para `xp:awarded`, `token:changed`, `level:up`, `badge:awarded`, `event:started`, `combo:changed`, `prediction:open`.
- A camada de jogo é **Fase 1 do build, não polimento**: quiz, XP, tokens e placar ao vivo são o núcleo da experiência, não enfeite final.
