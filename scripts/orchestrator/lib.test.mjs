import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { guard, safePath, extractReviewer, validate, redact, sanitize, requireSuccess, Stop } from './lib.mjs';

test('Guard includes cumulative tracked, staged and untracked changes', () => {
  const contract = { allowed_paths: ['src/', 'delete.txt'], forbidden_paths: ['src/secret.txt'] };
  const snap = { entries: [{ status: ' M', file: 'src/one.txt' }, { status: 'A ', file: 'src/two.txt' }, { status: '??', file: 'src/new file.txt' }, { status: ' D', file: 'delete.txt' }] };
  const files = snap.entries.map(x => x.file);
  assert.doesNotThrow(() => guard(snap, files.toReversed(), contract));
  assert.throws(() => guard(snap, files.slice(1), contract), /mismatch/);
  assert.throws(() => guard({ entries: [{ file: 'src/secret.txt' }] }, ['src/secret.txt'], contract), /violation/);
  assert.throws(() => guard({ entries: [{ file: 'src2/one.txt' }] }, ['src2/one.txt'], contract), /violation/);
  for (const file of ['../outside', 'C:/outside', '/outside', '.git/config', 'src\\file', 'src/file:stream']) assert.throws(() => safePath(file), Stop);
});

test('Nested strict schema catches malformed finding and duplicate files', () => {
  const schema = { type: 'object', required: ['findings'], additionalProperties: false, properties: { findings: { type: 'array', items: { type: 'object', required: ['message'], additionalProperties: false, properties: { message: { type: 'string', minLength: 1 } } } } } };
  assert.doesNotThrow(() => validate({ findings: [{ message: 'fix' }] }, schema));
  for (const value of [{}, { findings: [{}] }, { findings: [{ message: '' }] }, { findings: [{ message: 'fix', extra: true }] }]) assert.throws(() => validate(value, schema), Stop);
  assert.throws(() => validate(['a', 'a'], { type: 'array', uniqueItems: true }), Stop);
});

test('Reviewer JSON extraction handles escaping and rejects ambiguity', () => {
  const value = { verdict: 'PASS', findings: [], text: 'brace } and quote "' };
  for (const result of [JSON.stringify(value), `Explanation\n\`\`\`json\n${JSON.stringify(value)}\n\`\`\``]) assert.deepEqual(extractReviewer(JSON.stringify({ result })), value);
  for (const result of ['{} {}', '{broken', 'no JSON']) assert.throws(() => extractReviewer(JSON.stringify({ result })), Stop);
  assert.throws(() => extractReviewer(JSON.stringify({ result: '{}', is_error: true })), Stop);
});

test('Redaction covers nested record strings before JSON serialization', () => {
  const value = sanitize({ password: 'fixture-sensitive', logs: ['password="fixture-sensitive"', '{"api_key":"fixture-sensitive"}'], token: 'fixture-sensitive' });
  assert.ok(!JSON.stringify(value).includes('fixture-sensitive'));
  assert.equal(redact('Bearer fixture-sensitive'), 'Bearer [REDACTED]');
  assert.ok(!redact('-----BEGIN PRIVATE KEY-----\nfixture-sensitive\n-----END PRIVATE KEY-----').includes('fixture-sensitive'));
});

test('Failure classification is deterministic and never overrides failed verify', () => {
  assert.doesNotThrow(() => requireSuccess({ code: 0 }, 'verify'));
  assert.throws(() => requireSuccess({ code: 1, stdout: '', stderr: '' }, 'verify'), error => error.status === 'BLOCKED');
  assert.throws(() => requireSuccess({ code: 1, stdout: 'usage limit', stderr: '' }, 'executor'), error => error.status === 'BLOCKED');
  assert.throws(() => requireSuccess({ code: 1, stdout: '', stderr: '' }, 'login', true), error => error.status === 'HUMAN_REQUIRED');
});

test('Codex schema keeps the contract while internal validation rejects duplicate and empty paths', async () => {
  const load = async name => JSON.parse(await readFile(new URL('../../harness/schemas/' + name, import.meta.url), 'utf8'));
  const internal = await load('executor-result.schema.json');
  const codex = await load('executor-result.codex.schema.json');
  const project = node => Object.fromEntries(Object.entries(node).filter(([key]) => !['$schema', 'title', 'description', 'uniqueItems', 'minLength', 'minItems'].includes(key)).map(([key, value]) => [key, key === 'properties' ? Object.fromEntries(Object.entries(value).map(([name, child]) => [name, project(child)])) : key === 'items' ? project(value) : value]));
  assert.deepEqual(codex, project(internal));
  const check = node => {
    for (const key of Object.keys(node)) assert.ok(['type', 'enum', 'required', 'properties', 'additionalProperties', 'items'].includes(key));
    if (node.type === 'object') {
      assert.equal(node.additionalProperties, false);
      assert.deepEqual([...node.required].sort(), Object.keys(node.properties).sort());
    }
    Object.values(node.properties ?? {}).forEach(check);
    if (node.items) check(node.items);
  };
  check(codex);
  const result = { status: 'DONE', changed_files: ['output.txt'], summary: '', verification: [], human_decisions_needed: [] };
  validate(result, internal);
  for (const changed_files of [['output.txt', 'output.txt'], ['']]) {
    validate({ ...result, changed_files }, codex);
    assert.throws(() => validate({ ...result, changed_files }, internal), Stop);
  }
});
