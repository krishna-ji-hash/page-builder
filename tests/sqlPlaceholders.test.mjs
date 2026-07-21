import assert from 'node:assert/strict';
import { convertSqlPlaceholders } from '../lib/sqlPlaceholders.js';
import {
  CompatibleConnection,
  CompatiblePool,
  attachMysqlErrorAliases,
  toMysqlStyleResult,
} from '../lib/db.js';
import { buildPgPoolConfig, requirePostgresDatabaseUrl, resolvePgSsl } from '../lib/pgPoolOptions.js';

function assertConvert(sql, params, expectedText, expectedValues) {
  const result = convertSqlPlaceholders(sql, params);
  assert.equal(result.text, expectedText);
  assert.deepEqual(result.values, expectedValues);
}

// --- positional ---
assertConvert(
  'SELECT * FROM users WHERE id = ?',
  [42],
  'SELECT * FROM users WHERE id = $1',
  [42]
);

assertConvert(
  'WHERE a = ? AND b = ?',
  [1, 'x'],
  'WHERE a = $1 AND b = $2',
  [1, 'x']
);

// --- named ---
assertConvert(
  'SELECT * FROM admin_sessions WHERE user_id = :userId',
  { userId: 7 },
  'SELECT * FROM admin_sessions WHERE user_id = $1',
  [7]
);

// repeated named → same $n, single values entry
assertConvert(
  'SELECT * FROM t WHERE a = :id OR b = :id',
  { id: 9 },
  'SELECT * FROM t WHERE a = $1 OR b = $1',
  [9]
);

// --- ::jsonb cast must not be treated as named placeholder ---
assertConvert(
  'SELECT value::jsonb FROM t WHERE id = ?',
  [1],
  'SELECT value::jsonb FROM t WHERE id = $1',
  [1]
);

assertConvert(
  'SELECT :payload::jsonb',
  { payload: '{"a":1}' },
  'SELECT $1::jsonb',
  ['{"a":1}']
);

// --- string literal containing ? ---
assertConvert(
  "SELECT * FROM t WHERE note = 'what?' AND id = ?",
  [3],
  "SELECT * FROM t WHERE note = 'what?' AND id = $1",
  [3]
);

// --- URL https:// ---
assertConvert(
  "SELECT * FROM t WHERE url = 'https://example.com/?q=1' AND id = ?",
  [5],
  "SELECT * FROM t WHERE url = 'https://example.com/?q=1' AND id = $1",
  [5]
);

// --- comments ---
assertConvert(
  'SELECT id FROM t -- where id = ?\nWHERE id = ?',
  [1],
  'SELECT id FROM t -- where id = ?\nWHERE id = $1',
  [1]
);

assertConvert(
  'SELECT id FROM t /* :userId ? */ WHERE id = ?',
  [2],
  'SELECT id FROM t /* :userId ? */ WHERE id = $1',
  [2]
);

// --- IN (?) expand ---
assertConvert(
  'DELETE FROM builder_nodes WHERE id IN (?)',
  [[1, 2, 3]],
  'DELETE FROM builder_nodes WHERE id IN ($1,$2,$3)',
  [1, 2, 3]
);

assertConvert(
  'SELECT * FROM t WHERE id IN ( ? ) AND live = ?',
  [[10, 20], 1],
  'SELECT * FROM t WHERE id IN ( $1,$2 ) AND live = $3',
  [10, 20, 1]
);

// empty IN → IN (NULL)
assertConvert(
  'SELECT * FROM t WHERE id IN (?)',
  [[]],
  'SELECT * FROM t WHERE id IN (NULL)',
  []
);

// named IN (:ids)
assertConvert(
  'SELECT * FROM t WHERE id IN (:ids)',
  { ids: [4, 5] },
  'SELECT * FROM t WHERE id IN ($1,$2)',
  [4, 5]
);

// --- pg pool options (no credentials logged; no network) ---
{
  const prev = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://user:secret@localhost:5432/documents_pg?schema=documents';
  try {
    assert.equal(
      requirePostgresDatabaseUrl(),
      'postgresql://user:secret@localhost:5432/documents_pg?schema=documents'
    );
    const cfg = buildPgPoolConfig();
    assert.equal(cfg.connectionString.includes('localhost'), true);
    assert.equal(cfg.max >= 1, true);
    assert.equal(resolvePgSsl(cfg.connectionString), undefined);
    assert.throws(() => requirePostgresDatabaseUrl('mysql://x'), /PostgreSQL/);
  } finally {
    if (prev === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prev;
  }
}

// --- result tuple mapping ---
{
  const [rows, fields] = toMysqlStyleResult({
    command: 'SELECT',
    rows: [{ id: 1 }],
    fields: [{ name: 'id' }],
    rowCount: 1,
  });
  assert.deepEqual(rows, [{ id: 1 }]);
  assert.equal(fields[0].name, 'id');
}

{
  const [header] = toMysqlStyleResult({
    command: 'UPDATE',
    rows: [],
    fields: [],
    rowCount: 2,
  });
  assert.equal(header.affectedRows, 2);
  assert.equal(header.changedRows, 2);
  assert.equal(header.insertId, 0);
}

{
  const [header] = toMysqlStyleResult({
    command: 'INSERT',
    rows: [{ id: 99 }],
    fields: [{ name: 'id' }],
    rowCount: 1,
  });
  assert.equal(header.insertId, 99);
  assert.deepEqual(header.rows, [{ id: 99 }]);
}

// --- error aliases ---
{
  const err = attachMysqlErrorAliases({ code: '23505', message: 'duplicate' });
  assert.equal(err.code, '23505');
  assert.equal(err.mysqlCode, 'ER_DUP_ENTRY');
}

// --- CompatiblePool / Connection with mocked pg client ---
{
  /** @type {string[]} */
  const calls = [];
  const mockClient = {
    async query(text, values) {
      calls.push(text);
      if (text.startsWith('SET search_path')) {
        return { command: 'SET', rows: [], fields: [], rowCount: null };
      }
      if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') {
        return { command: text, rows: [], fields: [], rowCount: null };
      }
      assert.equal(text, 'SELECT * FROM users WHERE id = $1');
      assert.deepEqual(values, [42]);
      return {
        command: 'SELECT',
        rows: [{ id: 42 }],
        fields: [{ name: 'id' }],
        rowCount: 1,
      };
    },
    release() {
      calls.push('RELEASE');
    },
  };

  const conn = new CompatibleConnection(/** @type {any} */ (mockClient));
  const [rows] = await conn.query('SELECT * FROM users WHERE id = ?', [42]);
  assert.deepEqual(rows, [{ id: 42 }]);

  await conn.beginTransaction();
  await conn.commit();
  await conn.rollback();
  conn.release();

  assert.ok(calls.some((c) => c.startsWith('SET search_path')));
  assert.ok(calls.includes('BEGIN'));
  assert.ok(calls.includes('COMMIT'));
  assert.ok(calls.includes('ROLLBACK'));
  assert.ok(calls.includes('RELEASE'));
}

{
  const mockPgPool = {
    async query(text, values) {
      if (text.startsWith('SET search_path')) {
        return { command: 'SET', rows: [], fields: [], rowCount: null };
      }
      assert.equal(text, 'UPDATE t SET a = $1 WHERE id = $2');
      assert.deepEqual(values, ['v', 1]);
      return { command: 'UPDATE', rows: [], fields: [], rowCount: 1 };
    },
    async connect() {
      return {
        async query(text) {
          if (text.startsWith('SET search_path')) {
            return { command: 'SET', rows: [], fields: [], rowCount: null };
          }
          return { command: 'SELECT', rows: [], fields: [], rowCount: 0 };
        },
        release() {},
      };
    },
    async end() {},
    on() {},
  };

  const pool = new CompatiblePool(/** @type {any} */ (mockPgPool));
  const [result] = await pool.execute('UPDATE t SET a = ? WHERE id = ?', ['v', 1]);
  assert.equal(result.affectedRows, 1);
  assert.equal(result.insertId, 0);
}

{
  const mockPgPool = {
    async query(text, values) {
      if (text.startsWith('SET search_path')) {
        return { command: 'SET', rows: [], fields: [], rowCount: null };
      }
      assert.equal(text, 'SELECT * FROM t WHERE user_id = $1');
      assert.deepEqual(values, [9]);
      return { command: 'SELECT', rows: [{ user_id: 9 }], fields: [], rowCount: 1 };
    },
    async connect() {
      throw new Error('not used');
    },
    async end() {},
    on() {},
  };
  const pool = new CompatiblePool(/** @type {any} */ (mockPgPool));
  const [rows] = await pool.execute('SELECT * FROM t WHERE user_id = :userId', { userId: 9 });
  assert.deepEqual(rows, [{ user_id: 9 }]);
}


console.log('sqlPlaceholders + db compatible pool tests: ok');
