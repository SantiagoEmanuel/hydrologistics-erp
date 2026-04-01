import { authStore } from "@Auth/store/auth";
import type { UserLogin } from "@Auth/types/user";
import { Input } from "@UI/Input";
import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";

export default function Form() {
  const [credentials, setCredentials] = useState<UserLogin>({
    username: "",
    password: "",
  });

  const { login, isLoading, user } = authStore();

  if (user) {
    return <Navigate to={"/"} replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    login(credentials);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex h-full max-h-150 w-full max-w-150 rounded-md bg-white p-8 shadow-md"
      >
        <div className="flex flex-1 flex-col justify-around gap-4">
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <div className="flex flex-1 flex-col justify-center gap-4">
            <Input
              label="Usuario"
              type="text"
              name="username"
              className="lowercase"
              value={credentials.username}
              onChange={(e) => {
                setCredentials({
                  ...credentials,
                  [e.target.name]: e.target.value.toLocaleLowerCase(),
                });
              }}
            />
            <Input
              label="Contraseña"
              type="password"
              name="password"
              className="lowercase"
              value={credentials.password}
              onChange={(e) => {
                setCredentials({
                  ...credentials,
                  [e.target.name]: e.target.value,
                });
              }}
            />
            <button
              className="button-animated relative flex items-center justify-center rounded-xl bg-sky-400 py-4 transition-all hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Iniciando...
                </span>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
