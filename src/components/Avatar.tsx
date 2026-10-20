/**
 * O rosto da pessoa: a foto que ela enviou, ou o bicho que escolheu.
 * A foto vem por endereço (/foto/<id>?v=<versão>) e não dentro do placar.
 */
export function Avatar({ pessoa, tamanho = 24 }: { pessoa: { emoji: string; foto?: string | null; nick?: string }; tamanho?: number }) {
  if (pessoa.foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={pessoa.foto} alt={pessoa.nick ? `foto de ${pessoa.nick}` : ''} width={tamanho} height={tamanho}
        style={{ width: tamanho, height: tamanho, borderRadius: '50%', objectFit: 'cover', display: 'inline-block', verticalAlign: 'middle', flex: 'none' }} />
    );
  }
  return <span style={{ fontSize: tamanho * 0.85, lineHeight: 1, display: 'inline-block', verticalAlign: 'middle' }} aria-hidden>{pessoa.emoji}</span>;
}
