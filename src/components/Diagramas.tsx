'use client';

/**
 * Diagramas do deck, desenhados à mão em SVG.
 *
 * Nada de biblioteca de gráficos: estes desenhos precisam ser legíveis a dez
 * metros num projetor, funcionar em escala de cinza e caber na cena sem
 * sobrepor texto. Por isso cada rótulo tem posição calculada, com `viewBox`
 * folgada, e nenhum texto depende de medida de fonte para não colidir.
 */

const TRACO = { stroke: 'var(--tinta-2)', strokeWidth: 1.6, fill: 'none' } as const;
const CAIXA = { stroke: 'var(--tinta-2)', strokeWidth: 1.6, fill: 'var(--papel)' } as const;

function Seta() {
  return (
    <defs>
      <marker id="ponta" markerWidth="9" markerHeight="9" refX="7" refY="3.2" orient="auto">
        <path d="M0 0 L7 3.2 L0 6.4 z" fill="var(--tinta-2)" />
      </marker>
    </defs>
  );
}

const estiloSvg: React.CSSProperties = { width: '100%', maxHeight: '38vh', display: 'block' };

export function Diagrama({ nome }: { nome: 'arvore' | 'distros' | 'processo' | 'cadeados' | 'encanamento' }) {
  if (nome === 'arvore') return <Arvore />;
  if (nome === 'distros') return <Distros />;
  if (nome === 'processo') return <Processo />;
  if (nome === 'cadeados') return <Cadeados />;
  return <Encanamento />;
}

/** o sistema de arquivos como árvore, com a casa destacada */
function Arvore() {
  const linhas: { x: number; y: number; texto: string; forte?: boolean; nota?: string }[] = [
    { x: 24, y: 34, texto: '/', forte: true, nota: 'a raiz: tudo começa aqui' },
    { x: 72, y: 74, texto: 'etc/', nota: 'configurações' },
    { x: 72, y: 110, texto: 'var/', nota: 'logs' },
    { x: 72, y: 146, texto: 'home/', forte: true, nota: 'as pessoas' },
    { x: 128, y: 182, texto: 'aluno/', forte: true, nota: 'sua casa, o mesmo que ~' },
    { x: 184, y: 218, texto: 'docs/', nota: '~/docs' },
  ];
  return (
    <svg viewBox="0 0 640 250" style={estiloSvg} role="img" aria-label="sistema de arquivos em árvore">
      {/* o tronco desce da raiz e cada galho sai dele na horizontal */}
      <path d="M30 42 V146" {...TRACO} />
      <path d="M30 74 H64" {...TRACO} />
      <path d="M30 110 H64" {...TRACO} />
      <path d="M30 146 H64" {...TRACO} />
      <path d="M86 154 V182 H120" {...TRACO} />
      <path d="M142 190 V218 H176" {...TRACO} />
      {linhas.map((l) => (
        <g key={l.texto}>
          <text x={l.x} y={l.y} fontFamily="var(--mono)" fontSize="19" fontWeight={l.forte ? 700 : 400} fill="var(--tinta)">
            {l.texto}
          </text>
          {l.nota && (
            <text x={l.x + 96} y={l.y} fontFamily="var(--sans)" fontSize="15" fill="var(--tinta-2)">
              {l.nota}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/**
 * Kernel e distribuição: as camadas à esquerda (o kernel é só a do meio) e as
 * famílias à direita. Antes este slide reaproveitava a árvore de pastas, que
 * não tem relação com o assunto e confundia quem nunca viu nenhum dos dois.
 */
function Distros() {
  const camadas = [
    { y: 18, rotulo: 'programas e interface', nota: 'navegador, terminal, janelas' },
    { y: 74, rotulo: 'ferramentas + apt', nota: 'GNU e o instalador de programas' },
    { y: 130, rotulo: 'kernel Linux', nota: 'o núcleo: fala com o hardware', forte: true },
    { y: 186, rotulo: 'hardware', nota: 'processador, memória, disco' },
  ];
  const familias = [
    { y: 40, texto: 'Debian → Ubuntu → Mint' },
    { y: 96, texto: 'Red Hat → Fedora' },
    { y: 152, texto: 'Arch → Manjaro' },
  ];
  return (
    <svg viewBox="0 0 640 250" style={estiloSvg} role="img" aria-label="camadas de uma distribuição Linux e famílias de distros">
      {camadas.map((c) => (
        <g key={c.rotulo}>
          <rect x="16" y={c.y} width="300" height="46" rx="10" {...CAIXA}
            fill={c.forte ? 'var(--acento-suave)' : 'var(--papel)'} strokeWidth={c.forte ? 2.4 : 1.6} />
          <text x="32" y={c.y + 20} fontFamily="var(--mono)" fontSize="16" fontWeight={c.forte ? 700 : 400}
            fill={c.forte ? 'var(--acento)' : 'var(--tinta)'}>{c.rotulo}</text>
          <text x="32" y={c.y + 38} fontFamily="var(--sans)" fontSize="12.5" fill="var(--tinta-2)">{c.nota}</text>
        </g>
      ))}
      {/* a chave que junta as três camadas de cima: isso é a distro */}
      <path d="M324 22 H334 V172 H324" {...TRACO} />
      <text x="342" y="16" fontFamily="var(--sans)" fontSize="15" fontWeight="700" fill="var(--tinta)">distribuição (distro)</text>
      {familias.map((f) => (
        <text key={f.texto} x="352" y={f.y + 24} fontFamily="var(--mono)" fontSize="15.5" fill="var(--tinta)">{f.texto}</text>
      ))}
      <text x="342" y="236" fontFamily="var(--sans)" fontSize="13.5" fill="var(--tinta-2)">mesmo kernel, embalagens diferentes</text>
    </svg>
  );
}

/** processo em primeiro plano contra processo solto com & */
function Processo() {
  return (
    <svg viewBox="0 0 640 260" style={estiloSvg} role="img" aria-label="processo preso ao terminal e processo solto">
      <Seta />

      {/* coluna da esquerda: preso ao terminal */}
      <text x="16" y="26" fontFamily="var(--sans)" fontSize="16" fontWeight="700" fill="var(--tinta)">sem o &amp;</text>
      <rect x="16" y="40" width="268" height="86" rx="12" {...CAIXA} />
      <text x="36" y="74" fontFamily="var(--mono)" fontSize="18" fill="var(--tinta)">node app.js</text>
      <text x="36" y="104" fontFamily="var(--mono)" fontSize="15" fill="var(--tinta-2)">PID 4821</text>
      <path d="M150 126 V162" {...TRACO} markerEnd="url(#ponta)" />
      <text x="16" y="188" fontFamily="var(--sans)" fontSize="15" fill="var(--erro)">preso ao seu terminal</text>
      <text x="16" y="212" fontFamily="var(--sans)" fontSize="15" fill="var(--tinta-2)">fechou o terminal, morreu</text>

      {/* coluna da direita: soltou */}
      <text x="356" y="26" fontFamily="var(--sans)" fontSize="16" fontWeight="700" fill="var(--tinta)">com o &amp;</text>
      <rect x="356" y="40" width="268" height="86" rx="12" {...CAIXA} strokeDasharray="6 5" />
      <text x="376" y="74" fontFamily="var(--mono)" fontSize="18" fill="var(--tinta)">node app.js &amp;</text>
      <text x="376" y="104" fontFamily="var(--mono)" fontSize="15" fill="var(--tinta-2)">PID 4822</text>
      <path d="M490 126 V162" {...TRACO} strokeDasharray="6 5" markerEnd="url(#ponta)" />
      <text x="356" y="188" fontFamily="var(--sans)" fontSize="15" fill="var(--ok)">solto, o prompt volta</text>
      <text x="356" y="212" fontFamily="var(--sans)" fontSize="15" fill="var(--tinta-2)">você encerra com kill 4822</text>
    </svg>
  );
}

/** os três cadeados de permissão, com o número de cada um */
function Cadeados() {
  const grupos = [
    { quem: 'dono', bits: ['r', 'w', 'x'], ligados: [true, true, true], numero: 7 },
    { quem: 'grupo', bits: ['r', 'w', 'x'], ligados: [true, false, true], numero: 5 },
    { quem: 'outros', bits: ['r', 'w', 'x'], ligados: [true, false, false], numero: 4 },
  ];
  return (
    <svg viewBox="0 0 640 250" style={estiloSvg} role="img" aria-label="permissões por dono, grupo e outros">
      {grupos.map((g, i) => (
        <g key={g.quem} transform={`translate(${16 + i * 208} 16)`}>
          <rect width="192" height="150" rx="14" {...CAIXA} />
          <text x="20" y="34" fontFamily="var(--sans)" fontSize="17" fontWeight="700" fill="var(--tinta)">{g.quem}</text>
          {g.bits.map((b, j) => (
            <g key={b} transform={`translate(${20 + j * 56} 54)`}>
              <rect width="44" height="44" rx="10" {...CAIXA} fill={g.ligados[j] ? 'var(--acento-suave)' : 'var(--papel-2)'} />
              <text x="15" y="30" fontFamily="var(--mono)" fontSize="19" fontWeight="700"
                fill={g.ligados[j] ? 'var(--acento)' : 'var(--borda)'}>{b}</text>
            </g>
          ))}
          <text x="20" y="134" fontFamily="var(--mono)" fontSize="17" fill="var(--tinta-2)">
            soma: {g.numero}
          </text>
        </g>
      ))}
      <text x="16" y="208" fontFamily="var(--mono)" fontSize="22" fill="var(--tinta)">-rwxr-xr--</text>
      <text x="200" y="208" fontFamily="var(--sans)" fontSize="19" fill="var(--tinta-2)">é o mesmo que</text>
      <text x="380" y="208" fontFamily="var(--mono)" fontSize="22" fontWeight="700" fill="var(--acento)">754</text>
      <text x="16" y="238" fontFamily="var(--sans)" fontSize="15" fill="var(--tinta-2)">
        r vale 4, w vale 2, x vale 1
      </text>
    </svg>
  );
}

/** o encanamento: saída de um comando entra no próximo */
function Encanamento() {
  const pecas = [
    { rotulo: 'cat', nota: '50.000 linhas' },
    { rotulo: 'grep', nota: 'só os erros' },
    { rotulo: 'sort', nota: 'em ordem' },
    { rotulo: 'uniq -c', nota: 'contados' },
  ];
  return (
    <svg viewBox="0 0 640 230" style={estiloSvg} role="img" aria-label="comandos ligados por pipe">
      <Seta />
      {pecas.map((p, i) => (
        <g key={p.rotulo} transform={`translate(${14 + i * 158} 30)`}>
          <rect width="118" height="68" rx="12" {...CAIXA} />
          <text x="18" y="42" fontFamily="var(--mono)" fontSize="19" fill="var(--tinta)">{p.rotulo}</text>
          <text x="0" y="96" fontFamily="var(--sans)" fontSize="14" fill="var(--tinta-2)">{p.nota}</text>
          {i < pecas.length - 1 && (
            <>
              <path d="M118 34 H152" {...TRACO} markerEnd="url(#ponta)" />
              <text x="128" y="26" fontFamily="var(--mono)" fontSize="20" fontWeight="700" fill="var(--acento)">|</text>
            </>
          )}
        </g>
      ))}
      <text x="14" y="168" fontFamily="var(--sans)" fontSize="16" fill="var(--tinta-2)">
        cada | liga a saída de um comando na entrada do próximo
      </text>
      <text x="14" y="200" fontFamily="var(--mono)" fontSize="17" fill="var(--acento)">
        ... &gt; relatorio.txt
      </text>
      <text x="236" y="200" fontFamily="var(--sans)" fontSize="16" fill="var(--tinta-2)">
        guarda o resultado num arquivo
      </text>
    </svg>
  );
}
