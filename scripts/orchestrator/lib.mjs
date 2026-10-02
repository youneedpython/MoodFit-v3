import { spawn } from 'node:child_process';
import { readFile, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';

export class Stop extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const blocked = message => { throw new Stop('BLOCKED', message); };
export const readJson = async file => JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
export function redact(value) {
  return String(value)
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, '[REDACTED PRIVATE KEY]')
    .replace(/\bBearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
    .replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,}|AKIA[A-Z0-9]{16})\b/g, '[REDACTED]')
    .replace(/((?:["']?)(?:password|passwd|api[_-]?key|access[_-]?token|secret(?:[_-]?key)?|token)(?:["']?)\s*[:=]\s*)("[^"\r\n]*"|'[^'\r\n]*'|[^\s,}\r\n]+)/gi, '$1"[REDACTED]"');
}
export function sanitize(value) {
  if (typeof value === 'string') return redact(value);
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) =>
    [key, /^(?:password|passwd|api[_-]?key|access[_-]?token|secret(?:[_-]?key)?|token)$/i.test(key) ? '[REDACTED]' : sanitize(item)]));
  return value;
}
export function validate(value, schema, at = '$') {
  const supported = new Set(['$schema', 'title', 'description', 'type', 'enum', 'const', 'required', 'properties', 'additionalProperties', 'items', 'uniqueItems', 'minItems', 'minLength']);
  for (const key of Object.keys(schema)) if (!supported.has(key)) blocked(`Unsupported schema keyword: ${key}`);
  const type = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
  if (schema.type && schema.type !== type) blocked(`Schema ${at}: expected ${schema.type}`);
  if (schema.enum && !schema.enum.includes(value)) blocked(`Schema ${at}: invalid enum`);
  if ('const' in schema && value !== schema.const) blocked(`Schema ${at}: invalid const`);
  if (type === 'object') {
    for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) blocked(`Schema ${at}: missing ${key}`);
    for (const [key, item] of Object.entries(value)) {
      if (schema.properties?.[key]) validate(item, schema.properties[key], `${at}.${key}`);
      else if (schema.additionalProperties === false) blocked(`Schema ${at}: unexpected ${key}`);
    }
  }
  if (type === 'array') {
    if (value.length < (schema.minItems ?? 0)) blocked(`Schema ${at}: too few items`);
    if (schema.uniqueItems && new Set(value.map(x => JSON.stringify(x))).size !== value.length) blocked(`Schema ${at}: duplicate items`);
    if (schema.items) value.forEach((item, i) => validate(item, schema.items, `${at}[${i}]`));
  }
  if (type === 'string' && value.length < (schema.minLength ?? 0)) blocked(`Schema ${at}: empty string`);
}
export function commandCheck(command) {
  if (!Array.isArray(command) || !command.length || command.some(x => typeof x !== 'string' || !x || x.includes('\0'))) blocked('Command must be a nonempty string array');
  if (/\.(cmd|bat)$/i.test(command[0])) blocked('Use node + CLI JS entry instead of .cmd/.bat shim');
}
export async function processRun(command, { cwd, timeout, input = '', signal } = {}) {
  commandCheck(command);
  return new Promise(resolve => {
    let stdout = '', stderr = '', failure = null, finished = false, killer;
    let child;
    try { child = spawn(command[0], command.slice(1), { cwd, shell: false, windowsHide: true, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] }); }
    catch (error) { resolve({ code: null, failure: `spawn: ${error.code ?? error.message}`, stdout, stderr }); return; }
    const kill = reason => {
      if (finished || failure) return;
      failure = reason;
      if (child.pid) {
        if (process.platform === 'win32') {
          killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore', shell: false });
          killer.on('error', () => child.kill('SIGKILL'));
        } else { try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); } }
      }
    };
    const abort = () => kill('interrupted');
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => kill('timeout'), timeout);
    const finish = code => {
      if (finished) return;
      finished = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
      resolve({ code, failure, stdout, stderr });
    };
    child.on('error', error => { failure = `spawn: ${error.code ?? error.message}`; finish(null); });
    child.on('close', finish);
    for (const [stream, name] of [[child.stdout, 'stdout'], [child.stderr, 'stderr']]) {
      stream.setEncoding('utf8'); stream.on('data', chunk => {
        if (name === 'stdout') stdout += chunk; else stderr += chunk;
        if (Buffer.byteLength(stdout) > 8 * 1024 * 1024 || Buffer.byteLength(stderr) > 8 * 1024 * 1024) {
          stdout = stdout.slice(0, 8 * 1024 * 1024); stderr = stderr.slice(0, 8 * 1024 * 1024); kill('output_limit');
        }
      });
    }
    child.stdin.on('error', () => {});
    child.stdin.end(input);
    if (signal?.aborted) abort();
  });
}
export function requireSuccess(result, label, login = false) {
  if (result.code === 0 && !result.failure) return;
  const output = result.stdout + result.stderr;
  if (/quota|usage limit|rate limit|usage_limit/i.test(output)) blocked(`${label}: quota`);
  if (login || (label !== 'Verify' && /not logged in|login required|authentication|unauthorized|expired.*(?:login|token)/i.test(output))) throw new Stop('HUMAN_REQUIRED', `${label}: login unconfirmed`);
  blocked(`${label}: ${result.failure ?? `exit ${result.code}`}`);
}
export function safePath(file, directory = false) {
  if (typeof file !== 'string' || !file || /[\\\0:*?"<>|]/.test(file) || path.posix.isAbsolute(file)) blocked('Invalid relative path');
  const parts = (directory ? file.replace(/\/$/, '') : file).split('/');
  if (parts.some(x => !x || x === '.' || x === '..') || parts[0].toLowerCase() === '.git') blocked(`Unsafe path: ${file}`);
  return file;
}
export async function inside(root, relative) {
  safePath(relative);
  const target = path.resolve(root, relative);
  const resolved = await realpath(target);
  const rel = path.relative(root, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) blocked('Path escapes repository');
  let current = root;
  for (const part of relative.split('/')) { current = path.join(current, part); if ((await lstat(current)).isSymbolicLink()) blocked(`Symlink: ${relative}`); }
  return target;
}
export function extractReviewer(stdout) {
  const envelope = JSON.parse(stdout);
  if (envelope.is_error || (envelope.permission_denials?.length ?? 0) > 0) blocked('Reviewer error or permission denial');
  if (typeof envelope.result !== 'string') blocked('Missing reviewer result string');
  const value = envelope.result.trim();
  try { return JSON.parse(value); } catch { /* scan complete top-level objects, respecting JSON strings */ }
  const objects = [];
  let start = -1, depth = 0, quoted = false, escaped = false;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (start < 0) { if (c === '{') { start = i; depth = 1; } continue; }
    if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; continue; }
    if (c === '"') quoted = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) { try { objects.push(JSON.parse(value.slice(start, i + 1))); } catch { /* invalid JSON */ } start = -1; }
  }
  if (objects.length !== 1 || start >= 0) blocked('Malformed or ambiguous reviewer JSON');
  return objects[0];
}
export async function git(root, args, signal) {
  const result = await processRun(['git', ...args], { cwd: root, timeout: 30000, signal });
  requireSuccess(result, 'git'); return result.stdout;
}
export async function changes(root, signal) {
  const raw = await git(root, ['status', '--porcelain=v1', '-z', '-uall', '--no-renames'], signal);
  const entries = raw.split('\0').filter(Boolean).map(row => ({ status: row.slice(0, 2), file: row.slice(3) }));
  return entries;
}
export async function snapshot(root, signal) {
  const entries = await changes(root, signal);
  let diff = await git(root, ['diff', 'HEAD', '--no-ext-diff', '--no-textconv', '--binary', '--'], signal);
  for (const entry of entries) {
    safePath(entry.file);
    // Check every existing changed path (including ancestors); deleted paths have no content.
    try {
      const target = await inside(root, entry.file);
      if (entry.status === '??') diff += `\n--- untracked: ${entry.file}\n${await readFile(target, 'utf8')}\n`;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return { entries, diff };
}
export function guard(snapshotValue, reported, contract) {
  const actual = snapshotValue.entries.map(x => x.file).sort();
  reported.forEach(x => safePath(x));
  if (JSON.stringify(actual) !== JSON.stringify([...reported].sort())) blocked('changed_files mismatch');
  const match = (file, rule) => {
    if (process.platform === 'win32') { file = file.toLowerCase(); rule = rule.toLowerCase(); }
    return rule.endsWith('/') ? file.startsWith(rule) : file === rule;
  };
  for (const file of actual) if (contract.forbidden_paths.some(rule => match(file, rule)) || !contract.allowed_paths.some(rule => match(file, rule))) blocked(`Path violation: ${file}`);
}
