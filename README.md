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
npm run dev          # ou: npm run build && npm start
```

O servidor imprime as três URLs no boot:

| Papel | URL |
|---|---|
| participante | `http://<seu-ip>:3000` (é o QR code) |
| projetor | `http://localhost:3000/screen` |
| apresentador | `http://localhost:3000/host` — PIN `1991` (`PIN_HOST=...` para trocar) |

Atalhos do apresentador: `→`/`espaço` avança passo ou cena · `←` volta · `A` abre a cena (liga o timer) · `R` revela o quiz e pontua · `P` pausa global · `V` traz todos ao vivo.

## Arquitetura em uma frase

O slide **é** a aplicação: o deck é uma máquina de cenas e passos cujo estado vive no servidor, e cada cena se desenha de três formas — `screen` (projetor), `player` (participante), `host` (apresentador). Quiz, widget e terminal são tipos de cena, não telas separadas.

```
server.mjs              Next + Socket.IO num processo; estado do evento e livro-caixa de XP
src/deck/types.ts       contrato das cenas e dos níveis
src/deck/content.ts     o deck (M0 e M1 completos; M2–M6 com as cenas-chave)
src/deck/useArena.ts    conexão única; o cliente nunca calcula estado
src/components/         SceneRouter + diagramas SVG + widgets
src/app/                / (participante) · /screen (projetor) · /host (apresentador)
```

## Estado do código

**Pronto (Fase 0 + parte da 1):** runtime de cenas com os três papéis, sincronização em tempo real, reconexão com estado completo, entrada por nick/emoji, presença (ativo/ocioso/desconectado), motor de quiz com revelação e gráfico de respostas, XP em livro-caixa append-only com bônus de velocidade, níveis e patentes, tokens, grupos com placar por média, timer no servidor, pausa global, pedido de ajuda, aviso em broadcast. 10 tipos de cena desenhados, 2 widgets jogáveis (`permission-toggles`, `path-quiz`).

**Próximo, em ordem:** `TerminalHost` persistente (xterm.js ↔ `node-pty` ↔ `su - alunoNN`) e os checkers por critério · provisionamento (`infra/provision.sh`, seeds e `reset.sh`) · widgets `pipe-builder` e `fs-dragdrop` · persistência em SQLite · painel de facilitador cheio (grade pessoas × critérios, travados) · conteúdo de M2 a M6.

Roadmap completo em [docs/plano-app.md](docs/plano-app.md) §8.
