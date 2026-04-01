import { api } from "@/lib/api-client";
import type { User, UserLogin, UserRegister } from "@Auth/types/user";

export interface AuthApi {
  login: (userData: UserLogin) => Promise<User | null>;
  register: (userData: UserRegister) => Promise<User | null>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<User | null>;
}

export const authApi: AuthApi = {
  login: async (userData) => {
    try {
      const response = await api("auth/login", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      return response;
    } catch (error: any) {
      throw new Error(
        error.message || "Ha ocurrido un error, inténtelo más tarde",
      );
    }
  },
  register: async (userData) => {
    try {
      const response = await api("auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      return response;
    } catch (error: any) {
      throw new Error(
        error.message || "Ha ocurrido un error, inténtelo más tarde",
      );
    }
  },
  restoreSession: async () => {
    try {
      const response = await api("auth/restore-session");

      if (!response) {
        throw new Error("Ha ocurrido un error, inténtalo de nuevo");
      }
      return response;
    } catch (error: any) {
      throw new Error(
        error.message || "Ha ocurrido un error, inténtelo más tarde",
      );
    }
  },
  logout: async () => {
    try {
      await api("auth/logout", {
        method: "POST",
      });
    } catch (error: any) {
      throw new Error(
        error.message || "Ha ocurrido un error, inténtelo más tarde",
      );
    }
  },
};
