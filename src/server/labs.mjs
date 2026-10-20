/**
 * Definição dos labs: o que cada critério verifica, em bash.
 *
 * Regras de ouro dos checkers:
 *  1. Só leem o estado do lab. Um checker nunca conserta nada — se consertar, a
 *     pessoa "passa" sem ter aprendido, e o gabarito deixa de ter sentido.
 *     (A única escrita permitida é registrar que algo *foi observado*, como o
 *      marcador `.arena/rodou` do M5: é anotação, não conserto.)
 *  2. Idempotentes. Clicar Verificar 10x não muda nada nem pontua 2x.
 *  3. Devolvem mensagem útil no stdout quando falham: nunca "errado", sempre
 *     uma pergunta que aponta o próximo passo.
 *
 * `check` roda com `bash -c` dentro do HOME do participante, com $HOME e $USER
 * do dono e com a função `modo <arquivo>` disponível (portátil GNU/BSD).
 */

const PRELUDIO = `
set -o pipefail
modo() { stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1" 2>/dev/null; }
cai() { echo "$1"; exit 1; }
`;

export const LABS = {
  // ─────────────────────────────── M1 ───────────────────────────────────────
  'm1-flag': {
    titulo: 'A flag escondida',
    seed: 'm1.sh',
    solve: 'm1.sh',
    dicas: [
      'Arquivos que começam com ponto são escondidos: `ls -la` mostra tudo.',
      'O caminho é projetos → 2024 → uma pasta escondida → mais uma pasta. Use `cd` em cada uma e `ls -la` para ver.',
    ],
    criterios: [
      {
        id: 'm1-c1', xp: 150, tipo: 'resposta',
        descricao: 'Entregar o conteúdo de flag.txt',
        // compara o que a pessoa digitou com a flag sorteada no seed
        check: `
          esperado="$(cat "$HOME/.arena/flag" 2>/dev/null)"
          [ -n "$esperado" ] || cai "ambiente sem seed — chame um monitor"
          [ "$RESPOSTA" = "$esperado" ] || cai "não é esse texto. Confira se copiou o conteúdo inteiro do flag.txt"
        `,
      },
    ],
  },

  // ─────────────────────────────── M2 ───────────────────────────────────────
  'm2-bagunca': {
    titulo: 'Arrumando o diretório',
    seed: 'm2.sh',
    solve: 'm2.sh',
    dicas: [
      'O coringa poupa 20 comandos: `mv *.png imagens/`.',
      'Renomear é mover: `mv rascunho.txt docs/notas.md`.',
    ],
    criterios: [
      // Os "soltos na raiz" são contados com find (e não com `ls *.png *.jpg`):
      // o ls só falha quando TODOS os padrões somem, então com os .png movidos
      // e um .jpg sobrando ele dava erro e o critério achava que estava limpo.
      { id: 'm2-c1', xp: 40, descricao: 'Criar a pasta imagens e mover para ela todos os .png e .jpg', check: `
          cd "$HOME/bagunca" || cai "não achei ~/bagunca"
          [ -d imagens ] || cai "ainda não existe a pasta imagens: mkdir imagens"
          [ -z "$(find . -maxdepth 1 -type f \\( -name '*.png' -o -name '*.jpg' \\) -print -quit)" ] || cai "ainda tem imagem solta em ~/bagunca: mv *.png *.jpg imagens/"
          [ "$(ls imagens | grep -cE '\\.(png|jpg)$')" -ge 6 ] || cai "faltou mover alguma imagem para imagens/"` },
      // README.md fica de fora: ele é pedido justamente na raiz (critério 6)
      { id: 'm2-c2', xp: 40, descricao: 'Criar a pasta docs e mover para ela todos os .txt e .md', check: `
          cd "$HOME/bagunca" || cai "não achei ~/bagunca"
          [ -d docs ] || cai "ainda não existe a pasta docs: mkdir docs"
          [ -z "$(find . -maxdepth 1 -type f \\( -name '*.txt' -o -name '*.md' \\) ! -name README.md -print -quit)" ] || cai "ainda tem .txt ou .md solto em ~/bagunca: mv *.txt *.md docs/"
          [ "$(ls docs | grep -cE '\\.(txt|md)$')" -ge 5 ] || cai "faltou mover algum texto para docs/"` },
      { id: 'm2-c3', xp: 40, descricao: 'Criar a pasta scripts e mover para ela todos os .sh', check: `
          cd "$HOME/bagunca" || cai "não achei ~/bagunca"
          [ -d scripts ] || cai "ainda não existe a pasta scripts: mkdir scripts"
          [ -z "$(find . -maxdepth 1 -type f -name '*.sh' -print -quit)" ] || cai "ainda tem .sh solto em ~/bagunca: mv *.sh scripts/"
          [ "$(ls scripts | grep -c '\\.sh$')" -ge 3 ] || cai "faltou mover algum script"` },
      { id: 'm2-c4', xp: 40, descricao: 'Renomear o rascunho.txt para notas.md, dentro de docs', check: `
          cd "$HOME/bagunca" || cai "não achei ~/bagunca"
          [ -f docs/notas.md ] || cai "não achei docs/notas.md. Renomear é mover: mv rascunho.txt docs/notas.md (ou mv docs/rascunho.txt docs/notas.md)"
          [ ! -f rascunho.txt ] && [ ! -f docs/rascunho.txt ] || cai "o rascunho.txt ainda existe: renomeie com mv em vez de copiar"` },
      { id: 'm2-c5', xp: 40, descricao: 'Apagar os arquivos que começam com tmp_', check: `
          cd "$HOME/bagunca" || cai "não achei ~/bagunca"
          [ -z "$(find . -name 'tmp_*' -print -quit)" ] || cai "ainda sobrou algum tmp_: rm tmp_*"` },
      { id: 'm2-c6', xp: 40, descricao: 'Criar README.md em ~/bagunca com o texto: organizado por + o nome do seu prompt', check: `
          cd "$HOME/bagunca" || cai "não achei ~/bagunca"
          [ -f README.md ] || cai "crie o README.md aqui em ~/bagunca: echo \\"organizado por $USUARIO\\" > README.md"
          grep -qi "organizado por $USUARIO" README.md || grep -qi "organizado por $NICK" README.md \\
            || cai "o README.md precisa da frase: organizado por $USUARIO"` },
    ],
  },

  // ─────────────────────────────── M3 ───────────────────────────────────────
  'm3-permissoes': {
    titulo: 'Permissões e sudo',
    seed: 'm3.sh',
    solve: 'm3.sh',
    dicas: [
      'Script não roda sem permissão de execução: `chmod +x deploy.sh`.',
      'Para ler um arquivo você precisa do bit r: `chmod 644 relatorio.txt`.',
    ],
    criterios: [
      { id: 'm3-c1', xp: 80, descricao: 'Criar ~/deploy.sh com a 1ª linha #!/bin/bash e deixá-lo executável', check: `
          f="$HOME/deploy.sh"
          [ -f "$f" ] || cai "crie o ~/deploy.sh: echo '#!/bin/bash' > deploy.sh"
          head -1 "$f" | grep -q '^#!' || cai "a 1ª linha precisa ser #!/bin/bash: echo '#!/bin/bash' > deploy.sh"
          [ -x "$f" ] || cai "ele existe mas não é executável — chmod +x deploy.sh"` },
      { id: 'm3-c2', xp: 80, descricao: 'Fazer o deploy.sh imprimir uma frase quando roda', check: `
          out="$(cd "$HOME" && ./deploy.sh 2>&1)" || cai "o script deu erro ao rodar: $out"
          [ -n "$out" ] || cai "ele roda, mas não imprime nada. Acrescente uma linha: echo 'echo \"deploy feito\"' >> deploy.sh"` },
      { id: 'm3-c3', xp: 40, descricao: 'Liberar a leitura do relatorio.txt', check: `
          f="$HOME/relatorio.txt"
          [ -f "$f" ] || cai "não achei ~/relatorio.txt"
          [ "$(modo "$f")" != "000" ] || cai "ainda está com permissão 000 — chmod 644 relatorio.txt"
          [ -r "$f" ] || cai "ainda não dá para ler"` },
    ],
  },

  // ─────────────────────────────── M4 ───────────────────────────────────────
  'm4-pipes': {
    titulo: 'Caçando no log',
    seed: 'm4.sh',
    solve: 'm4.sh',
    dicas: [
      'Contar linhas que casam: `grep -c ERROR app.log`.',
      'O top 3: `... | sort | uniq -c | sort -rn | head -3`.',
    ],
    criterios: [
      { id: 'm4-c1', xp: 100, tipo: 'resposta', descricao: 'Quantas linhas do log têm a palavra ERROR?', check: `
          esperado="$(grep -c ERROR "$HOME/app.log")"
          [ "$RESPOSTA" = "$esperado" ] || cai "não é esse número. Tente de novo"` },
      { id: 'm4-c2', xp: 100, tipo: 'resposta', descricao: 'Qual IP aparece mais vezes no log inteiro?', check: `
          esperado="$(grep -oE '([0-9]{1,3}\\.){3}[0-9]{1,3}' "$HOME/app.log" | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')"
          [ "$RESPOSTA" = "$esperado" ] || cai "não é esse IP. Atenção: a pergunta é sobre o log inteiro, não só as linhas de erro"` },
      { id: 'm4-c3', xp: 150, descricao: 'Guardar todas as linhas com FATAL em ~/fatais.txt', check: `
          [ -f "$HOME/fatais.txt" ] || cai "crie o arquivo: grep FATAL app.log > fatais.txt"
          esperado="$(grep -c FATAL "$HOME/app.log")"
          achado="$(grep -c FATAL "$HOME/fatais.txt" 2>/dev/null || echo 0)"
          [ "$achado" = "$esperado" ] || cai "esperava $esperado linhas FATAL no arquivo, achei $achado"` },
    ],
  },

  // ─────────────────────────────── M5 ───────────────────────────────────────
  'm5-processos': {
    titulo: 'Programas e processos',
    seed: 'm5.sh',
    solve: 'm5.sh',
    dicas: [
      'O seu pacote está em ~/.pacote. Instale com `sudo apt install -y <nome>`.',
      'Para achar o PID: `ps aux | grep app.js`. Para matar: `kill <PID>`.',
    ],
    criterios: [
      { id: 'm5-c1', xp: 80, descricao: 'Instalar o programa que está em ~/.pacote', check: `
          pkg="$(cat "$HOME/.pacote" 2>/dev/null)"
          [ -n "$pkg" ] || cai "ambiente sem seed — chame um monitor"
          command -v "$pkg" >/dev/null 2>&1 || dpkg -s "$pkg" >/dev/null 2>&1 \
            || cai "o seu pacote é '$pkg' — sudo apt install -y $pkg"` },
      // adesivo: passa enquanto a app está no ar. Depois que a pessoa mata (c3),
      // este critério continua verde porque já foi premiado — ver `avaliar()`.
      { id: 'm5-c2', xp: 80, descricao: 'Rodar node app/app.js & e esperar o item ficar verde', check: `
          # casa o caminho completo, não o usuário: funciona tanto com contas
          # reais (su - alunoNN) quanto no modo local de desenvolvimento
          pgrep -f "$HOME/app/app.js" >/dev/null || cai "a app não está rodando. Rode node app/app.js & e espere este item ficar verde"
          mkdir -p "$HOME/.arena" && touch "$HOME/.arena/rodou"` },
      { id: 'm5-c3', xp: 120, descricao: 'Encerrar a app com kill + o PID', check: `
          [ -f "$HOME/.arena/rodou" ] || cai "primeiro o item 2: rode node app/app.js & e espere ele ficar verde ANTES de encerrar"
          pgrep -f "$HOME/app/app.js" >/dev/null && cai "ela ainda está no ar: ache o PID com ps aux | grep app.js e use kill PID"
          exit 0` },
    ],
  },

  // ───────────────────────── corrida de equipes ─────────────────────────────
  'corrida-1': {
    titulo: 'Corrida de comandos',
    escopo: 'grupo',
    seed: 'm2.sh',
    solve: 'm2.sh',
    dicas: ['Crie a pasta com `mkdir`, entre nela com `cd` e escreva o arquivo com `echo ... > nome.txt`.'],
    criterios: [
      {
        id: 'corrida-c1', xp: 0,   // o XP da corrida é por posição, não fixo
        descricao: 'Criar ~/corrida/<sua equipe>.txt com a palavra pronto',
        check: `
          d="$HOME/corrida"
          [ -d "$d" ] || cai "crie a pasta: mkdir ~/corrida"
          [ -n "$GRUPO" ] || cai "entre numa equipe antes"
          f="$d/$GRUPO.txt"
          [ -f "$f" ] || cai "falta o arquivo $GRUPO.txt dentro de ~/corrida"
          grep -qi pronto "$f" || cai "o arquivo existe, mas precisa conter a palavra pronto"
        `,
      },
    ],
  },

  // ───────────────────────────── boss (grupo) ───────────────────────────────
  'boss-chamado': {
    titulo: 'O Chamado',
    escopo: 'grupo',
    seed: 'boss.sh',
    solve: 'boss.sh',
    dicas: [
      'O cartão `grep FATAL log/relatorio.log` mostra a linha do erro: o Investigador cola o texto depois de FATAL.',
      'O cartão do `ps` lista primeiro quem mais gasta CPU. O PID é a 2ª coluna, e é ele que vai no cartão do `kill`.',
    ],
    criterios: [
      { id: 'b-c1', xp: 150, papel: 'investigador', tipo: 'resposta',
        descricao: 'Investigador: qual é a mensagem de erro do log?', check: `
          # sem a marca, o chamado não foi preparado: um processo que nunca
          # existiu contava como "morto" e o critério passava sozinho
          [ -f "$DIR_GRUPO/.semeado" ] || cai "o chamado ainda está sendo preparado"
          esperado="$(grep -m1 FATAL "$DIR_GRUPO/log/relatorio.log" | sed 's/.*FATAL //')"
          echo "$RESPOSTA" | grep -qiF "$esperado" || cai "não é essa mensagem. Tente de novo"` },
      { id: 'b-c2', xp: 150, papel: 'operador',
        descricao: 'Operador: o processo travado foi morto', check: `
          # sem a marca, o chamado não foi preparado: um processo que nunca
          # existiu contava como "morto" e o critério passava sozinho
          [ -f "$DIR_GRUPO/.semeado" ] || cai "o chamado ainda está sendo preparado"
          pgrep -f "arena-travado-$GRUPO" >/dev/null && cai "ele ainda está vivo — ache o PID e use kill"
          exit 0` },
      { id: 'b-c3', xp: 150, papel: 'mecanico',
        descricao: 'Mecânico: backup.sh executável e executado', check: `
          # sem a marca, o chamado não foi preparado: um processo que nunca
          # existiu contava como "morto" e o critério passava sozinho
          [ -f "$DIR_GRUPO/.semeado" ] || cai "o chamado ainda está sendo preparado"
          f="$DIR_GRUPO/backup.sh"
          [ -f "$f" ] || cai "não achei o backup.sh no diretório do grupo"
          [ -x "$f" ] || cai "ele existe mas não roda: ls -l mostra que falta o x — chmod +x"
          [ -f "$DIR_GRUPO/backup.ok" ] || cai "agora rode: ./backup.sh"` },
      { id: 'b-c4', xp: 250, papel: 'relator',
        descricao: 'Relator: laudo.txt com grupo, contagem de ERROR e o PID morto', check: `
          # sem a marca, o chamado não foi preparado: um processo que nunca
          # existiu contava como "morto" e o critério passava sozinho
          [ -f "$DIR_GRUPO/.semeado" ] || cai "o chamado ainda está sendo preparado"
          l="$DIR_GRUPO/laudo.txt"
          [ -f "$l" ] || cai "crie o laudo.txt no diretório do grupo"
          grep -qi "$GRUPO" "$l" || cai "o laudo precisa ter o nome da equipe ($GRUPO)"
          n="$(grep -c ERROR "$DIR_GRUPO/log/relatorio.log")"
          grep -q "$n" "$l" || cai "o laudo precisa da quantidade de linhas ERROR do log: grep -c ERROR log/relatorio.log"
          # a contagem de ERROR já tem dois dígitos: sem descontá-la, o laudo
          # passava sem o PID
          grep -oE '[0-9]{2,}' "$l" | grep -vxF "$n" | grep -q . || cai "o laudo precisa do PID do processo que vocês mataram"` },
    ],
  },
};

export function labDe(taskSlug) {
  return LABS[taskSlug];
}

export function criterioDe(taskSlug, criterioId) {
  return LABS[taskSlug]?.criterios.find((c) => c.id === criterioId);
}

export function scriptDoCheck(criterio) {
  return PRELUDIO + '\n' + criterio.check + '\nexit 0\n';
}

export const TOTAL_XP = Object.values(LABS).reduce(
  (s, l) => s + l.criterios.reduce((a, c) => a + c.xp, 0), 0,
);
