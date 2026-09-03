import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { postAuthAppPath } from "@/lib/ops";

export default async function AppHomePage() {
  const user = await getCurrentUser();
  redirect(postAuthAppPath(user));
}
