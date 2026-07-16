import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signUp } from "../lib/auth-client";

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } =
      mode === "signin"
        ? await signIn.email({ email, password, rememberMe })
        : await signUp.email({ name, email, password });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? "Não foi possível continuar.");
      return;
    }

    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 p-6 dark:border-gray-800"
      >
        <h1 className="text-xl font-semibold">
          {mode === "signin" ? "Entrar" : "Criar conta"}
        </h1>

        {mode === "signup" && (
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
          />
        )}

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />

        {mode === "signin" && (
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
            />
            Manter conectado
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-center text-sm text-gray-500 dark:text-gray-400"
        >
          {mode === "signin"
            ? "Não tem conta? Criar agora"
            : "Já tem conta? Entrar"}
        </button>
      </form>
    </div>
  );
}
