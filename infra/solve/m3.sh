set -e
cd "$HOME"
printf '#!/bin/bash\necho "deploy feito"\n' > deploy.sh
chmod +x deploy.sh
./deploy.sh >/dev/null
chmod 644 relatorio.txt
