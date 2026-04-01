import type { AuthState } from "@Auth/types/store";
import { toast } from "sonner";
import { create } from "zustand";
import { authApi } from "../api/auth";
import { isValidPassword, isValidString } from "../utils/manageString";
import { clearUserState, getUserState } from "../utils/manageUserState";

export const authStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  updateLoadingStatus: () => {
    set((prev) => ({
      isLoading: !prev.isLoading,
    }));
  },
  restoreSession: async () => {
    const lastUserData = getUserState();
    get().updateLoadingStatus();
    set(() => ({
      user: lastUserData,
    }));

    try {
      const response = await authApi.restoreSession();

      if (!response) {
        toast.error("Sesión caducada", {
          description: "Debes volver a iniciar sesión",
        });
        set(() => ({
          user: null,
        }));
        clearUserState();
        return;
      }

      set(() => ({
        user: response,
      }));
      toast.success(`Bienvenido, ${response.fullName}`, {
        description: "Tu sesión ha sido restaurada exitosamente",
      });
    } catch (error: any) {
      toast.error("Sesión caducada", {
        description: "Debes volver a iniciar sesión",
      });
      set(() => ({
        user: null,
      }));
      clearUserState();
      throw new Error("Sesión caducada");
    } finally {
      get().updateLoadingStatus();
    }
  },
  login: async (userData) => {
    get().updateLoadingStatus();

    if (
      !isValidString(userData.username) ||
      !isValidPassword(userData.password)
    ) {
      toast.error("Los datos son inválidos", {
        description:
          "Recordatorio: La contraseña debe tener al menos 4 caracteres, debe tener al menos una letra mayúscula, una letra minúscula y un número",
      });
      get().updateLoadingStatus();

      return;
    }

    try {
      const response = await authApi.login(userData);

      if (!response) {
        toast.error("Error al iniciar sesión", {
          description: "Tus credenciales son incorrectas",
        });
        return;
      }

      set(() => ({
        user: response,
      }));
      toast.success(`Bienvenido, ${response.fullName}`);
    } catch (error: any) {
      toast.error("Error al iniciar sesión", {
        description: error.message || "Ocurrió un error inesperado",
      });
    } finally {
      get().updateLoadingStatus();
    }
  },
  register: async (userData) => {
    try {
      const response = await authApi.register(userData);

      if (!response) {
        toast.error("No se pudo crear el usuario", {
          description: "Inténtalo nuevamente más tarde",
        });
      }

      set(() => ({
        user: response,
      }));
      toast.success("Usuario creado con éxito");
    } catch (error: any) {
      toast.error("Error al crear el usuario", {
        description: "Inténtalo nuevamente más tarde",
      });
    } finally {
      get().updateLoadingStatus();
    }
  },
  logout: async () => {
    try {
      authApi.logout();
      set(() => ({
        user: null,
      }));
      clearUserState();
      toast.success("Sesión cerrada", {
        description: "Has cerrado sesión exitosamente",
      });
    } catch (error: any) {
      toast.error("No hay sesión activa");
    }
  },
}));
