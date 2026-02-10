import { authService, type User } from "@/services/auth.service";
import { toast } from "sonner";
import { create } from "zustand";

interface useAuthStore {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  login: ({ username, password }: Partial<User>) => Promise<boolean>;
  register: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  me: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<useAuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.me();

      set({
        user,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      set({
        user: null,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  login: async ({ username, password }) => {
    set(() => ({ isLoading: true }));
    try {
      const data = await authService.login({ username, password });
      if (!data) {
        return false;
      }
      set(() => ({
        isLoading: false,
        user: data,
      }));
      return true;
    } catch (error) {
      toast.error(error.message);
      set(() => ({
        isLoading: false,
      }));
      return false;
    }
  },
  register: async (user) => {
    set(() => ({
      isLoading: true,
    }));

    try {
      const response = await authService.register(user);

      if (!response) {
        throw new Error("No se pudo crear el usuario");
      }

      set(() => ({
        user: response,
      }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      set(() => ({
        isLoading: false,
      }));
    }
  },
  logout: async () => {
    set(() => ({
      user: null,
    }));
  },
  me: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.me();
      set({ user, isLoading: false });
    } catch (error) {
      // Si falla /me (ej: token expirado), limpiamos usuario
      set({ user: null, isLoading: false });
    }
  },
}));
