import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { markAllAsRead } from "@/lib/domain/notification";

// POST /api/notifications/mark-all-read - Mark all as read
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const workspaceId = await requireActiveWorkspaceId();
    const userId = user.id;

    const count = await markAllAsRead(workspaceId, userId);

    return NextResponse.json(
      { message: `${count} notificações marcadas como lidas`, count },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error marking all as read:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao marcar notificações" },
      { status: 500 }
    );
  }
}
