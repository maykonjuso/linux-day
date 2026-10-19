# Boss "O Chamado" — quatro defeitos no diretório do grupo.
# Rodado como root no dia; GRUPO e DIR_GRUPO vêm do ambiente.
set -e
: "${GRUPO:?defina GRUPO}"
: "${DIR_GRUPO:?defina DIR_GRUPO}"
mkdir -p "$DIR_GRUPO/log"

# defeito 1 — o log com o erro, escondido num lugar que ninguém disse qual é
: > "$DIR_GRUPO/log/relatorio.log"
for i in $(seq 1 1200); do
  case $(( i % 31 )) in
    0) echo "2026-10-19 03:$(printf '%02d' $((i % 60))):00 ERROR falha ao abrir conexao" ;;
    *) echo "2026-10-19 03:$(printf '%02d' $((i % 60))):00 INFO linha processada" ;;
  esac >> "$DIR_GRUPO/log/relatorio.log"
done
echo "2026-10-19 03:59:00 FATAL permissao negada ao executar backup.sh" >> "$DIR_GRUPO/log/relatorio.log"

# defeito 2 — um processo travado comendo CPU, com nome plausível
nohup bash -c "exec -a arena-travado-$GRUPO bash -c 'while :; do :; done'" >/dev/null 2>&1 &

# defeito 3 — o script que não roda (falta o x)
cat > "$DIR_GRUPO/backup.sh" <<'B'
#!/bin/bash
echo "backup concluido em $(date)" > "$(dirname "$0")/backup.ok"
echo "backup ok"
B
chmod 644 "$DIR_GRUPO/backup.sh"
rm -f "$DIR_GRUPO/backup.ok" "$DIR_GRUPO/laudo.txt"
