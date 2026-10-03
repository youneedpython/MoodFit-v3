import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNoSecrets, guard, readJson, validate, redact } from './lib.mjs';
import { decide } from './state-machine.mjs';
import { workspaceName } from './workspace.mjs';
import { prBody, prTitle, PR_BODY_LIMIT } from './pr-description.mjs';
import { awsPreflight } from './aws-preflight.mjs';

const assignment = (name, value, separator = '=') => name + separator + value;
test('non-line-breaking whitespace after assignment separators remains blocked', () => {
  for (const space of ['\u00a0', '\u3000', '\f', '\v', '\t']) {
    for (const separator of ['=', ':']) {
      const input = assignment('pass' + 'word', space + 'synthetic-value', separator);
      assert.throws(() => assertNoSecrets(input), /Secret-like/);
      assert.ok(!redact(input).includes('synthetic-value'));
      assert.throws(() => assertNoSecrets(JSON.stringify({ text: input })), /Secret-like/);
      assert.throws(() => guard({ entries: [{ file: 'output.txt' }], diff: '+' + input }, ['output.txt'], { allowed_paths: ['output.txt'], forbidden_paths: [] }), /Secret-like/);
    }
  }
});
test('ARN resource colon does not consume the next assignment boundary', () => {
  const arn = 'arn:aws:secretsmanager:region:example:' + 'sec' + 'ret:';
  assert.doesNotThrow(() => assertNoSecrets(arn + 'example'));
  const input = arn + assignment('pass' + 'word', 'synthetic-value');
  assert.throws(() => assertNoSecrets(input), /Secret-like/);
  assert.ok(!redact(input).includes('synthetic-value'));
});
test('credential JSON context masks all nested primitives except placeholders', () => {
  const key = 'pass' + 'word';
  for (const value of [123456, true, false, null, ['synthetic-value', 123456, true], { nested: ['synthetic-value', { count: 123456 }] }]) {
    const input = JSON.stringify({ [key]: value, count: 7 });
    assert.throws(() => assertNoSecrets(input), /Secret-like/);
    const clean = JSON.parse(redact(input));
    assert.equal(clean.count, 7);
    const check = item => {
      if (item && typeof item === 'object') Object.values(item).forEach(check);
      else assert.equal(item, '[REDACTED]');
    };
    check(clean[key]);
  }
  assert.doesNotThrow(() => assertNoSecrets(JSON.stringify({ [key]: ['<placeholder>', { nested: '{{PLACEHOLDER}}' }, ''] })));
});
test('blocked unquoted values redact the whole remainder', () => {
  for (const raw of ['first second remainder', '<placeholder>attached-value', '${PLACEHOLDER}attached-value']) {
    const input = assignment('pass' + 'word', raw);
    assert.throws(() => assertNoSecrets(input), /Secret-like/);
    const output = redact(input);
    assert.ok(!output.includes('second'));
    assert.ok(!output.includes('remainder'));
    assert.ok(!output.includes('attached-value'));
  }
});
test('serialized documents preserve allowed line endings and block assignments', () => {
  const key = 'pass' + 'word';
  const document = [assignment(key, '<placeholder>'), assignment(key, '${PLACEHOLDER}'), assignment(key, '{{PLACEHOLDER}}'), 'secretsmanager:GetSecretValue', assignment(key, '설명', ': ')].join('\n');
  for (const text of [document, document + '\n']) {
    assert.doesNotThrow(() => assertNoSecrets(JSON.stringify({ text })));
    assert.throws(() => assertNoSecrets(JSON.stringify({ text: text + '\n' + assignment(key, 'actual-fixture') })), /Secret-like/);
  }
  assert.doesNotThrow(() => assertNoSecrets(JSON.stringify({ [key]: '<placeholder>' })));
});
test('quoted IAM actions pass while later assignments remain blocked', () => {
  for (const quote of ['"', "'"]) {
    const input = '  ' + quote + 'secretsmanager:GetSecretValue' + quote + ',';
    assert.doesNotThrow(() => assertNoSecrets(input));
    assert.throws(() => assertNoSecrets(input + ' ' + assignment('pass' + 'word', 'actual-fixture')), /Secret-like/);
  }
});
test('ARN exemption requires partition and service sections', () => {
  for (const raw of ['arn:pretend', 'arn:aws:pretend', 'short }']) {
    assert.throws(() => assertNoSecrets(assignment('pass' + 'word', raw, ': ')), /Secret-like/);
  }
  assert.doesNotThrow(() => assertNoSecrets(assignment('pass' + 'word', 'arn:aws:fixture:region:example:resource', ': ')));
});
test('each candidate after prose, ARN or placeholder is independently blocked', () => {
  const key = 'pass' + 'word';
  const later = assignment('DB_' + 'PASSWORD', 'synthetic-value');
  for (const allowed of ['자연어 설명', 'AWS Managed Secret 방식', 'arn:aws:fixture:region:example:resource', '<placeholder>', '{{PLACEHOLDER}}']) {
    const input = assignment(key, allowed + ' ' + later, ': ');
    assert.throws(() => assertNoSecrets(input), /Secret-like/);
    assert.ok(!redact(input).includes('synthetic-value'));
  }
  for (const raw of ['ab|cd', 'a1 설명', 'ab! 설명', 'abcdefgh 설명', 'fixture # comment']) {
    assert.throws(() => assertNoSecrets(assignment(key, raw, ': ')), /Secret-like/);
  }
  for (const delimiter of [';', '?', '&', '/', '(']) {
    assert.throws(() => assertNoSecrets(assignment(key, 'arn:aws:fixture:region:example:resource' + delimiter + later, ': ')), /Secret-like/);
  }
  for (const raw of ['`secretsmanager:GetSecretValue` 설명', 'secretsmanager:GetSecretValue 설명', '(secretsmanager:GetSecretValue). 설명']) {
    assert.doesNotThrow(() => assertNoSecrets(raw));
    assert.throws(() => assertNoSecrets(raw + ' ' + later), /Secret-like/);
  }
});
test('serialized redaction covers both nested strings and credential object keys', () => {
  const input = JSON.stringify({ text: assignment('api_' + 'key', 'nested-fixture'), ['pass' + 'word']: 'object-fixture' });
  const output = redact(input);
  assert.ok(!output.includes('nested-fixture'));
  assert.ok(!output.includes('object-fixture'));
});
test('assignment boundaries and serialized original strings remain blocked', () => {
  const key = 'pass' + 'word';
  for (const prefix of ['+', 'spring.datasource.', 'obj.', '&', ';', '?', '[', '(']) {
    for (const separator of ['=', ': ']) {
      for (const raw of ['synthetic-value', '"synthetic-value"']) {
        const value = prefix + assignment(key, raw, separator);
        assert.throws(() => assertNoSecrets(value), /Secret-like/);
        assert.throws(() => assertNoSecrets(JSON.stringify({ text: 'intro\n' + value })), /Secret-like/);
      }
    }
  }
  for (const value of ['synthetic-value # comment', 'synthetic|value', '{{PLACEHOLDER}}actual{{PLACEHOLDER}}']) {
    assert.throws(() => assertNoSecrets(assignment(key, value, ': ')), /Secret-like/);
  }
  for (const separator of ['=', ': ']) {
    const diff = '+' + assignment(key, 'synthetic-value', separator);
    assert.throws(() => guard({ entries: [{ file: 'output.txt' }], diff }, ['output.txt'], { allowed_paths: ['output.txt'], forbidden_paths: [] }), /Secret-like/);
  }
});
test('mandatory secret formats remain blocked', () => {
  const inputs = [
    ['-'.repeat(5), 'BEGIN ', ['PRIVATE', 'KEY'].join(' '), '-'.repeat(5), '\nfixture\n', '-'.repeat(5), 'END ', ['PRIVATE', 'KEY'].join(' '), '-'.repeat(5)].join(''),
    ['Bear', 'er fixture-value'].join(''),
    ['sk', '-synthetic0123456789'].join(''),
    ['ghp', '_synthetic0123456789'].join(''),
    ['github', '_pat_synthetic0123456789'].join(''),
    ['AK', 'IA', 'A'.repeat(16)].join(''),
    ['AS', 'IA', 'A'.repeat(16)].join(''),
    assignment('pass' + 'word', '"<placeholder>"actual-value'),
    assignment('DB_' + 'PASSWORD', 'synthetic-value'),
    assignment('AWS_' + 'SECRET_ACCESS_KEY', 'synthetic-value'),
    assignment('access_' + 'token', 'synthetic-value', ': '),
    assignment('"pass' + 'word"', '"synthetic value"', ': '),
    assignment('api_' + 'key', "'synthetic value'", ': '),
    ['https://user', ':fixture-value', '@example.invalid'].join(''),
  ];
  for (const input of inputs) assert.throws(() => assertNoSecrets(input), /Secret-like/);
});
test('placeholders, ARN, IAM and Markdown prose pass deterministically', () => {
  for (const value of ['<placeholder>', '${PLACEHOLDER}', '{{PLACEHOLDER}}', '[REDACTED]', 'REDACTED', '', '""']) {
    assert.doesNotThrow(() => assertNoSecrets(assignment('pass' + 'word', value)));
  }
  assert.doesNotThrow(() => assertNoSecrets(assignment('pass' + 'word', '\nNEXT=fixture')));
  for (const input of [
    'arn:aws:secretsmanager:ap-northeast-2:111111111111:' + 'sec' + 'ret:example',
    'secretsmanager:GetSecretValue',
    'secretsmanager:*',
    '- Pass' + 'word: AWS Managed Secret 방식',
    '| Secret | AWS Managed Secret 방식 |',
    '- To' + 'ken: 자연어 설명 문장',
  ]) assert.doesNotThrow(() => assertNoSecrets(input));
});
const description = {
  contract: { id: 'TASK-032', title: '개선 작업' },
  executor: { pr_overview: '반복 문제를 해결한다.', pr_changes: ['PR 본문 개선'], pr_follow_up: [] },
  reviewer: { verdict: 'PASS', findings: [{ message: '비차단 지적' }] },
  verification: [{ command: ['node', '--test'], code: 0 }],
  reviewCycle: 2, files: ['docs/example.md'], metadata: { diff_summary: '1 file changed' },
};
test('Korean PR describes work, review cycle, verification and handoff', () => {
  assert.equal(prTitle(description.contract), 'TASK-032 개선 작업');
  const body = prBody(description);
  for (const part of ['개요', '주요 변경', '검증', 'Review 결과', '회차: 2', '비차단 지적', '후속 작업 / 잔여 위험', 'Human Squash Merge', 'Auto Merge 없음', '<details>', 'Co-authored-by']) assert.ok(body.includes(part));
  assert.ok(body.indexOf('docs/example.md') > body.indexOf('<details>'));
});
test('PR length bounded and omitted content still checked for secrets', () => {
  const long = { ...description, executor: { ...description.executor, pr_overview: '가'.repeat(PR_BODY_LIMIT * 2) } };
  assert.ok(prBody(long).length <= PR_BODY_LIMIT);
  assert.ok(prBody(long).includes('생략'));
  for (const section of ['주요 변경', 'Review 결과', '승인 안내', 'Co-authored-by', '</details>']) assert.ok(prBody(long).includes(section));
  assert.throws(() => prBody({ ...long, executor: { ...long.executor, pr_follow_up: [assignment('pass' + 'word', 'synthetic-value')] } }), /Secret-like/);
});
test('limited PR preserves empty sections and Unicode boundaries', () => {
  const body = prBody({ ...description, reviewer: { verdict: 'PASS', findings: [] }, executor: { ...description.executor, pr_overview: '가'.repeat(4999) + '😀' + '가'.repeat(PR_BODY_LIMIT) } });
  assert.ok(body.includes('비차단 지적 없음'));
  assert.ok(body.includes('## 후속 작업 / 잔여 위험\n없음'));
  assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(body));
});
test('Executor PR fields are mandatory in both schemas', async () => {
  for (const name of ['executor-result.schema.json', 'executor-result.codex.schema.json']) {
    const schema = await readJson(new URL('../../harness/schemas/' + name, import.meta.url));
    const result = { status: 'DONE', changed_files: [], summary: '', verification: [], human_decisions_needed: [], handoff_actions: [], ...description.executor };
    validate(result, schema);
    for (const key of ['pr_overview', 'pr_changes', 'pr_follow_up']) {
      const missing = { ...result }; delete missing[key];
      assert.throws(() => validate(missing, schema), /Schema/);
    }
  }
});
test('Gate rework reaches PASS or limit without permission for Git', () => {
  const executor = { status: 'HUMAN_REQUIRED', human_decisions_needed: ['Decision'], handoff_actions: [] };
  assert.equal(decide(executor, { verdict: 'CHANGES_REQUIRED' }, 1).status, 'REWORK');
  const pass = decide(executor, { verdict: 'PASS' }, 2);
  assert.equal(pass.status, 'HUMAN_REQUIRED'); assert.match(pass.reason, /PASS cycle 2/);
  assert.match(decide(executor, { verdict: 'CHANGES_REQUIRED' }, 3).reason, /CHANGES_REQUIRED cycle 3/);
  assert.equal(decide(executor, { verdict: 'BLOCKED' }, 1).status, 'BLOCKED');
});
test('workspace name is short, stable and distinct', () => {
  assert.equal(workspaceName('run-one').length, 16);
  assert.equal(workspaceName('run-one'), workspaceName('run-one'));
  assert.notEqual(workspaceName('run-one'), workspaceName('run-two'));
});
test('AWS endpoint and CA overrides are blocked before fake invocation', async () => {
  for (const key of ['AWS_ENDPOINT_URL', 'AWS_ENDPOINT_URL_STS', 'AWS_CA_BUNDLE']) {
    await assert.rejects(awsPreflight({ aws_profiles: ['moodfit-readonly'] }, {}, {
      env: { [key]: 'fixture' }, record: async () => {}, execute: () => assert.fail('invoked'),
    }), /credential-source/);
  }
  await assert.rejects(awsPreflight({ aws_profiles: ['moodfit-readonly'] }, {}, {
    env: {}, record: async () => {}, execute: () => assert.fail('invoked'),
  }), /missing-config/);
});
