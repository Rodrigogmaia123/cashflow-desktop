"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db";

export async function completeOnboarding({ skip }: { skip: boolean }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingCompleted: true
      }
    });

    revalidatePath("/app");
  } catch (error) {
    console.error("Erro ao completar onboarding:", error);
    throw error;
  }
}
