const API_URL = import.meta.env.VITE_API_URL;

type FetchOptions = RequestInit & {};

export const api = async (endpoint: string, options: FetchOptions = {}) => {
  const { headers, ...rest } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (response.status === 401) {
    throw new Error("Sesión expirada");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error en la petición");
  }

  return response.json();
};
