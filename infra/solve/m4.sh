set -e
cd "$HOME"
grep FATAL app.log > fatais.txt
