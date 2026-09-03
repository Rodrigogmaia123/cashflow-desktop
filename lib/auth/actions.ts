"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";
import { checkRateLimit } from "./rate-limit";
import { sendWelcomeEmail, sendResetPasswordEmail } from "@/lib/email/send-email";
import crypto from "crypto";

/**
 * Schemas de validação Zod
 */

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  accountType: z.enum(["PF", "PJ"], {
    errorMap: () => ({ message: "Tipo de conta deve ser PF ou PJ" })
  })
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória")
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido")
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres")
});

const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  accountType: z.enum(["PF", "PJ"]).optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres")
});

/**
 * Tipos de retorno das Server Actions
 */
type ActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; reason: string };

/**
 * REGISTER - Criar conta com workspace
 * 
 * Fluxo:
 * 1. Validar dados
 * 2. Verificar se email já existe
 * 3. Hash da senha
 * 4. Criar usuário + workspace em transação
 * 5. Associar usuário como owner
 * 6. Definir activeWorkspaceId
 * 7. Login automático
 * 8. Redirecionar para /app/overview
 */
export async function register(
  formData: FormData
): Promise<ActionResult<{ email: string; message: string }>> {
  try {
    // Rate limit: 5 tentativas por hora por IP
    const ip = "unknown"; // Em produção, pegar do request
    if (!checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
      return {
        success: false,
        reason: "Muitas tentativas. Tente novamente mais tarde."
      };
    }

    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      accountType: formData.get("accountType") as "PF" | "PJ"
    };

    const validated = registerSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        reason: validated.error.errors[0]?.message ?? "Dados inválidos"
      };
    }

    const { name, email, password, accountType } = validated.data;

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Mensagem genérica (não revela se email existe)
      return {
        success: false,
        reason: "Não foi possível criar a conta. Verifique os dados."
      };
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Criar usuário + workspace em transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar usuário
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          accountType,
          plan: "FREE",
          isLifetime: false,
          isAdmin: false
        }
      });

      // Criar workspace padrão
      const workspace = await tx.workspace.create({
        data: {
          name: accountType === "PJ" ? "Minha Empresa" : "Meu Workspace"
        }
      });

      // Associar usuário como owner
      await tx.userWorkspace.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: "OWNER"
        }
      });

      // Definir activeWorkspaceId
      await tx.user.update({
        where: { id: user.id },
        data: { activeWorkspaceId: workspace.id }
      });

      return { user, workspace };
    });

    // Enviar email de boas-vindas (side-effect, não bloqueia o fluxo)
    // Usa .catch() para garantir que erros não quebrem o fluxo
    sendWelcomeEmail(email, name).catch((error) => {
      console.error("[auth] ❌ Erro ao enviar email de boas-vindas:", error);
      // Não lança erro - email é side-effect, não deve quebrar o registro
    });

    // Retornar sucesso - o componente cliente fará o login e redirect
    // Não podemos fazer login automático aqui porque signIn não funciona em Server Actions
    // Retornamos apenas email (sem senha por segurança) para o cliente fazer login
    return {
      success: true,
      data: { 
        email,
        message: "Conta criada com sucesso!" 
      }
    };
  } catch (error) {
    console.error("Register error:", error);
    return {
      success: false,
      reason: "Erro ao criar conta. Tente novamente."
    };
  }
}

/**
 * LOGIN - Autenticação com email e senha
 * 
 * Nota: Esta função não é mais necessária.
 * O login é feito diretamente pelo componente CredentialsLoginForm
 * usando signIn do next-auth/react no cliente.
 * 
 * Mantida apenas para referência, mas não deve ser usada.
 */

/**
 * FORGOT PASSWORD - Solicitar reset de senha
 * 
 * Gera token seguro e envia email (simulado por enquanto)
 */
export async function forgotPassword(
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = {
      email: formData.get("email") as string
    };

    const validated = forgotPasswordSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        reason: validated.error.errors[0]?.message ?? "Email inválido"
      };
    }

    const { email } = validated.data;

    // Rate limit: 3 tentativas por hora por email
    if (!checkRateLimit(`forgot:${email}`, 3, 60 * 60 * 1000)) {
      return {
        success: false,
        reason: "Muitas tentativas. Tente novamente mais tarde."
      };
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Mensagem genérica (não revela se email existe)
    if (!user) {
      return {
        success: true,
        data: {
          message:
            "Se o email existir, você receberá um link para redefinir sua senha."
        }
      };
    }

    // Gerar token seguro
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Expira em 1 hora

    // Salvar token no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires
      }
    });

    // Enviar email com link de reset (side-effect, não bloqueia o fluxo)
    sendResetPasswordEmail(email, token).catch((error) => {
      console.error("[auth] Erro ao enviar email de reset de senha:", error);
      // Não lança erro - email é side-effect
    });

    return {
      success: true,
      data: {
        message:
          "Se o email existir, você receberá um link para redefinir sua senha."
      }
    };
  } catch (error) {
    console.error("Forgot password error:", error);
    return {
      success: false,
      reason: "Erro ao processar solicitação. Tente novamente."
    };
  }
}

/**
 * RESET PASSWORD - Redefinir senha com token
 */
export async function resetPassword(
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = {
      token: formData.get("token") as string,
      password: formData.get("password") as string
    };

    const validated = resetPasswordSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        reason: validated.error.errors[0]?.message ?? "Dados inválidos"
      };
    }

    const { token, password } = validated.data;

    // Buscar usuário com token válido
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date() // Token não expirado
        }
      }
    });

    if (!user) {
      return {
        success: false,
        reason: "Token inválido ou expirado."
      };
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(password);

    // Atualizar senha e limpar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    return {
      success: true,
      data: { message: "Senha redefinida com sucesso." }
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      reason: "Erro ao redefinir senha. Tente novamente."
    };
  }
}

/**
 * UPDATE PROFILE - Atualizar perfil do usuário
 */
export async function updateProfile(
  formData: FormData,
  userId: string
): Promise<ActionResult> {
  try {
    const rawData = {
      name: formData.get("name") as string,
      accountType: formData.get("accountType") as "PF" | "PJ" | undefined
    };

    const validated = updateProfileSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        reason: validated.error.errors[0]?.message ?? "Dados inválidos"
      };
    }

    const { name, accountType } = validated.data;

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        ...(accountType && { accountType })
      }
    });

    return {
      success: true,
      data: { message: "Perfil atualizado com sucesso." }
    };
  } catch (error) {
    console.error("Update profile error:", error);
    return {
      success: false,
      reason: "Erro ao atualizar perfil. Tente novamente."
    };
  }
}

/**
 * CHANGE PASSWORD - Alterar senha do usuário autenticado
 */
export async function changePassword(
  formData: FormData,
  userId: string
): Promise<ActionResult> {
  try {
    const rawData = {
      currentPassword: formData.get("currentPassword") as string,
      newPassword: formData.get("newPassword") as string
    };

    const validated = changePasswordSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        reason: validated.error.errors[0]?.message ?? "Dados inválidos"
      };
    }

    const { currentPassword, newPassword } = validated.data;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.password) {
      return {
        success: false,
        reason: "Usuário não encontrado ou não possui senha cadastrada."
      };
    }

    // Verificar senha atual
    const isValid = await verifyPassword(currentPassword, user.password);

    if (!isValid) {
      return {
        success: false,
        reason: "Senha atual incorreta."
      };
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);

    // Atualizar senha
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return {
      success: true,
      data: { message: "Senha alterada com sucesso." }
    };
  } catch (error) {
    console.error("Change password error:", error);
    return {
      success: false,
      reason: "Erro ao alterar senha. Tente novamente."
    };
  }
}
