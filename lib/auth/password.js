import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const SALT_BYTES = 16;
const KEY_LEN = 64;

export async function hashPassword(plain) {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scryptAsync(String(plain), salt, KEY_LEN);
  return `scrypt:${salt.toString('hex')}:${derived.toString('hex')}`;
}

export async function verifyPassword(plain, stored) {
  if (!stored || !String(stored).startsWith('scrypt:')) return false;
  const [, saltHex, hashHex] = String(stored).split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = await scryptAsync(String(plain), salt, expected.length);
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
