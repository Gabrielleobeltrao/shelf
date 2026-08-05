import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { API_URL } from "./api";
import { useSession } from "./auth-client";

type Sync = { itemsRev: number; listRev: number };

const SyncContext = createContext<Sync>({ itemsRev: 0, listRev: 0 });

export function useHouseholdSync() {
  return useContext(SyncContext);
}

// Runs `fn` whenever `rev` changes, skipping the initial mount — for silently
// refetching a slice when a live household event bumps its revision.
export function useSyncEffect(rev: number, fn: () => void) {
  const initial = useRef(rev);
  useEffect(() => {
    if (rev !== initial.current) fn();
    // fn is intentionally read fresh on each rev change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rev]);
}

// Opens one SSE connection to the household stream while signed in and bumps a
// revision per changed slice (pantry / list). Components subscribe and refetch.
// Switching household reloads the page, so the stream reconnects for the new one.
export function HouseholdSyncProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const loggedIn = !!session;
  const [rev, setRev] = useState<Sync>({ itemsRev: 0, listRev: 0 });

  useEffect(() => {
    if (!loggedIn) return;
    const source = new EventSource(`${API_URL}/api/household/stream`, { withCredentials: true });
    source.onmessage = (e) => {
      try {
        const { type } = JSON.parse(e.data);
        if (type === "items") setRev((r) => ({ ...r, itemsRev: r.itemsRev + 1 }));
        else if (type === "list") setRev((r) => ({ ...r, listRev: r.listRev + 1 }));
      } catch {
        // ignore malformed frames (e.g. the initial "connected" ping)
      }
    };
    return () => source.close();
  }, [loggedIn]);

  return <SyncContext.Provider value={rev}>{children}</SyncContext.Provider>;
}
