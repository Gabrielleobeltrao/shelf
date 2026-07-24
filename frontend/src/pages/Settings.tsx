import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  changeEmail,
  changePassword,
  deleteUser,
  updateUser,
  useSession,
} from "../lib/auth-client";
import { api } from "../lib/api";
import { Switch } from "../components/ui/Switch";
import { NutritionFieldsModal } from "../components/settings/NutritionFieldsModal";
import { TrashIcon } from "../components/icons";

export function Settings() {
  const navigate = useNavigate();
  const { data: session } = useSession();

  const [settings, setSettings] = useState({
    trackExpiration: false,
    trackNutrition: false,
    nutritionFields: [] as string[],
    trackGlutenFree: false,
    trackVegan: false,
  });
  const [nutritionModalOpen, setNutritionModalOpen] = useState(false);

  useEffect(() => {
    api.get<typeof settings>("/api/settings").then(setSettings);
  }, []);

  async function handleToggle(key: "trackExpiration" | "trackGlutenFree" | "trackVegan", value: boolean) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    await api.patch("/api/settings", { [key]: value });
  }

  async function handleToggleNutrition(value: boolean) {
    setSettings((prev) => ({ ...prev, trackNutrition: value }));
    await api.patch("/api/settings", { trackNutrition: value });
    if (value) setNutritionModalOpen(true);
  }

  async function handleSaveNutritionFields(selected: string[]) {
    setSettings((prev) => ({ ...prev, nutritionFields: selected }));
    await api.patch("/api/settings", { trackNutrition: true, nutritionFields: selected });
    setNutritionModalOpen(false);
  }

  const [name, setName] = useState(session?.user.name ?? "");
  const [nameStatus, setNameStatus] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);

  const [email, setEmail] = useState(session?.user.email ?? "");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameSaving(true);
    setNameStatus(null);

    const { error } = await updateUser({ name: name.trim() });

    setNameSaving(false);
    setNameStatus(error ? error.message ?? "Não foi possível salvar." : "Nome atualizado.");
  }

  async function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailSaving(true);
    setEmailStatus(null);

    const { error } = await changeEmail({ newEmail: email.trim() });

    setEmailSaving(false);
    setEmailStatus(error ? error.message ?? "Não foi possível salvar." : "E-mail atualizado.");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordStatus(null);

    const { error } = await changePassword({ currentPassword, newPassword });

    setPasswordSaving(false);
    if (error) {
      setPasswordStatus(error.message ?? "Não foi possível trocar a senha.");
      return;
    }
    setPasswordStatus("Senha alterada.");
    setCurrentPassword("");
    setNewPassword("");
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleting(true);
    setDeleteStatus(null);

    const { error } = await deleteUser({ password: deletePassword });

    if (error) {
      setDeleting(false);
      setDeleteStatus(error.message ?? "Não foi possível excluir a conta.");
      return;
    }

    navigate("/login", { replace: true });
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-lg font-semibold">Configurações</h1>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted">Preferências</h2>
        <Switch
          checked={settings.trackExpiration}
          onChange={(value) => handleToggle("trackExpiration", value)}
          label="Data de validade"
          description="Adiciona um campo de validade nos itens do estoque."
        />
        <div>
          <Switch
            checked={settings.trackNutrition}
            onChange={handleToggleNutrition}
            label="Informações nutricionais"
            description="Escolha quais dados (açúcar, sódio, etc.) aparecem nos itens do estoque."
          />
          {settings.trackNutrition && (
            <button
              type="button"
              onClick={() => setNutritionModalOpen(true)}
              className="mt-1 text-sm font-medium text-primary-600"
            >
              Editar campos
            </button>
          )}
        </div>
        <Switch
          checked={settings.trackGlutenFree}
          onChange={(value) => handleToggle("trackGlutenFree", value)}
          label="Sem glúten"
          description="Adiciona uma marcação de sem glúten nos itens do estoque."
        />
        <Switch
          checked={settings.trackVegan}
          onChange={(value) => handleToggle("trackVegan", value)}
          label="Vegano"
          description="Adiciona uma marcação de vegano nos itens do estoque."
        />
      </div>

      <form onSubmit={handleSaveName} className="space-y-2 border-t border-line pt-6">
        <label className="text-sm font-medium">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg bg-surface-2 px-3 py-2 text-base"
        />
        {nameStatus && <p className="text-sm text-muted">{nameStatus}</p>}
        <button
          type="submit"
          disabled={nameSaving}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {nameSaving ? "Salvando..." : "Salvar nome"}
        </button>
      </form>

      <form onSubmit={handleSaveEmail} className="space-y-2 border-t border-line pt-6">
        <label className="text-sm font-medium">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg bg-surface-2 px-3 py-2 text-base"
        />
        {emailStatus && <p className="text-sm text-muted">{emailStatus}</p>}
        <button
          type="submit"
          disabled={emailSaving}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {emailSaving ? "Salvando..." : "Salvar e-mail"}
        </button>
      </form>

      <form
        onSubmit={handleChangePassword}
        className="space-y-2 border-t border-line pt-6"
      >
        <label className="text-sm font-medium">Trocar senha</label>
        <input
          type="password"
          placeholder="Senha atual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="w-full rounded-lg bg-surface-2 px-3 py-2 text-base"
        />
        <input
          type="password"
          placeholder="Nova senha"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-lg bg-surface-2 px-3 py-2 text-base"
        />
        {passwordStatus && <p className="text-sm text-muted">{passwordStatus}</p>}
        <button
          type="submit"
          disabled={passwordSaving}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {passwordSaving ? "Salvando..." : "Trocar senha"}
        </button>
      </form>

      <div className="space-y-2 border-t border-line pt-6">
        <label className="text-sm font-medium text-rust-600">Excluir conta</label>
        <p className="text-sm text-muted">
          Remove sua conta e todo o seu estoque e receitas permanentemente.
        </p>

        {confirmingDelete ? (
          <form onSubmit={handleDeleteAccount} className="space-y-2">
            <input
              type="password"
              placeholder="Confirme sua senha"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg bg-surface-2 px-3 py-2 text-base"
            />
            {deleteStatus && <p className="text-sm text-rust-600">{deleteStatus}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 rounded-lg border border-line py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={deleting}
                className="flex-1 rounded-lg bg-rust-600 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {deleting ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-2 rounded-lg border border-rust-600 px-4 py-2 text-sm font-medium text-rust-600"
          >
            <TrashIcon className="h-4 w-4" />
            Excluir conta
          </button>
        )}
      </div>

      {nutritionModalOpen && (
        <NutritionFieldsModal
          selected={settings.nutritionFields}
          onClose={() => setNutritionModalOpen(false)}
          onSave={handleSaveNutritionFields}
        />
      )}
    </div>
  );
}
