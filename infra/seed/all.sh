# Semeia todos os módulos de uma vez (usado no provisionamento e no reset).
set -e
for m in m1 m2 m3 m4 m5; do
  bash "${ARENA_SEEDS:-/opt/seed}/$m.sh" 2>/dev/null || true
done
