/**
 * O que cada comando faz e como usar, em uma linha cada.
 *
 * Aparece onde a pessoa precisa lembrar NA HORA: na lista "comandos deste
 * módulo" do laboratório e no fecho de cada módulo. Só o nome do comando não
 * ajuda quem viu ele uma vez, dez minutos atrás; o nome com um exemplo pronto
 * para adaptar ajuda.
 *
 * A chave é exatamente o texto usado em `comandosDoModulo` e `resumo` no
 * deck. O teste `npm run teste:tempo` reprova o deck se algum comando listado
 * ali ficar sem explicação aqui.
 */
export const COMANDOS: Record<string, { faz: string; exemplo?: string }> = {
  // navegação
  'pwd': { faz: 'mostra em que pasta você está', exemplo: 'pwd' },
  'ls': { faz: 'lista o que tem na pasta', exemplo: 'ls' },
  'ls -la': { faz: 'lista tudo, inclusive os escondidos (nome com ponto)', exemplo: 'ls -la' },
  'cd': { faz: 'entra numa pasta', exemplo: 'cd projetos' },
  'cd ..': { faz: 'sobe uma pasta (volta um nível)', exemplo: 'cd ..' },
  'cat': { faz: 'mostra o conteúdo de um arquivo', exemplo: 'cat flag.txt' },
  'Tab': { faz: 'completa o nome do arquivo ou da pasta', exemplo: 'cd pro + Tab' },
  '↑': { faz: 'traz de volta o comando anterior' },
  '--help': { faz: 'mostra a ajuda de qualquer comando', exemplo: 'ls --help' },
  'q': { faz: 'sai do manual ou de um texto longo' },
  'Ctrl+C': { faz: 'interrompe o programa que está rodando' },
  ':q!': { faz: 'sai do vim sem salvar (aperte Esc antes)' },

  // arquivos
  'mkdir': { faz: 'cria uma pasta', exemplo: 'mkdir imagens' },
  'mkdir -p': { faz: 'cria o caminho inteiro de pastas', exemplo: 'mkdir -p projeto/src' },
  'touch': { faz: 'cria um arquivo vazio', exemplo: 'touch app.js' },
  'cp': { faz: 'copia (o original continua lá)', exemplo: 'cp notas.txt copia.txt' },
  'mv': { faz: 'move ou renomeia', exemplo: 'mv rascunho.txt docs/notas.md' },
  '*': { faz: 'coringa: "qualquer coisa" no nome', exemplo: 'mv *.png imagens/' },
  'rm': { faz: 'apaga um arquivo, sem lixeira', exemplo: 'rm tmp_*' },
  'rm -r': { faz: 'apaga uma pasta e tudo dentro', exemplo: 'rm -r pasta' },
  'echo >': { faz: 'grava um texto num arquivo (apaga o que tinha)', exemplo: 'echo "oi" > README.md' },
  '>': { faz: 'grava a saída num arquivo (apaga o que tinha)', exemplo: 'grep FATAL app.log > fatais.txt' },
  '>>': { faz: 'acrescenta no fim do arquivo, sem apagar', exemplo: 'echo "mais" >> notas.txt' },
  'nano': { faz: 'editor simples: Ctrl+O grava, Ctrl+X sai', exemplo: 'nano notas.txt' },

  // permissões
  'ls -l': { faz: 'mostra as permissões no começo da linha', exemplo: 'ls -l deploy.sh' },
  "echo '...' >": { faz: 'cria o script com a 1ª linha', exemplo: "echo '#!/bin/bash' > deploy.sh" },
  '#!/bin/bash': { faz: '1ª linha de um script: diz quem executa ele' },
  'chmod +x': { faz: 'deixa o arquivo executável', exemplo: 'chmod +x deploy.sh' },
  'chmod 644': { faz: 'todos leem, só o dono escreve', exemplo: 'chmod 644 relatorio.txt' },
  './deploy.sh': { faz: 'executa o script desta pasta', exemplo: './deploy.sh' },
  './script.sh': { faz: 'executa um script desta pasta', exemplo: './deploy.sh' },
  'sudo': { faz: 'roda o comando como administrador', exemplo: 'sudo apt update' },

  // busca e pipes
  'grep': { faz: 'mostra só as linhas que têm a palavra', exemplo: 'grep ERROR app.log' },
  'grep -c': { faz: 'conta as linhas que têm a palavra', exemplo: 'grep -c ERROR app.log' },
  'grep -n': { faz: 'mostra também o número da linha', exemplo: 'grep -n FATAL app.log' },
  'find': { faz: 'procura arquivos pelo nome', exemplo: 'find ~ -name "*.log"' },
  'find -name': { faz: 'procura arquivos pelo nome', exemplo: 'find ~ -name config.yml' },
  '|': { faz: 'liga a saída de um comando na entrada do próximo', exemplo: 'grep ERROR app.log | head -3' },
  'cut -d" " -f3': { faz: 'pega o 3º pedaço de cada linha (separado por espaço)', exemplo: 'cut -d" " -f3 app.log' },
  'cut': { faz: 'pega um pedaço (coluna) de cada linha', exemplo: 'cut -d" " -f3 app.log' },
  'sort': { faz: 'põe as linhas em ordem', exemplo: '... | sort' },
  'uniq -c': { faz: 'conta linhas repetidas (use depois do sort)', exemplo: '... | sort | uniq -c' },
  'sort -rn': { faz: 'ordena números do maior para o menor', exemplo: '... | uniq -c | sort -rn' },
  'head': { faz: 'mostra só as primeiras linhas', exemplo: '... | head -3' },
  'wc -l': { faz: 'conta as linhas', exemplo: 'wc -l app.log' },
  '&&': { faz: 'roda o 2º comando se o 1º der certo', exemplo: 'mkdir corrida && cd corrida' },

  // programas e processos
  'cat ~/.pacote': { faz: 'mostra qual programa você deve instalar', exemplo: 'cat ~/.pacote' },
  'sudo apt install -y': { faz: 'instala um programa da loja oficial', exemplo: 'sudo apt install -y htop' },
  'apt install': { faz: 'instala um programa (com sudo)', exemplo: 'sudo apt install -y htop' },
  'htop': { faz: 'mostra os programas rodando (sai com q)', exemplo: 'htop' },
  'node app/app.js &': { faz: 'roda a app em segundo plano e devolve o prompt', exemplo: 'node app/app.js &' },
  '&': { faz: 'no fim do comando: roda em segundo plano', exemplo: 'node app/app.js &' },
  'ps aux': { faz: 'lista todos os processos (a 2ª coluna é o PID)', exemplo: 'ps aux | grep app.js' },
  'ps aux | grep': { faz: 'acha o PID de um programa', exemplo: 'ps aux | grep app.js' },
  'kill': { faz: 'encerra um processo pelo PID', exemplo: 'kill 4822' },
  'kill -9': { faz: 'força o encerramento', exemplo: 'kill -9 4822' },
  'which': { faz: 'mostra onde o programa está instalado', exemplo: 'which htop' },
};
