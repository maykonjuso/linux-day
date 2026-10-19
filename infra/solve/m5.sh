set -e
pkg="$(cat "$HOME/.pacote" 2>/dev/null || echo tree)"
(sudo apt-get install -y "$pkg" >/dev/null 2>&1 || true)
touch "$HOME/.arena/rodou"
pkill -f "$HOME/app/app.js" 2>/dev/null || true
