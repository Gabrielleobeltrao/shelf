import { useState } from "react";
import { NUTRITION_OPTIONS } from "../../lib/nutrition";

type Props = {
  selected: string[];
  onClose: () => void;
  onSave: (selected: string[]) => Promise<void>;
};

export function NutritionFieldsModal({ selected, onClose, onSave }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set(selected));
  const [saving, setSaving] = useState(false);

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await onSave([...checked]);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full space-y-3 overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-stone-950"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Informações nutricionais</h2>
          <button
            onClick={onClose}
            className="text-sm text-stone-500 dark:text-stone-400"
          >
            Fechar
          </button>
        </div>

        <p className="text-sm text-stone-500">
          Escolha quais campos vão aparecer nos itens do estoque.
        </p>

        <div className="space-y-1">
          {NUTRITION_OPTIONS.map((option) => (
            <label
              key={option.key}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={checked.has(option.key)}
                onChange={() => toggle(option.key)}
                className="h-4 w-4 rounded border-stone-300 dark:border-stone-700"
              />
              {option.label} ({option.unit})
            </label>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-primary-600 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
