import { processRun, Stop, commandCheck } from './lib.mjs';

const providers = /^AWS_(?:ACCESS_KEY(?:_ID)?|SECRET_ACCESS_KEY|SECRET_KEY|SESSION_TOKEN|SECURITY_TOKEN|PROFILE|DEFAULT_PROFILE|ROLE_ARN|ROLE_SESSION_NAME|WEB_IDENTITY_TOKEN_FILE|CONTAINER_CREDENTIALS.*|CREDENTIAL.*|CONFIG_FILE|SHARED_CREDENTIALS_FILE)$/i;
const approved = new Set(['moodfit-readonly', 'moodfit-staging']);

// Identity output stays in memory; never use the recorded call wrapper.
export async function awsPreflight(contract, config, { cwd, timeout, signal, record, env = process.env, execute = processRun } = {}) {
  const profiles = contract.aws_profiles ?? [];
  if (!profiles.length) return;
  const stop = async (profile, reason) => {
    await record('aws-preflight.json', { profile, matched: false, at: new Date().toISOString(), reason });
    throw new Stop('HUMAN_REQUIRED', `AWS Preflight: ${reason}`, 'auth');
  };
  for (const profile of profiles) {
    if (Object.keys(env).some(key => providers.test(key) && env[key])) await stop(profile, 'credential-source');
    const aws = config.aws;
    if (!approved.has(profile) || !Array.isArray(aws?.allowed_profiles) || !aws.allowed_profiles.includes(profile) || aws?.forbidden_profiles?.includes(profile)) await stop(profile, 'forbidden-profile');
    const expected = aws.profiles?.[profile];
    if (!expected || !/^\d{12}$/.test(expected.account ?? '') || !/^[\w+=,.@-]+$/.test(expected.role ?? '')) await stop(profile, 'missing-expectation');
    if (/AdministratorAccess/i.test(expected.role)) await stop(profile, 'administrator-role');
    try { commandCheck(aws.command); } catch { await stop(profile, 'missing-command'); }
    let result;
    try { result = await execute([...aws.command, 'sts', 'get-caller-identity', '--profile', profile, '--output', 'json'], { cwd, timeout, signal, env }); }
    catch { await stop(profile, 'lookup-failed'); }
    if (result.failure || result.code !== 0) await stop(profile, result.failure === 'timeout' ? 'timeout' : 'lookup-failed');
    let identity;
    try { identity = JSON.parse(result.stdout); } catch { await stop(profile, 'invalid-response'); }
    if (!identity || typeof identity !== 'object' || Array.isArray(identity)) await stop(profile, 'invalid-response');
    const match = /^arn:aws:sts::(\d{12}):assumed-role\/([^/]+)\/[^/]+$/.exec(identity.Arn ?? '');
    if (!match) await stop(profile, 'invalid-role');
    if (/AdministratorAccess/i.test(match[2])) await stop(profile, 'administrator-role');
    if (identity.Account !== expected.account || match[1] !== expected.account) await stop(profile, 'account-mismatch');
    if (match[2] !== expected.role) await stop(profile, 'role-mismatch');
    await record('aws-preflight.json', { profile, matched: true, at: new Date().toISOString(), reason: 'matched' });
  }
}
