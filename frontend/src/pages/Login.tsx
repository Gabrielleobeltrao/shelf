import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authClient, signIn, signUp, useSession } from "../lib/auth-client";
import { useI18n } from "../lib/i18n";
import { ShelfLogo } from "../components/icons";
import { Checkbox } from "../components/ui/Checkbox";

export function Login() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { data: session } = useSession();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("signup") != null ? "signup" : "signin",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Leave the login screen as soon as a session exists — whether we just
  // signed in/up or arrived here already logged in. Redirecting off the
  // reactive session (instead of only right after the request) avoids the
  // race where a protected route still sees us as logged out.
  useEffect(() => {
    if (session) navigate("/estoque", { replace: true });
  }, [session, navigate]);

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

    if (authError) {
      setLoading(false);
      setError(authError.message ?? t.auth.cannotContinue);
      return;
    }

    // Make sure the reactive session is populated before we move on, so the
    // protected route sees us as logged in on the first try.
    await authClient.getSession();
    navigate("/estoque", { replace: true });
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <ShelfLogo className="h-12 w-12" />
        <div>
          <h1 className="font-display text-xl font-bold">
            {mode === "signin" ? t.auth.welcomeBack : t.auth.signup}
          </h1>
          {mode === "signin" && <p className="mt-1 text-sm text-muted">{t.auth.tagline}</p>}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-line p-6"
      >
        {mode === "signup" && (
          <input
            type="text"
            name="name"
            autoComplete="name"
            placeholder={t.auth.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl bg-surface-2 px-3 py-2 text-base"
          />
        )}

        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder={t.auth.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl bg-surface-2 px-3 py-2 text-base"
        />

        <input
          type="password"
          name="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder={t.auth.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-xl bg-surface-2 px-3 py-2 text-base"
        />

        {mode === "signin" && (
          <Checkbox
            checked={rememberMe}
            onChange={setRememberMe}
            label={t.auth.keepConnected}
          />
        )}

        {error && <p className="text-sm text-rust-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary-600 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {loading ? t.auth.wait : mode === "signin" ? t.auth.signin : t.auth.signup}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-center text-sm text-muted"
        >
          {mode === "signin" ? t.auth.noAccount : t.auth.haveAccount}
        </button>
      </form>
    </div>
  );
}
