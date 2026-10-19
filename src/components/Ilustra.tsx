'use client';

/**
 * Ilustrações coloridas do deck.
 *
 * São arquivos SVG próprios, extraídos do Noto (MIT/OFL) por
 * `scripts/extrair-ilustracoes.mjs` e versionados em public/ilustra. Dois
 * motivos para não depender do emoji do sistema: o desenho fica igual em
 * qualquer máquina (o seu Mac, o notebook Windows da pessoa e o projetor), e
 * nada é baixado da internet, que no dia do evento não existe.
 *
 * Vetor, então ampliar não perde nada: a mesma ilustração serve ao crachá de
 * 20px e à capa de módulo de 160px no projetor.
 */
export type NomeIlustra =
  | 'pinguim' | 'computador' | 'servidor' | 'terminal' | 'arvore' | 'casa'
  | 'pasta' | 'pasta-aberta' | 'arquivo' | 'lupa' | 'cadeado' | 'cadeado-aberto'
  | 'chave' | 'lixeira' | 'bomba' | 'caveira' | 'alerta' | 'alarme' | 'ideia'
  | 'foguete' | 'engrenagem' | 'ferramenta' | 'elo' | 'pacote' | 'loja'
  | 'cronometro' | 'trofeu' | 'medalha' | 'moeda' | 'mapa' | 'bussola' | 'porta'
  | 'extintor' | 'bandeira' | 'detetive' | 'pessoas' | 'aperto-de-mao' | 'festa'
  | 'estrela' | 'certo' | 'errado' | 'livro' | 'grafico' | 'robo' | 'celular'
  | 'raiz' | 'fogo' | 'gato' | 'vaca' | 'relogio' | 'coracao';

export function Ilustra({
  nome, tamanho = 32, titulo, style,
}: { nome: NomeIlustra; tamanho?: number | string; titulo?: string; style?: React.CSSProperties }) {
  const lado = typeof tamanho === 'number' ? `${tamanho}px` : tamanho;
  return (
    <img
      src={`/ilustra/${nome}.svg`}
      alt={titulo ?? ''}
      aria-hidden={titulo ? undefined : true}
      width={lado}
      height={lado}
      style={{ width: lado, height: lado, flex: 'none', display: 'block', ...style }}
      draggable={false}
    />
  );
}

/** Ilustração grande em cima de um fundo suave: abre módulo e dá imagem à memória. */
export function IlustraDestaque({ nome, titulo }: { nome: NomeIlustra; titulo?: string }) {
  return (
    <div
      style={{
        width: 'clamp(84px, 11vw, 148px)', aspectRatio: '1',
        borderRadius: 'var(--r-g)', display: 'grid', placeItems: 'center',
        background: 'var(--papel-2)', border: '1px solid var(--borda)', flex: 'none',
        padding: 'var(--e3)',
      }}
    >
      <Ilustra nome={nome} tamanho="100%" titulo={titulo} />
    </div>
  );
}
