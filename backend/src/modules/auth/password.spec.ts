import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('uses a fresh salt and verifies the matching password only', async () => {
    const first = await hashPassword('correct horse battery');
    const second = await hashPassword('correct horse battery');
    expect(first).not.toBe(second);
    expect(first).toMatch(/^scrypt\$131072\$8\$1\$/);
    await expect(verifyPassword('correct horse battery', first)).resolves.toBe(true);
    await expect(verifyPassword('wrong password', first)).resolves.toBe(false);
  });

  it('rejects malformed hashes without throwing', async () => {
    await expect(verifyPassword('anything', 'scrypt$1$1$1$bad$bad')).resolves.toBe(false);
  });
});
