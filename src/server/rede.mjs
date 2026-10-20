/**
 * Em que endereço a turma encontra o servidor.
 *
 * Serve à página /ip (projetada no começo, com o QR code) e ao banner do boot.
 */
import { networkInterfaces } from 'node:os';
import { readFileSync } from 'node:fs';

/** IPv4 de rede (sem o localhost), com as interfaces de cabo e Wi-Fi primeiro */
export function enderecosDaRede(interfaces = networkInterfaces()) {
  const virtual = /^(docker|br-|veth|virbr|vmnet|utun|lo|tailscale|zt)/;
  return Object.entries(interfaces)
    .flatMap(([nome, lista]) => (lista ?? [])
      .filter((i) => (i.family === 'IPv4' || i.family === 4) && !i.internal)
      .map((i) => ({ interface: nome, ip: i.address, virtual: virtual.test(nome) })))
    .sort((a, b) => Number(a.virtual) - Number(b.virtual));
}

/**
 * No WSL o IP que o Linux vê (172.x) é de uma rede interna do Windows: outro
 * computador da sala não chega nele sem encaminhar a porta no Windows. Melhor
 * a página dizer isso do que a turma inteira ficar olhando "não carrega".
 */
export function rodandoNoWsl(lerVersao = () => readFileSync('/proc/version', 'utf8')) {
  try { return /microsoft/i.test(lerVersao()); } catch { return false; }
}

export function descreverRede({ porta, interfaces, lerVersao } = {}) {
  const enderecos = enderecosDaRede(interfaces);
  return {
    porta,
    enderecos: enderecos.map((e) => ({ ...e, url: `http://${e.ip}:${porta}` })),
    principal: enderecos[0] ? `http://${enderecos[0].ip}:${porta}` : null,
    wsl: rodandoNoWsl(lerVersao),
  };
}
