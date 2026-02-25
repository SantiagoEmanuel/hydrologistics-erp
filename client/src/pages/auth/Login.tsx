import { useAuth } from "@/hook/useAuth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function Login() {
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(credentials);
  };
  return (
    <div className="flex h-full w-full items-center justify-center rounded-md bg-gray-200 p-4">
      <form
        onSubmit={handleLogin}
        className="flex h-full max-h-150 w-full max-w-150 rounded-md bg-white p-8 shadow-md"
      >
        <div className="flex flex-1 flex-col justify-around gap-4">
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <div className="flex flex-1 flex-col justify-center gap-4">
            <label className="input-animated">
              <input
                type="text"
                name="username"
                required
                value={credentials.username}
                className="lowercase"
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    username: e.target.value.trim().toLowerCase(),
                  })
                }
              />
              <span>Usuario</span>
            </label>
            <label className="input-animated">
              <input
                type="password"
                name="password"
                required
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    password: e.target.value.trim(),
                  })
                }
              />
              <span>Contraseña</span>
            </label>

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
    </div>
  );
}
