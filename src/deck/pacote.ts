/**
 * O pacote de sobrevivência: ~40 comandos organizados **por situação**, não
 * por tema. Iniciante não pensa "preciso de grep"; pensa "preciso achar onde
 * está escrito isso". O cheatsheet impresso tem exatamente esta estrutura.
 *
 * Fonte: docs/plano-workshop.md §4.
 */
export const PACOTE: { situacao: string; itens: string[] }[] = [
  { situacao: 'Onde eu estou? O que tem aqui?', itens: ['pwd', 'ls', 'ls -la', 'cd pasta', 'cd ..', 'cd ~', 'tree'] },
  { situacao: 'Quero ver o que tem dentro do arquivo', itens: ['cat arquivo', 'less arquivo  (sai com q)', 'head -5', 'tail -5', 'wc -l'] },
  { situacao: 'Quero criar, copiar, renomear, apagar', itens: ['mkdir -p pasta', 'touch arquivo', 'cp a b', 'mv a b  (renomear = mover)', 'rm arquivo', 'rm -r pasta'] },
  { situacao: 'Quero fazer isso com vários arquivos de uma vez', itens: ['*.txt', 'tmp_*', 'mv *.png imagens/'] },
  { situacao: 'Quero editar um arquivo', itens: ['nano arquivo', 'Ctrl+O grava', 'Ctrl+X sai'] },
  { situacao: 'Deu "permission denied"', itens: ['ls -l arquivo', 'whoami', 'id', 'chmod +x script.sh', 'chmod 644 texto.txt', 'sudo comando  (a senha não aparece!)'] },
  { situacao: 'Preciso achar uma coisa', itens: ['find . -name "nome"', 'grep -rn "texto" .', 'grep -c "texto" arquivo', 'which programa'] },
  { situacao: 'Quero juntar comandos / salvar o resultado', itens: ['comando1 | comando2', '> arquivo  (sobrescreve)', '>> arquivo  (acrescenta)', 'sort', 'uniq -c', 'cut -d" " -f3'] },
  { situacao: 'Quero rodar um comando depois do outro', itens: ['a ; b  (os dois)', 'a && b  (b só se a der certo)'] },
  { situacao: 'Algo travou / o que está rodando?', itens: ['Ctrl+C interrompe', 'ps aux | grep nome', 'top  (sai com q)', 'kill PID', 'kill -9 PID', 'comando &', 'jobs'] },
  { situacao: 'Preciso instalar um programa', itens: ['sudo apt update', 'sudo apt install -y nome', 'apt search nome'] },
  { situacao: 'Errei o começo de um comando enorme', itens: ['Ctrl+A início', 'Ctrl+E fim', 'Ctrl+W apaga palavra', 'Ctrl+U apaga a linha'] },
  { situacao: 'Não sei o comando / esqueci a sintaxe', itens: ['Tab completa', '↑ repete', 'Ctrl+R busca no histórico', 'history', 'comando --help', 'man comando', 'tldr comando'] },
  { situacao: 'Socorro, não consigo SAIR disso', itens: ['q  (less, man, top)', 'Ctrl+C  (programa rodando)', 'Esc :q!  (vim)', 'Ctrl+D  (fecha o shell)', 'Ctrl+L limpa a tela'] },
  { situacao: 'Quero deixar o terminal do meu jeito', itens: ["alias ll='ls -la'", 'nano ~/.bashrc', 'source ~/.bashrc'] },
];

export const HABITOS = [
  { titulo: 'Leia a mensagem de erro', porque: 'ela quase sempre diz exatamente o que está errado. São seis mensagens que se repetem para sempre.' },
  { titulo: 'Perdido? pwd e ls -la', porque: 'nessa ordem, sempre. Resolve metade dos problemas de iniciante.' },
  { titulo: 'Use Tab', porque: 'é mais rápido, e se o Tab não completa é porque o caminho não existe. Um teste de erro de graça.' },
  { titulo: '--help antes de perguntar', porque: 'responde mais rápido que qualquer colega.' },
  { titulo: 'Pare antes de rm -r e de sudo', porque: 'são os dois comandos que fazem estrago de verdade. Reler antes do Enter é hábito, não medo.' },
  { titulo: 'Comando colado que você não entende é dívida', porque: 'decomponha (programa → subcomando → flag → argumento) ou não cole.' },
];

export const ARMADILHAS = [
  { o: 'A senha do sudo não aparece enquanto você digita', nem: 'nem asterisco. Seu teclado está funcionando: digite e dê Enter.' },
  { o: 'Ctrl+C no terminal não copia', nem: 'interrompe o programa. Copiar é Ctrl+Shift+C, colar é Ctrl+Shift+V.' },
  { o: 'Maiúscula importa e espaço no nome quebra o comando', nem: 'Docs ≠ docs; use "meu arquivo.txt" com aspas.' },
];

export const ECONOMIA = [
  { fonte: 'Quiz (história + relâmpago)', detalhe: '40 XP por acerto + até 30 por velocidade', total: '910' },
  { fonte: 'Widgets (9 exercícios no slide)', detalhe: '90 XP cada', total: '810' },
  { fonte: 'Jogos de equipe', detalhe: 'corrida e caça ao erro: 450/300/210/140 por posição; passa ou repassa: 300', total: '~1.500' },
  { fonte: 'Roleta', detalhe: '300 XP para quem tem menos XP, 200 no meio, 120 para quem tem mais', total: 'sorteio' },
  { fonte: 'Labs no terminal (M1 a M5)', detalhe: 'XP por critério, com pontos parciais', total: '1.220' },
  { fonte: 'Boss "O Chamado" (grupo)', detalhe: '4 defeitos, 1 por carta de função', total: '700' },
  { fonte: 'Extras', detalhe: 'check-in, predições, diagnósticos, mentoria, desafios bônus', total: '~300' },
];
