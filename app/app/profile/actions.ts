"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { sendEmail } from "@/lib/email/send-email";

/**
 * Schemas de validação Zod
 */
const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// Schema mais flexível para URLs (aceita HTTP e HTTPS, incluindo localhost)
const uploadAvatarSchema = z.object({
  imageUrl: z.string().max(500).refine(
    (url) => {
      // Se for string vazia, aceita (para remover avatar)
      if (!url || url.trim() === "") {
        return true;
      }
      
      // Validação mais flexível de URL
      try {
        const urlObj = new URL(url.trim());
        // Aceita http, https, e até mesmo data URLs
        return urlObj.protocol === "http:" || 
               urlObj.protocol === "https:" ||
               urlObj.protocol === "data:";
      } catch {
        return false;
      }
    },
    { message: "URL inválida. Use uma URL válida (ex: https://exemplo.com/foto.jpg)" }
  ),
});

/**
 * Tipos de retorno das Server Actions
 */
type ActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; reason: string };

/**
 * UPDATE PROFILE - Atualizar nome do usuário
 */
export async function updateProfile(
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        reason: "Usuário não autenticado.",
      };
    }

    const rawData = {
      name: formData.get("name") as string,
    };

    const validated = updateProfileSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        reason: validated.error.errors[0]?.message ?? "Dados inválidos",
      };
    }

    const { name } = validated.data;

    await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });

    // Revalidar cache da página de perfil
    revalidatePath("/app/profile");

    return {
      success: true,
      data: { message: "Perfil atualizado com sucesso." },
    };
  } catch (error) {
    console.error("Update profile error:", error);
    return {
      success: false,
      reason: "Erro ao atualizar perfil. Tente novamente.",
    };
  }
}

/**
 * CHANGE PASSWORD - Alterar senha do usuário autenticado
 * 
 * Após sucesso:
 * - Logout automático
 * - Email de confirmação
 */
export async function changePassword(
  formData: FormData
): Promise<ActionResult<{ requiresLogout: boolean; message?: string }>> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        reason: "Usuário não autenticado.",
      };
    }

    // Rate limit: 5 tentativas por hora por usuário
    if (!checkRateLimit(`change-password:${user.id}`, 5, 60 * 60 * 1000)) {
      return {
        success: false,
        reason: "Muitas tentativas. Tente novamente mais tarde.",
      };
    }

    const rawData = {
      currentPassword: formData.get("currentPassword") as string,
      newPassword: formData.get("newPassword") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const validated = changePasswordSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        reason: validated.error.errors[0]?.message ?? "Dados inválidos",
      };
    }

    const { currentPassword, newPassword } = validated.data;

    // Buscar usuário com senha
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true, email: true, name: true },
    });

    if (!dbUser || !dbUser.password) {
      return {
        success: false,
        reason: "Usuário não encontrado ou não possui senha cadastrada.",
      };
    }

    // Verificar senha atual
    const isValid = await verifyPassword(currentPassword, dbUser.password);

    if (!isValid) {
      return {
        success: false,
        reason: "Senha atual incorreta.",
      };
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Enviar email de confirmação (side-effect, não bloqueia)
    sendEmail({
      to: dbUser.email,
      subject: "Senha alterada com sucesso - Cashflow Pro",
      template: "password-changed",
      props: {
        name: dbUser.name || "Usuário",
        timestamp: new Date().toLocaleString("pt-BR"),
      },
    }).catch((error) => {
      console.error("[profile] Erro ao enviar email de confirmação:", error);
    });

    return {
      success: true,
      data: {
        message: "Senha alterada com sucesso. Você será desconectado.",
        requiresLogout: true,
      },
    };
  } catch (error) {
    console.error("Change password error:", error);
    return {
      success: false,
      reason: "Erro ao alterar senha. Tente novamente.",
    };
  }
}

/**
 * UPLOAD AVATAR - Salvar URL da foto de perfil
 * 
 * Nota: Esta função apenas salva a URL no banco.
 * O upload real deve ser feito no cliente (Cloudinary, S3, etc.)
 */
export async function uploadAvatar(
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        reason: "Usuário não autenticado.",
      };
    }

    // Pegar o valor do formData e garantir que seja string
    const imageUrlRaw = formData.get("imageUrl");
    const imageUrlString = imageUrlRaw ? String(imageUrlRaw) : "";

    // Log para debug (sempre, não apenas em desenvolvimento)
    console.log("[uploadAvatar] URL recebida (raw):", imageUrlRaw);
    console.log("[uploadAvatar] URL recebida (string):", imageUrlString);
    console.log("[uploadAvatar] Tipo:", typeof imageUrlRaw);

    const rawData = {
      imageUrl: imageUrlString,
    };

    const validated = uploadAvatarSchema.safeParse(rawData);

    if (!validated.success) {
      // Retorna mensagem de erro mais detalhada
      const errorMessage = validated.error.errors[0]?.message ?? "URL inválida";
      console.error("[uploadAvatar] Erro de validação:", JSON.stringify(validated.error.errors, null, 2));
      return {
        success: false,
        reason: errorMessage,
      };
    }

    let { imageUrl } = validated.data;
    
    // Se imageUrl for string vazia ou apenas espaços, remover avatar (null)
    if (!imageUrl || imageUrl.trim() === "") {
      const finalImageUrl = null;
      
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { image: finalImageUrl },
        select: { image: true },
      });
      
      console.log("[uploadAvatar] Avatar removido do banco");
      revalidatePath("/app/profile");
      return {
        success: true,
        data: { message: "Foto de perfil removida com sucesso." },
      };
    }
    
    imageUrl = imageUrl.trim();
    
    // Converter links do Imgur para URLs diretas de imagem
    // imgur.com/abc123 ou i.imgur.com/abc123 -> i.imgur.com/abc123.jpg
    if (imageUrl.includes("imgur.com")) {
      // Extrair o ID da imagem do link
      const imgurIdMatch = imageUrl.match(/imgur\.com\/(?:a\/)?([a-zA-Z0-9]+)/);
      if (imgurIdMatch && imgurIdMatch[1]) {
        const imageId = imgurIdMatch[1];
        // Se já começa com i.imgur.com, manter
        if (imageUrl.includes("i.imgur.com")) {
          // Se não tem extensão, adicionar .jpg
          if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            imageUrl = `https://i.imgur.com/${imageId}.jpg`;
            console.log("[uploadAvatar] Convertido link Imgur para URL direta:", imageUrl);
          }
        } else {
          // Converter imgur.com/abc123 para i.imgur.com/abc123.jpg
          imageUrl = `https://i.imgur.com/${imageId}.jpg`;
          console.log("[uploadAvatar] Convertido link Imgur para URL direta:", imageUrl);
        }
      }
    }
    
    const finalImageUrl = imageUrl;

    // Log para debug
    console.log("[uploadAvatar] imageUrl após validação:", imageUrl);
    console.log("[uploadAvatar] finalImageUrl a ser salvo:", finalImageUrl);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { image: finalImageUrl },
      select: { image: true }, // Retornar apenas o campo image para verificação
    });

    // Log para debug
    console.log("[uploadAvatar] ✅ Usuário atualizado no banco!");
    console.log("[uploadAvatar] Valor salvo no campo 'image':", updatedUser.image);

    // Revalidar cache
    revalidatePath("/app/profile");

    return {
      success: true,
      data: { message: "Foto de perfil atualizada com sucesso." },
    };
  } catch (error) {
    console.error("Upload avatar error:", error);
    return {
      success: false,
      reason: "Erro ao atualizar foto de perfil. Tente novamente.",
    };
  }
}

/**
 * LOGOUT - Desconectar usuário
 * 
 * Esta função retorna um indicador de sucesso.
 * O logout real deve ser feito no cliente usando signOut() do next-auth/react.
 */
export async function logout(): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        reason: "Usuário não autenticado.",
      };
    }

    // O logout real é feito no cliente
    // Esta função apenas valida que o usuário está autenticado
    return {
      success: true,
      data: { message: "Logout realizado com sucesso." },
    };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      reason: "Erro ao fazer logout. Tente novamente.",
    };
  }
}

