import type { Response } from "express";

// In-memory registry of open SSE connections, grouped by household. When a
// household's pantry or list changes, we push a small "refetch this" event to
// everyone currently viewing that household so their UI updates live.
//
// Single-instance only: a multi-process deployment would need a shared bus
// (e.g. Redis pub/sub) so events reach clients connected to other instances.
const connections = new Map<string, Set<Response>>();

export function addConnection(householdId: string, res: Response) {
  let set = connections.get(householdId);
  if (!set) {
    set = new Set();
    connections.set(householdId, set);
  }
  set.add(res);
}

export function removeConnection(householdId: string, res: Response) {
  const set = connections.get(householdId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) connections.delete(householdId);
}

// Tell everyone viewing this household what changed ("items" or "list") so
// they can refetch just that slice.
export function publish(householdId: string | undefined, type: "items" | "list") {
  if (!householdId) return;
  const set = connections.get(householdId);
  if (!set) return;
  const payload = `data: ${JSON.stringify({ type })}\n\n`;
  for (const res of set) res.write(payload);
}
