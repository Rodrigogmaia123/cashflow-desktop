import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import {
  getNotificationById,
  updateNotificationStatus,
  deleteNotification,
} from "@/lib/domain/notification";
import { updateNotificationStatusSchema } from "@/types/notification";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/notifications/[id] - Get single notification
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const workspaceId = await requireActiveWorkspaceId();
    const params = await context.params;
    const notificationId = params.id;

    const notification = await getNotificationById(notificationId, workspaceId);

    if (!notification) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching notification:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar notificação" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/[id] - Update notification status
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const workspaceId = await requireActiveWorkspaceId();
    const params = await context.params;
    const notificationId = params.id;
    const body = await request.json();

    const input = updateNotificationStatusSchema.parse(body);

    const notification = await updateNotificationStatus(
      notificationId,
      workspaceId,
      input
    );

    return NextResponse.json({ notification }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar notificação" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const workspaceId = await requireActiveWorkspaceId();
    const params = await context.params;
    const notificationId = params.id;

    await deleteNotification(notificationId, workspaceId);

    return NextResponse.json(
      { message: "Notificação deletada com sucesso" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao deletar notificação" },
      { status: 500 }
    );
  }
}
