import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from './run.mjs';
import { processRun, redact, validate, extractReviewer, commandCheck, Stop } from './lib.mjs';
const fake = fileURLToPath(new URL('./fixtures/fake-cli.mjs', import.meta.url));
const fakeAws = fileURLToPath(new URL('./fixtures/fake-aws.mjs', import.meta.url));

for (const awsMode of ['ok', 'recheck']) test(`AWS identity ${awsMode}: rechecked before Verify and never persisted or sent to agents`, async t => {
  const root = await fixture(t);
  const taskFile = path.join(root, 'harness/tasks/TASK-019.json');
  const task = JSON.parse(await readFile(taskFile, 'utf8'));
  task.aws_profiles = ['moodfit-readonly'];
  await writeFile(taskFile, JSON.stringify(task));
  for (const args of [['add', 'harness/tasks/TASK-019.json'], ['-c', 'user.name=Harness Test', '-c', 'user.email=harness@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'AWS fixture']]) {
    const result = await processRun(['git', ...args], { cwd: root, timeout: 10000 });
    assert.equal(result.code, 0, result.stderr);
  }
  const configFile = path.join(root, 'harness/config.local.json');
  const cfg = JSON.parse(await readFile(configFile, 'utf8'));
  await mkdir(path.join(root, '.harness/runs'), { recursive: true });
  cfg.aws = { command: [process.execPath, fakeAws, awsMode, path.join(root, '.harness/runs/aws-count')], allowed_profiles: ['moodfit-readonly'], profiles: { 'moodfit-readonly': { account: '111111111111', role: 'AWSReservedSSO_MoodFitReadOnly_fake' } } };
  await writeFile(configFile, JSON.stringify(cfg));
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^AWS_/i.test(key)));
  const result = await run('TASK-019', { root, env });
  assert.equal(result.status, awsMode === 'ok' ? 'PASS' : 'HUMAN_REQUIRED', result.state.reason);
  assert.equal(result.state.phase, awsMode === 'ok' ? 'Decide' : 'Verify');
  assert.equal(result.state.review_cycles, awsMode === 'ok' ? 1 : 0);
  const files = await readdir(result.run_dir);
  assert.equal(files.includes('verify-1-1.input.json'), awsMode === 'ok');
  assert.ok(files.includes('execute-1.input.json'));
  for (const file of files) {
    const text = await readFile(path.join(result.run_dir, file), 'utf8');
    for (const sensitive of ['111111111111', 'private-user-id', 'private-session', 'AWSReservedSSO_MoodFitReadOnly_fake']) assert.ok(!text.includes(sensitive), file);
  }
});

async function fixture(t, scenario = 'pass') {
  const root = await mkdtemp(path.join(os.tmpdir(), 'moodfit-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const git = async (...args) => { const result = await processRun(['git', ...args], { cwd: root, timeout: 10000 }); assert.equal(result.code, 0, result.stderr); };
  await git('init', '-b', scenario === 'main' ? 'main' : 'task/test');
  await mkdir(path.join(root, 'harness/tasks'), { recursive: true });
  await writeFile(path.join(root, '.gitignore'), '.harness/runs/\n.harness/workspaces/\nharness/config.local.json\n');
  await writeFile(path.join(root, 'task.md'), 'Fake Task: implement output.txt');
  await writeFile(path.join(root, 'harness/tasks/TASK-019.json'), JSON.stringify({ id: 'TASK-019', title: 'Fake task', task_file: 'task.md', allowed_paths: ['output.txt'], forbidden_paths: ['forbidden.txt'], verify: [{ command: [process.execPath, fake, scenario, 'verify'], cwd: '.' }], max_review_cycles: 3 }));
  await git('add', '.');
  await git('-c', 'user.name=Harness Test', '-c', 'user.email=harness@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'fixture');
  await writeFile(path.join(root, 'harness/config.local.json'), JSON.stringify({ codex: { command: [process.execPath, fake, scenario, 'executor'] }, claude: { command: [process.execPath, fake, scenario, 'reviewer'] }, sandbox: 'unelevated', timeouts: { preflight_ms: 10000, executor_ms: scenario === 'timeout' ? 200 : 10000, reviewer_ms: 10000, verify_ms: 10000 } }));
  if (scenario === 'dirty') await writeFile(path.join(root, 'dirty.txt'), 'dirty');
  return root;
}

for (const id of ['TASK-021', 'TASK-032', 'TASK-033']) test(`automatic Git phase eligibility: ${id}`, async t => {
  const root = await fixture(t);
  const task = JSON.parse(await readFile(path.join(root, 'harness/tasks/TASK-019.json'), 'utf8'));
  task.id = id;
  await writeFile(path.join(root, `harness/tasks/${id}.json`), JSON.stringify(task));
  for (const args of [['add', `harness/tasks/${id}.json`], ['-c', 'user.name=Harness Test', '-c', 'user.email=harness@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'Eligibility fixture']]) {
    const result = await processRun(['git', ...args], { cwd: root, timeout: 10000 });
    assert.equal(result.code, 0, result.stderr);
  }
  const result = await run(id, { root });
  const eligible = id !== 'TASK-021';
  assert.equal(result.state.history.some(x => x.phase === 'Git'), eligible);
  // Deliberately unapproved fixture branch proves the phase is reached while
  // preserving the branch guard and preventing external Git handoff.
  assert.equal(result.status, eligible ? 'BLOCKED' : 'PASS', result.state.reason);
  if (eligible) assert.match(result.state.reason, /approved Task branch/);
});

const cases = [
  ['gate-rework', 'HUMAN_REQUIRED', 2], ['gate-limit', 'HUMAN_REQUIRED', 3], ['gate-blocked', 'BLOCKED', 1],
  ['executor-auth', 'HUMAN_REQUIRED', 0], ['verify-sandbox', 'BLOCKED', 0],
  ['pass', 'PASS', 1], ['wrapped', 'PASS', 1], ['executor-failure', 'BLOCKED', 0], ['executor-status-failure', 'BLOCKED', 0],
  ['timeout', 'BLOCKED', 0], ['verify', 'BLOCKED', 0], ['rework', 'PASS', 2], ['human', 'HUMAN_REQUIRED', 1],
  ['blocked', 'BLOCKED', 1], ['limit', 'HUMAN_REQUIRED', 3], ['executor-json', 'BLOCKED', 0], ['reviewer-json', 'BLOCKED', 1],
  ['executor-schema', 'BLOCKED', 0], ['reviewer-schema', 'BLOCKED', 1], ['mismatch', 'BLOCKED', 0], ['path', 'BLOCKED', 0],
  ['main', 'BLOCKED', 0], ['dirty', 'BLOCKED', 0], ['login', 'HUMAN_REQUIRED', 0], ['quota', 'BLOCKED', 0],
  ['verify-mutation', 'BLOCKED', 0], ['reviewer-mutation', 'BLOCKED', 1], ['secret', 'PASS', 1], ['executor-human', 'HUMAN_REQUIRED', 1], ['handoff', 'HANDOFF_PENDING', 1], ['secret-file', 'BLOCKED', 0], ['secret-content', 'BLOCKED', 0], ['sandbox', 'BLOCKED', 0]
];
for (const sandbox of ['elevated', 'unelevated', 'invalid', '', null]) test(`sandbox config: ${String(sandbox)}`, async t => {
  const root = await fixture(t);
  const configFile = path.join(root, 'harness/config.local.json');
  const config = JSON.parse(await readFile(configFile, 'utf8'));
  config.sandbox = sandbox;
  await writeFile(configFile, JSON.stringify(config));
  const result = await run('TASK-019', { root });
  const allowed = ['elevated', 'unelevated'].includes(sandbox);
  assert.equal(result.status, allowed ? 'PASS' : 'BLOCKED', result.state.reason);
  if (allowed) {
    const input = JSON.parse(await readFile(path.join(result.run_dir, 'execute-1.input.json'), 'utf8'));
    assert.ok(input.command.includes(`windows.sandbox="${sandbox}"`));
  } else {
    assert.match(result.state.reason, /Sandbox must be/);
    assert.ok(!(await readdir(result.run_dir)).includes('execute-1.input.json'));
  }
});
for (const [scenario, status, cycles] of cases) test(`integration: ${scenario}`, async t => {
  const root = await fixture(t, scenario);
  const result = await run('TASK-019', { root });
  assert.equal(result.status, status, result.state.reason);
  assert.equal(result.code, { PASS: 0, HUMAN_REQUIRED: 2, BLOCKED: 3, HANDOFF_PENDING: 0 }[status]);
  assert.equal(result.state.review_cycles, cycles);
  const state = JSON.parse(await readFile(path.join(result.run_dir, 'state.json'), 'utf8'));
  assert.equal(state.status, status);
  const category = { 'executor-auth': 'auth', 'executor-failure': 'execution', sandbox: 'sandbox', 'verify-sandbox': 'verify' }[scenario];
  if (category) assert.equal(state.error_category, category);
  const files = await readdir(result.run_dir);
  if (scenario.startsWith('gate-')) {
    assert.ok(!state.history.some(x => x.phase === 'Git'));
    assert.ok(!files.includes('git-result.json'));
    if (scenario === 'gate-rework') assert.match(state.reason, /PASS cycle 2/);
    if (scenario === 'gate-limit') assert.match(state.reason, /CHANGES_REQUIRED cycle 3/);
  }
  if (cycles === 0) assert.ok(!files.some(x => x.startsWith('review-')));
  if (scenario === 'limit') { assert.ok(files.includes('execute-3.input.json')); assert.ok(!files.includes('execute-4.input.json')); }
  if (scenario === 'rework') assert.match(await readFile(path.join(result.run_dir, 'execute-2.input.json'), 'utf8'), /fix this/);
  if (result.state.workspace) await assert.rejects(readFile(path.join(root, 'output.txt')), { code: 'ENOENT' });
  if (scenario === 'executor-human') { assert.ok(files.includes('verify-1-1.output.json')); assert.ok(files.includes('review-1.output.json')); }
  if (status === 'PASS') {
    assert.match(await readFile(path.join(result.run_dir, `review-${cycles}.input.json`), 'utf8'), /untracked: output.txt/);
    assert.deepEqual(state.history.map(x => x.phase).slice(0, 8), ['Preflight', 'Workspace', 'Execute', 'Guard', 'Verify', 'Review', 'Decide', ...(cycles > 1 ? ['Execute'] : [])]);
  }
  if (scenario === 'secret') for (const file of files) assert.ok(!(await readFile(path.join(result.run_dir, file), 'utf8')).includes('sk-fake0123456789'));
});

test('redaction / strict schema / reviewer extraction / shim rejection', () => {
  assert.ok(!redact('Bearer abcdef api_key="sensitive" ghp_abcdefghijk').includes('sensitive'));
  assert.equal(redact('password=example'), 'password="[REDACTED]"');
  assert.throws(() => validate({ extra: true }, { type: 'object', additionalProperties: false, properties: {} }), Stop);
  assert.throws(() => validate('a', { maxLength: 1 }), Stop);
  assert.throws(() => validate('a', { type: 'string', pattern: '^\\d+$' }), Stop);
  assert.throws(() => extractReviewer(JSON.stringify({ result: '{} {}' })), Stop);
  assert.throws(() => extractReviewer(JSON.stringify({ result: '{}', permission_denials: [{}] })), Stop);
  assert.throws(() => commandCheck(['codex.cmd']), Stop);
});

test('entrypoint exit code and state on main', async t => {
  const root = await fixture(t, 'main');
  const result = await processRun([process.execPath, fileURLToPath(new URL('./run.mjs', import.meta.url)), 'TASK-019'], { cwd: root, timeout: 10000 });
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
