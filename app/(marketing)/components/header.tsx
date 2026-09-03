import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Header da landing page pública
 * 
 * Contém:
 * - Logo do projeto
 * - Links de navegação (Funcionalidades, Para quem é)
 * - Botões de ação (Entrar, Criar conta grátis)
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent" />
            <span className="text-lg font-semibold tracking-tight">
              Cashflow Pro
            </span>
          </div>
        </Link>

        {/* Navegação Desktop */}
        <nav className="hidden items-center space-x-6 md:flex">
          <a
            href="#funcionalidades"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Funcionalidades
          </a>
          <a
            href="#para-quem-e"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Para quem é
          </a>
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Preços
          </Link>
        </nav>

        {/* CTAs */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button variant="accent" size="sm" asChild>
            <Link href="/register">Criar conta grátis</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

