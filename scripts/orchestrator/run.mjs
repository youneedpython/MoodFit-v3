import { mkdir, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Stop, blocked, readJson, redact, sanitize, validate, commandCheck, processRun, requireSuccess, safePath, inside, extractReviewer, git, changes, snapshot, guard } from './lib.mjs';

const assets = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../harness');
const exits = { PASS: 0, ERROR: 1, HUMAN_REQUIRED: 2, BLOCKED: 3 };
const strings = { type: 'array', items: { type: 'string', minLength: 1 }, uniqueItems: true };
const contractSchema = {
  type: 'object', additionalProperties: false,
  required: ['id', 'title', 'task_file', 'allowed_paths', 'forbidden_paths', 'verify', 'max_review_cycles'],
  properties: {
    id: { type: 'string', minLength: 1 }, title: { type: 'string', minLength: 1 }, task_file: { type: 'string', minLength: 1 },
    allowed_paths: { ...strings, minItems: 1 }, forbidden_paths: strings, max_review_cycles: { type: 'number', const: 3 },
    verify: { type: 'array', minItems: 1, items: { type: 'object', additionalProperties: false, required: ['command', 'cwd'], properties: { command: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } }, cwd: { type: 'string', minLength: 1 } } } }
  }
};

export async function run(taskId, { root = process.cwd(), configPath = path.join(root, 'harness/config.local.json'), assetRoot = assets } = {}) {
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`;
  const runDir = path.join(root, '.harness/runs', runId);
  const state = { task_id: taskId, run_id: runId, phase: 'Preflight', status: 'RUNNING', review_cycles: 0, reason: '', history: [] };
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.on('SIGINT', interrupt); process.on('SIGTERM', interrupt);
  let temporary;
  const record = async (name, value) => writeFile(path.join(runDir, name), (typeof value === 'string' ? redact(value) : JSON.stringify(sanitize(value), null, 2)) + '\n', 'utf8');
  const phase = async name => {
    if (controller.signal.aborted) blocked('interrupted');
    state.phase = name; state.history.push({ phase: name, cycle: state.review_cycles, at: new Date().toISOString() });
    await record('state.json', state);
  };
  const call = async (name, command, timeout, input = '', cwd = root) => {
    await record(`${name}.input.json`, { command, cwd, timeout, input });
    const result = await processRun(command, { cwd, timeout, input, signal: controller.signal });
    await record(`${name}.output.json`, result);
    return result;
  };
  try {
    await mkdir(runDir, { recursive: true });
    await phase('Preflight');
    if (!/^TASK-\d{3}$/.test(taskId ?? '')) blocked('Usage: node scripts/orchestrator/run.mjs <TASK-ID> [--config <path>]');
    if (Number(process.versions.node.split('.')[0]) !== 24) blocked('Node.js 24 required');
    if (path.resolve((await git(root, ['rev-parse', '--show-toplevel'], controller.signal)).trim()) !== path.resolve(root)) blocked('Run from repository root');
    const branch = (await git(root, ['branch', '--show-current'], controller.signal)).trim();
    if (!branch || branch === 'main') blocked('main or detached HEAD');
    if ((await changes(root, controller.signal)).length) blocked('Working Tree is dirty');
    // Run records must be ignored before any agent is started.
    requireSuccess(await call('preflight-ignore', ['git', 'check-ignore', runDir + '/state.json'], 30000), 'Run directory must be gitignored');
    let config, contract, executorSchema, codexSchema, reviewerSchema, executorTemplate, reviewerTemplate, taskText;
    try {
      config = await readJson(configPath);
      contract = await readJson(path.join(root, 'harness/tasks', `${taskId}.json`));
      validate(contract, contractSchema);
      if (contract.id !== taskId) blocked('Task id mismatch');
      for (const rule of [...contract.allowed_paths, ...contract.forbidden_paths]) safePath(rule, true);
      const taskPath = await inside(root, contract.task_file);
      taskText = await readFile(taskPath, 'utf8');
      executorSchema = await readJson(path.join(assetRoot, 'schemas/executor-result.schema.json'));
      codexSchema = await readJson(path.join(assetRoot, 'schemas/executor-result.codex.schema.json'));
      reviewerSchema = await readJson(path.join(assetRoot, 'schemas/reviewer-result.schema.json'));
      executorTemplate = await readFile(path.join(assetRoot, 'prompts/executor.md'), 'utf8');
      reviewerTemplate = await readFile(path.join(assetRoot, 'prompts/reviewer.md'), 'utf8');
      if (!executorTemplate.includes('{{INPUT}}') || !reviewerTemplate.includes('{{INPUT}}')) blocked('Missing prompt placeholder');
      commandCheck(config.codex?.command); commandCheck(config.claude?.command);
      if (config.sandbox !== 'unelevated') blocked('Sandbox must be unelevated');
      for (const key of ['preflight_ms', 'executor_ms', 'reviewer_ms', 'verify_ms']) if (!Number.isSafeInteger(config.timeouts?.[key]) || config.timeouts[key] <= 0) blocked(`Invalid timeout: ${key}`);
      for (const check of contract.verify) { commandCheck(check.command); if (check.cwd !== '.') await inside(root, check.cwd); }
    } catch (error) { if (error instanceof Stop) throw error; blocked(`Configuration / contract: ${error.code ?? error.name}`); }
    await record('preflight.contract.json', contract);
    requireSuccess(await call('preflight-codex-version', [...config.codex.command, '--version'], config.timeouts.preflight_ms), 'Codex executable');
    const login = await call('preflight-login', [...config.codex.command, 'login', 'status'], config.timeouts.preflight_ms);
    if (login.failure) requireSuccess(login, 'Codex login process');
    requireSuccess(login, 'Codex login', true);
    requireSuccess(await call('preflight-claude-version', [...config.claude.command, '--version'], config.timeouts.preflight_ms), 'Claude executable');
    temporary = await mkdtemp(path.join(os.tmpdir(), 'moodfit-result-'));
    const schemaFile = path.join(temporary, 'executor-schema.json');
    await writeFile(schemaFile, JSON.stringify(codexSchema));
    let findings = [];
    for (let cycle = 1; cycle <= contract.max_review_cycles; cycle++) {
      await phase('Execute');
      const resultFile = path.join(temporary, `executor-${cycle}.json`);
      const input = executorTemplate.replace('{{INPUT}}', () => redact(JSON.stringify({ contract, task_document: taskText, findings, result_schema: executorSchema }, null, 2)));
      const execution = await call(`execute-${cycle}`, [...config.codex.command, 'exec', '-s', 'workspace-write', '-c', 'windows.sandbox="unelevated"', '--output-schema', schemaFile, '-o', resultFile, '-'], config.timeouts.executor_ms, input);
      requireSuccess(execution, 'Executor');
      await phase('Guard');
      let executor;
      try {
        const raw = await readFile(resultFile, 'utf8');
        await rm(resultFile, { force: true });
        await record(`executor-${cycle}.raw.txt`, raw);
        executor = JSON.parse(raw.replace(/^\uFEFF/, ''));
      } catch { blocked('Malformed Executor JSON / missing result'); }
      await record(`executor-${cycle}.json`, executor);
      validate(executor, executorSchema);
      const before = await snapshot(root, controller.signal);
      guard(before, executor.changed_files, contract);
      await record(`guard-${cycle}.json`, { changed_files: before.entries, matched: true });
      if (executor.status === 'FAILED') blocked('Executor FAILED');
      if (executor.status === 'HUMAN_REQUIRED') throw new Stop('HUMAN_REQUIRED', executor.human_decisions_needed.join('; ') || 'Executor Human Gate');
      await phase('Verify');
      const verification = [];
      for (let i = 0; i < contract.verify.length; i++) {
        const check = contract.verify[i];
        const cwd = check.cwd === '.' ? root : await inside(root, check.cwd);
        const result = await call(`verify-${cycle}-${i + 1}`, check.command, config.timeouts.verify_ms, '', cwd);
        verification.push({ command: check.command, cwd: check.cwd, ...result });
        requireSuccess(result, 'Verify');
      }
      if (JSON.stringify(before) !== JSON.stringify(await snapshot(root, controller.signal))) blocked('Verify changed Working Tree');
      await phase('Review'); state.review_cycles = cycle; await record('state.json', state);
      const reviewerInput = reviewerTemplate.replace('{{INPUT}}', () => redact(JSON.stringify({ contract, task_document: taskText, diff: before.diff, verify_logs: verification, result_schema: reviewerSchema }, null, 2)));
      const review = await call(`review-${cycle}`, [...config.claude.command, '-p', '--output-format', 'json', '--allowedTools', 'Read,Grep,Glob', '--tools', 'Read,Grep,Glob', '--strict-mcp-config'], config.timeouts.reviewer_ms, reviewerInput);
      requireSuccess(review, 'Reviewer');
      let verdict;
      try { verdict = extractReviewer(review.stdout); } catch (error) { if (error instanceof Stop) throw error; blocked('Malformed Reviewer JSON'); }
      validate(verdict, reviewerSchema);
      if (verdict.verdict === 'CHANGES_REQUIRED' && !verdict.findings.length) blocked('CHANGES_REQUIRED needs findings');
      await record(`reviewer-${cycle}.json`, verdict);
      if (JSON.stringify(before) !== JSON.stringify(await snapshot(root, controller.signal))) blocked('Reviewer changed Working Tree');
      await phase('Decide');
      if (verdict.verdict !== 'CHANGES_REQUIRED') {
        state.status = verdict.verdict; state.reason = verdict.findings.map(x => x.message).join('; '); break;
      }
      findings = verdict.findings;
      if (cycle === contract.max_review_cycles) { state.status = 'HUMAN_REQUIRED'; state.reason = 'Review limit reached (3)'; }
    }
  } catch (error) {
    state.status = error instanceof Stop ? error.status : 'ERROR';
    state.reason = error.message;
  } finally {
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
    if (temporary) await rm(temporary, { recursive: true, force: true });
    state.finished_at = new Date().toISOString();
    await mkdir(runDir, { recursive: true });
    await record('state.json', state);
  }
  return { status: state.status, code: exits[state.status] ?? 1, run_dir: runDir, state };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (!(args.length === 1 || (args.length === 3 && args[1] === '--config'))) {
    process.stderr.write('Usage: node scripts/orchestrator/run.mjs <TASK-ID> [--config <path>]\n'); process.exitCode = 3;
  } else {
    try {
      const result = await run(args[0], { configPath: args[2] ? path.resolve(args[2]) : undefined });
      process.stdout.write(redact(JSON.stringify({ status: result.status, run_dir: result.run_dir, reason: result.state.reason })) + '\n');
      process.exitCode = result.code;
    } catch (error) { process.stderr.write(redact(error.message) + '\n'); process.exitCode = 1; }
  }
}
