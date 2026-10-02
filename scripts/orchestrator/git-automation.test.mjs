import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { automateGit, gitPolicy } from './git-automation.mjs';
import { processRun, git, snapshot, guard, validate } from './lib.mjs';
import { guardAgents, syncAgents } from './status-sync.mjs';

const contract = { id: 'TASK-022', title: 'Git fixture', allowed_paths: ['src/'], forbidden_paths: ['src/forbidden.txt'], verify: [{ command: ['node', '--version'], cwd: '.' }] };
const evidence = { contract, branch: 'task/TASK-022-fixture', status: 'PASS', executor: { status: 'DONE', human_decisions_needed: [], changed_files: ['src/a.txt', 'src/new.txt', 'src/delete.txt'] }, reviewer: { verdict: 'PASS' }, verification: [{ command: ['node', '--version'], code: 0 }] };

test('Contract schema validates optional agents_sections and blocks malformed formats', async () => {
  const schema = JSON.parse(await readFile(new URL('../../harness/schemas/task-contract.schema.json', import.meta.url), 'utf8'));
  const complete = { ...contract, task_file: 'task.md', max_review_cycles: 3 };
  validate(complete, schema);
  validate({ ...complete, agents_sections: ['12'] }, schema);
  for (const agents_sections of ['12', [12], [''], ['12x'], ['12', '12'], null]) {
    assert.throws(() => validate({ ...complete, agents_sections }, schema), error => error.status === 'BLOCKED');
  }
});

test('Git blocks main, wrong Task branch, force, merge, failed Verify, non-PASS and Human Gates', () => {
  gitPolicy(evidence);
  for (const override of [{ branch: 'main' }, { branch: 'task/TASK-023-fixture' }, { force: true }, { merge: true }, { status: 'BLOCKED' }, { status: 'HUMAN_REQUIRED' }, { status: 'CHANGES_REQUIRED' }, { verification: [] }, { verification: [{ code: 1 }] }, { verification: [{ code: 0, failure: 'timeout' }] }, { executor: { status: 'HUMAN_REQUIRED', human_decisions_needed: [] } }, { executor: { status: 'DONE', human_decisions_needed: ['Gate'] } }, ...['CHANGES_REQUIRED', 'HUMAN_REQUIRED', 'BLOCKED'].map(verdict => ({ reviewer: { verdict } }))]) {
    assert.throws(() => gitPolicy({ ...evidence, ...override }), error => error.status === 'BLOCKED');
  }
});

test('Stage guard blocks forbidden, secret, outside allowlist and active Contract', () => {
  for (const file of ['src/forbidden.txt', 'src/.env.local', 'outside.txt']) assert.throws(() => guard({ entries: [{ file }], diff: '' }, [file], contract));
  const file = 'harness/tasks/TASK-022.json';
  assert.throws(() => guard({ entries: [{ file }], diff: '' }, [file], { ...contract, allowed_paths: ['harness/'] }), /active Task/);
  guard({ entries: [{ file: 'harness/tasks/TASK-023.json' }], diff: '' }, ['harness/tasks/TASK-023.json'], { ...contract, allowed_paths: ['harness/'] });
});

test('AGENTS exception permits only Contract approved section bodies with LF and mixed CRLF', () => {
  const before = '## 3. Current phase\nCurrent Task:\n```text\nTASK-021 fixture\n```\nStatus:\n```text\nREADY\n```\n## 12. Git / Commit 규칙\n\nPreserve\n';
  const tasks = '## 3. Current Task\nTASK-021 fixture\nStatus:\n```text\nIN_PROGRESS\n```\n';
  for (const newline of [text => text, text => text.replace(/\n/g, (_, offset) => offset % 2 ? '\r\n' : '\n')]) {
    const baseline = newline(before + '## 5. Approval\nProtected\n## 13. Report\nEnd\n');
    const after = syncAgents(baseline.replace('Preserve', 'Changed'), tasks);
    const approved = { agents_sections: ['12'] };
    guardAgents(baseline, after, tasks, approved);
    guardAgents(baseline, baseline.replace('Preserve', 'Changed'), tasks, approved);
    for (const changed of [after.replace('Protected', 'Changed'), after.replace('Git / Commit 규칙', 'Changed'), after.replace(/## 13\. Report\r?\n/, '')]) {
      assert.throws(() => guardAgents(baseline, changed, tasks, approved), error => error.status === 'BLOCKED');
    }
    assert.throws(() => guardAgents(baseline, after, tasks), error => error.status === 'BLOCKED');
    for (const agents_sections of ['12', [12], [''], ['12', '12'], ['12x'], null]) {
      assert.throws(() => guardAgents(baseline, baseline, tasks, { agents_sections }), error => error.status === 'BLOCKED');
    }
  }
});

async function fixture(t) {
  const home = await mkdtemp(path.join(os.tmpdir(), 'moodfit-git-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  const sourceRoot = path.join(home, 'source');
  const workspace = path.join(home, 'workspace');
  const remote = path.join(home, 'remote.git');
  await mkdir(sourceRoot);
  await git(sourceRoot, ['init', '-b', 'main']);
  await git(sourceRoot, ['config', 'user.name', 'Harness Test']);
  await git(sourceRoot, ['config', 'user.email', 'harness@example.invalid']);
  await git(sourceRoot, ['config', 'commit.gpgsign', 'false']);
  await git(sourceRoot, ['config', 'core.autocrlf', 'false']);
  await writeFile(path.join(sourceRoot, '.gitignore'), '.harness/\n.env*\n*.pem\n');
  await mkdir(path.join(sourceRoot, 'src'));
  await writeFile(path.join(sourceRoot, 'src/a.txt'), 'old\n');
  await writeFile(path.join(sourceRoot, 'src/delete.txt'), 'delete\n');
  await git(sourceRoot, ['add', '--', '.gitignore', 'src/a.txt', 'src/delete.txt']);
  await git(sourceRoot, ['commit', '-m', 'fixture baseline']);
  await git(sourceRoot, ['init', '--bare', remote]);
  await git(sourceRoot, ['remote', 'add', 'origin', remote]);
  await git(sourceRoot, ['push', 'origin', 'main']);
  await git(sourceRoot, ['switch', '-c', evidence.branch]);
  const revision = (await git(sourceRoot, ['rev-parse', 'HEAD'])).trim();
  await git(sourceRoot, ['worktree', 'add', '--detach', workspace, revision]);
  await writeFile(path.join(workspace, 'src/a.txt'), 'new\n');
  await writeFile(path.join(workspace, 'src/new.txt'), 'created\n');
  await rm(path.join(workspace, 'src/delete.txt'));
  const reviewed = await snapshot(workspace);
  const runDir = path.join(sourceRoot, '.harness/runs/test');
  await mkdir(runDir, { recursive: true });
  const calls = [], records = new Map();
  const invoke = async (args, options) => {
    calls.push(args);
    if (args[0] === 'gh') {
      let stdout = 'account detail omitted';
      if (args[1] === 'repo') stdout = JSON.stringify({ nameWithOwner: 'fixture/repo' });
      if (args[1] === 'api') stdout = '[[]]';
      if (args[1] === 'pr' && args[2] === 'create') stdout = 'https://example.invalid/pr/1\n';
      if (args[1] === 'pr' && args[2] === 'view') stdout = JSON.stringify({ number: 1, headRefOid: (await git(sourceRoot, ['rev-parse', 'HEAD'])).trim(), headRefName: evidence.branch, baseRefName: 'main' });
      return { code: 0, stdout, stderr: '' };
    }
    return processRun(args, options);
  };
  return { ...evidence, sourceRoot, workspace, revision, reviewed, runDir, invoke, record: async (name, value) => records.set(name, value), calls, records };
}

test('temporary local Git flow transfers reviewed changes, individual Stage, Commit, Push and Draft PR audit', async t => {
  const options = await fixture(t);
  await writeFile(path.join(options.sourceRoot, '.env.local'), 'fixture only\n');
  const result = await automateGit(options);
  assert.match(result.commit_sha, /^[a-f0-9]{40}$/);
  assert.equal((await git(options.sourceRoot, ['status', '--porcelain'])).trim(), '');
  assert.equal((await git(options.sourceRoot, ['rev-parse', 'origin/' + evidence.branch])).trim(), result.commit_sha);
  assert.equal((await git(options.sourceRoot, ['rev-parse', 'origin/main'])).trim(), options.revision);
  const adds = options.calls.filter(x => x.includes('add'));
  assert.equal(adds.length, 3);
  assert.ok(adds.every(x => x[1] === '--literal-pathspecs' && x[3] === '--' && x.length === 5));
  const pr = options.calls.find(x => x[0] === 'gh' && x[1] === 'pr');
  assert.ok(pr.includes('--draft'));
  const body = await readFile(pr.at(-1), 'utf8');
  for (const part of ['TASK-022', 'Verification:', 'Review Verdict: PASS', 'Human Gate:', result.commit_sha, 'Co-authored-by: Codex', 'Co-authored-by: Claude', 'src/new.txt']) assert.ok(body.includes(part));
  assert.ok(options.records.has('git-pre-pr.json') && options.records.has('git-result.json'));
  assert.ok(!JSON.stringify([...options.records]).includes('account detail omitted'));
  assert.equal(await readFile(path.join(options.sourceRoot, '.env.local'), 'utf8'), 'fixture only\n');
  assert.ok(!options.calls.some(args => args.includes('.env.local')));
  assert.ok(!(await git(options.sourceRoot, ['ls-tree', '-r', '--name-only', 'HEAD'])).includes('.env.local'));
});

test('reported Secret paths and Workspace ignored Secrets block before mutation', async t => {
  const options = await fixture(t);
  for (const file of ['src/.env.local', 'src/key.pem']) {
    await assert.rejects(automateGit({ ...options, reviewed: { entries: [{ file }], diff: '' }, executor: { ...options.executor, changed_files: [file] } }), error => error.status === 'BLOCKED' && /Secret file/.test(error.message));
  }
  await writeFile(path.join(options.workspace, '.env.local'), 'fixture only\n');
  await assert.rejects(automateGit(options), error => error.status === 'BLOCKED' && /Workspace/.test(error.message));
  assert.equal(options.calls.length, 0);
});

test('injected staged Secret paths block Commit and Push', async t => {
  for (const file of ['.env.local', 'key.pem']) {
    const options = await fixture(t);
    const invoke = options.invoke;
    options.invoke = async (args, context) => {
      const result = await invoke(args, context);
      if (args.includes('add') && args.at(-1) === options.reviewed.entries.at(-1).file) {
        await writeFile(path.join(options.sourceRoot, file), 'fixture only\n');
        await git(options.sourceRoot, ['add', '-f', '--', file]);
      }
      return result;
    };
    await assert.rejects(automateGit(options), error => error.status === 'BLOCKED' && /Secret file detected in staged/.test(error.message));
    assert.ok(!options.calls.some(args => args.includes('commit') || args.includes('push')));
    assert.equal((await git(options.sourceRoot, ['rev-parse', 'HEAD'])).trim(), options.revision);
  }
});

test('dirty source and missing gh authentication prevent all mutations', async t => {
  const options = await fixture(t);
  await writeFile(path.join(options.sourceRoot, 'unexpected.txt'), 'dirty');
  await assert.rejects(automateGit(options), /Dirty Working Tree/);
  assert.equal(options.calls.length, 0);
  await rm(path.join(options.sourceRoot, 'unexpected.txt'));
  options.invoke = async args => { options.calls.push(args); return { code: 1, stdout: '', stderr: 'not logged in' }; };
  await assert.rejects(automateGit(options), error => error.status === 'HUMAN_REQUIRED');
  assert.equal(options.calls.length, 1);
  assert.equal((await git(options.sourceRoot, ['rev-parse', 'HEAD'])).trim(), options.revision);
  assert.equal((await git(options.sourceRoot, ['status', '--porcelain'])).trim(), '');
});

test('failed Verify / non-PASS stop before any Git or gh invocation', async t => {
  const options = await fixture(t);
  for (const override of [{ verification: [{ code: 1 }] }, { reviewer: { verdict: 'CHANGES_REQUIRED' } }, { reviewer: { verdict: 'HUMAN_REQUIRED' } }]) await assert.rejects(automateGit({ ...options, ...override }));
  assert.equal(options.calls.length, 0);
  assert.equal((await git(options.sourceRoot, ['rev-parse', 'HEAD'])).trim(), options.revision);
});
