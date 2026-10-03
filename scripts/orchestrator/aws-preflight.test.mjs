import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { awsPreflight } from './aws-preflight.mjs';
import { validate, readJson } from './lib.mjs';

const fake = fileURLToPath(new URL('./fixtures/fake-aws.mjs', import.meta.url));
const contract = { aws_profiles: ['moodfit-readonly'] };
const config = mode => ({ aws: { command: [process.execPath, fake, mode], allowed_profiles: ['moodfit-readonly'], forbidden_profiles: ['moodfit-production-human'], profiles: { 'moodfit-readonly': { account: '111111111111', role: 'AWSReservedSSO_MoodFitReadOnly_fake' } } } });
const options = logs => ({ env: {}, timeout: 2000, record: async (name, value) => logs.push({ name, value }) });

test('optional contract field validates unique nonempty aliases', async () => {
  const schema = (await readJson(new URL('../../harness/schemas/task-contract.schema.json', import.meta.url))).properties.aws_profiles;
  validate([], schema); validate(contract.aws_profiles, schema);
  assert.throws(() => validate(['moodfit-readonly', 'moodfit-readonly'], schema));
  assert.throws(() => validate([''], schema));
});
test('absent and empty profiles skip CLI and configuration', async () => {
  for (const c of [{}, { aws_profiles: [] }]) await awsPreflight(c, {}, { execute: () => assert.fail('CLI invoked') });
});
test('fake CLI success records only alias and match metadata', async () => {
  const logs = [];
  await awsPreflight(contract, config('ok'), options(logs));
  assert.equal(logs[0].value.matched, true);
  const text = JSON.stringify(logs);
  for (const sensitive of ['111111111111', 'arn:', 'private-session', 'private-user-id', 'AWSReservedSSO']) assert.ok(!text.includes(sensitive));
});
for (const [mode, reason] of [['account', 'account-mismatch'], ['role', 'role-mismatch'], ['partial', 'role-mismatch'], ['admin', 'administrator-role'], ['expired', 'lookup-failed'], ['timeout', 'timeout']]) {
  test(`fake CLI rejects ${mode}`, async () => {
    const logs = [];
    await assert.rejects(awsPreflight(contract, config(mode), { ...options(logs), timeout: mode === 'timeout' ? 100 : 2000 }), error => error.status === 'HUMAN_REQUIRED' && error.message.endsWith(reason));
    assert.equal(logs[0].value.reason, reason);
    assert.ok(!JSON.stringify(logs).includes('111111111111'));
  });
}
test('missing expectations, admin expectation and forbidden profiles fail before invoking CLI', async () => {
  const cases = [
    [contract, { aws: { allowed_profiles: ['moodfit-readonly'] } }, 'missing-expectation'],
    [contract, config('ok'), 'forbidden-profile'],
    [{ aws_profiles: ['moodfit-production-human'] }, config('ok'), 'forbidden-profile'],
    [{ aws_profiles: ['student11'] }, config('ok'), 'forbidden-profile'],
  ];
  cases[1][1].aws.forbidden_profiles.push('moodfit-readonly');
  const admin = config('ok'); admin.aws.profiles['moodfit-readonly'].role = 'AdministratorAccess';
  cases.push([contract, admin, 'administrator-role']);
  for (const [c, cfg, reason] of cases) await assert.rejects(awsPreflight(c, cfg, { ...options([]), execute: () => assert.fail('CLI invoked') }), error => error.status === 'HUMAN_REQUIRED' && error.message.endsWith(reason));
});
test('alternative credential sources fail without recording values', async () => {
  for (const key of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN', 'AWS_PROFILE', 'AWS_DEFAULT_PROFILE', 'AWS_WEB_IDENTITY_TOKEN_FILE', 'AWS_CONTAINER_CREDENTIALS_FULL_URI', 'AWS_CONFIG_FILE']) {
    const logs = [];
    await assert.rejects(awsPreflight(contract, config('ok'), { ...options(logs), env: { [key]: 'private-value' }, execute: () => assert.fail('CLI invoked') }), /credential-source/);
    assert.ok(!JSON.stringify(logs).includes('private-value'));
  }
});
