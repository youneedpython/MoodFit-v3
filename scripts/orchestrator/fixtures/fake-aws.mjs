import { readFile, writeFile } from 'node:fs/promises';
let mode = process.argv[2];
if (mode === 'recheck') {
  const marker = process.argv[3];
  let count = 0;
  try { count = Number(await readFile(marker, 'utf8')); } catch {}
  await writeFile(marker, String(count + 1));
  mode = count ? 'expired' : 'ok';
}
if (mode === 'timeout') await new Promise(resolve => setTimeout(resolve, 10000));
if (mode === 'expired') { process.stderr.write('Expired SSO session'); process.exit(1); }
const account = mode === 'account' ? '222222222222' : '111111111111';
const role = mode === 'admin' ? 'AWSReservedSSO_AdministratorAccess_fake' : mode === 'partial' ? 'AWSReservedSSO_MoodFitReadOnly_fake_extra' : mode === 'role' ? 'DifferentRole' : 'AWSReservedSSO_MoodFitReadOnly_fake';
process.stdout.write(JSON.stringify({ Account: account, Arn: `arn:aws:sts::${account}:assumed-role/${role}/private-session`, UserId: 'private-user-id' }));
