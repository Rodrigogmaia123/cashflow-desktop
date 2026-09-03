import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { NotificationPanel } from "@/components/notifications/notification-panel";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const workspaceId = await requireActiveWorkspaceId();

  return (
    <div className="container mx-auto px-4 py-8">
      <NotificationPanel />
    </div>
  );
}
