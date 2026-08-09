import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser, updateUser, useSession } from "../lib/auth-client";
import { api } from "../lib/api";
import { Switch } from "../components/ui/Switch";
import { NutritionFieldsModal } from "../components/settings/NutritionFieldsModal";
import { SharedPantryCard } from "../components/settings/SharedPantryCard";
import { InstallCard } from "../components/settings/InstallCard";
import { ThemeToggle } from "../components/settings/ThemeToggle";
import { LanguageSelect } from "../components/ui/LanguageSelect";
import { MinusIcon, PlusIcon, TrashIcon } from "../components/icons";
import { useI18n } from "../lib/i18n";

export function Settings() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const { t } = useI18n();

  const [settings, setSettings] = useState({
    trackExpiration: false,
    expiryAlertDays: 7,
    trackNutrition: false,
    nutritionFields: [] as string[],
    trackGlutenFree: false,
    trackVegan: false,
    pantryVisibility: "private" as "private" | "followers" | "public",
  });
  const [nutritionModalOpen, setNutritionModalOpen] = useState(false);

  async function handlePantryVisibility(value: "private" | "followers" | "public") {
    setSettings((prev) => ({ ...prev, pantryVisibility: value }));
    await api.patch("/api/settings", { pantryVisibility: value });
  }

  useEffect(() => {
    api.get<typeof settings>("/api/settings").then(setSettings);
  }, []);

  async function handleToggle(key: "trackExpiration" | "trackGlutenFree" | "trackVegan", value: boolean) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    await api.patch("/api/settings", { [key]: value });
  }

  async function handleSetDays(days: number) {
    const clamped = Math.max(1, Math.min(30, days));
    setSettings((prev) => ({ ...prev, expiryAlertDays: clamped }));
    await api.patch("/api/settings", { expiryAlertDays: clamped });
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
    setNameStatus(error ? error.message ?? t.settings.cannotSave : t.settings.nameUpdated);
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleting(true);
    setDeleteStatus(null);

    const { error } = await deleteUser({ password: deletePassword });

    if (error) {
      setDeleting(false);
      setDeleteStatus(error.message ?? t.settings.cannotDelete);
      return;
    }

    navigate("/login", { replace: true });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">{t.settings.title}</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <InstallCard />

      <div className="space-y-4 rounded-2xl bg-surface-2 p-4">
        <h2 className="text-sm font-medium text-muted">{t.settings.preferences}</h2>
        <div>
          <Switch
            checked={settings.trackExpiration}
            onChange={(value) => handleToggle("trackExpiration", value)}
            label={t.settings.expirationLabel}
            description={t.settings.expirationDesc}
          />
          {settings.trackExpiration && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t.settings.expiryDaysLabel}</p>
                <p className="text-xs text-muted">{t.settings.expiryDaysDesc}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetDays(settings.expiryAlertDays - 1)}
                  disabled={settings.expiryAlertDays <= 1}
                  aria-label={t.common.remove}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface disabled:opacity-40"
                >
                  <MinusIcon className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-16 text-center text-sm tabular-nums">
                  {t.settings.days(settings.expiryAlertDays)}
                </span>
                <button
                  type="button"
                  onClick={() => handleSetDays(settings.expiryAlertDays + 1)}
                  disabled={settings.expiryAlertDays >= 30}
                  aria-label={t.common.add}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface disabled:opacity-40"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
        <div>
          <Switch
            checked={settings.trackNutrition}
            onChange={handleToggleNutrition}
            label={t.settings.nutritionLabel}
            description={t.settings.nutritionDesc}
          />
          {settings.trackNutrition && (
            <button
              type="button"
              onClick={() => setNutritionModalOpen(true)}
              className="mt-1 text-sm font-medium text-primary-600"
            >
              {t.settings.editFields}
            </button>
          )}
        </div>
        <Switch
          checked={settings.trackGlutenFree}
          onChange={(value) => handleToggle("trackGlutenFree", value)}
          label={t.settings.glutenLabel}
          description={t.settings.glutenDesc}
        />
        <Switch
          checked={settings.trackVegan}
          onChange={(value) => handleToggle("trackVegan", value)}
          label={t.settings.veganLabel}
          description={t.settings.veganDesc}
        />
      </div>

      <SharedPantryCard />

      <div className="space-y-2 rounded-2xl bg-surface-2 p-4">
        <label className="text-sm font-medium">{t.social.pantryVisibility}</label>
        <div className="flex rounded-full bg-surface p-1">
          {(["private", "followers", "public"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handlePantryVisibility(v)}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                settings.pantryVisibility === v ? "bg-ink text-surface" : "text-muted"
              }`}
            >
              {v === "private"
                ? t.social.pantryPrivate
                : v === "followers"
                  ? t.social.pantryFollowers
                  : t.social.pantryPublic}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-2xl bg-surface-2 p-4">
        <label className="text-sm font-medium">{t.theme.label}</label>
        <ThemeToggle />
      </div>

      <div className="space-y-2 rounded-2xl bg-surface-2 p-4">
        <label className="text-sm font-medium">{t.settings.language}</label>
        <LanguageSelect className="w-full" />
      </div>

      <form onSubmit={handleSaveName} className="space-y-2 rounded-2xl bg-surface-2 p-4">
        <label className="text-sm font-medium">{t.settings.name}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg bg-surface px-3 py-2 text-base"
        />
        {nameStatus && <p className="text-sm text-muted">{nameStatus}</p>}
        <button
          type="submit"
          disabled={nameSaving}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {nameSaving ? t.common.saving : t.settings.saveName}
        </button>
      </form>

      <div className="space-y-2 rounded-2xl bg-surface-2 p-4">
        <p className="text-sm font-medium">{t.settings.email}</p>
        <p className="truncate rounded-lg bg-surface px-3 py-2 text-base text-muted">
          {session?.user.email}
        </p>
      </div>

      <div className="space-y-2 rounded-2xl bg-surface-2 p-4">
        <label className="text-sm font-medium text-rust-600">{t.settings.deleteAccount}</label>
        <p className="text-sm text-muted">
          {t.settings.deleteAccountDesc}
        </p>

        {confirmingDelete ? (
          <form onSubmit={handleDeleteAccount} className="space-y-2">
            <input
              type="password"
              placeholder={t.settings.confirmPassword}
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg bg-surface px-3 py-2 text-base"
            />
            {deleteStatus && <p className="text-sm text-rust-600">{deleteStatus}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 rounded-lg border border-line py-2 text-sm font-medium"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={deleting}
                className="flex-1 rounded-lg bg-rust-600 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {deleting ? t.common.deleting : t.settings.deleteConfirm}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-2 rounded-lg border border-rust-600 px-4 py-2 text-sm font-medium text-rust-600"
          >
            <TrashIcon className="h-4 w-4" />
            {t.settings.deleteAccount}
          </button>
        )}
      </div>
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
