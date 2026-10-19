# Gaps, Riscos e Decisões Abertas

> O que você **não** mencionou e que costuma decidir se um workshop assim dá certo ou vira duas horas de frustração. Ordenado por quanto pode te machucar.

---

## 1. Decisões abertas (preciso da sua resposta para fechar o plano)

| # | Decisão | Por que trava coisas | Recomendação |
|---|---|---|---|
| 1 | **Data do evento e quanto tempo você tem para construir** | define quanto do backlog é realista; o plano tem ~14 dias de trabalho focado | se faltar menos de 3 semanas corridas, construa Fases 0–2 e use a opção B do laboratório |
| 2 | **Quantas pessoas** (10? 30? 80?) | muda nº de monitores, tamanho de fonte e formato dos grupos | **abra 30 vagas**: é o que o Mac aguarda com folga e o que você consegue atender com 3 monitores. Acima de 40 o limite é humano, não técnico |
| 3 | ~~Onde os comandos rodam~~ | **decidido:** tudo no seu Mac (Lima VM + Incus, um container por pessoa), acesso pelo Wi-Fi da sala em `http://<seu-ip>:3000`. Ver `infra-mac.md` | — |
| 4 | ~~Orçamento~~ | **decidido:** infraestrutura custa zero. Só um roteador de bolso (~R$ 200) e impressão | — |
| 4b | ~~Modelo e RAM do Mac~~ | **decidido:** M4 com 24 GB → **30 participantes com folga, teto técnico 40**. VM com 14 GB/6 vCPU, 640 MB rígidos por container. Ver `infra-mac.md` §2 | — |
| 4c | **É MacBook Air M4?** | Air é sem ventoinha: 2h de carga + espelhamento throttla e o lab engasga no meio | se for Air, ensaio térmico de 40 min é obrigatório; em mini/Pro é um não-problema |
| 4d | ~~Ambiente de lab~~ | **decidido:** uma Lima VM com um usuário Linux por participante (sem containers), isolados por `chmod 700` + `hidepid=2` + cota + `sudo` em lista branca. Metade dos exercícios é widget no slide, sem shell | — |
| 5 | **Participantes trazem notebook?** | sem notebook, nada de lab | duplas obrigatórias, anunciadas na inscrição |
| 6 | **Quantos monitores você tem?** | 1 por 10 pessoas é o mínimo viável | recrute e treine com 1 semana de antecedência |
| 7 | **Vai repetir o workshop?** | muda o quanto vale investir em conteúdo reaproveitável | se sim, o banco de perguntas e os seeds/checks valem o dobro do esforço |

---

## 2. Gaps técnicos

1. **O shell do macOS não serve para ensinar Linux.** Sem `apt`, sem `systemd`/`systemctl`/`journalctl`, utilitários BSD com flags diferentes (`stat -c` não existe), layout de diretórios diferente — e, pior, 30 pessoas no mesmo `~` com acesso aos seus arquivos. O Mac roda a infraestrutura; cada participante recebe um container Linux. Detalhado em `plano-app.md` §1.1.
2. **AP isolation é agora o risco nº 1.** "Estão no mesmo Wi-Fi, logo alcançam meu IP" falha em boa parte das redes institucionais e de convidados, que bloqueiam tráfego entre clientes — e nada do seu lado conserta isso. Leve **roteador de bolso próprio** e teste no local com dois celulares. Isso precisa ser verificado na primeira semana, não na véspera.
3. **Lima só encaminha para `127.0.0.1` por padrão.** Sem `hostIP: "0.0.0.0"` no `lima.yaml`, o app funciona perfeitamente no seu Mac e para ninguém mais.
4. **Sem TLS, `navigator.clipboard` não funciona** (contexto não seguro). O botão "copiar comando" precisa de fallback com `textarea` + `execCommand`.
5. **Teclado ABNT2:** com terminal no navegador, o layout é o do próprio participante e já funciona — o problema desaparece. O que **permanece** é ele não saber *onde* estão `|`, `~`, `/` e `$`; isso é slide, não configuração. Ainda assim, fixe locale `pt_BR.UTF-8` na imagem base para as mensagens.
5b. **DHCP trocando o IP do Mac no meio do evento** invalida o QR code projetado. IP manual ou reserva no roteador, e gere o QR do IP real detectado no boot.
6. **Copiar/colar no terminal** não é `Ctrl+C`. Diga isso no M1 ou perca 5 minutos depois (e no xterm.js configure `Ctrl+Shift+V` e colagem por clique do meio).
7. **Isolamento entre usuários na mesma VM** é o item que exige mais cuidado nesta arquitetura, e são quatro linhas: `chmod 700` nas homes, **`hidepid=2`** no `/proc` (senão qualquer um mata o processo do colega no M5), cota de disco e `limits.conf` (`nproc 300`) — alguém **vai** rodar `:(){ :|:& };:`. Sem `hidepid`, o M5 vira bagunça; valide com `sudo -u aluno02 ps aux | grep aluno01` (deve vir vazio).
7b. **`sudo` tem que ser lista branca**, nunca irrestrito: 30 pessoas com root na mesma máquina é uma questão de quando, não de se. Rode `sudo visudo -c` depois de editar — um `sudoers` quebrado te tranca fora da sua própria VM.
7c. **O `apt install` só funciona para todos se cada um instalar um pacote diferente** — senão o segundo em diante vê *"already the newest version"* e o lab perde o sentido. Sorteie o pacote no provisionamento.
7d. **O diretório do grupo** (`2770`, setgid) é compartilhado de propósito. Mostre na tela quem mais está mexendo ali, senão dois colegas editam o mesmo arquivo e ninguém entende o que houve.
8. **Snapshot e reset em segundos.** Sem reset rápido, cada ambiente destruído é uma pessoa perdida pelo resto do workshop.
9. **Reconexão é o caso normal, não exceção.** Notebook fecha, Wi-Fi cai, aba recarrega. O cliente tem que reconstruir todo o estado a partir de um `GET /api/state`. Teste isso fechando a tampa de verdade.
10. **Relógio e fuso.** Bônus de velocidade dependem de tempo; calcule **sempre no servidor**, nunca no cliente.
11. **Carga, agora no seu Mac:** 30 sockets + 30 PTYs + 30 containers + checkers, enquanto a mesma máquina apresenta e espelha a tela no projetor. Enfileire os checkers (máx. 6 em paralelo), rode **build de produção**, mantenha na tomada com `caffeinate -dimsu`, e faça um ensaio de 30 min com carga total medindo temperatura e throttling.
11b. **Teto de participantes dimensionado:** M4/24 GB → 30 com folga de 2×, 40 no limite técnico. Abra 30 vagas e trave a inscrição ali — acima disso o gargalo é atendimento humano (1 monitor por 10), não a máquina.
12. **Observabilidade sem nuvem é você olhando:** painel na sua tela com containers vivos, RAM/CPU da VM, sockets conectados, fila de checkers e throttling do Mac. Não dá para descobrir uma queda pelo silêncio da sala.
12b. **Se o Mac morrer, não existe nada.** SSD externo com imagem da VM + app + banco + `restore.sh` testado, segundo notebook capaz de assumir o mesmo IP, PDF dos slides e labs impressos.
13. **Idempotência dos checkers.** `Verificar` clicado 10 vezes não pode pontuar 10 vezes nem corromper o ambiente. Checker é só leitura — nunca conserta nada.
14. **Seeds randomizados precisam ser verificáveis.** Se a flag é aleatória, o checker tem que saber qual é a daquele participante: grave o valor na criação do ambiente.

---

## 3. Gaps de conteúdo e didática

15. **Nível misto é o problema pedagógico central.** Sem trilha para os rápidos (desafios bônus) e piso para os lentos (gabarito em 1 clique, pontos parciais), você perde as duas pontas da sala.
16. **Inglês.** Mensagens de erro, `man pages` e nomes de comando são todos em inglês. Traduza as mensagens recorrentes num slide (`plano-slides-ux.md` §2/T5) e no cheatsheet.
17. **Cheatsheet de uma folha, impresso, organizado por situação** (a estrutura do pacote de sobrevivência, `plano-workshop.md` §4) — não em ordem alfabética de comando. O artefato de maior valor percebido, e o que eles levam para casa. Entregue na entrada, não no fim.
18. **Nomenclatura explícita:** kernel, distro, shell, root, flag, PID, processo, pacote, repositório. Cada palavra apresentada **uma vez**, de forma explícita. Jargão não definido é onde o iniciante desiste em silêncio.
19. **O que cortar está decidido, o que não cortar também.** Já está no plano: corta M3 e Kahoot relâmpago; nunca corta o M5.
20. **Pergunta de quiz ambígua ao vivo gera revolta.** Peça para alguém de fora revisar o banco de perguntas.
21. **Pós-workshop:** indique 3 caminhos concretos (um livro, um site de exercícios, um projeto para fazer em casa com a própria VM). Sem isso, o impulso morre no mesmo dia.

---

## 4. Gaps de pessoas e logística

22. **Monitores sem briefing são passageiros.** Faça 30 min com eles **tendo rodado os labs inteiros**, com o cheatsheet e as respostas na mão.
23. **Projetor engole contraste.** Teste com a luz da sala acesa, da última fileira. Dark theme no monitor costuma virar sopa cinza na parede — por isso o deck é claro.
24. **Tomadas, extensões e bateria.** 30 notebooks em 2h sem tomada = gente desligando no M4. Leve réguas.
25. **Som.** O placar e o boss têm momento sonoro; teste caixa/HDMI antes.
26. **Quem chega atrasado.** Regra decidida: entra jogando, fica fora do ranking dos módulos encerrados.
27. **Quem sai no meio.** Não deixe o grupo do M5 ficar com 2 pessoas — o painel do facilitador precisa permitir remanejar grupos ao vivo.
28. **Acessibilidade:** fonte grande por padrão, contraste alto, cor nunca como única informação, `prefers-reduced-motion` respeitado, nada de piscar, navegação por teclado no app. Pergunte na inscrição se alguém precisa de acomodação específica (baixa visão, leitor de tela, mobilidade).
29. **Celular como segunda tela.** Quiz, placar e enunciado funcionam no celular; terminal, não. Isso salva quem ficou sem notebook.
30. **Moderação do chat de grupo.** 30 estudantes anônimos num chat: tenha um botão de silenciar e uma regra anunciada. Ninguém pensa nisso até acontecer.
31. **Nicknames ofensivos.** Lista de bloqueio simples + poder de renomear no painel.

---

## 5. Gaps legais e de dados

32. **LGPD.** Você coleta nome/nickname e talvez e-mail para o certificado. Tenha: aviso curto na tela de entrada, finalidade declarada, consentimento explícito, e **exclusão dos dados após o evento** (defina: 30 dias). Não colete CPF. Não peça e-mail se não for mandar certificado.
33. **Foto e gravação.** Se vai fotografar ou gravar, avise na entrada e tenha uma forma de quem não quer aparecer sinalizar (adesivo colorido no crachá funciona).
34. **Conteúdo gerado pelos participantes** (nicknames, nomes de grupo, o laudo do boss projetado) fica visível para a sala. Avise, e tenha como renomear ou esconder em um clique.
35. **Licença do material.** Se o repo vai público: escolha a licença (MIT para código, CC BY-SA para conteúdo) e credite as fontes das curiosidades do M0.

---

## 6. Registro de riscos

| Risco | Impacto | Prob. | Mitigação |
|---|---|---|---|
| **AP isolation**: ninguém alcança seu IP | fatal | **alta** | roteador de bolso próprio; teste no local com 2 celulares na semana 1 |
| **Seu Mac superaquece e throttla** (RAM está folgada com 24 GB) | alto | média (**alta** se for Air) | ensaio de 40 min com carga total + tela espelhada, superfície dura, só app e navegador abertos, build de produção |
| **Seu Mac morre** | fatal | baixa | SSD com imagem da VM + app + banco + `restore.sh` testado; segundo notebook assumindo o mesmo IP; PDF dos slides |
| Ambiente Linux não se comporta como o esperado (`apt`, `sudo`, `/home`) | fatal | baixa | Incus dentro da Lima VM resolve; validar na semana 1 rodando os 6 labs de ponta a ponta |
| Port-forward do Lima só em localhost | alto | **alta** se esquecer | `hostIP: "0.0.0.0"` no `lima.yaml`, verificado de outro aparelho |
| App cai no meio do workshop | alto | baixa | PDF dos slides + labs impressos + verificação por monitor + placar no flipchart |
| Mac sobrecarrega no `Verificar` de 30 pessoas | alto | média | fila com no máx. 6 checkers em paralelo + teste de carga |
| Um participante derruba o ambiente dos outros | alto | média | limites de CPU/RAM/processos por container + ACL de rede |
| Sala muito mais lenta que o previsto | alto | **alta** | gabarito em 1 clique, regra dos 70%, cortes já decididos |
| Backlog não fica pronto a tempo | alto | **alta** | fases ordenadas; Fase 0+1 já faz o workshop acontecer |
| Pouca gente com notebook | médio | média | duplas obrigatórias anunciadas na inscrição |
| Participantes destroem o próprio ambiente | médio | **alta** | reset grátis em 1 clique + snapshot |
| Quiz com pergunta ambígua | baixo | média | revisão externa do banco |
| Placar vira competição tóxica | médio | baixa | sem último lugar público, sem XP negativo, prêmio de mentoria |

---

## 7. Custos estimados

| Item | Valor |
|---|---|
| Infraestrutura (roda no seu Mac) | **R$ 0** |
| Roteador de bolso (contorna AP isolation) | R$ 150–250 — o item mais importante da lista |
| SSD externo para o plano B | provavelmente você já tem |
| Impressão de cheatsheets (30) | ~R$ 30 |
| Brindes/prêmios | opcional (adesivos de patrocinador resolvem) |
| **Seu tempo de build** | ~12–14 dias de trabalho focado para o plano inteiro; ~5 dias para o mínimo que funciona |

---

## 8. Critérios de sucesso (defina antes, meça depois)

- **≥ 80% dos participantes concluem o M4** (o pipe de busca em log) — é o módulo de maior retorno do pacote de sobrevivência.
- **≥ 70% dos grupos fecham o chamado no boss** (os 4 defeitos). Esse é o número que diz se houve **transferência**: eles escolheram a ferramenta sem ninguém dizer qual era.
- **≥ 90% usam o kit de fuga sem pedir ajuda** (sair do `less`/`man`/`vim`) — medido por não haver pedido de ajuda com esse motivo.
- **Mediana de XP ≥ 60% do teto** — se ficar muito abaixo, o ritmo foi rápido demais.
- **≤ 10% de participantes em estado "travado" por mais de 3 minutos** em qualquer lab.
- **NPS ≥ 50** no feedback, e a pergunta aberta "o que mais te travou" respondida por ≥ 50%.
- Nenhum participante com 0 XP no fim. Se houver um, foi falha de design, não da pessoa.
