let testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error('E2E cần TEST_DATABASE_URL; DATABASE_URL không được dùng thay thế.');
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
  throw new Error('E2E chỉ chạy trên database có tên chứa test hoặc ci.');
}

process.env.DATABASE_URL = testUrl;
