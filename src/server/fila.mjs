/**
 * Fila com concorrência limitada. Existe por um motivo concreto: quando 30
 * pessoas clicam "Verificar" ao mesmo tempo, 30 × 6 critérios = 180 processos
 * — e o Mac que está apresentando derrete. Com 6 em paralelo, ninguém percebe
 * a diferença e a máquina continua inteira.
 */
export function criarFila(limite = 6) {
  let rodando = 0;
  const espera = [];

  const proximo = () => {
    if (rodando >= limite || espera.length === 0) return;
    rodando++;
    const { tarefa, ok, falha } = espera.shift();
    tarefa().then(ok, falha).finally(() => { rodando--; proximo(); });
  };

  return {
    adicionar(tarefa) {
      return new Promise((ok, falha) => { espera.push({ tarefa, ok, falha }); proximo(); });
    },
    get tamanho() { return espera.length + rodando; },
  };
}
