'use client';

import { useCallback, useEffect, useState } from 'react';
import type { NomeTema } from './temas';

const CHAVE = 'arena:tema';

/**
 * Tema do slide, guardado por navegador.
 *
 * O padrão vem do papel: o projetor começa claro (sala com luz come o preto) e
 * o notebook segue o que o sistema da pessoa já pede. Trocar é dela, e fica
 * guardado para a próxima vez.
 */
export function useTema(padrao: NomeTema = 'claro') {
  const [tema, setTema] = useState<NomeTema>(padrao);

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE) as NomeTema | null;
    if (salvo === 'claro' || salvo === 'escuro') { setTema(salvo); return; }
    if (padrao === 'claro' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) setTema('escuro');
  }, [padrao]);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
  }, [tema]);

  const trocar = useCallback((proximo?: NomeTema) => {
    setTema((atual) => {
      const novo = proximo ?? (atual === 'claro' ? 'escuro' : 'claro');
      try { localStorage.setItem(CHAVE, novo); } catch { /* aba privada */ }
      return novo;
    });
  }, []);

  return { tema, trocar };
}

const CHAVE_TERM = 'arena:tema-terminal';

/** tema do terminal, também por navegador (os temas abrem por nível) */
export function useTemaTerminal() {
  const [id, setId] = useState('noite');

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE_TERM);
    if (salvo) setId(salvo);
  }, []);

  const trocar = useCallback((proximo: string) => {
    setId(proximo);
    try { localStorage.setItem(CHAVE_TERM, proximo); } catch { /* aba privada */ }
  }, []);

  return { temaTerminal: id, trocarTemaTerminal: trocar };
}
