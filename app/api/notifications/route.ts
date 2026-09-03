import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import {
  listNotifications,
  createNotification,
  getNotificationStats,
  markAllAsRead,
} from "@/lib/domain/notification";
import {
  notificationFiltersSchema,
  createNotificationSchema,
} from "@/types/notification";

// GET /api/notifications - List notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const workspaceId = await requireActiveWorkspaceId();

    const { searchParams } = new URL(request.url);
    const filters = notificationFiltersSchema.parse({
      workspaceId,
      userId: searchParams.get("userId") || user.id,
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 50,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : 0,
    });

    const notifications = await listNotifications(filters);

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error: any) {
    console.error("Error listing notifications:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao listar notificações" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create notification (manual)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const workspaceId = await requireActiveWorkspaceId();
    const body = await request.json();

    const input = createNotificationSchema.parse({
      ...body,
      workspaceId,
    });

    const notification = await createNotification(input);

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar notificação" },
      { status: 500 }
    );
  }
}
