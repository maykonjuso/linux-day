'use client';

import {
  AlertTriangle, ArrowRight, BadgeCheck, Binary, BookOpen, Box, Check, ChevronLeft,
  ChevronRight, CircleHelp, Clock, Coins, Compass, Eye, FileText, Files, FolderOpen,
  Folders, Gauge, Gift, Hand, HelpCircle, History, Info, KeyRound, Keyboard, Lightbulb,
  ListChecks, Lock, LogOut, Medal, Microscope, Package, Pause, Pencil, Play, Plug,
  RefreshCw, Rocket, Scissors, Search, Server, Settings, Shield, Skull, SlidersHorizontal,
  Sparkles, Split, SquareTerminal, Target, Terminal, Timer, Trash2, Trophy, Unlock, Users,
  Wrench, Zap, type LucideIcon,
} from 'lucide-react';

/**
 * Ícones por NOME DE INTENÇÃO, não por nome do desenho.
 * Assim o conteúdo diz "isto é um perigo" e o visual decide como mostrar, e
 * trocar o desenho depois não exige mexer no conteúdo.
 *
 * Tudo offline: a biblioteca vira SVG no bundle, nada é baixado em runtime
 * (o workshop roda numa rede local, sem internet).
 */
const MAPA: Record<string, LucideIcon> = {
  // navegação e estrutura
  onde: Compass, pasta: FolderOpen, pastas: Folders, arquivo: FileText, arquivos: Files,
  arvore: Split, caminho: Compass,
  // ações
  criar: Pencil, editar: Pencil, apagar: Trash2, mover: ArrowRight, copiar: Files,
  procurar: Search, filtrar: Scissors, juntar: Plug,
  // permissões e segurança
  cadeado: Lock, destravado: Unlock, chave: KeyRound, escudo: Shield, perigo: Skull,
  // processos e programas
  processo: Gauge, programa: Package, instalar: Package, matar: Zap, servidor: Server,
  terminal: Terminal, shell: SquareTerminal, binario: Binary,
  // jogo
  xp: Sparkles, token: Coins, nivel: Medal, troféu: Trophy, badge: BadgeCheck,
  premio: Gift, alvo: Target, relogio: Timer, tempo: Clock,
  // aula
  ideia: Lightbulb, atencao: AlertTriangle, erro: AlertTriangle, info: Info,
  duvida: CircleHelp, ajuda: Hand, consultar: BookOpen, pergunta: HelpCircle,
  checklist: ListChecks, feito: Check, olho: Eye, historico: History,
  teclado: Keyboard, config: Settings, ferramenta: Wrench, lupa: Microscope,
  caixa: Box, foguete: Rocket, ajustes: SlidersHorizontal, sair: LogOut,
  // controles
  anterior: ChevronLeft, proximo: ChevronRight, tocar: Play, pausar: Pause,
  recomecar: RefreshCw, pessoas: Users, verificar: BadgeCheck,
};

export type NomeIcone = keyof typeof MAPA | string;

export function Icone({ nome, tamanho = 20, cor, style }: { nome: NomeIcone; tamanho?: number; cor?: string; style?: React.CSSProperties }) {
  const C = MAPA[nome] ?? Info;
  return <C size={tamanho} color={cor} strokeWidth={1.9} style={{ flex: 'none', ...style }} aria-hidden />;
}

/** Ícone grande, de ilustração: abre o módulo e dá uma imagem para a memória. */
export function IconeGrande({ nome, cor = 'var(--acento)' }: { nome: NomeIcone; cor?: string }) {
  return (
    <div style={{
      width: 92, height: 92, borderRadius: 24, display: 'grid', placeItems: 'center',
      background: 'var(--papel-2)', border: '1px solid var(--borda)',
    }}>
      <Icone nome={nome} tamanho={48} cor={cor} />
    </div>
  );
}
