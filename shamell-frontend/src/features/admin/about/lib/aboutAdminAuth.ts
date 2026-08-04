import { getAdminBearerToken as readAdminBearerToken } from "@/lib/admin/auth";
import { toast } from "@/hooks/use-toast";

/** About module: shows toast when session is missing (legacy behavior). */
export function getAdminBearerToken(): string | null {
  const token = readAdminBearerToken();
  if (!token) {
    toast({
      variant: "destructive",
      title: "Sign-in required",
      description: "You must sign in as an admin.",
    });
    return null;
  }
  return token;
}
