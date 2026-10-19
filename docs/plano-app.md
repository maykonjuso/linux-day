# Plataforma do Workshop — Plano da Aplicação

> Nome de trabalho: **Linux Day Arena**.
> Uma única aplicação que é: deck de slides sincronizado + laboratório verificado + grupos tipo Discord + placar ao vivo + painel de controle do facilitador.

---

## 1. Infraestrutura: tudo roda no seu Mac, na rede local

Decidido: **o seu Mac é o servidor.** Os participantes entram pelo Wi-Fi da sala, no seu IP e porta. Sem nuvem, sem custo, sem dependência de internet — e, como consequência, com um ponto único de falha que o plano precisa tratar com seriedade (§1.6).

### 1.1 Uma correção de premissa importante

Você disse "pode usar o shell do meu computador também". **Não dá para os participantes aprenderem Linux no shell do macOS**, e isso não é preciosismo — é que o currículo inteiro deixa de funcionar:

- `apt` não existe no macOS (é `brew`);
- `apt`/`dpkg` e o conceito de repositório não existem — o M5 (instalar programas) morre aqui;
- `ls`, `grep`, `sed`, `chmod`, `stat` são BSD, com flags diferentes do GNU: `stat -c %a` não funciona, `ls --color` não funciona, `sed -i` tem sintaxe diferente;
- o layout de diretórios é outro: não há `/home`, `/var/log` tem outro conteúdo, e nada do que você ensinar sobre "onde as coisas moram" vale;
- e, o mais sério: **um shell, 30 pessoas, um sistema de arquivos só** — todos pisando no `~` do mesmo usuário, com acesso real aos seus arquivos, suas chaves SSH e ao app que está rodando o workshop.

O que vale é o contrário, e é melhor: **o Mac roda a infraestrutura; os participantes recebem cada um um Linux de verdade dentro dele.** O shell do Mac fica sendo *o seu* — é de lá que você provisiona, reseta e monitora tudo.

### 1.2 A pilha no Mac

```
macOS (seu Mac)
└── Lima VM  (Ubuntu 24.04, Virtualization.framework)      ← um Linux de verdade
    ├── Next.js + Socket.IO  :3000                          ← o app/deck
    ├── apt-cacher-ng        :3142                           ← cache de pacotes local
    ├── SQLite (arquivo no disco da VM)                      ← banco
    └── Incus
        ├── ld-01  (Ubuntu + systemd)   ← participante 1
        ├── ld-02  (Ubuntu + systemd)   ← participante 2
        ├── …
        └── grupo-azul (Ubuntu + systemd) ← container compartilhado do grupo (boss)
```

Por que assim:
- **Lima** (`brew install lima`) sobe uma VM Linux nativa no Apple Silicon, rápida, com montagem do seu diretório de código e port-forward para o macOS. É o único jeito de ter systemd real no Mac.
- **Incus** (containers de *sistema*, sucessor do LXD) dá a cada participante um Ubuntu completo com `apt`, `sudo`, `top`, `/home` e um `systemd` de verdade — um Linux honesto, igual ao que ele vai encontrar depois — gastando ~150–250 MB de RAM cada, não 2 GB como uma VM.
- **O app roda dentro da VM**, não no macOS: assim ele fala com o socket do Incus e alcança os containers direto pela bridge interna, sem gambiarra de rede. Você edita o código no Mac (diretório montado) e o processo roda na VM.
- **apt-cacher-ng** pré-aquecido faz os 30 `apt install` do M5 baixarem **uma vez** e depois servirem do disco: o lab fica rápido e **funciona mesmo se a internet do local cair** — e `apt install` com a sala toda clicando junto é o momento de maior carga de rede do workshop.

### 1.3 Isolamento — ninguém pisa no pé de ninguém

Requisito que você levantou, e é o motivo de usar um container por pessoa em vez de contas num servidor só:

| Garantia | Como |
|---|---|
| Sistema de arquivos próprio | container independente; ninguém vê nem apaga o arquivo do outro |
| `root` sem risco | a pessoa é root **dentro** do próprio container, e container não-privilegiado não alcança o host nem a VM |
| Porta 80 e 3000 livres para todos | cada container tem a própria pilha de rede — 30 pessoas usam a porta 80 ao mesmo tempo sem conflito, o que seria impossível num shell compartilhado |
| Um não derruba os outros | limites por container: **1 vCPU (`limits.cpu.allowance=40%`), 768 MB de RAM, `limits.processes=400`, disco 2 GB**. `fork bomb` e `dd` matam só o próprio container |
| Rede isolada entre pessoas | ACL do Incus: cada container alcança só a VM (para o cache de pacotes) e o gateway. Ninguém faz `curl` no colega, e a regra fica ligada do começo ao fim — não há mais exceção a gerenciar |
| Destruição sem dano | `incus snapshot` no estado inicial; reset = `incus restore` em ~2 s. Perder o ambiente deixa de ser tragédia |
| Nada toca o seu Mac | o pior cenário é um container morto. Seus arquivos e o app estão dois níveis acima |

**Exceção deliberada: o container do grupo.** No boss o grupo trabalha em **um container compartilhado** (`grupo-azul`), com 4 terminais atacados à mesma máquina — todos veem o que o outro digitou, que é exactamente a experiência de um plantão de verdade (e a razão das cartas de função existirem). A implementação é `incus exec` múltiplo no mesmo container, com um indicador na tela de quem mais está conectado ali.

### 1.4 Rede da sala: como eles chegam até você

O app escuta na VM, o Lima encaminha para o macOS, e o macOS expõe no Wi-Fi:

- **Lima por padrão só encaminha para `127.0.0.1`.** Você precisa declarar `portForwards: [{ guestPort: 3000, hostIP: "0.0.0.0" }]` no `lima.yaml`, senão ninguém de fora acessa e você vai perder 20 minutos no dia descobrindo isso.
- **IP fixo:** DHCP pode te dar um IP novo no meio do evento. Fixe um IP manual no macOS (ou reserva no roteador) e gere o QR code **a partir do IP real** detectado no boot do app, não de um valor hardcoded.
- **Firewall do macOS** vai pedir autorização na primeira vez que o processo escutar. Autorize antes, no ensaio, não na frente de 30 pessoas.
- **`http://` simples (sem TLS) tem uma pegadinha:** `navigator.clipboard` só funciona em contexto seguro. O botão "copiar comando" precisa de fallback (`textarea` + `execCommand('copy')`). O `ws://` do terminal funciona normalmente.
- **O risco real: AP isolation.** Wi-Fi de instituição e de convidados muito frequentemente **bloqueia tráfego entre clientes** — e aí o "eles estão na mesma rede, então alcançam meu IP" simplesmente não acontece, mesmo com tudo certo do seu lado. Mitigação, em ordem: (1) **leve um roteador próprio** (um GL.iNet de bolso resolve: todos conectam nele, você é o gateway); (2) teste no local, com 2 celulares, antes do dia; (3) `Compartilhamento de Internet` do macOS como último recurso (limitado em nº de clientes e exige uplink por cabo). **Teste isso na primeira semana** — é o risco nº 1 do novo arranjo.
- **Porta:** use `:3000` e pronto; porta 80 no macOS exige privilégio e não ganha nada. O QR code esconde a porta do participante.

### 1.5 O boss em grupo: um container compartilhado

Com o módulo de expor aplicação fora do currículo (ver `plano-workshop.md` §1), **a aplicação não precisa expor container nenhum para a rede** — o que simplifica bastante a infraestrutura: sem proxy por grupo, sem faixa de portas encaminhadas, sem liga/desliga de ACL. A única coisa que trafega na rede da sala é o próprio app, em `:3000`.

O que o boss precisa é diferente e mais simples: **um container compartilhado por grupo**, pré-quebrado pelo `seed` com os 4 defeitos, e 4 terminais atacados nele ao mesmo tempo (`incus exec` múltiplo). Requisitos de interface:

- indicador de **quem mais está conectado** naquele container, com o nick de cada um — sem isso, dois colegas editam o mesmo arquivo e ninguém entende o que aconteceu;
- o **critério só aceita submissão da carta de função** correspondente (`Investigador`/`Operador`/`Mecânico`/`Relator`);
- o checker roda de fora do container, como nos labs individuais, lendo o estado final (`~/laudo.txt`, o PID morto, o modo do `backup.sh`).

### 1.6 Ponto único de falha: o seu Mac

Com tudo no seu Mac, três coisas podem acabar com o evento. Trate-as como itens de checklist:

1. **Recursos — resolvido.** Seu Mac é **M4 com 24 GB**: 8 GB para o macOS/navegador/projeção, 14 GB para a Lima VM, ~12 GB efetivos para containers a ~200 MB cada. **30 participantes com folga de 2×, teto técnico ~40.** Dimensionamento completo e limites por container em `infra-mac.md` §2.
2. **Térmica e energia — o risco que sobrou.** Com RAM resolvida, é aqui que o aperto aparece: apresentar + espelhar tela + 30 containers por 2 horas derruba o clock de um MacBook (e num **Air M4, sem ventoinha**, derruba antes). Na tomada, `caffeinate -dimsu` ativo, nada mais aberto, **build de produção** (nunca `next dev`), e um ensaio de 30 min com carga total para ver a temperatura.
3. **Se o Mac morrer, não existe nada.** Mitigação: a imagem base da VM + o app + o banco num **SSD externo**, com um `restore.sh` testado; os slides exportados em **PDF**; e os labs em uma folha impressa com o checklist para verificação manual. Um segundo notebook capaz de assumir o mesmo IP é o plano A do plano B.

### 1.7 Custo

Zero de infraestrutura. O que aparece é um roteador de bolso (~R$ 150–250, e vale cada centavo), impressão dos cheatsheets e, se você quiser, um SSD externo que provavelmente já tem.

---

## 2. Stack

| Camada | Escolha | Por quê |
|--------|---------|---------|
| Frontend + BFF | **Next.js 15 (App Router) + TypeScript** | você já pensou nisso; rotas, SSR e um único deploy |
| UI | **Tailwind + shadcn/ui** + Framer Motion | velocidade de construção; animação de placar importa |
| Slides | componentes React próprios — **9 tipos de cena fixos** (incluindo cena de quiz e cena de lab), descritos em `plano-slides-ux.md`; **não** use Reveal.js nem nada baseado em `iframe`/HTML estático | o slide **é** a aplicação: ele hospeda o terminal, o quiz e o placar, lê estado ao vivo e muda de layout por papel (projetor / participante). Nenhuma biblioteca de deck suporta isso |
| Tempo real | **Socket.IO** em servidor Node custom (`server.ts` que embrulha o Next) | salas nativas (`room`-per-sessão e per-grupo), reconexão automática, funciona offline. Alternativa gerenciada: Partykit/Supabase Realtime |
| Banco | **SQLite (arquivo) + Drizzle ORM** | 30 pessoas num evento de 2h não justificam um servidor de banco; um arquivo é trivial de copiar, versionar e restaurar do SSD no meio do evento. Drizzle deixa a porta aberta para Postgres se você for repetir em escala |
| Terminal | **xterm.js** montado **uma única vez** na raiz do app e posicionado dentro do slot da cena (ver §3.4) ↔ WebSocket ↔ `incus exec --interactive` | PTY real; e montar/desmontar junto com o slide perderia histórico, scroll e sessão a cada navegação |
| Orquestração do lab | **Incus dentro de uma Lima VM** + um serviço `lab-orchestrator` em Node que clona/reseta/destrói containers e roda os checkers (fila com no máx. 6 em paralelo) | systemd de verdade no Mac; clone e restore de snapshot em segundos; a fila impede que 30 cliques no `Verificar` derretam a máquina |
| Auth | código de sala + nickname, cookie assinado (JWT httpOnly). Sem senha | atrito zero; o facilitador entra com um PIN separado |
| Deploy | **nenhum**: `pnpm build && pnpm start` dentro da Lima VM, porta 3000 encaminhada para `0.0.0.0` no macOS, acesso por `http://<seu-ip>:3000` + QR code gerado do IP real | é a sua máquina na rede local, e uma porta só — nada de DNS, TLS ou proxy por grupo |
| Observabilidade | painel de status na sua tela: containers vivos, RAM/CPU da VM, sockets conectados, fila de checkers, temperatura/throttling do Mac | sem nuvem, o monitoramento é você olhando — então tem que estar na tela, não num dashboard externo |

---

## 3. Superfície única: o slide **é** a aplicação

Decisão central: **não existem telas separadas de lab e de quiz.** Existe um deck, e o deck hospeda tudo — texto, Kahoot e terminal acontecem dentro do próprio slide. A pessoa nunca troca de contexto, nunca "sai da apresentação para o laboratório", nunca perde de vista onde está na jornada.

Isso tem três consequências arquiteturais que precisam ser decididas agora, não depois.

### 3.1 O deck é uma máquina de estados de cenas e passos

```
Deck = [Cena, Cena, Cena, …]      cada Cena = { tipo, conteúdo, N passos, fase }
Estado global sincronizado        { cenaIndex, passoIndex, fase, pausado }
```

O avanço do apresentador (`→`) incrementa **passo**; quando os passos acabam, vai para a próxima cena. Isso unifica tudo: a revelação do Kahoot é um passo, abrir o terminal é um passo, acender o placar é um passo. Um único controle, um único atalho, um único evento de socket (`scene:changed { cenaId, passo, fase }`).

**Fases de cena:** `idle → aberta → encerrada → revelada`. Uma cena de quiz aberta aceita resposta; encerrada não; revelada mostra o gráfico. Uma cena de lab aberta provisiona/liga o terminal e o checker; encerrada congela o cronômetro e libera o gabarito.

### 3.2 A mesma cena, três papéis

Cada tipo de cena exporta **três renderizações do mesmo conteúdo** — é o que permite o slide ser projetor e app ao mesmo tempo:

| Papel | Onde | O que vê numa cena de **quiz** | O que vê numa cena de **lab** |
|---|---|---|---|
| `screen` (projetor) | sua máquina → projetor | pergunta gigante, timer, nº de respostas recebidas, depois o gráfico | enunciado + critérios agregados da sala (12/28 fizeram o critério 3) + quem terminou |
| `player` (participante) | notebook de cada um | alternativas grandes e tocáveis, sem a pergunta repetida em miúdo | **terminal + seus critérios + Verificar/Dica/Resetar**, enunciado colapsável |
| `host` (você) | seu laptop, tela secundária | pergunta + resposta correta + distribuição ao vivo + botão revelar | grade pessoas × critérios, travados, fila de ajuda, botões de evento |

Implementação: `scenes/<Tipo>/{Screen,Player,Host}.tsx` + um `index.ts` que declara `passos`, `fases` e o schema do conteúdo. O conteúdo em MDX é um só; quem muda é a projeção. Nunca duplique conteúdo entre papéis — é assim que deck e lab saem de sincronia na véspera.

### 3.3 Os 9 tipos de cena

1. `ModuleCover` — capa de módulo
2. `MentalModel` — diagrama grande
3. `CommandAnatomy` — comando dissecado
4. `TerminalDemo` — comando + saída, com replay digitado
5. `WillGoWrong` — erros previstos e como lê-los
6. **`QuizScene`** — Kahoot dentro do slide (passos: pergunta → contagem → trava → revelação → explicação)
7. **`LabScene`** — terminal dentro do slide (passos: enunciado → abrir terminal → abrir critérios → encerrar → gabarito)
8. `Scoreboard` — placar, individual ou de grupos
9. `Recap` — recuperação + resumo acumulado do módulo

`QuizScene` e `LabScene` são cenas de primeira classe, não modais em cima do slide. Modal implica "você saiu da apresentação"; a ideia aqui é o oposto.

### 3.4 O terminal persistente (detalhe que decide o sucesso)

O terminal **não pode** ser filho do slide na árvore React, senão cada navegação remonta o xterm.js e a pessoa perde histórico, scroll e sessão.

Padrão: um `<TerminalHost>` montado uma vez na raiz, com a sessão WebSocket viva do começo ao fim do workshop. A `LabScene` declara um **slot** (uma `div` vazia medida com `ResizeObserver`), e o `TerminalHost` se posiciona em cima desse slot via `transform`/`inset` absolutos, animando 200ms quando o slot muda de lugar ou de tamanho. Fora das cenas de lab o terminal recolhe para uma gaveta na borda inferior (`Ctrl+\``), ainda vivo — porque alguém sempre vai querer testar um comando durante um slide de teoria, e deixar isso acontecer é ótimo para o aprendizado.

Consequências a tratar explicitamente:
- `fit()` do xterm só depois da animação terminar, e `resize` do PTY com debounce de 150ms — redimensionar PTY no meio de uma animação embaralha a saída.
- Reconexão do WebSocket mantém o buffer local; o servidor guarda os últimos ~2.000 linhas por sessão para repintar depois de um F5.
- Uma sessão PTY por participante, reaproveitada por todas as cenas de lab. Trocar de cena não cria shell novo (o estado do sistema de arquivos continua, o que é pedagogicamente essencial: o M5 depende do que a pessoa fez no M4).

### 3.5 Teclado: o conflito que vai te morder

O terminal quer `↑`, `↓`, `Ctrl+C`, `Tab`, `Ctrl+L`. O deck quer `→`, `←`, `Space`. Regras:

- **Participante não navega o deck por teclado. Nunca.** Ele segue o apresentador; a navegação dele é por botão discreto no canto. Isso elimina 90% do conflito.
- Quando o terminal tem foco, **todas** as teclas vão para o PTY, inclusive `→`. Sair do foco: `Esc Esc` (duplo, para não conflitar com `vim`/`nano`) ou clique fora.
- Um indicador visual de foco obrigatório: borda acesa + legenda "o teclado está no terminal". Iniciante que digita no vazio e não vê nada aparecer acha que travou.
- Atalhos do apresentador (`→`, `←`, `P` pausa, `R` revelar, `E` eventos, `H` painel) só existem no papel `host`, e são capturados em `keydown` na janela com `capture: true`, ignorados se o alvo for o terminal.
- `Ctrl+L` limpa o terminal, não o slide. `F11`/`Esc` do navegador não podem derrubar o deck: guarde o estado no servidor, sempre.

### 3.6 Consulta sem sair da cena

Durante um lab a pessoa precisa rever o `CommandAnatomy` de dois slides atrás. Em vez de deixá-la navegar (e se perder):

- **Peek (`?` ou botão "Consultar"):** uma gaveta lateral que traz as cenas `CommandAnatomy`/`TerminalDemo` já vistas do módulo atual, como cartões, sem mudar a cena. Fecha com `Esc`.
- **Régua de comandos do módulo** sempre visível na `LabScene` (só os nomes; a sintaxe completa custa 1 token).
- É a única "navegação" que o participante tem — e é deliberadamente uma consulta, não um deslocamento.

### 3.7 O que sobrou de rota

| Rota | Papel |
|---|---|
| `/j/<codigo>` | entrada: nickname, avatar, aceite de dados. QR code aponta para cá |
| `/` | **o deck** (papel `player`). É onde o participante passa as 2 horas inteiras |
| `/screen` | o deck no papel `screen`, para o projetor |
| `/host` | o deck no papel `host` + faixa de controle e o painel (`H` alterna painel cheio) |
| `/grupos` | escolha de grupo tipo canal de Discord — **também embutido como cena** no momento de formar grupos; a rota existe só para quem precisa trocar depois |
| `/regras` | tabela de XP, tokens e badges. Abre em gaveta, sem sair do deck |
| `/me` | resumo pessoal pós-evento, badges e certificado |

Tudo o que antes era tela virou cena ou gaveta. O participante tem **uma** URL.

---

## 4. Modelo de dados (Drizzle/Postgres)

```
events            id, nome, data, codigo_entrada, pin_host, estado(lobby|rodando|pausado|encerrado), cena_atual, passo_atual
participants      id, event_id, nick, emoji, team_id?, token_hash, criado_em, ultimo_visto_em, estado_presenca, consentimento_lgpd
teams             id, event_id, nome, cor, capacidade, criado_em
modules           id, event_id, ordem, titulo
scenes            id, module_id, ordem, slug, tipo(ModuleCover|MentalModel|CommandAnatomy|TerminalDemo|WillGoWrong|QuizScene|LabScene|Scoreboard|Recap), passos int, conteudo_ref(MDX), fase(idle|aberta|encerrada|revelada), aberta_em
tasks             id, scene_id, slug, titulo, enunciado_md, escopo(individual|grupo), xp_base, limite_segundos   -- 1:1 com uma LabScene
quiz_questions    id, scene_id, pergunta, alternativas_json, correta, segundos                                  -- 1:N dentro de uma QuizScene
pty_sessions      id, participant_id, lab_instance_id, aberta_em, ultimo_buffer, ultimo_visto_em
task_criteria     id, task_id, ordem, descricao, pontos, checker_key
hints             id, task_id, ordem, texto, custo_percentual
submissions       id, task_id, participant_id?, team_id?, criado_em, duracao_ms, resultado_json, aprovados int, total int
criterion_results id, submission_id, criterion_id, passou, mensagem
points_ledger     id, event_id, participant_id?, team_id?, tipo(criterio|quiz|bonus_velocidade|combo|predicao|diagnostico|mentoria|evento|bonus_token|juri), referencia, xp(+), criado_em
criterion_awards  participant_id|team_id, criterion_id   -- UNIQUE: garante idempotência do XP
token_ledger      id, participant_id, tipo(ganho_quiz|ganho_limpo|ganho_mentoria|ganho_predicao|gasto_dica|gasto_sintaxe|gasto_powerup|gasto_pular), delta(+/-), criado_em
combos            participant_id, multiplicador, acertos_seguidos, atualizado_em
predictions       id, slide_ref, pergunta, alternativas_json, correta, segundos
prediction_answers id, prediction_id, participant_id, alternativa, correta, ms_resposta
diagnoses         id, submission_id, participant_id, alternativa, correta   -- "por que você acha que falhou?"
mentorships       id, mentor_id, mentorado_id, task_id, criado_em
live_events       id, event_id, tipo(xp_dobrado|sudden_death|sabotagem|resgate|pausa), iniciado_em, encerrado_em, payload_json
role_cards        id, team_id, participant_id, papel(instalador|configurador|testador|relator)
levels            nivel, xp_minimo, patente, prompt_exibido
hint_redemptions  id, participant_id, hint_id, criado_em
badges            id, slug, nome, descricao, icone
badge_awards      id, participant_id, badge_id, criado_em
quiz_answers      id, question_id, participant_id, alternativa, ms_resposta, correta
lab_instances     id, participant_id, container_nome, estado(provisionando|pronto|resetando|destruido), url_publica, ip_interno, snapshot_base
presence_events    id, participant_id, tipo(conectou|desconectou|ocioso|ativo|pediu_ajuda), criado_em
help_requests     id, participant_id, task_id, criado_em, atendido_por?, atendido_em?
audit_log         id, actor, acao, payload_json, criado_em
```

**Decisão de design importante:** pontuação é um **livro-caixa append-only** (`points_ledger`), nunca um campo `pontos` mutável. Isso te permite recalcular, estornar uma tarefa quebrada no meio do evento, auditar um empate e desfazer um erro seu ao vivo — sem corromper o placar. O total vira uma view materializada ou um `SUM` com índice.

---

## 5. Eventos de tempo real (Socket.IO)

Salas: `event:<id>` (todos), `team:<id>` (grupo), `host:<eventId>` (só facilitador).

**Servidor → cliente**
```
scene:changed        { cenaId, tipo, passo, fase, forceFollow }
scene:phase          { cenaId, fase }        // idle | aberta | encerrada | revelada
task:opened          { taskId, limiteSegundos, abertaEm }   // emitido quando a LabScene abre
task:closed          { taskId }
task:solution        { taskId }                 // gabarito aplicado
submission:result    { submissionId, criterios[], pontosGanhos, primeiros[] }
score:updated        { individual[], grupos[] } // throttle 1/s, só o topo + a posição do próprio
team:updated         { teamId, membros[] }
presence:updated     { participantes[] }        // diff, não lista inteira
help:queued          { participantId, taskId }  // só para host
broadcast:message    { texto, tipo }
session:paused       { pausado: boolean }
quiz:question        { questionId, pergunta, alternativas, segundos }
quiz:reveal          { correta, distribuicao }
badge:awarded        { participantId, badgeSlug }
xp:awarded           { participantId, xp, tipo, referencia, multiplicador }
token:changed        { participantId, saldo, delta, motivo }
level:up             { participantId, nivel, patente, promptExibido }
combo:changed        { participantId, multiplicador }
prediction:open      { predictionId, pergunta, alternativas, segundos }
prediction:reveal    { correta, distribuicao }
diagnosis:open       { submissionId, alternativas }
event:started        { tipo, duracaoSegundos }   // xp dobrado, sabotagem, sudden death, resgate
event:ended          { tipo }
role:assigned        { teamId, participantId, papel }
comprehension:pulse  { entendi, perdi }          // só para host
lab:status           { estado, urlPublica }
```

**Cliente → servidor**
```
presence:heartbeat   { cenaId, terminalFocado }   // a cada 20s; servidor marca ocioso aos 90s
task:submit          { taskId }         // dispara o checker; cooldown 10s
hint:buy             { hintId }
syntax:reveal        { comando }        // custa 1 token
prediction:answer    { predictionId, alternativa }
diagnosis:answer     { submissionId, alternativa }
mentorship:credit    { mentorId }       // "quem te ajudou?"
comprehension:vote   { valor: 'entendi' | 'perdi' }   // anônimo, sem XP
help:request         { taskId }
team:join / team:leave { teamId }
quiz:answer          { questionId, alternativa }
terminal:data / terminal:resize         // canal do PTY
host:*               (todos os controles, com PIN validado no handshake)
```

**Reconexão:** ao reconectar, o cliente chama `GET /api/state` e recebe o estado completo (cena, passo, fase, tarefa aberta, critérios já passados, XP, tokens, grupo, container e o buffer do PTY). Nunca dependa de ter recebido eventos anteriores — alguém vai fechar o notebook.

---

## 6. Como funciona a verificação (o coração)

1. Participante clica **Verificar**.
2. `POST /api/tasks/:id/submit` → o `lab-orchestrator` executa, dentro do container daquele participante, um **script de check por critério** (`incus exec <c> -- /opt/check/<checker_key>.sh`), com timeout de 5s e saída `exit 0` = passou, stdout = mensagem para o participante.
3. Para o critério "exposto na rede" do M6, o check roda **no host**, não no container: `curl -sS -m 3 http://<ip_do_container>/` e valida status 200 + conteúdo esperado.
4. Resultado gravado em `submissions` + `criterion_results`; pontos lançados no `points_ledger` **só para critérios ainda não pontuados** (idempotência: um `UNIQUE(participant_id, criterion_id)` em uma tabela `criterion_awards` evita pontuar duas vezes ao reenviar).
5. Emite `submission:result` para a pessoa e `score:updated` para a sala.

Os checkers são **arquivos bash versionados no repo** (`labs/<modulo>/checks/*.sh`), copiados para a imagem base. Cada lab tem também um `seed.sh` (cria a bagunça inicial, as flags randomizadas) e um `solve.sh` (o gabarito de 1 clique). Essa tríade — seed/check/solve — é o que torna o conteúdo testável automaticamente em CI.

---

## 7. Estrutura de repositório

```
/
├── apps/web/                 # Next.js (telas, slides, painel)
│   └── src/app/{j,lobby,stage,lab,scoreboard,host,quiz,me}/
├── apps/realtime/            # servidor Socket.IO + PTY bridge (pode ser o mesmo processo do Next)
├── apps/orchestrator/        # criação/reset/destroy de containers Incus + execução de checkers
├── packages/db/              # schema Drizzle + migrações + seeds
├── packages/shared/          # tipos dos eventos socket, zod schemas (uma fonte de verdade)
├── content/                  # módulos, slides (MDX), enunciados, dicas, quizzes
├── labs/<modulo>/            # seed.sh, checks/*.sh, solve.sh, fixtures
├── infra/                    # imagem base Incus (cloud-init), Caddyfile, compose do Postgres
└── docs/                     # este planejamento
```

Os 7 tipos de slide viram 7 componentes em `apps/web/src/components/slides/` (`ModuleCover`, `MentalModel`, `CommandAnatomy`, `TerminalDemo`, `WillGoWrong`, `HandsOnBridge`, `ModuleRecap`) — autor escreve MDX e escolhe o tipo, nunca monta layout à mão. O contrato de cada um está em `plano-slides-ux.md` §2.

Conteúdo em MDX/arquivo (não no banco) é deliberado: você vai editar texto de slide na véspera, e quer isso em commit, não em formulário.

---

## 8. Fases de construção (do indispensável ao luxo)

**Fase 0 — O deck como máquina de cenas (2 dias)**
Next + Socket.IO + Postgres + entrada por código/nickname + presença + o runtime de cenas (cena/passo/fase sincronizados, os três papéis `screen`/`player`/`host`, follow-the-presenter com escape) + 4 tipos de cena de conteúdo em MDX.
*Esse runtime é a fundação de tudo: quiz e lab são só mais dois tipos de cena. Errar a abstração aqui custa reescrever o app depois.*

**Fase 1 — As duas cenas que importam (5–6 dias)**
`QuizScene` completa (pergunta/contagem/trava/revelação/explicação como passos, com gráfico ao vivo) + `points_ledger`/`token_ledger` + níveis e patentes + placar ao vivo; e `LabScene` com o `TerminalHost` persistente (§3.4), imagem base Incus, provisionamento por participante, seed/check/solve do M1 e M2 e submissão por critério.
*A camada de jogo é núcleo, não polimento: sem quiz e sem XP o M0 inteiro não existe. E é aqui que nasce o que você pediu — mudar arquivos com comandos e o app mostrar na hora quem acertou.*

**Fase 2 — Grupos e presença (2 dias)**
Grupos tipo Discord (entrar/sair/capacidade/chat), tarefas de escopo grupo, cartas de função, grade pessoas × critérios no painel, estado "travado", pedir ajuda, pausa global, reset e gabarito.

**Fase 3 — Camadas finas do jogo (2 dias)**
Combos, predições durante o slide, diagnóstico de erro, eventos ao vivo (XP dobrado, sabotagem, sudden death, resgate), mentoria, badges, desafios bônus, animações do placar.

**Fase 4 — Conteúdo completo (2–3 dias)**
M3 a M5 com seeds/checks/solves, e o boss: container de grupo pré-quebrado com os 4 defeitos, multi-terminal e cartas de função.

**Fase 5 — Polimento e resiliência (2 dias)**
Modo offline (SQLite + rede local), export de PDF dos slides, resumo pessoal + certificado, Sentry, teste de carga, ensaio.

**Corte de escopo se o tempo apertar, nesta ordem:** Fase 5 → eventos ao vivo e combos (Fase 3) → chat de grupo → terminal no navegador (cai para a opção B do item 1). **Nunca** corte o motor de quiz: ele carrega os primeiros 25 minutos do workshop. **Nunca** corte: verificação por critério, placar, painel do facilitador, follow-the-presenter com escape.

---

## 9. Decisões técnicas que valem registrar agora

- **O slide é a aplicação** (§3): quiz e terminal são tipos de cena, não telas separadas. O participante tem uma URL e nunca troca de contexto.
- **Slides como código React** (não dados): permite um slide "placar ao vivo" e um slide "sua tarefa" que reagem ao estado. Custo: editar slide = deploy. Aceitável para um evento único.
- **Um processo Node servindo Next + Socket.IO**: menos partes móveis, essencial para o modo offline.
- **Containers de sistema (Incus dentro de uma Lima VM), não Docker, e nunca o shell do macOS**: o currículo exige `apt`, `sudo`, `/home`, `ps`/`kill`, utilitários GNU e isolamento por pessoa. Guia completo em `infra-mac.md`.
- **Um container por participante, um container por grupo**: isolamento total no individual (inclusive porta 80 livre para todos ao mesmo tempo), compartilhamento deliberado no boss do M5.
- **Tudo idempotente e recuperável**: reconectar, reenviar, resetar e recalcular são operações normais, não exceções.
- **Limites por container**: `limits.cpu.allowance=40%`, 768 MB `enforce=hard`, `limits.processes=400`, disco 2 GB, ACL de rede ligada no individual e desligada no M5. Alguém vai rodar `:(){ :|:& };:` — isso é parte da diversão, desde que derrube só o próprio container.
- **O teto de participantes está dimensionado** (M4/24 GB → 30 com folga, 40 no limite): ~200 MB por container, 640 MB de limite rígido.
