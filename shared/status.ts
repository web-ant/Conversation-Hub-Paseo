export interface AgentStatus { status: string; requiresAttention: boolean; attentionReason: string | null }
/** A turn remains running while Paseo waits for a permission reply. */
export function conversationState(agent: AgentStatus, pendingPermissionCount = 0): string {
  if (pendingPermissionCount > 0 || agent.attentionReason === 'permission') return 'permission';
  if (agent.status === 'running' || agent.status === 'initializing') return 'running';
  if (agent.status === 'error' || agent.requiresAttention && agent.attentionReason === 'error') return 'error';
  if (agent.requiresAttention) return 'updated';
  return agent.status === 'idle' || agent.attentionReason === 'finished' ? 'finished' : 'idle';
}
/** A subtask's result, error included, goes back to its parent; only a permission request needs the user directly. */
export function quietSubtask(agent: AgentStatus & { parentAgent?: unknown }, pendingPermissionCount = 0) {
  return !!agent.parentAgent && conversationState(agent, pendingPermissionCount) !== 'permission';
}
export function aggregateStates(states: readonly string[]) {
  return { state: ['permission','running','error','updated'].find(state => states.includes(state)) ?? 'idle', hasUpdates: states.some(state => ['updated','permission','error'].includes(state)) };
}
