/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // há outro lockfile acima deste diretório; fixa a raiz para o Next não adivinhar
  outputFileTracingRoot: import.meta.dirname,
  // o deck é servido na rede local; nada de otimizações que exijam internet
  images: { unoptimized: true },
};
