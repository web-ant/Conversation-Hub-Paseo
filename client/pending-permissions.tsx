import type { PaseoApi } from '@getpaseo/client';
import { getPaseoClient, useHosts } from '@getpaseo/plugin/client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type PermissionCount = (agent: { hostId: string; id: string }) => number;
const PermissionContext = createContext<PermissionCount>(() => 0);
export const usePermissionCount = () => useContext(PermissionContext);

// The sidebar snapshot omits pendingPermissions. Keep only counts from the live agent directory.
export function observePermissionCounts(paseo: PaseoApi, publish: (counts: ReadonlyMap<string, number>) => void) {
  const controller = new AbortController();
  const signal = controller.signal;
  const options = { scope: 'active', signal, page: { limit: 200 } } as const;
  let generation = 0;
  function clear() {
    generation++;
    if (!signal.aborted) publish(new Map());
  }
  void paseo.agents.list({ ...options, subscribe: {} }).then(({ subscription }) => {
    if (signal.aborted || !subscription) return;
    let counts = new Map<string, number>();
    let touched = new Set<string>();
    let paging = false;
    const set = (id: string, count: number) => {
      if (count) counts.set(id, count);
      else counts.delete(id);
    };
    const emit = () => { if (!signal.aborted) publish(new Map(counts)); };
    subscription.subscribe({
      snapshot: snapshot => {
        const current = ++generation;
        counts = new Map();
        touched = new Set();
        for (const { agent } of snapshot.entries) set(agent.id, agent.pendingPermissions.length);
        let page = snapshot.pageInfo;
        paging = page.hasMore;
        emit();
        void (async () => {
          while (page.hasMore && page.nextCursor && !signal.aborted && current === generation) {
            const next = await paseo.agents.list({ ...options, page: { ...options.page, cursor: page.nextCursor } });
            if (signal.aborted || current !== generation) return;
            for (const { agent } of next.entries) {
              if (!touched.has(agent.id)) set(agent.id, agent.pendingPermissions.length);
            }
            page = next.pageInfo;
            emit();
          }
        })().catch(() => { /* Keep counts already received from the subscribed directory. */ }).finally(() => {
          if (current === generation) {
            paging = false;
            touched.clear();
          }
        });
      },
      update: message => {
        if (message.type !== 'agent_update' || signal.aborted) return;
        const change = message.payload;
        const id = change.kind === 'upsert' ? change.agent.id : change.agentId;
        const count = change.kind === 'upsert' ? change.agent.pendingPermissions.length : 0;
        if (paging) touched.add(id);
        if ((counts.get(id) ?? 0) === count) return;
        set(id, count);
        emit();
      },
      error: clear,
    });
  }).catch(clear);
  return () => controller.abort();
}

type HostCounts = ReadonlyMap<string, number>;
function PermissionHost({ hostId, update }: { hostId: string; update(hostId: string, counts?: HostCounts): void }) {
  useEffect(() => {
    // The host can disconnect between render and effect.
    let paseo: PaseoApi;
    try { paseo = getPaseoClient(hostId); } catch { return; }
    const stop = observePermissionCounts(paseo, counts => update(hostId, counts));
    return () => { stop(); update(hostId); };
  }, [hostId, update]);
  return null;
}

export function SidebarPermissions({ children }: { children: ReactNode }) {
  const hosts = useHosts();
  const [byHost, setByHost] = useState<ReadonlyMap<string, HostCounts>>(() => new Map());
  const update = useCallback((hostId: string, counts?: HostCounts) => {
    setByHost(previous => {
      if (!previous.has(hostId) && !counts?.size) return previous;
      const next = new Map(previous);
      if (counts?.size) next.set(hostId, counts);
      else next.delete(hostId);
      return next;
    });
  }, []);
  const permissionCount = useCallback<PermissionCount>(agent => byHost.get(agent.hostId)?.get(agent.id) ?? 0, [byHost]);
  return <PermissionContext.Provider value={permissionCount}>
    {children}
    {hosts.filter(host => host.status === 'online').map(host => <PermissionHost key={host.serverId} hostId={host.serverId} update={update} />)}
  </PermissionContext.Provider>;
}
