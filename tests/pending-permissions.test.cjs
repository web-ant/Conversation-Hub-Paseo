const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./folder-fixture.cjs');
const { observePermissionCounts } = load('../client/pending-permissions.tsx', {
  react: { createContext: () => ({}) },
});

const entry = (id, count) => ({ agent: { id, pendingPermissions: Array.from({ length: count }, () => ({})) } });
const page = (entries, nextCursor) => ({ entries, pageInfo: { hasMore: !!nextCursor, nextCursor } });

test('the sidebar tracks outstanding requests without opening the chat', async () => {
  let finishPage;
  const secondPage = new Promise(resolve => { finishPage = resolve; });
  let listener;
  const queries = [];
  const paseo = { agents: { list: async options => {
    queries.push(options);
    if (options.subscribe) return { subscription: { subscribe: value => { listener = value; } } };
    return secondPage;
  } } };
  const published = [];
  const stop = observePermissionCounts(paseo, counts => published.push(Object.fromEntries(counts)));
  await new Promise(setImmediate);
  const upsert = (id, count) => listener.update({ type: 'agent_update', payload: { kind: 'upsert', ...entry(id, count) } });
  listener.snapshot(page([entry('warden', 2)], 'older'));
  upsert('warden', 1);
  upsert('warden', 0);
  upsert('old-agent', 0); // A live answer wins over a stale page, even if the agent was not on page one.
  finishPage(page([entry('old-agent', 1), entry('ask-user', 1)]));
  await new Promise(setImmediate);
  assert.deepEqual(published, [{ warden: 2 }, { warden: 1 }, {}, { 'ask-user': 1 }]);
  assert.equal(queries[1].page.cursor, 'older');
  listener.update({ type: 'agent_update', payload: { kind: 'remove', agentId: 'ask-user' } });
  assert.deepEqual(published.at(-1), {});
  stop();
  assert.ok(queries[0].signal.aborted);
  upsert('warden', 1);
  assert.deepEqual(published.at(-1), {});
});
