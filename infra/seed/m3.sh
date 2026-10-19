# M3 — permissões: um relatório ilegível e um script que não roda.
set -e
cd "$HOME"
echo "faturamento: 1.240 reais" > relatorio.txt
chmod 000 relatorio.txt
# deploy.sh NÃO é criado: criá-lo é a tarefa.
rm -f deploy.sh
