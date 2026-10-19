# M2 — o diretório bagunçado (20 arquivos soltos).
set -e
d="$HOME/bagunca"
rm -rf "$d"; mkdir -p "$d"; cd "$d"
for f in foto1.png foto2.png grafico.png logo.jpg banner.jpg capa.jpg; do echo "binario-falso" > "$f"; done
for f in notas.txt lista.txt leia.md guia.md contatos.txt; do echo "texto de exemplo" > "$f"; done
for f in deploy.sh backup.sh limpar.sh; do printf '#!/bin/bash\necho ok\n' > "$f"; done
echo "rascunho antigo" > rascunho.txt
for f in tmp_1.log tmp_2.log tmp_x.cache; do echo "lixo" > "$f"; done
