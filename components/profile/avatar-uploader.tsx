"use client";

import { useState, type FormEvent } from "react";
import { uploadAvatar } from "@/app/app/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "lucide-react";
import Image from "next/image";

type AvatarUploaderProps = {
  currentImageUrl?: string | null;
  userName?: string | null;
};

export function AvatarUploader({
  currentImageUrl,
  userName,
}: AvatarUploaderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl || "");

  // Gerar inicial do nome para fallback
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    // Log para debug
    const urlValue = formData.get("imageUrl") as string;
    console.log("[AvatarUploader] Enviando URL:", urlValue);
    
    const result = await uploadAvatar(formData);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.reason);
      console.error("[AvatarUploader] Erro ao salvar:", result.reason);
      return;
    }

    console.log("[AvatarUploader] Sucesso! Recarregando página...");
    setSuccess(true);
    
    // Recarregar página para atualizar avatar
    // Dar tempo para o servidor processar antes de recarregar
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  return (
    <div className="space-y-4">
      {/* Avatar atual */}
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-primary/20 bg-muted">
          {currentImageUrl ? (
            <Image
              src={currentImageUrl}
              alt={userName || "Avatar"}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-semibold text-primary">
              {getInitials(userName)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-muted-foreground">
            Foto de perfil
          </p>
          <p className="text-[10px] text-muted-foreground">
            {currentImageUrl
              ? "URL atual configurada"
              : "Avatar com inicial (padrão)"}
          </p>
        </div>
      </div>

      {/* Formulário de upload */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <label
            htmlFor="imageUrl"
            className="text-xs font-semibold text-muted-foreground"
          >
            URL da imagem (PNG, JPG)
          </label>
          <Input
            id="imageUrl"
            name="imageUrl"
            type="url"
            placeholder="https://exemplo.com/foto.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full"
          />
          <p className="text-[10px] text-muted-foreground">
            Cole a URL da sua foto de perfil. Você pode usar serviços como
            Cloudinary, Imgur ou S3.
          </p>
        </div>

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-[11px] text-destructive">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-2 text-[11px] text-emerald-700">
            Foto de perfil atualizada com sucesso!
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={isSubmitting || !imageUrl.trim()}
          >
            {isSubmitting ? "Salvando..." : "Atualizar foto"}
          </Button>
          {currentImageUrl && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={async () => {
                setImageUrl("");
                setError(null);
                // Limpar avatar (enviar string vazia)
                const formData = new FormData();
                formData.set("imageUrl", "");
                const result = await uploadAvatar(formData);
                if (result.success) {
                  window.location.reload();
                } else {
                  setError(result.reason);
                }
              }}
              className="text-xs"
            >
              Remover
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

