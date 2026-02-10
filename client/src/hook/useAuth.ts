import { useAuthStore } from "@/store/useAuthStore";

export function useAuth() {
  const { user, login, logout, register, isLoading, checkAuth } =
    useAuthStore();

  return {
    user,
    login,
    logout,
    register,
    isLoading,
    checkAuth,
  };
}
