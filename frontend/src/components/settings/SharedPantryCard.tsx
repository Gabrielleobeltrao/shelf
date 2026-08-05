import { useEffect, useState } from "react";
import { describeActivity, householdApi, type ActivityEntry, type Household } from "../../lib/household";
import { useI18n } from "../../lib/i18n";
import { CheckIcon, CloseIcon, PencilIcon } from "../icons";

export function SharedPantryCard() {
  const { t, lang } = useI18n();
  const [household, setHousehold] = useState<Household | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([householdApi.get(), householdApi.activity().catch(() => [])])
      .then(([h, a]) => {
        setHousehold(h);
        setActivity(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const timeFmt = (iso: string) =>
    new Date(iso).toLocaleString(lang === "pt" ? "pt-BR" : "en-US", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  async function handleRename() {
    const name = nameDraft.trim();
    if (!name) return;
    setHousehold(await householdApi.rename(name));
    setEditingName(false);
  }

  // Switching the active space changes what the whole app shows (pantry,
  // list, alerts), so reload to pick it up everywhere consistently.
  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim();
    if (!code || busy) return;
    setBusy(true);
    setJoinError(null);
    try {
      await householdApi.join(code);
      window.location.reload();
    } catch {
      setJoinError(t.household.joinError);
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    try {
      await householdApi.leave();
      window.location.reload();
    } catch {
      setBusy(false);
    }
  }

  async function handleRemove(userId: string) {
    setHousehold(await householdApi.removeMember(userId).then(householdApi.get));
  }

  async function handleRotate() {
    setHousehold(await householdApi.rotateCode());
  }

  function handleCopy() {
    if (!household) return;
    navigator.clipboard?.writeText(household.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4 rounded-2xl bg-surface-2 p-4">
      <h2 className="text-sm font-medium text-muted">{t.household.title}</h2>

      {loading || !household ? (
        <p className="text-sm text-muted">{t.common.loading}</p>
      ) : (
        <>
          {/* Space name + which space you're in */}
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={60}
                  className="min-w-0 flex-1 rounded-lg bg-surface px-3 py-1.5 text-sm"
                />
                <button onClick={handleRename} aria-label={t.household.save} className="text-primary-600">
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingName(false)} aria-label={t.common.close} className="text-muted">
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold">{household.name}</p>
                {household.role === "owner" && (
                  <button
                    onClick={() => {
                      setNameDraft(household.name);
                      setEditingName(true);
                    }}
                    aria-label={t.household.rename}
                    className="text-muted"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            <p className="mt-0.5 text-xs text-muted">
              {household.isHome ? t.household.personalSpace : t.household.sharedSpace}
            </p>
          </div>

          {/* Members */}
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              {t.household.members}
            </p>
            <ul className="space-y-1">
              {household.members.map((m) => (
                <li key={m.userId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    {m.name}
                    {m.isYou && <span className="text-muted"> ({t.household.you})</span>}
                    <span className="text-muted">
                      {" · "}
                      {m.role === "owner" ? t.household.owner : t.household.member}
                    </span>
                  </span>
                  {household.role === "owner" && !m.isYou && m.role !== "owner" && (
                    <button
                      onClick={() => handleRemove(m.userId)}
                      aria-label={t.household.removeAria(m.name)}
                      className="shrink-0 text-rust-600"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Invite code */}
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
              {t.household.inviteLabel}
            </p>
            <div className="flex items-center gap-2">
              <span className="flex-1 rounded-lg bg-surface px-3 py-2 font-mono text-base font-semibold tracking-widest">
                {household.inviteCode}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg bg-surface px-3 py-2 text-sm font-medium text-primary-600"
              >
                {copied ? t.household.copied : t.household.copy}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">{t.household.inviteHint}</p>
            {household.role === "owner" && (
              <button onClick={handleRotate} className="mt-1 text-xs font-medium text-primary-600">
                {t.household.newCode}
              </button>
            )}
          </div>

          {/* Join another space */}
          <form onSubmit={handleJoin} className="border-t border-line pt-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              {t.household.joinLabel}
            </p>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder={t.household.codePlaceholder}
                maxLength={12}
                className="min-w-0 flex-1 rounded-lg bg-surface px-3 py-2 text-sm uppercase tracking-widest"
              />
              <button
                type="submit"
                disabled={busy || !joinCode.trim()}
                className="shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {t.household.joinBtn}
              </button>
            </div>
            {joinError && <p className="mt-1 text-xs text-rust-600">{joinError}</p>}
          </form>

          {/* Leave — only when in a shared (non-home) space */}
          {!household.isHome && (
            <button
              onClick={handleLeave}
              disabled={busy}
              className="w-full rounded-lg py-2 text-sm font-medium text-rust-600 disabled:opacity-50"
            >
              {t.household.leave}
            </button>
          )}

          {/* Change history */}
          <div className="border-t border-line pt-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              {t.household.activityTitle}
            </p>
            {activity.length === 0 ? (
              <p className="text-xs text-muted">{t.household.activityEmpty}</p>
            ) : (
              <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                {activity.map((e) => (
                  <li key={e.id} className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate">{describeActivity(t, e)}</span>
                    <span className="shrink-0 text-muted">{timeFmt(e.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
