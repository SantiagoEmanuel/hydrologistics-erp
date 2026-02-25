import { api } from "@/lib/api-client";
import { toast } from "sonner";

export type User = {
  id: string;
  fullName: string;
  username: string;
  role: "ADMIN" | "EMPLOYEE" | "DRIVER";
  password: string;
};

export const authService = {
  login: async ({ username, password }: Partial<User>): Promise<User> => {
    if (!password || !username) {
      toast.error("Error al iniciar sesión", {
        description: "Credenciales inválidas",
      });
      throw new Error("Credenciales inválidas");
    }

    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      toast.success("Sesión iniciada");
      return await res;
    } catch (error: any) {
      console.error({ error: error.message });
      throw new Error("Error al iniciar sesión");
    }
  },

  logout: async (): Promise<void> => {
    try {
      const res = await api(`/auth/logout`, {
        method: "POST",
      });

      toast.success("Sesión cerrada");
      await cookieStore.delete("auth_token");
      return await res;
    } catch (error: any) {
      console.error({ error: error.message });
      throw new Error("Error al cerrar sesión");
    }
  },

  register: async ({
    username,
    fullName,
    password,
    role,
  }: Partial<User>): Promise<User> => {
    if (!username || !fullName || !password) {
      toast.error("Datos insuficientes", {
        description: "Completa todos los campos",
      });
    }

    try {
      const res = await api(`/auth/register`, {
        method: "POST",
        body: JSON.stringify({
          username,
          fullName,
          password,
          role,
        }),
      });

      if (!res.ok) {
        toast.error("Error al crear el usuario", {
          description: "No se pudo crear el usuario, inténtalo más tarde",
        });
        throw new Error("Erro al crear el usuario");
      }

      toast.success("Usuario creado");
      return await res;
    } catch (error: any) {
      console.error({ error: error.message });
      toast.error("Error al crear el usuario", {
        description: "No se pudo crear el usuario, inténtalo más tarde",
      });
      throw new Error("Erro al crear el usuario");
    }
  },

  me: async (): Promise<User> => {
    try {
      const res = await api(`/auth/me`, {});

      toast.success("Sesión iniciada", {
        description: "Se a iniciado automáticamente la sesión",
      });
      return await res;
    } catch (error: any) {
      console.error({
        error: error.message,
      });

      toast.error("Fallo al iniciar sesión", {
        description: "No se pudo iniciar sesión automáticamente",
      });
      throw new Error("Error al obtener el usuario");
    }
  },
};
