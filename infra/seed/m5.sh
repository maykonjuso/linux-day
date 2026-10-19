# M5 — a app de exemplo (sem pacote instalado: instalar é a tarefa).
set -e
mkdir -p "$HOME/app" "$HOME/.arena"

# pacote sorteado para ESTE participante. Cada um instala um diferente: se
# todos instalassem o mesmo, do segundo em diante o apt diria "already the
# newest version" e o lab perderia o sentido.
if [ ! -f "$HOME/.pacote" ]; then
  PKGS="cmatrix jq cowsay figlet ncdu sl neofetch tree"
  n=$(( $(od -An -N1 -tu1 /dev/urandom | tr -d ' ') % 8 + 1 ))
  echo "$PKGS" | cut -d' ' -f"$n" > "$HOME/.pacote"
fi
cat > "$HOME/app/app.js" <<'APP'
// App de exemplo do workshop: fica rodando até alguém matar.
const porta = 3000;
console.log('app no ar na porta ' + porta + ' — PID ' + process.pid);
setInterval(() => {}, 1000);
APP
# marcador: o critério 3 do M5 só conta depois de a app ter rodado uma vez
cat > "$HOME/.arena/marcar-rodou.sh" <<'MARK'
#!/bin/bash
touch "$HOME/.arena/rodou"
MARK
chmod +x "$HOME/.arena/marcar-rodou.sh"
