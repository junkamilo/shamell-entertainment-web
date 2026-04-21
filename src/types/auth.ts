export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "viewer";
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
