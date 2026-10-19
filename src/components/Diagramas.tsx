/**
 * Diagramas inline. SVG à mão, não biblioteca: precisam ser legíveis a 10
 * metros num projetor e funcionar sem cor (teste em escala de cinza).
 */
export function Diagrama({ nome }: { nome: 'arvore' | 'processo' | 'cadeados' | 'encanamento' }) {
  const t = { fontFamily: 'var(--mono)', fontSize: 15, fill: 'var(--tinta)' } as const;
  const linha = { stroke: 'var(--tinta-2)', strokeWidth: 1.5, fill: 'none' } as const;

  if (nome === 'arvore')
    return (
      <svg viewBox="0 0 420 240" style={{ width: '100%', maxHeight: '42vh' }}>
        <text x="10" y="26" {...t} fontWeight="700">/</text>
        <path d="M18 34 V60 H40" {...linha} /><text x="46" y="65" {...t}>etc/</text>
        <path d="M18 34 V96 H40" {...linha} /><text x="46" y="101" {...t}>var/</text>
        <path d="M18 34 V132 H40" {...linha} /><text x="46" y="137" {...t} fontWeight="700">home/</text>
        <path d="M58 140 V168 H80" {...linha} />
        <text x="86" y="173" {...t} fontWeight="700">aluno/</text>
        <text x="200" y="173" {...t} fill="var(--acento)">← isto é o ~</text>
        <path d="M98 176 V204 H120" {...linha} /><text x="126" y="209" {...t}>docs/</text>
        <text x="126" y="232" {...t} fill="var(--tinta-2)">/home/aluno/docs  ==  ~/docs</text>
      </svg>
    );

  if (nome === 'processo')
    return (
      <svg viewBox="0 0 420 200" style={{ width: '100%', maxHeight: '42vh' }}>
        <rect x="12" y="20" width="180" height="70" rx="10" {...linha} />
        <text x="26" y="48" {...t}>node app.js</text>
        <text x="26" y="72" {...t} fill="var(--tinta-2)">PID 4821</text>
        <path d="M102 90 V120" {...linha} />
        <text x="12" y="142" {...t} fill="var(--erro)">terminal preso · fechou, morreu</text>
        <rect x="228" y="20" width="180" height="70" rx="10" {...linha} strokeDasharray="5 4" />
        <text x="242" y="48" {...t}>node app.js &amp;</text>
        <text x="242" y="72" {...t} fill="var(--tinta-2)">PID 4822</text>
        <path d="M318 90 V120" {...linha} strokeDasharray="5 4" />
        <text x="228" y="142" {...t} fill="var(--ok)">soltou · o prompt volta</text>
        <text x="12" y="180" {...t} fill="var(--tinta-2)">é pelo PID que você mata: kill 4822</text>
      </svg>
    );

  if (nome === 'cadeados')
    return (
      <svg viewBox="0 0 420 200" style={{ width: '100%', maxHeight: '42vh' }}>
        {['dono', 'grupo', 'outros'].map((quem, i) => (
          <g key={quem} transform={`translate(${12 + i * 136} 20)`}>
            <rect width="120" height="110" rx="10" {...linha} />
            <text x="12" y="26" {...t} fontWeight="700">{quem}</text>
            {['r', 'w', 'x'].map((p, j) => (
              <g key={p} transform={`translate(${12 + j * 34} 44)`}>
                <rect width="26" height="26" rx="6" {...linha} fill={i === 0 || (j === 0) ? '#eff4ff' : 'none'} />
                <text x="8" y="19" {...t}>{p}</text>
              </g>
            ))}
            <text x="12" y="98" {...t} fill="var(--tinta-2)">{i === 0 ? '7' : i === 1 ? '5' : '4'}</text>
          </g>
        ))}
        <text x="12" y="172" {...t}>-rwxr-xr--  ==  754</text>
      </svg>
    );

  return (
    <svg viewBox="0 0 440 190" style={{ width: '100%', maxHeight: '42vh' }}>
      {['cat', 'grep', 'sort', 'uniq -c'].map((c, i) => (
        <g key={c} transform={`translate(${10 + i * 108} 40)`}>
          <rect width="86" height="54" rx="10" {...linha} />
          <text x="14" y="33" {...t}>{c}</text>
          {i < 3 && <path d="M86 27 H108" {...linha} markerEnd="url(#seta)" />}
        </g>
      ))}
      <defs>
        <marker id="seta" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 z" fill="var(--tinta-2)" />
        </marker>
      </defs>
      <text x="10" y="128" {...t} fill="var(--tinta-2)">cada | leva a saída de um para a entrada do próximo</text>
      <text x="10" y="156" {...t} fill="var(--acento)">... &gt; relatorio.txt   despeja o resultado num arquivo</text>
    </svg>
  );
}
