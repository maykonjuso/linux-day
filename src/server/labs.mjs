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
      'Dá para procurar pelo nome em vez de abrir pasta por pasta: `find ~ -name flag.txt`.',
    ],
    criterios: [
      {
        id: 'm1-c1', xp: 150, tipo: 'resposta',
        descricao: 'Entregar o conteúdo de flag.txt',
        // compara o que a pessoa digitou com a flag sorteada no seed
        check: `
          esperado="$(cat "$HOME/.arena/flag" 2>/dev/null)"
          [ -n "$esperado" ] || cai "ambiente sem seed — chame um monitor"
          [ "$RESPOSTA" = "$esperado" ] || cai "não é essa. Procure por um arquivo escondido: ls -la"
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
      { id: 'm2-c1', xp: 40, descricao: 'imagens/ com todos os .png e .jpg', check: `
          cd "$HOME/bagunca" || cai "não achei ~/bagunca"
          [ -d imagens ] || cai "ainda não existe a pasta imagens/ — mkdir imagens"
          ls *.png *.jpg >/dev/null 2>&1 && cai "ainda tem imagem solta na raiz de ~/bagunca"
          [ "$(ls imagens | grep -cE '\\.(png|jpg)$')" -ge 6 ] || cai "faltou mover alguma imagem para imagens/"` },
      { id: 'm2-c2', xp: 40, descricao: 'docs/ com todos os .txt e .md', check: `
          cd "$HOME/bagunca" || cai "não achei ~/bagunca"
          [ -d docs ] || cai "ainda não existe a pasta docs/"
          ls *.txt *.md >/dev/null 2>&1 && cai "ainda tem .txt ou .md solto na raiz"
          [ "$(ls docs | grep -cE '\\.(txt|md)$')" -ge 5 ] || cai "faltou mover algum texto para docs/"` },
      { id: 'm2-c3', xp: 40, descricao: 'scripts/ com todos os .sh', check: `
          cd "$HOME/bagunca" || cai "não achei ~/bagunca"
          [ -d scripts ] || cai "ainda não existe a pasta scripts/"
          ls *.sh >/dev/null 2>&1 && cai "ainda tem .sh solto na raiz"
          [ "$(ls scripts | grep -c '\\.sh$')" -ge 3 ] || cai "faltou mover algum script"` },
      { id: 'm2-c4', xp: 40, descricao: 'rascunho.txt renomeado para docs/notas.md', check: `
          cd "$HOME/bagunca" || cai "não achei ~/bagunca"
          [ -f docs/notas.md ] || cai "não achei docs/notas.md — você renomeou rascunho.txt? (mv é renomear)"
          [ ! -f rascunho.txt ] || cai "rascunho.txt ainda está aqui: renomeie em vez de copiar"` },
      { id: 'm2-c5', xp: 40, descricao: 'nenhum arquivo tmp_* sobrando', check: `
          cd "$HOME/bagunca" || cai "não achei ~/bagunca"
          [ -z "$(find . -name 'tmp_*' -print -quit)" ] || cai "ainda sobrou algum tmp_* — rm tmp_*"` },
      { id: 'm2-c6', xp: 40, descricao: 'README.md com a linha "organizado por <seu nick>"', check: `
          cd "$HOME/bagunca" || cai "não achei ~/bagunca"
          [ -f README.md ] || cai "crie o README.md (echo ... > README.md ou nano)"
          grep -qi "organizado por $NICK" README.md || cai "o README.md precisa da linha: organizado por $NICK"` },
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
      { id: 'm3-c1', xp: 80, descricao: 'deploy.sh existe, tem shebang e é executável', check: `
          f="$HOME/deploy.sh"
          [ -f "$f" ] || cai "crie o ~/deploy.sh (nano deploy.sh)"
          head -1 "$f" | grep -q '^#!' || cai "falta a primeira linha #!/bin/bash"
          [ -x "$f" ] || cai "ele existe mas não é executável — chmod +x deploy.sh"` },
      { id: 'm3-c2', xp: 80, descricao: 'deploy.sh roda e imprime algo', check: `
          out="$(cd "$HOME" && ./deploy.sh 2>&1)" || cai "o script deu erro ao rodar: $out"
          [ -n "$out" ] || cai "ele roda, mas não imprime nada — use echo"` },
      { id: 'm3-c3', xp: 40, descricao: 'relatorio.txt legível (e você leu)', check: `
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
      { id: 'm4-c1', xp: 100, tipo: 'resposta', descricao: 'Quantas linhas de ERROR tem o app.log?', check: `
          esperado="$(grep -c ERROR "$HOME/app.log")"
          [ "$RESPOSTA" = "$esperado" ] || cai "não é esse número. Dica: grep -c conta em vez de listar"` },
      { id: 'm4-c2', xp: 100, tipo: 'resposta', descricao: 'Qual IP aparece mais no log?', check: `
          esperado="$(grep -oE '([0-9]{1,3}\\.){3}[0-9]{1,3}' "$HOME/app.log" | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')"
          [ "$RESPOSTA" = "$esperado" ] || cai "não é esse IP. Monte o encanamento: sort | uniq -c | sort -rn | head -1"` },
      { id: 'm4-c3', xp: 150, descricao: '~/fatais.txt com todas as linhas FATAL', check: `
          [ -f "$HOME/fatais.txt" ] || cai "crie o arquivo com > fatais.txt"
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
      { id: 'm5-c1', xp: 80, descricao: 'Seu pacote sorteado está instalado', check: `
          pkg="$(cat "$HOME/.pacote" 2>/dev/null)"
          [ -n "$pkg" ] || cai "ambiente sem seed — chame um monitor"
          command -v "$pkg" >/dev/null 2>&1 || dpkg -s "$pkg" >/dev/null 2>&1 \
            || cai "o seu pacote é '$pkg' — sudo apt install -y $pkg"` },
      // adesivo: passa enquanto a app está no ar. Depois que a pessoa mata (c3),
      // este critério continua verde porque já foi premiado — ver `avaliar()`.
      { id: 'm5-c2', xp: 80, descricao: 'app.js rodando em background (com &)', check: `
          # casa o caminho completo, não o usuário: funciona tanto com contas
          # reais (su - alunoNN) quanto no modo local de desenvolvimento
          pgrep -f "$HOME/app/app.js" >/dev/null || cai "a app não está rodando — rode: node app/app.js &"
          mkdir -p "$HOME/.arena" && touch "$HOME/.arena/rodou"` },
      { id: 'm5-c3', xp: 120, descricao: 'Você matou a app depois (nada de node no ar)', check: `
          [ -f "$HOME/.arena/rodou" ] || cai "primeiro deixe a app rodando em background"
          pgrep -f "$HOME/app/app.js" >/dev/null && cai "ela ainda está no ar: ache o PID com ps aux | grep node e use kill"
          exit 0` },
    ],
  },

  // ───────────────────────────── boss (grupo) ───────────────────────────────
  'boss-chamado': {
    titulo: 'O Chamado',
    escopo: 'grupo',
    seed: 'boss.sh',
    solve: 'boss.sh',
    dicas: [
      'O log não está na sua casa. `find /srv/chamado -name "*.log"`.',
      'O processo travado aparece no topo do `top` — ou em `ps aux --sort=-pcpu | head`.',
    ],
    criterios: [
      { id: 'b-c1', xp: 150, papel: 'investigador', tipo: 'resposta',
        descricao: 'Investigador: qual é a mensagem de erro do log?', check: `
          esperado="$(grep -m1 FATAL "$DIR_GRUPO/log/relatorio.log" | sed 's/.*FATAL //')"
          echo "$RESPOSTA" | grep -qiF "$esperado" || cai "ache a linha FATAL no log do grupo (grep FATAL)"` },
      { id: 'b-c2', xp: 150, papel: 'operador',
        descricao: 'Operador: o processo travado foi morto', check: `
          pgrep -f "arena-travado-$GRUPO" >/dev/null && cai "ele ainda está vivo — ache o PID e use kill"
          exit 0` },
      { id: 'b-c3', xp: 150, papel: 'mecanico',
        descricao: 'Mecânico: backup.sh executável e executado', check: `
          f="$DIR_GRUPO/backup.sh"
          [ -f "$f" ] || cai "não achei o backup.sh no diretório do grupo"
          [ -x "$f" ] || cai "ele existe mas não roda: ls -l mostra que falta o x — chmod +x"
          [ -f "$DIR_GRUPO/backup.ok" ] || cai "agora rode: ./backup.sh"` },
      { id: 'b-c4', xp: 250, papel: 'relator',
        descricao: 'Relator: laudo.txt com grupo, contagem de ERROR e o PID morto', check: `
          l="$DIR_GRUPO/laudo.txt"
          [ -f "$l" ] || cai "crie o laudo.txt no diretório do grupo"
          grep -qi "$GRUPO" "$l" || cai "o laudo precisa dizer qual é o grupo"
          n="$(grep -c ERROR "$DIR_GRUPO/log/relatorio.log")"
          grep -q "$n" "$l" || cai "o laudo precisa da contagem de ERROR do log (grep -c ERROR)"
          grep -qE '[0-9]{2,}' "$l" || cai "o laudo precisa do PID do processo que vocês mataram"` },
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
