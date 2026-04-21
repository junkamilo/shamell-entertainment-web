import { apiClient } from "./api-client";
import type { AuthUser, LoginCredentials } from "@/types/auth";

export const authService = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<{ success: boolean }>("/api/auth/login", credentials),

  logout: () => apiClient.post<{ success: boolean }>("/api/auth/logout", {}),

  me: () => apiClient.get<{ user: AuthUser }>("/api/auth/me"),
};
