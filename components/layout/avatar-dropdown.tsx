"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { User, LogOut, ChevronDown } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { isDesktopMode } from "@/lib/desktop";

type AvatarDropdownProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  showProfile?: boolean;
};

export function AvatarDropdown({
  name,
  email,
  image,
  showProfile = true,
}: AvatarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Fechar ao pressionar Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen]);

  // Gerar inicial do nome para fallback
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push("/app/profile");
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut({
      redirect: true,
      callbackUrl: "/login",
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Avatar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 w-full rounded-lg px-2 py-2 transition-all duration-200",
          "hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
          isOpen && "bg-white/5"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menu do usuário"
      >
        {/* Avatar */}
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-muted">
          {image ? (
            <Image
              src={image}
              alt={name || "Avatar"}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-semibold text-primary">
              {getInitials(name)}
            </div>
          )}
        </div>

        {/* Nome e Email */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-medium text-foreground truncate">
            {name || "Usuário"}
          </p>
          {email && (
            <p className="text-[10px] text-muted-foreground truncate">
              {email}
            </p>
          )}
        </div>

        {/* Ícone de chevron */}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute bottom-full left-0 right-0 mb-2 z-50",
            "bg-card border border-white/10 rounded-lg shadow-xl",
            "overflow-hidden",
            "transform transition-all duration-200 ease-out",
            "opacity-100 scale-100"
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {showProfile && (
            <>
              <button
                type="button"
                onClick={handleProfileClick}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm",
                  "text-foreground hover:bg-white/5 transition-colors",
                  "focus:outline-none focus:bg-white/5"
                )}
                role="menuitem"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Perfil</span>
              </button>
              <div className="h-px bg-white/5" />
            </>
          )}

          {!isDesktopMode() && (
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm",
              "text-destructive hover:bg-destructive/10 transition-colors",
              "focus:outline-none focus:bg-destructive/10"
            )}
            role="menuitem"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
          )}
        </div>
      )}
    </div>
  );
}

