# M4 — um log de 50 mil linhas com erros plantados.
# Gerado com awk num passe único: em bash puro (50 mil `echo >>`) isto levava
# mais de 10 segundos por participante e estourava o timeout do provisionamento.
set -e
cd "$HOME"
awk 'BEGIN {
  srand(42);
  split("10.0.0.7 10.0.0.9 192.168.0.14 172.16.0.3", ip, " ");
  for (i = 1; i <= 50000; i++) {
    n = (i % 4) + 1;
    mm = sprintf("%02d", i % 60);
    r = i % 97;
    if (r == 0)       { nivel = "ERROR"; msg = "timeout ao gravar no banco" }
    else if (r == 13) { nivel = "ERROR"; msg = "conexao recusada" }
    else if (r == 57) { nivel = "WARN";  msg = "fila crescendo" }
    else              { nivel = "INFO";  msg = "requisicao atendida" }
    printf "2026-10-19T08:%s:00 %s %s %s\n", mm, nivel, ip[n], msg;
  }
  # o 10.0.0.7 aparece mais que os outros: é a resposta do segundo critério
  for (i = 1; i <= 400; i++) print "2026-10-19T09:00:00 INFO 10.0.0.7 requisicao atendida";
  # e o 172.16.0.3 é o que mais dá ERROR: é o que a demonstração do slide acha
  # (de propósito diferente da resposta do lab, para o slide não entregar o lab)
  for (i = 1; i <= 250; i++) print "2026-10-19T09:05:00 ERROR 172.16.0.3 conexao recusada";
  print "2026-10-19T09:10:00 FATAL 10.0.0.7 disco cheio em /var";
  print "2026-10-19T09:11:00 FATAL 10.0.0.9 processo morto pelo kernel";
}' > app.log
rm -f fatais.txt
