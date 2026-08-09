import { useState } from "react";
import { social, type PostView } from "../../lib/social";
import { useI18n } from "../../lib/i18n";
import { Portal } from "../ui/Portal";
import { CloseIcon } from "../icons";

const VIS = ["public", "followers", "private"] as const;

export function ComposeSheet({
  onClose,
  onPosted,
}: {
  onClose: () => void;
  onPosted: (post: PostView) => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<(typeof VIS)[number]>("public");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const post = await social.createPost({ type: "text", text, visibility });
      onPosted(post);
    } catch {
      setSaving(false);
    }
  }

  const visLabel = (v: (typeof VIS)[number]) =>
    v === "public" ? t.social.visPublic : v === "followers" ? t.social.visFollowers : t.social.visPrivate;

  return (
    <Portal>
      <div className="fixed inset-0 z-40 flex items-end bg-black/50 sm:items-center" onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full space-y-3 rounded-t-3xl bg-surface p-4 pb-safe sm:mx-auto sm:max-w-md sm:rounded-2xl sm:pb-4"
        >
          <div className="mx-auto -mt-1 mb-1 h-1 w-9 rounded-full bg-line sm:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t.social.publish}</h2>
            <button onClick={onClose} aria-label={t.common.close} className="text-muted">
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.social.composePlaceholder}
            rows={4}
            className="w-full rounded-xl bg-surface-2 px-3 py-2 text-base"
          />
          <div className="flex gap-2">
            {VIS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                  visibility === v ? "bg-primary-600 text-white" : "bg-surface-2 text-muted"
                }`}
              >
                {visLabel(v)}
              </button>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={saving || !text.trim()}
            className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {t.social.publish}
          </button>
        </div>
      </div>
    </Portal>
  );
}
