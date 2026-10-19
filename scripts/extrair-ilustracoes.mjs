/**
 * Extrai as ilustrações que o deck usa do pacote @svgmoji/noto.
 *
 * O pacote traz um sprite único de 26 MB. Servir isso para 30 notebooks numa
 * rede local seria desperdício, então pegamos só os desenhos usados e gravamos
 * um arquivo por ilustração em public/ilustra. O resultado é versionado, e por
 * isso o pacote fica só como dependência de desenvolvimento: no dia do evento
 * nada é baixado.
 *
 * Rodar depois de acrescentar um nome novo em MAPA:  node scripts/extrair-ilustracoes.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/** nome usado no código → codepoint do emoji correspondente (Noto) */
export const MAPA = {
  pinguim: '1F427',
  computador: '1F4BB',
  servidor: '1F5A5',
  terminal: '2328',
  arvore: '1F333',
  casa: '1F3E0',
  pasta: '1F4C1',
  'pasta-aberta': '1F4C2',
  arquivo: '1F4C4',
  lupa: '1F50D',
  cadeado: '1F512',
  'cadeado-aberto': '1F513',
  chave: '1F511',
  lixeira: '1F5D1',
  bomba: '1F4A3',
  caveira: '1F480',
  alerta: '26A0',
  alarme: '1F6A8',
  ideia: '1F4A1',
  foguete: '1F680',
  engrenagem: '2699',
  ferramenta: '1F527',
  elo: '1F517',
  pacote: '1F4E6',
  loja: '1F3EA',
  cronometro: '23F1',
  trofeu: '1F3C6',
  medalha: '1F3C5',
  moeda: '1FA99',
  mapa: '1F5FA',
  bussola: '1F9ED',
  porta: '1F6AA',
  extintor: '1F9EF',
  bandeira: '1F3C1',
  detetive: '1F575',
  pessoas: '1F465',
  'aperto-de-mao': '1F91D',
  festa: '1F389',
  estrela: '2B50',
  certo: '2705',
  errado: '274C',
  livro: '1F4D6',
  grafico: '1F4CA',
  robo: '1F916',
  celular: '1F4F1',
  raiz: '1F331',
  fogo: '1F525',
  gato: '1F431',
  vaca: '1F42E',
  relogio: '1F550',
  coracao: '2764',
};

const SPRITE = resolve('node_modules/@svgmoji/noto/sprites/all.svg');
const DESTINO = resolve('public/ilustra');

const sprite = readFileSync(SPRITE, 'utf8');
mkdirSync(DESTINO, { recursive: true });

let feitos = 0;
const faltando = [];

for (const [nome, codigo] of Object.entries(MAPA)) {
  // o sprite guarda cada desenho como <svg id="CODEPOINT">…</svg>, e alguns
  // emojis vêm com o seletor de cor FE0F no id
  const candidatos = [codigo, `${codigo}-FE0F`];
  let svg = null;

  for (const id of candidatos) {
    const abre = sprite.indexOf(`id="${id}"`);
    if (abre === -1) continue;
    const inicio = sprite.lastIndexOf('<svg', abre);
    // acha o </svg> que fecha ESTE desenho, contando aberturas aninhadas
    let i = inicio, profundidade = 0, fim = -1;
    while (i < sprite.length) {
      const proximaAbertura = sprite.indexOf('<svg', i + 1);
      const proximoFecho = sprite.indexOf('</svg>', i + 1);
      if (proximoFecho === -1) break;
      if (proximaAbertura !== -1 && proximaAbertura < proximoFecho) { profundidade++; i = proximaAbertura; continue; }
      if (profundidade === 0) { fim = proximoFecho + 6; break; }
      profundidade--; i = proximoFecho;
    }
    if (fim === -1) continue;
    svg = sprite.slice(inicio, fim).replace(`id="${id}"`, 'role="img"');
    /*
     * Vários desenhos usam `xlink:href`, e o `xmlns:xlink` ficava declarado no
     * <svg> raiz do sprite. Sem ele no fragmento o arquivo é XML inválido e o
     * navegador mostra imagem quebrada, silenciosamente.
     */
    if (/xlink:/.test(svg) && !/xmlns:xlink/.test(svg)) {
      svg = svg.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
    }
    break;
  }

  if (!svg) { faltando.push(`${nome} (${codigo})`); continue; }
  writeFileSync(resolve(DESTINO, `${nome}.svg`), svg);
  feitos++;
}

console.log(`✅ ${feitos} ilustrações em public/ilustra`);
if (faltando.length) console.log(`⚠ não encontradas: ${faltando.join(', ')}`);
