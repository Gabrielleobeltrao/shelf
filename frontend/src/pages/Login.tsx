import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signUp } from "../lib/auth-client";
import { PantryShelfIllustration } from "../components/illustrations";

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Lê os valores reais do formulário: se o navegador preencheu os
    // campos via autofill sem disparar onChange, o estado do React ainda
    // estaria vazio e o próximo render "limparia" os inputs visualmente.
    const formData = new FormData(e.currentTarget);
    const nameValue = String(formData.get("name") ?? "");
    const emailValue = String(formData.get("email") ?? "");
    const passwordValue = String(formData.get("password") ?? "");

    setName(nameValue);
    setEmail(emailValue);
    setPassword(passwordValue);
    setError(null);
    setLoading(true);

    const { error: authError } =
      mode === "signin"
        ? await signIn.email({ email: emailValue, password: passwordValue, rememberMe })
        : await signUp.email({ name: nameValue, email: emailValue, password: passwordValue });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? "Não foi possível continuar.");
      return;
    }

    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <PantryShelfIllustration className="h-28 w-auto" />
        <div>
          <h1 className="font-display text-xl font-semibold">
            {mode === "signin" ? "Bem-vindo de volta" : "Criar conta"}
          </h1>
          {mode === "signin" && (
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Sua cozinha organizada te espera.
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-stone-200 p-6 dark:border-stone-800"
      >
        {mode === "signup" && (
          <input
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
          />
        )}

        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
        />

        <input
          type="password"
          name="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
        />

        {mode === "signin" && (
          <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 dark:border-stone-700"
            />
            Manter conectado
          </label>
        )}

        {error && <p className="text-sm text-rust-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-600 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-center text-sm text-stone-500 dark:text-stone-400"
        >
          {mode === "signin"
            ? "Não tem conta? Criar agora"
            : "Já tem conta? Entrar"}
        </button>
      </form>
    </div>
  );
}
