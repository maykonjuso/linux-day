'use client';

import { useState } from 'react';

/**
 * Quatro widgets que compartilham a mesma mecânica (escolher entre opções com
 * feedback imediato) e por isso compartilham um componente:
 *   escape-room      → qual tecla te salva desta tela
 *   spot-the-danger  → qual destes comandos destrói algo
 *   predict-output   → o que este comando vai fazer
 *   error-match      → qual é a causa desta mensagem de erro
 *
 * Contrato: errar não dói (dá para tentar de novo na hora), feedback no mesmo
 * lugar da ação, e a explicação aparece sempre — inclusive quando acerta.
 */
export interface Rodada {
  contexto: string;          // o que está na tela / a mensagem / o comando
  pergunta: string;
  opcoes: { texto: string; certo?: boolean; porque: string }[];
  mono?: boolean;            // mostra o contexto como terminal
}

export function Escolhas({ rodadas, onConcluir }: { rodadas: Rodada[]; onConcluir?: () => void }) {
  const [i, setI] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const r = rodadas[i];

  if (!r) return <div className="cartao" style={{ color: 'var(--ok)' }}>✅ {rodadas.length} de {rodadas.length}. Próximo.</div>;

  const op = escolha !== null ? r.opcoes[escolha] : null;

  return (
    <div className="grade" style={{ gap: 16 }}>
      <div className="olho">{i + 1} de {rodadas.length}</div>
      {r.mono
        ? <div className="term" style={{ fontSize: 'clamp(15px, 1.6vw, 24px)' }}>{r.contexto}</div>
        : <p className="corpo" style={{ maxWidth: '44em' }}>{r.contexto}</p>}
      <strong style={{ fontSize: 'clamp(17px, 1.8vw, 26px)' }}>{r.pergunta}</strong>

      <div className="alternativas">
        {r.opcoes.map((o, j) => (
          <button key={o.texto} className="alt"
            data-estado={escolha === null ? undefined : o.certo ? 'certa' : j === escolha ? 'errada' : undefined}
            onClick={() => setEscolha(j)}
            style={{ fontFamily: o.texto.length < 22 ? 'var(--mono)' : 'var(--sans)' }}>
            <span className="letra">{String.fromCharCode(65 + j)}</span>
            <span style={{ flex: 1 }}>{o.texto}</span>
          </button>
        ))}
      </div>

      {op && (
        <div className="cartao" style={{ borderColor: op.certo ? 'var(--ok)' : 'var(--atencao)', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>{op.certo ? '✅' : '↩︎'} {op.porque}</span>
          {op.certo ? (
            <button className="btn primario" style={{ marginLeft: 'auto' }}
              onClick={() => { setEscolha(null); if (i + 1 < rodadas.length) setI(i + 1); else { setI(rodadas.length); onConcluir?.(); } }}>
              {i + 1 < rodadas.length ? 'próxima' : 'concluir'}
            </button>
          ) : (
            <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => setEscolha(null)}>tentar de novo</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── os bancos de rodadas ──────────────────────────

/** O kit de fuga: o conteúdo que mais destrava gente de verdade. */
export const ESCAPE: Rodada[] = [
  {
    mono: true, contexto: 'LS(1)                    User Commands\n\nNAME\n     ls - list directory contents\n\n:',
    pergunta: 'Essa tela não fecha. Qual tecla te salva?',
    opcoes: [
      { texto: 'q', certo: true, porque: 'q sai do man e do less. É a tecla que mais gente não conhece.' },
      { texto: 'Ctrl+C', porque: 'não faz nada aqui: o man não está "rodando", está exibindo.' },
      { texto: 'Esc', porque: 'não sai do man.' },
      { texto: 'fechar o terminal', porque: 'funciona, mas você perde a sessão sem precisar.' },
    ],
  },
  {
    mono: true, contexto: '~\n~\n~\n"arquivo.txt" [New]                      0,0-1',
    pergunta: 'Você abriu o vim sem querer. Como sai sem salvar?',
    opcoes: [
      { texto: 'Esc depois :q!', certo: true, porque: 'Esc sai do modo de inserção, :q! sai sem salvar. Decore: é a pergunta mais famosa da internet.' },
      { texto: 'Ctrl+X', porque: 'isso é o nano, não o vim.' },
      { texto: 'q', porque: 'o vim só entende q depois dos dois pontos.' },
      { texto: 'Ctrl+C', porque: 'ele avisa que não é assim que se sai.' },
    ],
  },
  {
    mono: true, contexto: '$ node app.js\napp no ar na porta 3000\n█',
    pergunta: 'O prompt não volta. O que aconteceu?',
    opcoes: [
      { texto: 'Está ocupado: Ctrl+C interrompe', certo: true, porque: 'não travou, está rodando. O Ctrl+C interrompe e devolve o prompt.' },
      { texto: 'O terminal travou, preciso fechar', porque: 'ele está ocupado, não travado. Essa confusão trava muita gente.' },
      { texto: 'O comando falhou', porque: 'ele imprimiu que está no ar: funcionou.' },
      { texto: 'Preciso reiniciar a máquina', porque: 'nunca precisa.' },
    ],
  },
];

export const PERIGO: Rodada[] = [
  {
    contexto: 'Quatro comandos parecidos. Um deles apaga coisas que você nunca mais recupera. No terminal não existe lixeira.',
    pergunta: 'Qual é o perigoso?',
    opcoes: [
      { texto: 'rm -rf ~', certo: true, porque: 'apaga a SUA CASA inteira, sem confirmar e sem volta. É o par de letras que você relê antes do Enter.' },
      { texto: 'rm -i *.log', porque: 'o -i pergunta antes de cada arquivo. É o modo covarde, e covarde é bom.' },
      { texto: 'rm tmp_*', porque: 'apaga só o que começa com tmp_.' },
      { texto: 'rm -r ~/tmp', porque: 'apaga uma pasta específica sua. Ruim se errar, mas limitado.' },
    ],
  },
  {
    contexto: 'Você está em /home/aluno/projeto e quer apagar a pasta build.',
    pergunta: 'Qual comando é seguro?',
    opcoes: [
      { texto: 'rm -r build', certo: true, porque: 'caminho relativo, dentro de onde você está. Confira com pwd antes.' },
      { texto: 'rm -rf /build', porque: 'a barra inicial aponta para a raiz do sistema, não para a sua pasta.' },
      { texto: 'sudo rm -rf build', porque: 'funciona, mas o sudo aqui é força desnecessária. É juntando sudo com rm -rf que as máquinas morrem.' },
      { texto: 'rm build', porque: 'dá erro: é uma pasta, falta o -r.' },
    ],
  },
];

export const PREVER: Rodada[] = [
  {
    mono: true, contexto: '$ node app.js',
    pergunta: 'O que acontece?',
    opcoes: [
      { texto: 'A app roda e o prompt NÃO volta', certo: true, porque: 'ela ficou em primeiro plano, presa ao seu terminal. Fechou o terminal, morreu.' },
      { texto: 'A app roda e o prompt volta', porque: 'isso só com & no fim.' },
      { texto: 'Dá erro', porque: 'o arquivo existe.' },
    ],
  },
  {
    mono: true, contexto: '$ node app.js &',
    pergunta: 'E agora?',
    opcoes: [
      { texto: 'O prompt volta e aparece um número', certo: true, porque: 'o & solta o processo. O número é o PID, e é por ele que você encerra depois.' },
      { texto: 'Nada muda', porque: 'o & muda tudo: é o que libera o seu terminal.' },
      { texto: 'A app não sobe', porque: 'sobe, só não prende o terminal.' },
    ],
  },
  {
    mono: true, contexto: '$ ls -la',
    pergunta: 'O que aparece a mais, comparado com ls?',
    opcoes: [
      { texto: 'Arquivos escondidos, permissões e dono', certo: true, porque: '-l dá a lista longa (permissões, dono, tamanho) e -a inclui os que começam com ponto.' },
      { texto: 'Só as pastas', porque: 'isso não é o que -la faz.' },
      { texto: 'O conteúdo dos arquivos', porque: 'para ver conteúdo é cat ou less.' },
    ],
  },
];

export const ERROS: Rodada[] = [
  {
    mono: true, contexto: 'bash: cd: docs: No such file or directory',
    pergunta: 'Qual é a causa mais provável?',
    opcoes: [
      { texto: 'Você está em outro diretório', certo: true, porque: 'o caminho é relativo a onde você está. Reflexo: pwd e depois ls -la.' },
      { texto: 'Falta sudo', porque: 'não é permissão: o sistema diz que o caminho não existe.' },
      { texto: 'O comando cd não existe', porque: 'ele existe; a mensagem vem dele.' },
    ],
  },
  {
    mono: true, contexto: 'bash: ./deploy.sh: Permission denied',
    pergunta: 'E essa?',
    opcoes: [
      { texto: 'Falta permissão de execução: chmod +x', certo: true, porque: 'o arquivo existe e você pode lê-lo, mas ninguém marcou que ele é executável.' },
      { texto: 'O arquivo não existe', porque: 'se não existisse, a mensagem seria No such file.' },
      { texto: 'Falta instalar o bash', porque: 'o bash está rodando. Foi ele que reclamou.' },
    ],
  },
  {
    mono: true, contexto: 'bash: htop: command not found',
    pergunta: 'E essa?',
    opcoes: [
      { texto: 'O programa não está instalado nesta máquina', certo: true, porque: 'ou é erro de digitação. Instale com sudo apt install htop.' },
      { texto: 'Falta permissão', porque: 'permissão daria Permission denied.' },
      { texto: 'O htop está rodando', porque: 'nada está rodando: o shell não achou o programa.' },
    ],
  },
];
