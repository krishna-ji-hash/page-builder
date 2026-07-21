import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { convertSqlPlaceholders } from '../lib/sqlPlaceholders.js';
import { toMysqlStyleResult, attachMysqlErrorAliases } from '../lib/db.js';
import { isActiveFlag, toClientId } from '../lib/auth/clientIds.js';
import { hashPassword, verifyPassword } from '../lib/auth/password.js';

/** Mirror of authService.isUniqueViolation — avoid importing authService (pulls session/next). */
function isUniqueViolation(error) {
  return error?.code === '23505' || error?.mysqlCode === 'ER_DUP_ENTRY';
}

assert.equal(isActiveFlag(true), true);
assert.equal(isActiveFlag(false), false);
assert.equal(isActiveFlag(1), true);
assert.equal(isActiveFlag(0), false);
assert.equal(toClientId('42'), 42);
assert.equal(toClientId(7n), 7);
assert.equal(isUniqueViolation({ code: '23505' }), true);
assert.equal(isUniqueViolation({ mysqlCode: 'ER_DUP_ENTRY' }), true);
assert.equal(isUniqueViolation({ code: '23503' }), false);

{
  const err = attachMysqlErrorAliases({ code: '23505', message: 'dup' });
  assert.equal(err.code, '23505');
  assert.equal(err.mysqlCode, 'ER_DUP_ENTRY');
  assert.equal(isUniqueViolation(err), true);
}

{
  const named = convertSqlPlaceholders(
    `INSERT INTO admin_sessions (user_id, token_hash, expires_at, ip_address, user_agent, created_at)
     VALUES (:userId, :tokenHash, :expiresAt, :ip, :ua, NOW())`,
    { userId: 1, tokenHash: 'abc', expiresAt: new Date('2030-01-01T00:00:00Z'), ip: null, ua: null }
  );
  assert.equal(named.text.includes('$1'), true);
  assert.equal(named.text.includes(':userId'), false);
  assert.equal(named.values[0], 1);
  assert.equal(named.values[1], 'abc');
}

{
  const q = convertSqlPlaceholders(
    `SELECT id FROM admin_users WHERE email = :email LIMIT 1`,
    { email: 'admin@example.com' }
  );
  assert.equal(q.text, 'SELECT id FROM admin_users WHERE email = $1 LIMIT 1');
  assert.deepEqual(q.values, ['admin@example.com']);
}

{
  const [header] = toMysqlStyleResult({
    command: 'INSERT',
    rows: [{ id: '99' }],
    fields: [{ name: 'id' }],
    rowCount: 1,
  });
  assert.equal(header.insertId, '99');
  assert.equal(toClientId(header.insertId), 99);
}

{
  const hash = await hashPassword('CorrectHorseBattery1!');
  assert.equal(await verifyPassword('CorrectHorseBattery1!', hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
}

{
  const sessions = new Map();
  let nextSessionId = 1;

  function hashToken(token) {
    return createHash('sha256').update(String(token)).digest('hex');
  }

  async function mockExecute(sql, params) {
    const text = String(sql);
    if (text.startsWith('INSERT INTO admin_sessions')) {
      const converted = convertSqlPlaceholders(sql, params);
      const [userId, tokenHash, expiresAt] = converted.values;
      const id = nextSessionId++;
      sessions.set(tokenHash, {
        session_id: id,
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        is_active: true,
        email: 'admin@example.com',
        display_name: 'Admin',
        role: 'super_admin',
        id: userId,
      });
      return [{ affectedRows: 1, insertId: 0 }, null];
    }
    if (text.includes('FROM admin_sessions s') && text.includes('INNER JOIN admin_users')) {
      const converted = convertSqlPlaceholders(sql, params);
      const tokenHash = converted.values[0];
      const row = sessions.get(tokenHash);
      return [row ? [row] : [], null];
    }
    if (text.startsWith('DELETE FROM admin_sessions WHERE token_hash')) {
      const converted = convertSqlPlaceholders(sql, params);
      sessions.delete(converted.values[0]);
      return [{ affectedRows: 1, insertId: 0 }, null];
    }
    if (text.startsWith('DELETE FROM admin_sessions WHERE id')) {
      const converted = convertSqlPlaceholders(sql, params);
      const id = converted.values[0];
      for (const [k, row] of sessions) {
        if (row.session_id === id) sessions.delete(k);
      }
      return [{ affectedRows: 1, insertId: 0 }, null];
    }
    throw new Error(`Unexpected SQL in mock: ${text.slice(0, 80)}`);
  }

  const tokenHash = hashToken('a'.repeat(64));
  const expiresAt = new Date(Date.now() + 60_000);
  await mockExecute(
    `INSERT INTO admin_sessions (user_id, token_hash, expires_at, ip_address, user_agent, created_at)
     VALUES (:userId, :tokenHash, :expiresAt, :ip, :ua, NOW())`,
    { userId: 1, tokenHash, expiresAt, ip: null, ua: null }
  );
  assert.equal(sessions.has(tokenHash), true);

  {
    const [rows] = await mockExecute(
      `SELECT
       s.id AS session_id,
       s.expires_at,
       u.id,
       u.email,
       u.display_name,
       u.role,
       u.is_active
     FROM admin_sessions s
     INNER JOIN admin_users u ON u.id = s.user_id
     WHERE s.token_hash = :tokenHash
     LIMIT 1`,
      { tokenHash }
    );
    assert.equal(rows.length, 1);
    assert.equal(isActiveFlag(rows[0].is_active), true);
    assert.equal(new Date(rows[0].expires_at).getTime() > Date.now(), true);
  }

  {
    const expiredHash = hashToken('b'.repeat(64));
    sessions.set(expiredHash, {
      session_id: 99,
      expires_at: new Date(Date.now() - 1000),
      is_active: true,
      id: 1,
      email: 'admin@example.com',
      display_name: 'Admin',
      role: 'admin',
    });
    const [rows] = await mockExecute(
      `SELECT
       s.id AS session_id,
       s.expires_at,
       u.id,
       u.email,
       u.display_name,
       u.role,
       u.is_active
     FROM admin_sessions s
     INNER JOIN admin_users u ON u.id = s.user_id
     WHERE s.token_hash = :tokenHash
     LIMIT 1`,
      { tokenHash: expiredHash }
    );
    assert.equal(new Date(rows[0].expires_at).getTime() <= Date.now(), true);
    await mockExecute(`DELETE FROM admin_sessions WHERE id = :id`, { id: rows[0].session_id });
    assert.equal(sessions.has(expiredHash), false);
  }

  await mockExecute(`DELETE FROM admin_sessions WHERE token_hash = :tokenHash`, { tokenHash });
  assert.equal(sessions.has(tokenHash), false);
}

{
  const activeUser = {
    id: 1,
    email: 'admin@example.com',
    password_hash: await hashPassword('CorrectHorseBattery1!'),
    display_name: 'Admin',
    role: 'super_admin',
    is_active: true,
  };

  async function authenticate(email, password, user) {
    if (!user || String(email).toLowerCase() !== user.email) return null;
    if (!isActiveFlag(user.is_active)) return null;
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return null;
    return user;
  }

  assert.equal(
    (await authenticate('admin@example.com', 'CorrectHorseBattery1!', activeUser))?.email,
    'admin@example.com'
  );
  assert.equal(await authenticate('admin@example.com', 'bad', activeUser), null);
  assert.equal(
    await authenticate('admin@example.com', 'CorrectHorseBattery1!', { ...activeUser, is_active: false }),
    null
  );
}

{
  const insertSql = `INSERT INTO admin_users (email, password_hash, display_name, role, is_active)
       VALUES (:email, :passwordHash, :displayName, :role, TRUE)
       RETURNING id`;
  const converted = convertSqlPlaceholders(insertSql, {
    email: 'new@example.com',
    passwordHash: 'scrypt:x:y',
    displayName: 'New',
    role: 'editor',
  });
  assert.equal(converted.text.includes('RETURNING id'), true);
  assert.equal(converted.text.includes('TRUE'), true);

  const [header] = toMysqlStyleResult({
    command: 'INSERT',
    rows: [{ id: 55 }],
    fields: [{ name: 'id' }],
    rowCount: 1,
  });
  assert.equal(toClientId(header.insertId), 55);

  assert.equal(isUniqueViolation({ code: '23505' }), true);
}

console.log('authBatchB.test.mjs: ok');
