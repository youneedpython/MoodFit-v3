import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from './run.mjs';
import { processRun, redact, validate, extractReviewer, commandCheck, Stop } from './lib.mjs';
const fake = fileURLToPath(new URL('./fixtures/fake-cli.mjs', import.meta.url));

async function fixture(t, scenario = 'pass') {
  const root = await mkdtemp(path.join(os.tmpdir(), 'moodfit-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const git = async (...args) => { const result = await processRun(['git', ...args], { cwd: root, timeout: 10000 }); assert.equal(result.code, 0, result.stderr); };
  await git('init', '-b', scenario === 'main' ? 'main' : 'task/test');
  await mkdir(path.join(root, 'harness/tasks'), { recursive: true });
  await writeFile(path.join(root, '.gitignore'), '.harness/runs/\nharness/config.local.json\n');
  await writeFile(path.join(root, 'task.md'), 'Fake Task: implement output.txt');
  await writeFile(path.join(root, 'harness/tasks/TASK-999.json'), JSON.stringify({ id: 'TASK-999', title: 'Fake task', task_file: 'task.md', allowed_paths: ['output.txt'], forbidden_paths: ['forbidden.txt'], verify: [{ command: [process.execPath, fake, scenario, 'verify'], cwd: '.' }], max_review_cycles: 3 }));
  await git('add', '.');
  await git('-c', 'user.name=Harness Test', '-c', 'user.email=harness@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'fixture');
  await writeFile(path.join(root, 'harness/config.local.json'), JSON.stringify({ codex: { command: [process.execPath, fake, scenario, 'executor'] }, claude: { command: [process.execPath, fake, scenario, 'reviewer'] }, sandbox: 'unelevated', timeouts: { preflight_ms: 10000, executor_ms: scenario === 'timeout' ? 200 : 10000, reviewer_ms: 10000, verify_ms: 10000 } }));
  if (scenario === 'dirty') await writeFile(path.join(root, 'dirty.txt'), 'dirty');
  return root;
}

const cases = [
  ['pass', 'PASS', 1], ['wrapped', 'PASS', 1], ['executor-failure', 'BLOCKED', 0], ['executor-status-failure', 'BLOCKED', 0],
  ['timeout', 'BLOCKED', 0], ['verify', 'BLOCKED', 0], ['rework', 'PASS', 2], ['human', 'HUMAN_REQUIRED', 1],
  ['blocked', 'BLOCKED', 1], ['limit', 'HUMAN_REQUIRED', 3], ['executor-json', 'BLOCKED', 0], ['reviewer-json', 'BLOCKED', 1],
  ['executor-schema', 'BLOCKED', 0], ['reviewer-schema', 'BLOCKED', 1], ['mismatch', 'BLOCKED', 0], ['path', 'BLOCKED', 0],
  ['main', 'BLOCKED', 0], ['dirty', 'BLOCKED', 0], ['login', 'HUMAN_REQUIRED', 0], ['quota', 'BLOCKED', 0],
  ['verify-mutation', 'BLOCKED', 0], ['reviewer-mutation', 'BLOCKED', 1], ['secret', 'PASS', 1]
];
for (const [scenario, status, cycles] of cases) test(`integration: ${scenario}`, async t => {
  const root = await fixture(t, scenario);
  const result = await run('TASK-999', { root });
  assert.equal(result.status, status, result.state.reason);
  assert.equal(result.code, { PASS: 0, HUMAN_REQUIRED: 2, BLOCKED: 3 }[status]);
  assert.equal(result.state.review_cycles, cycles);
  const state = JSON.parse(await readFile(path.join(result.run_dir, 'state.json'), 'utf8'));
  assert.equal(state.status, status);
  const files = await readdir(result.run_dir);
  if (cycles === 0) assert.ok(!files.some(x => x.startsWith('review-')));
  if (scenario === 'limit') { assert.ok(files.includes('execute-3.input.json')); assert.ok(!files.includes('execute-4.input.json')); }
  if (scenario === 'rework') assert.match(await readFile(path.join(result.run_dir, 'execute-2.input.json'), 'utf8'), /fix this/);
  if (status === 'PASS') {
    assert.match(await readFile(path.join(result.run_dir, `review-${cycles}.input.json`), 'utf8'), /untracked: output.txt/);
    assert.deepEqual(state.history.map(x => x.phase).slice(0, 7), ['Preflight', 'Execute', 'Guard', 'Verify', 'Review', 'Decide', ...(cycles > 1 ? ['Execute'] : [])]);
  }
  if (scenario === 'secret') for (const file of files) assert.ok(!(await readFile(path.join(result.run_dir, file), 'utf8')).includes('sk-fake0123456789'));
});

test('redaction / strict schema / reviewer extraction / shim rejection', () => {
  assert.ok(!redact('Bearer abcdef api_key="sensitive" ghp_abcdefghijk').includes('sensitive'));
  assert.equal(redact('password=example'), 'password="[REDACTED]"');
  assert.throws(() => validate({ extra: true }, { type: 'object', additionalProperties: false, properties: {} }), Stop);
  assert.throws(() => validate('a', { pattern: '.' }), Stop);
  assert.throws(() => extractReviewer(JSON.stringify({ result: '{} {}' })), Stop);
  assert.throws(() => extractReviewer(JSON.stringify({ result: '{}', permission_denials: [{}] })), Stop);
  assert.throws(() => commandCheck(['codex.cmd']), Stop);
});

test('entrypoint exit code and state on main', async t => {
  const root = await fixture(t, 'main');
  const result = await processRun([process.execPath, fileURLToPath(new URL('./run.mjs', import.meta.url)), 'TASK-999'], { cwd: root, timeout: 10000 });
  assert.equal(result.code, 3);
  assert.equal(JSON.parse(result.stdout).status, 'BLOCKED');
});

test('Fake Codex rejects unsupported output schema before writing results', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'moodfit-schema-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const keyword of ['uniqueItems', 'minLength']) {
    const schema = JSON.parse(await readFile(new URL('../../harness/schemas/executor-result.codex.schema.json', import.meta.url), 'utf8'));
    if (keyword === 'uniqueItems') schema.properties.changed_files.uniqueItems = true;
    else schema.properties.changed_files.items.minLength = 1;
    const schemaFile = path.join(root, keyword + '.json');
    await writeFile(schemaFile, JSON.stringify(schema));
    const result = await processRun([process.execPath, fake, 'pass', 'executor', 'exec', '-s', 'workspace-write', '-c', 'windows.sandbox="unelevated"', '--output-schema', schemaFile, '-o', path.join(root, 'result.json'), '-'], { cwd: root, timeout: 10000 });
    assert.equal(result.code, 1, result.failure ?? result.stderr);
    assert.match(result.stderr, /invalid_json_schema/);
    assert.ok(result.stderr.includes(keyword));
    await assert.rejects(readFile(path.join(root, 'result.json')), { code: 'ENOENT' });
    await assert.rejects(readFile(path.join(root, 'output.txt')), { code: 'ENOENT' });
  }
});
