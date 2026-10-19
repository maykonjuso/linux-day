set -e
cd "$HOME/bagunca"
mkdir -p imagens docs scripts
mv -f *.png *.jpg imagens/ 2>/dev/null || true
mv -f rascunho.txt docs/notas.md 2>/dev/null || true
mv -f *.txt *.md docs/ 2>/dev/null || true
mv -f *.sh scripts/ 2>/dev/null || true
rm -f tmp_* 2>/dev/null || true
echo "organizado por ${NICK:-gabarito}" > README.md
