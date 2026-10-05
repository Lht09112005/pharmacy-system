import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error('Cần khai báo TEST_DATABASE_URL; không dùng DATABASE_URL dự phòng.');
}

let parsedUrl: URL;
try {
  parsedUrl = new URL(testUrl);
} catch {
  throw new Error('TEST_DATABASE_URL không phải PostgreSQL URL hợp lệ.');
}
if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
  throw new Error('TEST_DATABASE_URL phải dùng giao thức PostgreSQL.');
}
const databaseName = decodeURIComponent(parsedUrl.pathname.slice(1));
if (!/(?:^|[_-])(test|ci)(?:[_-]|$)/i.test(databaseName)) {
  throw new Error('TEST_DATABASE_URL phải trỏ đến database có tên chứa test hoặc ci.');
}

process.env.DATABASE_URL = testUrl;
const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prismaCli = resolve(backendDirectory, 'node_modules/prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
  cwd: backendDirectory,
  env: process.env,
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
