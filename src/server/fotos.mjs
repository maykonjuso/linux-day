/**
 * A foto que a pessoa envia do próprio computador.
 *
 * O navegador já corta em quadrado e reduz para 256×256 antes de enviar
 * (src/deck/foto.ts), então o que chega aqui tem dezenas de KB. O teto do
 * servidor é folgado por isso, e existe porque o cliente não é confiável:
 * sem ele, qualquer um mandaria 50 MB pelo socket.
 */
export const TETO_DA_FOTO = 256 * 1024;

const ASSINATURAS = {
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/webp': (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
};

/**
 * Confere o data URL e devolve os bytes, ou o motivo da recusa.
 * O tipo declarado tem que bater com os primeiros bytes: um SVG ou um HTML
 * renomeado para .png não passa (SVG carrega script, e a foto é servida a
 * todas as telas).
 */
export function validarFoto(dataUrl) {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl ?? ''));
  if (!m) return { erro: 'a foto precisa ser PNG, JPG ou WebP' };
  const [, mime, b64] = m;
  if (b64.length > Math.ceil(TETO_DA_FOTO / 3) * 4 + 4) return { erro: 'a foto passou do limite depois de reduzida' };
  const dados = Buffer.from(b64, 'base64');
  if (dados.length > TETO_DA_FOTO) return { erro: 'a foto passou do limite depois de reduzida' };
  if (!ASSINATURAS[mime](dados)) return { erro: 'o arquivo não é a imagem que diz ser' };
  return { mime, dados };
}
