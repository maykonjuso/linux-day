# M1 — a flag escondida.
# A flag é sorteada por participante: copiar a resposta do colega não funciona,
# mas copiar o comando funciona (e isso é aprendizado, não cola).
set -e
mkdir -p "$HOME/.arena"
FLAG="tux-$(od -An -N3 -tx1 /dev/urandom | tr -d ' \n')"
echo "$FLAG" > "$HOME/.arena/flag"

mkdir -p "$HOME/projetos/2024/.backup/antigo"
echo "$FLAG" > "$HOME/projetos/2024/.backup/antigo/flag.txt"
echo "nada aqui. tente mais fundo." > "$HOME/projetos/leia-me.txt"
echo "quase. use ls -la" > "$HOME/projetos/2024/pista.txt"
mkdir -p "$HOME/docs" "$HOME/app"
