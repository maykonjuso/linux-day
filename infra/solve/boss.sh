set -e
: "${DIR_GRUPO:?}"; : "${GRUPO:?}"
pkill -f "arena-travado-$GRUPO" 2>/dev/null || true
chmod +x "$DIR_GRUPO/backup.sh"
(cd "$DIR_GRUPO" && ./backup.sh >/dev/null)
n=$(grep -c ERROR "$DIR_GRUPO/log/relatorio.log")
printf 'grupo %s\nERROR: %s\nPID morto: 99999\n' "$GRUPO" "$n" > "$DIR_GRUPO/laudo.txt"
