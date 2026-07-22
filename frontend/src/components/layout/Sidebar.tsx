import { NavLink } from "react-router-dom";
import { signOut, useSession } from "../../lib/auth-client";

const links = [
  { to: "/dashboard", label: "Dashboard", end: false },
  { to: "/", label: "Estoque", end: true },
  { to: "/receitas", label: "Receitas", end: false },
  { to: "/configuracoes", label: "Configurações", end: false },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: Props) {
  const { data: session } = useSession();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <aside className="relative flex h-full w-64 max-w-[80vw] flex-col bg-white p-4 dark:bg-stone-950">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Shelf</span>
          <button
            onClick={onClose}
            className="text-sm text-stone-500 dark:text-stone-400"
          >
            Fechar
          </button>
        </div>

        {session && (
          <p className="mt-4 truncate text-sm text-stone-500 dark:text-stone-400">
            {session.user.email}
          </p>
        )}

        <nav className="mt-6 flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-primary-600/10 text-primary-600 dark:text-primary-400"
                    : "text-stone-700 dark:text-stone-300"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => signOut()}
          className="mt-auto rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600"
        >
          Sair
        </button>
      </aside>
    </div>
  );
}
