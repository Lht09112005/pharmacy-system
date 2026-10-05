import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';

const parameters = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 } as const;
const keyLength = 64;

function deriveKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keyLength, parameters, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await deriveKey(password, salt);
  return `scrypt$${parameters.N}$${parameters.r}$${parameters.p}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const match = /^scrypt\$131072\$8\$1\$([a-f0-9]{32,})\$([a-f0-9]{128})$/i.exec(encoded);
  if (!match || match[1].length % 2 !== 0) return false;
  try {
    const salt = Buffer.from(match[1], 'hex');
    if (salt.length < 16) return false;
    const expected = Buffer.from(match[2], 'hex');
    const actual = await deriveKey(password, salt);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
