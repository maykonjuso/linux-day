/**
 * Prepara a foto no navegador, antes de enviar: confere o limite, corta o
 * quadrado do meio e reduz para 256×256.
 *
 * O limite de 2 MB vale para o arquivo escolhido. Reduzir aqui é o que deixa a
 * foto leve no projetor e no celular de todo mundo; uma foto de celular tem
 * 4 MB e 4000 px, e seria desenhada em 40 px.
 */
export const LIMITE_DO_ARQUIVO = 2 * 1024 * 1024;
export const LADO_DA_FOTO = 256;
const TIPOS = ['image/png', 'image/jpeg', 'image/webp'];

export async function prepararFoto(arquivo: File): Promise<{ dataUrl: string } | { erro: string }> {
  if (!TIPOS.includes(arquivo.type)) return { erro: 'escolha uma imagem PNG, JPG ou WebP' };
  if (arquivo.size > LIMITE_DO_ARQUIVO) {
    return { erro: `a imagem tem ${(arquivo.size / 1024 / 1024).toFixed(1)} MB, e o limite é 2 MB` };
  }
  let imagem: ImageBitmap;
  try { imagem = await createImageBitmap(arquivo); } catch { return { erro: 'não consegui abrir essa imagem' }; }

  const lado = Math.min(imagem.width, imagem.height);
  const tela = document.createElement('canvas');
  tela.width = LADO_DA_FOTO;
  tela.height = LADO_DA_FOTO;
  const ctx = tela.getContext('2d');
  if (!ctx) return { erro: 'este navegador não consegue reduzir a imagem' };
  ctx.drawImage(imagem, (imagem.width - lado) / 2, (imagem.height - lado) / 2, lado, lado, 0, 0, LADO_DA_FOTO, LADO_DA_FOTO);
  imagem.close();

  // WebP quando o navegador sabe gerar (Safari antigo devolve PNG no lugar)
  const webp = tela.toDataURL('image/webp', 0.85);
  return { dataUrl: webp.startsWith('data:image/webp') ? webp : tela.toDataURL('image/jpeg', 0.85) };
}
