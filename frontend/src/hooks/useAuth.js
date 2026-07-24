import { useAuthStore } from "../store/auth.store";

export function useAuth() {
  const { employee, token, isAuthenticated, login, logout, fetchUserProfile } = useAuthStore();
  return { employee, token, isAuthenticated, login, logout, fetchUserProfile };
}
