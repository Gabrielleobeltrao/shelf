import type { ReactNode } from "react";

type Props = {
  illustration: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ illustration, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="h-[7.5rem] w-[9.5rem]">{illustration}</div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="max-w-xs text-sm text-stone-500 dark:text-stone-400">{description}</p>
      {action}
    </div>
  );
}
