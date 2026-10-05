type Environment = Record<string, unknown>;

function requireString(config: Environment, key: string): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Biến môi trường ${key} là bắt buộc.`);
  }
  return value.trim();
}

export function validateEnvironment(config: Environment) {
  const portValue = config.PORT ?? '3001';
  const port = Number(portValue);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT phải là số nguyên từ 1 đến 65535.');
  }

  const timezone = String(config.APP_TIMEZONE ?? 'Asia/Ho_Chi_Minh');
  if (timezone !== 'Asia/Ho_Chi_Minh') {
    throw new Error('APP_TIMEZONE phải là Asia/Ho_Chi_Minh theo D16.');
  }

  return {
    ...config,
    PORT: port,
    DATABASE_URL: requireString(config, 'DATABASE_URL'),
    FRONTEND_ORIGIN: requireString(config, 'FRONTEND_ORIGIN'),
    APP_TIMEZONE: timezone,
  };
}
