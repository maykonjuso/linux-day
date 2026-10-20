/**
 * O chamado (boss do módulo 6) jogado com cartões de comando.
 *
 * Cada cargo tem a sua mão de cartões, e só quem tem a carta do cargo envia
 * os cartões dele (carta sem dono fica aberta para a equipe, como antes). Por
 * isso o chamado não tem terminal: com o terminal aberto qualquer um fazia
 * qualquer conserto e o cargo virava enfeite.
 *
 * Três tipos de cartão:
 *   - comando: roda na pasta da equipe e a saída aparece para a equipe toda;
 *   - com campo: o cartão tem uma lacuna (o PID, o texto do laudo) que a
 *     pessoa preenche. O valor vai por variável de ambiente, nunca colado no
 *     script, e passa por uma lista do que é aceito;
 *   - armadilha: parece resolver, mas causa outro problema. Não roda nada:
 *     devolve o porquê, que é a lição.
 */

export const CARTOES = [
  // ── Investigador: acha o que quebrou ──
  { id: 'inv-ls', papel: 'investigador', comando: 'ls log', script: 'ls log' },
  { id: 'inv-tail', papel: 'investigador', comando: 'tail -3 log/relatorio.log', script: 'tail -3 log/relatorio.log' },
  { id: 'inv-grep', papel: 'investigador', comando: 'grep FATAL log/relatorio.log', script: 'grep FATAL log/relatorio.log' },
  { id: 'inv-rm', papel: 'investigador', comando: 'rm log/relatorio.log', armadilha: 'apagar o log apaga a prova: o erro some da tela, mas o chamado fica sem explicação. Log se lê, não se apaga.' },

  // ── Operador: acha o processo que trava o servidor e encerra ──
  // o --sort é do Linux; no macOS (ensaio no modo local) quem ordena por CPU é o -r
  { id: 'op-ps', papel: 'operador', comando: 'ps aux --sort=-%cpu | head -5',
    script: 'if ps --version >/dev/null 2>&1; then ps aux --sort=-%cpu | head -5; else ps aux -r | head -5; fi' },
  { id: 'op-kill', papel: 'operador', comando: 'kill {PID}', campo: { nome: 'PID', tipo: 'pid', dica: 'o número da 2ª coluna do ps' },
    script: 'kill "$VALOR" && echo "processo $VALOR encerrado"' },
  { id: 'op-reboot', papel: 'operador', comando: 'sudo reboot', armadilha: 'reiniciar o servidor inteiro derruba todo mundo que estava usando, para matar um processo só. kill + PID resolve sem tirar ninguém do ar.' },

  // ── Mecânico: faz o backup rodar ──
  { id: 'mec-ls', papel: 'mecanico', comando: 'ls -l backup.sh', script: 'ls -l backup.sh' },
  { id: 'mec-chmod', papel: 'mecanico', comando: 'chmod +x backup.sh', script: 'chmod +x backup.sh && ls -l backup.sh' },
  { id: 'mec-rodar', papel: 'mecanico', comando: './backup.sh', script: './backup.sh' },
  { id: 'mec-777', papel: 'mecanico', comando: 'chmod 777 backup.sh', armadilha: '777 deixa qualquer pessoa da máquina ESCREVER no script de backup: resolve o sintoma e abre um buraco. Só falta o x: chmod +x.' },

  // ── Relator: documenta o conserto ──
  { id: 'rel-contar', papel: 'relator', comando: 'grep -c ERROR log/relatorio.log', script: 'grep -c ERROR log/relatorio.log' },
  { id: 'rel-laudo', papel: 'relator', comando: 'echo "{TEXTO}" > laudo.txt', campo: { nome: 'TEXTO', tipo: 'texto', dica: 'equipe, quantos ERROR e o PID encerrado' },
    script: 'printf "%s\\n" "$VALOR" > laudo.txt && echo "laudo.txt gravado"' },
  { id: 'rel-cat', papel: 'relator', comando: 'cat laudo.txt', script: 'cat laudo.txt' },
  { id: 'rel-motd', papel: 'relator', comando: 'echo "{TEXTO}" > /etc/motd', armadilha: '/etc/motd é a mensagem que TODO usuário vê ao entrar, e não é lugar de laudo. O laudo vai na pasta da equipe: laudo.txt.' },
];

export const cartaoDe = (id) => CARTOES.find((c) => c.id === id) ?? null;

/** os cartões que esta pessoa pode enviar: os do cargo dela e os dos cargos sem dono */
export function cartoesLiberados({ meuPapel, papeisDaEquipe }) {
  const comDono = new Set(Object.values(papeisDaEquipe ?? {}));
  return CARTOES.filter((c) => c.papel === meuPapel || !comDono.has(c.papel));
}

/** o que pode ir num campo; o resto é recusado antes de qualquer coisa rodar */
const VALIDAR_CAMPO = {
  pid: (v) => (/^\d{1,7}$/.test(v) ? null : 'o PID é só o número, sem espaço nem letra'),
  texto: (v) => (v.length === 0 ? 'escreva o laudo'
    : v.length > 200 ? 'o laudo cabe em 200 caracteres'
    : /^[\p{L}\p{N} .,:;!?()\-_/#=+]+$/u.test(v) ? null
    : 'o laudo aceita letras, números e pontuação simples'),
};

/**
 * Decide o que fazer com um cartão enviado. Não roda nada: devolve o script e
 * o ambiente, a armadilha ou o motivo da recusa. Quem roda é o servidor.
 */
export function prepararCartao({ cartaoId, valor, meuPapel, papeisDaEquipe }) {
  const c = cartaoDe(cartaoId);
  if (!c) return { erro: 'esse cartão não existe' };
  const liberado = cartoesLiberados({ meuPapel, papeisDaEquipe }).some((x) => x.id === c.id);
  if (!liberado) return { erro: `esse cartão é do cargo ${c.papel}, e quem está com a carta envia` };
  if (c.armadilha) return { armadilha: c.armadilha, cartao: c };
  const texto = String(valor ?? '').trim();
  if (c.campo) {
    const problema = VALIDAR_CAMPO[c.campo.tipo](texto);
    if (problema) return { erro: problema };
  }
  const script = c.campo?.tipo === 'pid'
    // só o processo travado DESTA equipe: no modo local o kill roda com o
    // usuário do apresentador e derrubaria qualquer coisa, inclusive o servidor
    ? `grep -qa -- "arena-travado-$GRUPO" "/proc/$VALOR/cmdline" 2>/dev/null || ps -p "$VALOR" -o args= 2>/dev/null | grep -q -- "arena-travado-$GRUPO" || { echo "o PID $VALOR não é o processo que está travando o servidor. Confira a lista do ps"; exit 1; }
${c.script}`
    : c.script;
  return { script: `cd "$DIR_GRUPO" || exit 1\n${script}`, env: c.campo ? { VALOR: texto } : {}, cartao: c, exibir: c.campo ? c.comando.replace(`{${c.campo.nome}}`, texto) : c.comando };
}
