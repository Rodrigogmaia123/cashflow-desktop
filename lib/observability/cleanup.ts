import { prisma } from "@/lib/db";

/**
 * Remove métricas antigas baseado em TTL.
 * @param days Número de dias de retenção
 * @returns Número de métricas removidas
 */
export async function cleanupOldMetrics(days: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  try {
    const result = await prisma.metricEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error("[CLEANUP] Failed to cleanup old metrics:", error);
    throw error;
  }
}
