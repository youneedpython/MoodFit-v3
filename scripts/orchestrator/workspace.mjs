import { mkdir, open, readFile, rm, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { blocked, git, changes } from './lib.mjs';

export async function repositoryIdentity(root) {
  return realpath((await git(root, ['rev-parse', '--path-format=absolute', '--git-common-dir'])).trim());
}

// Common git-dir identity shares one lock across every worktree and Task.
// Exclusive creation deliberately does not reclaim stale locks automatically.
export async function acquireLock(root, runId) {
  const identity = await repositoryIdentity(root);
  const key = createHash('sha256').update(process.platform === 'win32' ? identity.toLowerCase() : identity).digest('hex');
  const directory = path.join(os.tmpdir(), 'moodfit-orchestrator-locks');
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, key + '.json');
  let handle;
  try { handle = await open(file, 'wx'); }
  catch (error) { if (error.code === 'EEXIST') blocked('Repository execution lock held; Human must inspect stale owner before removal'); throw error; }
  await handle.writeFile(JSON.stringify({ run_id: runId, pid: process.pid }));
  await handle.close();
  return async () => {
    const owner = JSON.parse(await readFile(file, 'utf8'));
    if (owner.run_id !== runId) blocked('Lock ownership changed');
    await rm(file);
  };
}

export async function createWorkspace(root, runId, revision) {
  const target = path.join(root, '.harness/workspaces', runId);
  await mkdir(path.dirname(target), { recursive: true });
  await git(root, ['worktree', 'add', '--detach', target, revision]);
  if ((await changes(target)).length) blocked('New worktree is dirty');
  return target;
}

// Preserve changed worktrees as review artifacts; never force-remove user work.
export async function cleanupWorkspace(root, target) {
  const parent = await realpath(path.join(root, '.harness/workspaces'));
  const resolved = await realpath(target);
  const relative = path.relative(parent, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) blocked('Unsafe workspace cleanup');
  if ((await changes(target)).length) blocked('Workspace has changes; retain for Human review');
  await git(root, ['worktree', 'remove', target]);
}
