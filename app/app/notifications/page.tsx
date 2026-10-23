import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { NotificationPanel } from "@/components/notifications/notification-panel";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await requireActiveWorkspaceId();

  return <NotificationPanel />;
}
