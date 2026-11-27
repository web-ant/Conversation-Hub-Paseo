const {test} = require('node:test');
const assert = require('node:assert/strict');
const {z} = require('zod');
const {load} = require('./folder-fixture.cjs');
const manifest = require('../paseo-plugin.json');
const settings = load('../shared/settings.ts', {'@getpaseo/plugin': {defineSettings: value => value}, zod: {z}});
const routing = load('../shared/workspace-routing.ts');

test('workspace and agent hooks route through the Conversation Hub installation and preserve existing entries', async () => {
  const folder = {id: 'work', name: 'Work', workspacePaths: ['/projects/hub'], agentIds: ['existing']};
  const documents = {
    organization: settings.organization.schema.parse({groups: [folder]}),
    'sidebar-tabs': settings.sidebarTabs.schema.parse({tabs: [{id: 'tab', name: 'Work', organization: {groups: [folder]}}]}),
  };
  const calls = [];
  let closed = false;
  const client = {async invokePluginRpc(pluginId, method, input) {
    assert.equal(pluginId, manifest.id);
    const [, id, action] = method.split('.');
    calls.push({pluginId, method});
    if (action === 'read') return {status: 'ready', revision: 'before', values: documents[id]};
    assert.equal(input.revision, 'before');
    documents[id] = input.values;
    return {status: 'saved'};
  }};
  const {WorkspaceRouter} = load('../server/workspace-routing.ts', {
    'node:os': require('node:os'), 'node:path': require('node:path'),
    'node:fs': {realpathSync: path => path},
    'node:child_process': {execFile() {assert.fail('Worktree lookup is disabled');}},
    '../shared/settings': settings, '../shared/workspace-routing': routing,
    './local-host': {LocalHost: class {async client() {return client;} async close() {closed = true;}}},
  });
  const router = new WorkspaceRouter({async read() {return {status: 'ready', values: {enabled: true, includeSubdirectories: true, includeWorktrees: false, includeSubagents: false}};}});
  const metadata = [];
  const paseo = {
    hosts: {list: async () => ({self: {serverId: 'local'}})},
    workspaces: {ref: id => ({setMetadata: async value => metadata.push({id, value})})},
  };
  await router.workspace({id: 'workspace', cwd: '/projects/hub'}, paseo);
  await router.agent({id: 'new', cwd: '/projects/hub'}, paseo);
  assert.deepEqual(metadata, [{id: 'workspace', value: {'conversation-hub.routing': {groupId: 'work'}}}]);
  assert.deepEqual(documents.organization.groups[0].agentIds, ['existing', 'new']);
  assert.deepEqual(documents['sidebar-tabs'].tabs[0].organization.groups[0].agentIds, ['existing', 'new']);
  assert.deepEqual(documents['sidebar-tabs'].tabs[0].members, [{hostId: 'local', agentId: 'new'}]);
  assert.equal(calls.filter(call => call.method.endsWith('.write')).length, 2);
  await router.close();
  assert.equal(closed, true);
});
