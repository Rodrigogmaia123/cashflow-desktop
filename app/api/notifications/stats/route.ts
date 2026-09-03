import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { getNotificationStats } from "@/lib/domain/notification";

// GET /api/notifications/stats - Get notification statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const workspaceId = await requireActiveWorkspaceId();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || user.id;

    const stats = await getNotificationStats(workspaceId, userId);

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching notification stats:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
